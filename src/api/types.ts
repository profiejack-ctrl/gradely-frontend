export type UserRole = 'dean' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  studentNumber?: string;
  sectionId?: string;
  sectionIds?: string[];
  title?: string;
  department?: string;
  mustChangePassword?: boolean;
}

export interface ScheduleSession {
  mode: 'f2f' | 'online';
  day: string;
  startTime: string;
  endTime: string;
  room?: string;
  meetingUrl?: string;
}

export interface MatrixCategory {
  id: string;
  name: string;
  weight: number;
  color?: string;
  description?: string;
  isAttendance?: boolean;
  subCategories?: Array<{
    id: string;
    name: string;
    weight: number;
    maxScore?: number;
  }>;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  units?: number;
  passingGrade?: number;
  gradingMatrixTemplateId?: string;
  matrix?: MatrixCategory[];
  department?: string;
  createdAt?: string;
}

export interface Subject {
  id: string;
  sectionId: string;
  sectionName?: string;
  gradeLevelOrYear?: string;
  teacherId?: string;
  name: string;
  code: string;
  units?: number;
  passingGrade?: number;
  gradeDisplayMode?: 'raw_only' | 'transmuted_only' | 'both';
  templateName?: string;
  gradingMatrixTemplateId?: string;
  schedule: ScheduleSession[];
  matrix?: MatrixCategory[];
  useTransmutation?: boolean;
}

export interface GradingMatrixTemplate {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  is_default?: boolean;
  passingGrade?: number;
  passing_grade?: number;
  gradeDisplayMode?: 'both' | 'raw_only' | 'transmuted_only';
  grade_display_mode?: 'both' | 'raw_only' | 'transmuted_only';
  matrix: MatrixCategory[];
  useTransmutation?: boolean;
}

export interface Section {
  id: string;
  name: string;
  gradeLevelOrYear: string;
  academicYear: string;
  semester: string;
  room?: string;
  description?: string;
  isAdviser?: boolean;
  studentCount?: number;
  courseCount?: number;
}

export interface Assessment {
  id: string;
  subject_id?: string;
  subjectId?: string;
  subjectCode?: string;
  title: string;
  category_id?: string;
  categoryId?: string;
  parent_category_id?: string;
  parentCategoryId?: string;
  subCategoryName?: string;
  period?: 'prelim' | 'midterm' | 'finals' | string;
  max_score?: number;
  maxScore?: number;
  date: string;
  due_date?: string | null;
  description?: string;
  points?: number;
  status?: string;
}

export interface ScoreRecord {
  id: string;
  assessmentId: string;
  studentId: string;
  score: number;
  remarks?: string;
  submittedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  subjectId: string;
  studentId: string;
  date: string;
  period: string;
  status: 'present' | 'late' | 'absent' | 'excused';
  note?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'exam' | 'holiday' | 'activity' | 'class';
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  time?: string;
  location?: string;
  description?: string;
  subjectId?: string;
  subjectName?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface FacultyOverview {
  teacher: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  stats: {
    totalSubjects: number;
    totalSections: number;
    currentDay: string;
    totalStudents?: number;
    classAverage?: number;
  };
  todayClasses: Array<{
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    sectionName: string;
    mode: 'f2f' | 'online';
    startTime: string;
    endTime: string;
    room?: string;
    meetingUrl?: string;
  }>;
  recentAssessments: Assessment[];
}

export interface AllDataResponse {
  users: User[];
  sections: Section[];
  subjects: Subject[];
  courses?: Course[];
  assessments: Assessment[];
  scores: ScoreRecord[];
  attendance: AttendanceRecord[];
  matrixTemplates: any[];
  holidays: any[];
  events?: CalendarEvent[];
}
