import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { AllDataResponse, FacultyOverview, Section, Subject, User, Assessment, GradingMatrixTemplate, Course } from '../api/types';
import { useAuth } from './AuthContext';

interface DataContextType {
  sections: Section[];
  subjects: Subject[];
  courses: Course[];
  students: User[];
  assessments: Assessment[];
  templates: GradingMatrixTemplate[];
  overview: FacultyOverview | null;
  isLoading: boolean;
  isRefreshing: boolean;
  lastFetched: Date | null;
  refreshData: (force?: boolean) => Promise<void>;
  addSectionLocal: (newSection: Section) => void;
  enrollStudentsLocal: (newStudents: User[], sectionId: string) => void;
  addSubjectLocal: (newSubject: Subject) => void;
  removeSubjectLocal: (subjectId: string) => void;
  addCourseLocal: (newCourse: Course) => void;
  removeCourseLocal: (courseId: string) => void;
  addTemplateLocal: (template: GradingMatrixTemplate) => void;
  removeTemplateLocal: (templateId: string) => void;
  applyTemplateGloballyLocal: (templateId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [templates, setTemplates] = useState<GradingMatrixTemplate[]>([]);
  const [overview, setOverview] = useState<FacultyOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const loadData = useCallback(async (force: boolean = false) => {
    if (!user) return;

    if (sections.length > 0 || subjects.length > 0) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [allData, ov, tmpls] = await Promise.all([
        api.getAllData({ forceRefresh: force }),
        api.getFacultyOverview({ forceRefresh: force }),
        api.getMatrixTemplates(),
      ]);

      if (allData) {
        setSections(allData.sections || []);
        const uniqueSubMap = new Map<string, Subject>();
        for (const sub of (allData.subjects || [])) {
          if (!uniqueSubMap.has(sub.id)) {
            uniqueSubMap.set(sub.id, sub);
          }
        }
        setSubjects(Array.from(uniqueSubMap.values()));
        setCourses(allData.courses || []);

        if (allData.assessments && allData.assessments.length > 0) {
          const subMap = new Map((allData.subjects || []).map((s) => [s.id, s.code]));
          const mappedAssessments = allData.assessments.slice(0, 8).map((a) => ({
            ...a,
            subjectCode: a.subject_id ? subMap.get(a.subject_id) || 'Course' : 'Course',
            status: 'Graded',
          }));
          setAssessments(mappedAssessments);
        } else {
          setAssessments([]);
        }

        if (allData.users) {
          const studentUsers = allData.users.filter((u) => u.role === 'student');
          setStudents(studentUsers);
        } else {
          setStudents([]);
        }
      }

      if (tmpls && tmpls.length > 0) {
        setTemplates(tmpls);
      } else if (allData?.matrixTemplates && allData.matrixTemplates.length > 0) {
        setTemplates(allData.matrixTemplates);
      }

      if (ov) {
        setOverview(ov);
      }

      setLastFetched(new Date());
    } catch (err) {
      console.warn('[DataContext] Data load error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, sections.length, subjects.length]);

  useEffect(() => {
    if (user) {
      loadData(false);
    } else {
      setSections([]);
      setSubjects([]);
      setCourses([]);
      setStudents([]);
      setAssessments([]);
      setTemplates([]);
      setOverview(null);
      setIsLoading(false);
    }
  }, [user, loadData]);

  const addSectionLocal = useCallback((newSection: Section) => {
    setSections((prev) => {
      if (prev.some((s) => s.id === newSection.id)) return prev;
      return [newSection, ...prev];
    });
  }, []);

  const enrollStudentsLocal = useCallback((newStudents: User[], sectionId: string) => {
    setStudents((prev) => {
      const existingMap = new Map(prev.map((s) => [s.studentNumber || s.id, s]));
      for (const ns of newStudents) {
        existingMap.set(ns.studentNumber || ns.id, ns);
      }
      return Array.from(existingMap.values());
    });

    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            studentCount: (sec.studentCount || 0) + newStudents.length,
          };
        }
        return sec;
      })
    );
  }, []);

  const addSubjectLocal = useCallback((newSubject: Subject) => {
    setSubjects((prev) => {
      const idx = prev.findIndex((s) => s.id === newSubject.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newSubject;
        return copy;
      }
      return [newSubject, ...prev];
    });
  }, []);

  const removeSubjectLocal = useCallback((subjectId: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
  }, []);

  const addCourseLocal = useCallback((newCourse: Course) => {
    setCourses((prev) => {
      const idx = prev.findIndex((c) => c.id === newCourse.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newCourse;
        return copy;
      }
      return [newCourse, ...prev];
    });
  }, []);

  const removeCourseLocal = useCallback((courseId: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
  }, []);

  const addTemplateLocal = useCallback((template: GradingMatrixTemplate) => {
    setTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === template.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = template;
        return copy;
      }
      return [...prev, template];
    });
  }, []);

  const removeTemplateLocal = useCallback((templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
  }, []);

  const applyTemplateGloballyLocal = useCallback((templateId: string) => {
    setSubjects((prev) =>
      prev.map((sub) => ({
        ...sub,
        gradingMatrixTemplateId: templateId,
      }))
    );
  }, []);

  const refreshData = useCallback(async (force: boolean = true) => {
    await loadData(force);
  }, [loadData]);

  return (
    <DataContext.Provider
      value={{
        sections,
        subjects,
        courses,
        students,
        assessments,
        templates,
        overview,
        isLoading,
        isRefreshing,
        lastFetched,
        refreshData,
        addSectionLocal,
        enrollStudentsLocal,
        addSubjectLocal,
        removeSubjectLocal,
        addCourseLocal,
        removeCourseLocal,
        addTemplateLocal,
        removeTemplateLocal,
        applyTemplateGloballyLocal,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
