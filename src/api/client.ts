import { AllDataResponse, FacultyOverview, Section, Subject, User, GradingMatrixTemplate, ScheduleSession, MatrixCategory, Assessment, Course } from './types';
import { MOCK_OVERVIEW, MOCK_SECTIONS, MOCK_SUBJECTS, MOCK_TEACHER } from './mockData';

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const BASE_URL = rawBaseUrl.replace(/\/+$/, '');

class ApiClient {
  private token: string | null = null;
  private cache: {
    allData?: { data: AllDataResponse; timestamp: number };
    overview?: { data: FacultyOverview; timestamp: number };
  } = {};
  private readonly CACHE_TTL_MS = 60 * 1000; // 1 minute cache TTL

  constructor() {
    this.token = localStorage.getItem('gradely_token');
    // Hydrate cache from sessionStorage if available
    try {
      const savedAllData = sessionStorage.getItem('gradely_cache_allData');
      if (savedAllData) {
        const parsed = JSON.parse(savedAllData);
        if (Date.now() - parsed.timestamp < this.CACHE_TTL_MS) {
          this.cache.allData = parsed;
        }
      }
      const savedOverview = sessionStorage.getItem('gradely_cache_overview');
      if (savedOverview) {
        const parsed = JSON.parse(savedOverview);
        if (Date.now() - parsed.timestamp < this.CACHE_TTL_MS) {
          this.cache.overview = parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  invalidateCache() {
    this.cache = {};
    try {
      sessionStorage.removeItem('gradely_cache_allData');
      sessionStorage.removeItem('gradely_cache_overview');
    } catch {}
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('gradely_token', token);
    } else {
      localStorage.removeItem('gradely_token');
      this.invalidateCache();
    }
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('gradely_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.setToken(null);
          localStorage.removeItem('gradely_user');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      console.warn(`[api] Request to ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  // Auth
  async login(identifier: string, password: string): Promise<{ token: string; user: User }> {
    const result = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    this.setToken(result.token);
    localStorage.setItem('gradely_user', JSON.stringify(result.user));
    return result;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      this.setToken(null);
      localStorage.removeItem('gradely_user');
    }
  }

  async getMe(): Promise<User> {
    try {
      const result = await this.request<{ user: User }>('/api/auth/me');
      return result.user;
    } catch {
      const stored = localStorage.getItem('gradely_user');
      if (stored) return JSON.parse(stored);
      return MOCK_TEACHER;
    }
  }

  // Faculty Overview (with Cache)
  async getFacultyOverview(options?: { forceRefresh?: boolean }): Promise<FacultyOverview | null> {
    const isCached =
      !options?.forceRefresh &&
      this.cache.overview &&
      Date.now() - this.cache.overview.timestamp < this.CACHE_TTL_MS;

    if (isCached && this.cache.overview) {
      return this.cache.overview.data;
    }

    try {
      const data = await this.request<FacultyOverview>('/api/faculty/overview');
      if (data) {
        const entry = { data, timestamp: Date.now() };
        this.cache.overview = entry;
        try {
          sessionStorage.setItem('gradely_cache_overview', JSON.stringify(entry));
        } catch {}
      }
      return data;
    } catch (err) {
      console.warn('[api] Failed to fetch faculty overview:', err);
      // Fallback to stale cache if request fails
      if (this.cache.overview) return this.cache.overview.data;
      return null;
    }
  }

  // Subjects
  async getFacultySubjects(): Promise<Subject[]> {
    try {
      return await this.request<Subject[]>('/api/faculty/subjects');
    } catch (err) {
      console.warn('[api] Failed to fetch faculty subjects:', err);
      return [];
    }
  }

  // Sections
  async getFacultySections(): Promise<Section[]> {
    try {
      return await this.request<Section[]>('/api/faculty/sections');
    } catch (err) {
      console.warn('[api] Failed to fetch faculty sections:', err);
      return [];
    }
  }

  async uploadSectionRoster(
    sectionId: string,
    students: Array<{ studentNumber: string; name: string; email?: string }>
  ): Promise<{ success: boolean; enrolledCount: number; students: any[] }> {
    const res = await this.request<{ success: boolean; enrolledCount: number; students: any[] }>(
      `/api/faculty/sections/${sectionId}/roster`,
      {
        method: 'POST',
        body: JSON.stringify({ students }),
      }
    );
    this.invalidateCache();
    return res;
  }

  async createSection(data: {
    name: string;
    gradeLevelOrYear: string;
    academicYear: string;
    semester: string;
    room?: string;
    description?: string;
  }): Promise<Section> {
    const id = `sec-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const user = JSON.parse(localStorage.getItem('gradely_user') || '{}');
    const adviserTag = user?.id ? `[adviser:${user.id}] ` : '';
    const desc = adviserTag + (data.description || 'Standard Cohort');

    const payload = {
      id,
      name: data.name.trim(),
      grade_level_or_year: data.gradeLevelOrYear,
      academic_year: data.academicYear,
      semester: data.semester,
      room: data.room?.trim() || 'TBA',
      adviserId: user?.id,
      description: desc,
    };

    const res = await this.request<{ success: boolean; errors?: string[] }>('/api/data/sync', {
      method: 'POST',
      body: JSON.stringify({
        mutations: [
          {
            table: 'sections',
            action: 'UPSERT',
            payload,
          },
        ],
      }),
    });

    if (res.errors && res.errors.length > 0) {
      throw new Error(res.errors.join(', '));
    }

    // Invalidate cached datasets so future calls or background sync pulls the new section
    this.invalidateCache();

    return {
      id,
      name: payload.name,
      gradeLevelOrYear: payload.grade_level_or_year,
      academicYear: payload.academic_year,
      semester: payload.semester,
      room: payload.room,
      description: data.description || 'Standard Cohort',
      studentCount: 0,
      courseCount: 0,
    };
  }

  // Matrix Templates
  async getMatrixTemplates(): Promise<GradingMatrixTemplate[]> {
    try {
      return await this.request<GradingMatrixTemplate[]>('/api/faculty/matrix-templates');
    } catch (err) {
      console.warn('[api] Failed to fetch matrix templates:', err);
      return [];
    }
  }

  async saveMatrixTemplate(template: Partial<GradingMatrixTemplate>): Promise<GradingMatrixTemplate> {
    const id = template.id || `tmpl-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const payload = {
      id,
      name: template.name?.trim(),
      description: template.description?.trim(),
      is_default: Boolean(template.isDefault || template.is_default),
      passing_grade: template.passingGrade ?? template.passing_grade ?? 75,
      matrix: template.matrix || [],
    };

    const res = await this.request<{ success: boolean; errors?: string[] }>('/api/data/sync', {
      method: 'POST',
      body: JSON.stringify({
        mutations: [
          {
            table: 'grading_matrix_templates',
            action: 'UPSERT',
            payload,
          },
        ],
      }),
    });

    if (res.errors && res.errors.length > 0) {
      throw new Error(res.errors.join(', '));
    }

    this.invalidateCache();
    return {
      id,
      name: payload.name || '',
      description: payload.description,
      isDefault: payload.is_default,
      passingGrade: payload.passing_grade,
      gradeDisplayMode: (template.gradeDisplayMode || template.grade_display_mode || 'both') as any,
      matrix: payload.matrix,
    };
  }

  async deleteMatrixTemplate(templateId: string): Promise<boolean> {
    const res = await this.request<{ success: boolean; errors?: string[] }>('/api/data/sync', {
      method: 'POST',
      body: JSON.stringify({
        mutations: [
          {
            table: 'grading_matrix_templates',
            action: 'DELETE',
            payload: { id: templateId },
          },
        ],
      }),
    });

    if (res.errors && res.errors.length > 0) {
      throw new Error(res.errors.join(', '));
    }

    this.invalidateCache();
    return true;
  }

  // Subject Creation & Management
  async createSubject(data: {
    name: string;
    code: string;
    sectionId: string;
    units?: number;
    passingGrade?: number;
    schedule: ScheduleSession[];
    gradingMatrixTemplateId?: string;
    matrix?: MatrixCategory[];
  }): Promise<Subject> {
    const id = `sub-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const user = JSON.parse(localStorage.getItem('gradely_user') || '{}');

    const payload = {
      id,
      section_id: data.sectionId,
      teacher_id: user?.id,
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      units: data.units ?? 3,
      passing_grade: data.passingGrade ?? 75,
      schedule: data.schedule,
      matrix: data.matrix || [],
    };

    const res = await this.request<{ success: boolean; errors?: string[] }>('/api/data/sync', {
      method: 'POST',
      body: JSON.stringify({
        mutations: [
          {
            table: 'subjects',
            action: 'UPSERT',
            payload,
          },
        ],
      }),
    });

    if (res.errors && res.errors.length > 0) {
      throw new Error(res.errors.join(', '));
    }

    this.invalidateCache();

    return {
      id,
      sectionId: data.sectionId,
      teacherId: user?.id,
      name: payload.name,
      code: payload.code,
      units: payload.units,
      passingGrade: payload.passing_grade,
      schedule: data.schedule,
      gradingMatrixTemplateId: data.gradingMatrixTemplateId,
      matrix: data.matrix,
      gradeDisplayMode: 'both',
    };
  }

  async deleteSubject(subjectId: string): Promise<boolean> {
    const res = await this.request<{ success: boolean; errors?: string[] }>('/api/data/sync', {
      method: 'POST',
      body: JSON.stringify({
        mutations: [
          {
            table: 'subjects',
            action: 'DELETE',
            payload: { id: subjectId },
          },
        ],
      }),
    });

    if (res.errors && res.errors.length > 0) {
      throw new Error(res.errors.join(', '));
    }

    this.invalidateCache();
    return true;
  }

  async applyTemplateToAllSubjects(templateId: string, subjectIds: string[]): Promise<boolean> {
    if (!subjectIds.length) return true;
    const mutations = subjectIds.map((id) => ({
      table: 'subjects',
      action: 'UPSERT',
      payload: {
        id,
        grading_matrix_template_id: templateId,
      },
    }));

    const res = await this.request<{ success: boolean; errors?: string[] }>('/api/data/sync', {
      method: 'POST',
      body: JSON.stringify({ mutations }),
    });

    if (res.errors && res.errors.length > 0) {
      throw new Error(res.errors.join(', '));
    }

    this.invalidateCache();
    return true;
  }

  // Gradebook & Assessments
  async getSubjectGradebook(subjectId: string, period?: string): Promise<any> {
    const url = `/api/faculty/subjects/${subjectId}/gradebook${period ? `?period=${period}` : ''}`;
    return await this.request<any>(url);
  }

  async saveScore(assessmentId: string, studentId: string, score: number, remarks?: string): Promise<boolean> {
    const id = `scr-${assessmentId}-${studentId}`;
    const payload = {
      id,
      assessment_id: assessmentId,
      student_id: studentId,
      score: Number(score),
      remarks: remarks || undefined,
    };

    const res = await this.request<{ success: boolean; errors?: string[] }>('/api/data/sync', {
      method: 'POST',
      body: JSON.stringify({
        mutations: [
          {
            table: 'score_records',
            action: 'UPSERT',
            payload,
          },
        ],
      }),
    });

    if (res.errors && res.errors.length > 0) {
      throw new Error(res.errors.join(', '));
    }

    return true;
  }

  async deleteScore(assessmentId: string, studentId: string): Promise<boolean> {
    const id = `scr-${assessmentId}-${studentId}`;
    const res = await this.request<{ success: boolean; errors?: string[] }>('/api/data/sync', {
      method: 'POST',
      body: JSON.stringify({
        mutations: [
          {
            table: 'score_records',
            action: 'DELETE',
            payload: { id, assessment_id: assessmentId, student_id: studentId },
          },
        ],
      }),
    });

    if (res.errors && res.errors.length > 0) {
      throw new Error(res.errors.join(', '));
    }

    return true;
  }

  async createAssessment(data: {
    subjectId: string;
    categoryId: string;
    parentCategoryId?: string;
    subCategoryName?: string;
    period: 'prelim' | 'midterm' | 'finals' | string;
    title: string;
    maxScore: number;
    date?: string;
    description?: string;
  }): Promise<Assessment> {
    const id = `ass-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const payload = {
      id,
      subject_id: data.subjectId,
      category_id: data.categoryId,
      parent_category_id: data.parentCategoryId || data.categoryId,
      period: data.period,
      title: data.title.trim(),
      max_score: Number(data.maxScore) || 100,
      date: data.date || new Date().toISOString().split('T')[0],
      description: data.description || undefined,
    };

    const res = await this.request<{ success: boolean; errors?: string[] }>('/api/data/sync', {
      method: 'POST',
      body: JSON.stringify({
        mutations: [
          {
            table: 'assessments',
            action: 'UPSERT',
            payload,
          },
        ],
      }),
    });

    if (res.errors && res.errors.length > 0) {
      throw new Error(res.errors.join(', '));
    }

    return {
      id,
      subjectId: data.subjectId,
      subject_id: data.subjectId,
      categoryId: data.categoryId,
      category_id: data.categoryId,
      parentCategoryId: payload.parent_category_id,
      parent_category_id: payload.parent_category_id,
      subCategoryName: data.subCategoryName,
      period: data.period,
      title: payload.title,
      maxScore: payload.max_score,
      max_score: payload.max_score,
      date: payload.date,
      description: payload.description,
    };
  }

  async updateAssessment(assessmentId: string, data: {
    title?: string;
    maxScore?: number;
    categoryId?: string;
  }): Promise<boolean> {
    const payload: any = { id: assessmentId };
    if (data.title) payload.title = data.title.trim();
    if (data.maxScore) payload.max_score = Number(data.maxScore);
    if (data.categoryId) payload.category_id = data.categoryId;

    const res = await this.request<{ success: boolean; errors?: string[] }>('/api/data/sync', {
      method: 'POST',
      body: JSON.stringify({
        mutations: [
          {
            table: 'assessments',
            action: 'UPSERT',
            payload,
          },
        ],
      }),
    });

    if (res.errors && res.errors.length > 0) {
      throw new Error(res.errors.join(', '));
    }
    return true;
  }

  async deleteAssessment(assessmentId: string): Promise<boolean> {
    const res = await this.request<{ success: boolean; errors?: string[] }>('/api/data/sync', {
      method: 'POST',
      body: JSON.stringify({
        mutations: [
          {
            table: 'assessments',
            action: 'DELETE',
            payload: { id: assessmentId },
          },
        ],
      }),
    });

    if (res.errors && res.errors.length > 0) {
      throw new Error(res.errors.join(', '));
    }

    return true;
  }

  // All Data (with Cache)
  async getAllData(options?: { forceRefresh?: boolean }): Promise<AllDataResponse | null> {
    const isCached =
      !options?.forceRefresh &&
      this.cache.allData &&
      Date.now() - this.cache.allData.timestamp < this.CACHE_TTL_MS;

    if (isCached && this.cache.allData) {
      return this.cache.allData.data;
    }

    try {
      const data = await this.request<AllDataResponse>('/api/data/all');
      if (data) {
        const entry = { data, timestamp: Date.now() };
        this.cache.allData = entry;
        try {
          sessionStorage.setItem('gradely_cache_allData', JSON.stringify(entry));
        } catch {}
      }
      return data;
    } catch (err) {
      console.warn('[api] Failed to fetch allData:', err);
      // Fallback to stale cache if request fails
      if (this.cache.allData) return this.cache.allData.data;
      return null;
    }
  }

  // Subject Attendance
  async getSubjectAttendance(subjectId: string, date?: string, period?: string): Promise<{
    subject: { id: string; code: string; name: string };
    metrics: {
      totalRecords: number;
      presentCount: number;
      lateCount: number;
      absentCount: number;
      excusedCount: number;
      attendanceRate: number;
    };
    students: any[];
    records: Array<{
      id: string;
      subject_id: string;
      student_id: string;
      date: string;
      period: string;
      status: 'present' | 'late' | 'absent' | 'excused';
      note?: string;
    }>;
  }> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (period) params.append('period', period);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/faculty/subjects/${subjectId}/attendance${query}`);
  }

  async saveAttendanceBatch(records: Array<{
    subjectId: string;
    studentId: string;
    date: string;
    period: string;
    status: 'present' | 'late' | 'absent' | 'excused';
    note?: string;
  }>): Promise<boolean> {
    if (records.length === 0) return true;

    const mutations = records.map((r) => ({
      table: 'attendance_records',
      action: 'UPSERT',
      payload: {
        id: `att-${r.subjectId}-${r.studentId}-${r.date}`,
        subject_id: r.subjectId,
        student_id: r.studentId,
        date: r.date,
        period: r.period || 'prelim',
        status: r.status,
        note: r.note || null,
      },
    }));

    const res = await this.request<{ success: boolean; errors?: string[] }>('/api/data/sync', {
      method: 'POST',
      body: JSON.stringify({ mutations }),
    });

    if (res.errors && res.errors.length > 0) {
      throw new Error(res.errors.join(', '));
    }
    return true;
  }

  // Reset Student / Faculty Password
  async resetStudentPassword(userId: string): Promise<{ success: boolean; initialPassword?: string }> {
    return await this.request<{ success: boolean; initialPassword?: string }>(`/api/teachers/${userId}/reset-password`, {
      method: 'POST',
    });
  }

  // Teacher / Faculty Management
  async getTeachers(): Promise<any[]> {
    return await this.request<any[]>('/api/teachers');
  }

  async createTeacher(data: {
    name: string;
    email: string;
    password?: string;
    role?: 'teacher' | 'dean';
    title?: string;
    department?: string;
  }): Promise<any> {
    const res = await this.request<any>('/api/teachers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.invalidateCache();
    return res;
  }

  async deleteTeacher(id: string): Promise<boolean> {
    await this.request(`/api/teachers/${id}`, { method: 'DELETE' });
    this.invalidateCache();
    return true;
  }

  // Course Curriculum Catalog (Dean Master Courses)
  async getCourses(): Promise<Course[]> {
    return await this.request<Course[]>('/api/data/courses');
  }

  async createCourse(data: {
    name: string;
    code: string;
    units?: number;
    passingGrade?: number;
    gradingMatrixTemplateId?: string;
    matrix?: MatrixCategory[];
    department?: string;
  }): Promise<Course> {
    const res = await this.request<Course>('/api/data/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.invalidateCache();
    return res;
  }

  async deleteCourse(id: string): Promise<boolean> {
    await this.request(`/api/data/courses/${id}`, { method: 'DELETE' });
    this.invalidateCache();
    return true;
  }

  // Clear Database (Keeps only Dean account, clears students and course data)
  async clearDatabase(): Promise<{ success: boolean; message: string; deanAccount?: string }> {
    const res = await this.request<{ success: boolean; message: string; deanAccount?: string }>(
      '/api/data/clear-database',
      { method: 'POST' }
    );
    this.invalidateCache();
    return res;
  }
}

export const api = new ApiClient();
