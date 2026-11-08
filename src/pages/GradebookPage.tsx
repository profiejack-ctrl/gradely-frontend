import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Assessment, Subject, User, MatrixCategory } from '../api/types';
import { parseNameParts } from './StudentsPage';
import {
  Table,
  Plus,
  Search,
  Upload,
  FileSpreadsheet,
  Download,
  Printer,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  ArrowUpDown,
  ChevronDown,
  Edit2,
  Trash2,
  UserCheck,
  Check,
  X,
  Sparkles,
  ClipboardList,
  ExternalLink,
} from 'lucide-react';
import { AddAssessmentModal } from '../components/AddAssessmentModal';
import { ImportGradesModal } from '../components/ImportGradesModal';
import { UploadRosterModal } from '../components/UploadRosterModal';
import { GlobalTemplatesModal } from '../components/GlobalTemplatesModal';
import { NavItem } from '../components/Sidebar';

interface GradebookPageProps {
  initialSubjectId?: string;
  onNavigate?: (tab: NavItem, subjectId?: string) => void;
}

type PeriodTab = 'prelim' | 'midterm' | 'finals' | 'summary';

export const GradebookPage: React.FC<GradebookPageProps> = ({ initialSubjectId, onNavigate }) => {
  const { subjects, sections, students, templates, enrollStudentsLocal } = useData();
  const { user } = useAuth();

  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || '');
  const [activePeriod, setActivePeriod] = useState<PeriodTab>('prelim');
  const [transmutationOn, setTransmutationOn] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [nameFormat, setNameFormat] = useState<'lastFirst' | 'firstLast'>('lastFirst');

  // Modals
  const [isAddAssessmentOpen, setIsAddAssessmentOpen] = useState(false);
  const [isImportGradesOpen, setIsImportGradesOpen] = useState(false);
  const [isUploadMasterlistOpen, setIsUploadMasterlistOpen] = useState(false);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);

  // Live score state: assessmentId -> studentId -> score
  const [scoreMap, setScoreMap] = useState<Record<string, Record<string, number>>>({});
  const [subjectAssessments, setSubjectAssessments] = useState<Assessment[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [editingCell, setEditingCell] = useState<{ studentId: string; assessmentId: string } | null>(null);
  const [cellInputValue, setCellInputValue] = useState<string>('');

  const lastInitialSubjectIdRef = useRef<string | undefined>(undefined);
  const hasInitializedRef = useRef<boolean>(false);

  // Sync initial and selected subject/section
  useEffect(() => {
    if (subjects.length === 0 && sections.length === 0) return;

    // 1. If parent explicitly passed a NEW initialSubjectId that hasn't been applied yet
    if (initialSubjectId && initialSubjectId !== lastInitialSubjectIdRef.current) {
      lastInitialSubjectIdRef.current = initialSubjectId;
      hasInitializedRef.current = true;
      setSelectedSubjectId(initialSubjectId);
      const sub = subjects.find((s) => s.id === initialSubjectId);
      if (sub?.sectionId) setSelectedSectionId(sub.sectionId);
      return;
    }

    // 2. Default initialization on first mount
    if (!hasInitializedRef.current) {
      if (initialSubjectId) {
        lastInitialSubjectIdRef.current = initialSubjectId;
        hasInitializedRef.current = true;
        setSelectedSubjectId(initialSubjectId);
        const sub = subjects.find((s) => s.id === initialSubjectId);
        if (sub?.sectionId) setSelectedSectionId(sub.sectionId);
      } else if (sections.length > 0) {
        hasInitializedRef.current = true;
        setSelectedSectionId(sections[0].id);
        const matchedSub = subjects.find((s) => s.sectionId === sections[0].id);
        if (matchedSub) setSelectedSubjectId(matchedSub.id);
        else if (subjects.length > 0) setSelectedSubjectId(subjects[0].id);
      } else if (subjects.length > 0) {
        hasInitializedRef.current = true;
        setSelectedSubjectId(subjects[0].id);
        if (subjects[0].sectionId) setSelectedSectionId(subjects[0].sectionId);
      }
    }
  }, [initialSubjectId, subjects, sections]);

  const activeSectionId =
    selectedSectionId ||
    subjects.find((s) => s.id === selectedSubjectId)?.sectionId ||
    sections[0]?.id ||
    '';

  const activeSection = sections.find((sec) => sec.id === activeSectionId) || sections[0] || null;

  // Subjects taught in this active section only
  const availableSubjectsForSection = useMemo(() => {
    if (!activeSectionId) return [];
    return subjects.filter((s) => s.sectionId === activeSectionId);
  }, [subjects, activeSectionId]);

  const activeSubject = useMemo(() => {
    if (availableSubjectsForSection.length === 0) return null;
    return (
      availableSubjectsForSection.find((s) => s.id === selectedSubjectId) ||
      availableSubjectsForSection[0]
    );
  }, [availableSubjectsForSection, selectedSubjectId]);

  const handleSectionChange = (newSecId: string) => {
    setSelectedSectionId(newSecId);
    const matchedSubs = subjects.filter((s) => s.sectionId === newSecId);
    if (matchedSubs.length > 0) {
      setSelectedSubjectId(matchedSubs[0].id);
    } else {
      setSelectedSubjectId('');
    }
  };

  const handleSubjectChange = (newSubId: string) => {
    setSelectedSubjectId(newSubId);
    const targetSub = subjects.find((s) => s.id === newSubId);
    if (targetSub?.sectionId && targetSub.sectionId !== activeSectionId) {
      setSelectedSectionId(targetSub.sectionId);
    }
  };

  // Load live gradebook data from backend
  useEffect(() => {
    if (!activeSubject) return;

    let isMounted = true;
    setIsLoadingScores(true);

    Promise.all([
      api.getSubjectGradebook(activeSubject.id),
      api.getSubjectAttendance(activeSubject.id).catch(() => null),
    ])
      .then(([gbData, attData]) => {
        if (!isMounted) return;
        if (gbData?.assessments) {
          setSubjectAssessments(gbData.assessments);
        }

        if (attData?.records && Array.isArray(attData.records)) {
          setAttendanceRecords(attData.records);
        } else {
          setAttendanceRecords([]);
        }

        // Populate scores map
        const newScoreMap: Record<string, Record<string, number>> = {};
        if (gbData?.gradebook && Array.isArray(gbData.gradebook)) {
          gbData.gradebook.forEach((row: any) => {
            const studId = row.student?.id;
            if (row.scores && studId) {
              Object.entries(row.scores).forEach(([assId, scData]: [string, any]) => {
                if (scData && Number.isFinite(Number(scData.rawScore))) {
                  if (!newScoreMap[assId]) newScoreMap[assId] = {};
                  newScoreMap[assId][studId] = scData.rawScore;
                }
              });
            }
          });
        }
        setScoreMap(newScoreMap);
      })
      .catch((err) => {
        console.warn('Gradebook fetch error:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingScores(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeSubject?.id]);

  // Students enrolled in this subject's section
  const sectionStudents = useMemo(() => {
    const targetSecId = activeSectionId || activeSubject?.sectionId;
    if (!targetSecId) return [];
    return students.filter(
      (s) =>
        s.sectionId === targetSecId ||
        (s.sectionIds && s.sectionIds.includes(targetSecId))
    );
  }, [students, activeSectionId, activeSubject?.sectionId]);

  // Filtered & Sorted student list
  const processedStudents = useMemo(() => {
    const list = sectionStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.studentNumber && s.studentNumber.includes(search))
    );

    return list.sort((a, b) => {
      const pA = parseNameParts(a.name || '');
      const pB = parseNameParts(b.name || '');
      const cmp = pA.lastName.localeCompare(pB.lastName, undefined, { sensitivity: 'base' });
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [sectionStudents, search, sortOrder]);

  // Categories resolved from active subject or default BCP Professional Lab
  const categories: MatrixCategory[] = useMemo(() => {
    if (activeSubject?.matrix && activeSubject.matrix.length > 0) {
      return activeSubject.matrix;
    }
    const tmpl = activeSubject?.gradingMatrixTemplateId
      ? templates.find((t) => t.id === activeSubject.gradingMatrixTemplateId)
      : templates[0];
    return (
      tmpl?.matrix || [
        { id: 'cat-proflab-cs', name: 'Class Standing', weight: 35 },
        { id: 'cat-proflab-cbo', name: 'Projects', weight: 40 },
        { id: 'cat-proflab-exam', name: 'Exams', weight: 25 },
      ]
    );
  }, [activeSubject, templates]);

  // Subcategory tag helper (e.g. PERFORMANCE TASK, QUIZZES, EXAM, PROJECT)
  const getAssessmentSubLabel = (ass: Assessment): string => {
    if (ass.subCategoryName) return ass.subCategoryName;

    // Check subCategories of categories
    for (const cat of categories) {
      const sub = cat.subCategories?.find(
        (s) => s.id === ass.category_id || s.id === ass.categoryId
      );
      if (sub) {
        const subName = sub.name.toUpperCase();
        if (subName.includes('TASK') || subName.includes('PERFORMANCE') || subName.includes('LAB')) return 'PERFORMANCE TASK';
        if (subName.includes('QUIZ') || subName.includes('WRITTEN')) return 'QUIZZES';
        return subName;
      }
    }

    const titleLower = (ass.title || '').toLowerCase();
    if (titleLower.includes('quiz') || titleLower.includes('written') || titleLower.includes('ww')) {
      return 'QUIZZES';
    }
    if (titleLower.includes('exam') || titleLower.includes('periodical')) {
      return 'EXAM';
    }
    if (titleLower.includes('project') || titleLower.includes('cbo') || titleLower.includes('output')) {
      return 'PROJECT';
    }
    return 'PERFORMANCE TASK';
  };

  // Categorize assessments for current period
  const periodAssessments = useMemo(() => {
    return subjectAssessments.filter((a) => {
      if (activePeriod === 'summary') return true;
      return a.period?.toLowerCase() === activePeriod.toLowerCase();
    });
  }, [subjectAssessments, activePeriod]);

  // Categorized assessments: CS vs Exam vs Projects (with robust parent/subcategory resolution)
  const assessmentsByCategory = useMemo(() => {
    const csAssessments: Assessment[] = [];
    const examAssessments: Assessment[] = [];
    const projectAssessments: Assessment[] = [];

    periodAssessments.forEach((ass) => {
      const catId = ass.parent_category_id || ass.parentCategoryId || ass.category_id || ass.categoryId;
      const cat =
        categories.find((c) => c.id === catId) ||
        categories.find((c) => c.subCategories?.some((s) => s.id === ass.category_id || s.id === ass.categoryId));

      const titleLower = (ass.title || '').toLowerCase();

      if (cat) {
        const catNameLower = cat.name.toLowerCase();
        if (catNameLower.includes('exam')) {
          examAssessments.push(ass);
        } else if (catNameLower.includes('project') || catNameLower.includes('cbo') || catNameLower.includes('output')) {
          projectAssessments.push(ass);
        } else {
          csAssessments.push(ass);
        }
      } else {
        // Fallback to title keywords
        if (titleLower.includes('exam')) {
          examAssessments.push(ass);
        } else if (titleLower.includes('project') || titleLower.includes('cbo') || titleLower.includes('output')) {
          projectAssessments.push(ass);
        } else {
          csAssessments.push(ass);
        }
      }
    });

    return { csAssessments, examAssessments, projectAssessments };
  }, [periodAssessments, categories]);

  // Real attendance statistics per student for the active period
  const studentAttendanceMap = useMemo(() => {
    const map: Record<string, { present: number; late: number; absent: number; excused: number; total: number; percentage: number }> = {};
    if (!attendanceRecords || attendanceRecords.length === 0) return map;

    attendanceRecords.forEach((r) => {
      if (activePeriod !== 'summary' && r.period && r.period.toLowerCase() !== activePeriod.toLowerCase()) {
        return;
      }
      const studId = r.student_id;
      if (!map[studId]) {
        map[studId] = { present: 0, late: 0, absent: 0, excused: 0, total: 0, percentage: 0 };
      }
      map[studId].total++;
      if (r.status === 'present') map[studId].present++;
      else if (r.status === 'late') map[studId].late++;
      else if (r.status === 'absent') map[studId].absent++;
      else if (r.status === 'excused') map[studId].excused++;
    });

    Object.values(map).forEach((m) => {
      if (m.total > 0) {
        // Standard formula: Present = 1.0, Late = 0.5, Excused = 1.0
        m.percentage = Math.round(((m.present + m.late * 0.5 + m.excused) / m.total) * 100);
      }
    });

    return map;
  }, [attendanceRecords, activePeriod]);

  // Category & Sub-category Weights extracted from active subject matrix
  const matrixWeights = useMemo(() => {
    const csCat = categories.find(
      (c) => c.name.toLowerCase().includes('standing') || c.name.toLowerCase().includes('class')
    );
    const projCat = categories.find(
      (c) =>
        c.name.toLowerCase().includes('project') ||
        c.name.toLowerCase().includes('cbo') ||
        c.name.toLowerCase().includes('output')
    );
    const examCat = categories.find((c) => c.name.toLowerCase().includes('exam'));

    const csWeight = csCat?.weight ?? 40;
    const projWeight = projCat?.weight ?? 25;
    const examWeight = examCat?.weight ?? 35;

    const attSub = csCat?.subCategories?.find((s) => s.name.toLowerCase().includes('attendance'));
    const wwSub = csCat?.subCategories?.find(
      (s) => s.name.toLowerCase().includes('written') || s.name.toLowerCase().includes('quiz')
    );
    const ptSub = csCat?.subCategories?.find(
      (s) =>
        s.name.toLowerCase().includes('task') ||
        s.name.toLowerCase().includes('performance') ||
        s.name.toLowerCase().includes('lab')
    );

    const attWeight = attSub?.weight ?? 10;
    const wwWeight = wwSub?.weight ?? 50;
    const ptWeight = ptSub?.weight ?? 40;

    return { csWeight, projWeight, examWeight, attWeight, wwWeight, ptWeight };
  }, [categories]);

  const { csWeight, examWeight, projWeight, attWeight, wwWeight, ptWeight } = matrixWeights;

  // Component category classifier for each assessment:
  // - WW: Written Works / Quizzes (Transmutable)
  // - PT: Performance Tasks / Lab (Transmutable)
  // - EXAM: Major Examination (Transmutable)
  // - PROJECT: Course-based Outputs (Fixed)
  const getAssessmentComponentType = (ass: Assessment): 'WW' | 'PT' | 'EXAM' | 'PROJECT' => {
    const subLabel = getAssessmentSubLabel(ass).toUpperCase();
    if (subLabel === 'QUIZZES' || subLabel.includes('WRITTEN') || subLabel.includes('QUIZ') || subLabel.includes('WW')) {
      return 'WW';
    }
    if (subLabel === 'EXAM' || subLabel.includes('EXAM')) {
      return 'EXAM';
    }
    if (subLabel === 'PROJECT' || subLabel.includes('PROJECT') || subLabel.includes('CBO') || subLabel.includes('OUTPUT')) {
      return 'PROJECT';
    }
    return 'PT';
  };

  /**
   * Transmutation function (Philippine BCP Annex A standard):
   * - No Attempt (undefined, null, NaN): 50.0 floor
   * - Attempt made (including 0):
   *   - 0% raw score -> 65.0
   *   - < 50% raw score -> 65.0 to 75.0 (65 + rawPercent * 0.2)
   *   - >= 50% raw score -> 75.0 to 100.0 (75 + (rawPercent - 50) * 0.5)
   */
  const transmuteScoreValue = (
    score: number | undefined | null,
    maxScore: number
  ): { rawPercent: number; transmutedGrade: number; hasAttempt: boolean } => {
    const safeMax = maxScore > 0 ? maxScore : 100;
    if (score === undefined || score === null || isNaN(Number(score))) {
      return {
        rawPercent: 0,
        transmutedGrade: 50, // No attempt floor
        hasAttempt: false,
      };
    }

    const numScore = Number(score);
    const rawPercent = Math.min(100, Math.max(0, (numScore / safeMax) * 100));

    let transmutedGrade: number;
    if (rawPercent < 50) {
      transmutedGrade = 65 + (rawPercent / 50) * 10;
    } else {
      transmutedGrade = 75 + (rawPercent - 50) * 0.5;
    }

    return {
      rawPercent: Math.round(rawPercent * 10) / 10,
      transmutedGrade: Math.round(transmutedGrade * 10) / 10,
      hasAttempt: true,
    };
  };

  interface StudentPeriodResult {
    attPct: number | null;
    hasAttendance: boolean;
    rawAverage: number | null;
    transmutedGrade: number | null;
    displayGrade: number | null;
    isPassing: boolean | null;
  }

  /**
   * Computes student grades for a specific period following the strict grading rules:
   * 1. Attendance = Fixed (actual roll call percentage, not transmuted)
   * 2. Written Works = Transmutable (no attempt = 50, attempt = 65..100)
   * 3. Performance Task = Transmutable (no attempt = 50, attempt = 65..100)
   * 4. Exam = Transmutable (no attempt = 50, attempt = 65..100)
   * 5. Project / CBO = Fixed (raw percentage, not transmuted)
   * 
   * "You only need to transmute the grade once":
   * The final period grade is the weighted average of the above components, and is NOT transmuted again!
   * 
   * "Whenever an assessment is created, automatically add that assessment to computation":
   * Any created assessment is factored into the calculation. Students with no recorded score get the 50 no-attempt floor.
   */
  const computeStudentPeriod = (student: User, period: PeriodTab): StudentPeriodResult => {
    if (period === 'summary') {
      const p = computeStudentPeriod(student, 'prelim');
      const m = computeStudentPeriod(student, 'midterm');
      const f = computeStudentPeriod(student, 'finals');

      let summaryTransmutedSum = 0;
      let summaryRawSum = 0;
      let summaryWeight = 0;

      if (p.transmutedGrade !== null) {
        summaryTransmutedSum += p.transmutedGrade * 30;
        summaryRawSum += (p.rawAverage ?? p.transmutedGrade) * 30;
        summaryWeight += 30;
      }
      if (m.transmutedGrade !== null) {
        summaryTransmutedSum += m.transmutedGrade * 30;
        summaryRawSum += (m.rawAverage ?? m.transmutedGrade) * 30;
        summaryWeight += 30;
      }
      if (f.transmutedGrade !== null) {
        summaryTransmutedSum += f.transmutedGrade * 40;
        summaryRawSum += (f.rawAverage ?? f.transmutedGrade) * 40;
        summaryWeight += 40;
      }

      if (summaryWeight === 0) {
        return {
          attPct: p.attPct,
          hasAttendance: p.hasAttendance,
          rawAverage: null,
          transmutedGrade: null,
          displayGrade: null,
          isPassing: null,
        };
      }

      const finalTransmuted = Math.round((summaryTransmutedSum / summaryWeight) * 10) / 10;
      const finalRaw = Math.round((summaryRawSum / summaryWeight) * 10) / 10;
      const displayGrade = transmutationOn ? finalTransmuted : finalRaw;
      const isPassing = displayGrade >= (activeSubject?.passingGrade || 75);

      return {
        attPct: p.attPct,
        hasAttendance: p.hasAttendance,
        rawAverage: finalRaw,
        transmutedGrade: finalTransmuted,
        displayGrade,
        isPassing,
      };
    }

    // 1. Attendance (Fixed) from real roll calls
    const studentAtt = studentAttendanceMap[student.id];
    const hasStudentAttendance = studentAtt !== undefined && studentAtt.total > 0;
    const attPct = hasStudentAttendance ? studentAtt.percentage : null;

    // 2. Filter assessments for this specific period
    const periodAssList = subjectAssessments.filter(
      (a) => a.period?.toLowerCase() === period.toLowerCase()
    );

    // Group assessments into the 4 assessment components
    const wwAss: Assessment[] = [];
    const ptAss: Assessment[] = [];
    const examAss: Assessment[] = [];
    const projAss: Assessment[] = [];

    periodAssList.forEach((ass) => {
      const type = getAssessmentComponentType(ass);
      if (type === 'WW') wwAss.push(ass);
      else if (type === 'PT') ptAss.push(ass);
      else if (type === 'EXAM') examAss.push(ass);
      else if (type === 'PROJECT') projAss.push(ass);
    });

    // Helper for Transmutable Groups (WW, PT, Exam):
    // No attempt -> 50.0; Attempt with 0 -> 65.0; Attempt with 100% -> 100.0
    const calcTransmutableGroup = (assList: Assessment[]) => {
      if (assList.length === 0) return { active: false, transmuted: 0, raw: 0 };
      let sumTransmuted = 0;
      let earnedRaw = 0;
      let maxRaw = 0;

      assList.forEach((a) => {
        const score = scoreMap[a.id]?.[student.id];
        const max = a.max_score || a.maxScore || 100;
        const res = transmuteScoreValue(score, max);
        sumTransmuted += res.transmutedGrade;
        earnedRaw += res.hasAttempt ? Math.max(0, Number(score)) : 0;
        maxRaw += max;
      });

      const transmuted = Math.round((sumTransmuted / assList.length) * 10) / 10;
      const raw = maxRaw > 0 ? Math.round((earnedRaw / maxRaw) * 1000) / 10 : 0;
      return { active: true, transmuted, raw };
    };

    // Helper for Fixed Groups (Project / CBO):
    // Not transmuted! Raw percent is used. No attempt -> 0%
    const calcFixedGroup = (assList: Assessment[]) => {
      if (assList.length === 0) return { active: false, transmuted: 0, raw: 0 };
      let earnedRaw = 0;
      let maxRaw = 0;

      assList.forEach((a) => {
        const score = scoreMap[a.id]?.[student.id];
        const max = a.max_score || a.maxScore || 100;
        if (score !== undefined && score !== null && !isNaN(Number(score))) {
          earnedRaw += Math.max(0, Number(score));
        }
        maxRaw += max;
      });

      const raw = maxRaw > 0 ? Math.round((earnedRaw / maxRaw) * 1000) / 10 : 0;
      return { active: true, transmuted: raw, raw }; // Fixed means transmuted = raw
    };

    const ww = calcTransmutableGroup(wwAss);
    const pt = calcTransmutableGroup(ptAss);
    const exam = calcTransmutableGroup(examAss);
    const proj = calcFixedGroup(projAss);

    // Combine Class Standing sub-components:
    // Attendance (Fixed) + Written Works (Transmutable) + Performance Tasks (Transmutable)
    let csActiveWeight = 0;
    let csTransmutedSum = 0;
    let csRawSum = 0;

    if (hasStudentAttendance && attPct !== null) {
      csActiveWeight += attWeight;
      csTransmutedSum += attPct * attWeight; // Fixed percentage
      csRawSum += attPct * attWeight;
    }
    if (ww.active) {
      csActiveWeight += wwWeight;
      csTransmutedSum += ww.transmuted * wwWeight; // Transmutable
      csRawSum += ww.raw * wwWeight;
    }
    if (pt.active) {
      csActiveWeight += ptWeight;
      csTransmutedSum += pt.transmuted * ptWeight; // Transmutable
      csRawSum += pt.raw * ptWeight;
    }

    const csActive = csActiveWeight > 0;
    const csTransmuted = csActive ? csTransmutedSum / csActiveWeight : 0;
    const csRaw = csActive ? csRawSum / csActiveWeight : 0;

    // Combine Main Categories:
    // Class Standing + Project (Fixed) + Exam (Transmutable)
    let totalMainWeight = 0;
    let periodTransmutedSum = 0;
    let periodRawSum = 0;

    if (csActive) {
      totalMainWeight += csWeight;
      periodTransmutedSum += csTransmuted * csWeight;
      periodRawSum += csRaw * csWeight;
    }
    if (proj.active) {
      totalMainWeight += projWeight;
      periodTransmutedSum += proj.transmuted * projWeight; // Fixed
      periodRawSum += proj.raw * projWeight;
    }
    if (exam.active) {
      totalMainWeight += examWeight;
      periodTransmutedSum += exam.transmuted * examWeight; // Transmutable
      periodRawSum += exam.raw * examWeight;
    }

    // If no assessments exist in this period and no roll call was conducted yet:
    if (totalMainWeight === 0) {
      return {
        attPct,
        hasAttendance: hasStudentAttendance,
        rawAverage: null,
        transmutedGrade: null,
        displayGrade: null,
        isPassing: null,
      };
    }

    const finalTransmuted = Math.round((periodTransmutedSum / totalMainWeight) * 10) / 10;
    const finalRaw = Math.round((periodRawSum / totalMainWeight) * 10) / 10;

    // ONLY TRANSMUTE ONCE: The overall period grade is the direct weighted combination
    // and is NOT transmuted again!
    const displayGrade = transmutationOn ? finalTransmuted : finalRaw;
    const isPassing = displayGrade >= (activeSubject?.passingGrade || 75);

    return {
      attPct,
      hasAttendance: hasStudentAttendance,
      rawAverage: finalRaw,
      transmutedGrade: finalTransmuted,
      displayGrade,
      isPassing,
    };
  };

  // Student row computation: calculates attendance, category weighted averages, raw percent, and transmuted standing
  const computeStudentRow = (student: User, _idx: number) => {
    return computeStudentPeriod(student, activePeriod);
  };

  // Inline score save handler
  const handleScoreSave = async (studentId: string, assessmentId: string, val: number) => {
    setScoreMap((prev) => ({
      ...prev,
      [assessmentId]: {
        ...(prev[assessmentId] || {}),
        [studentId]: val,
      },
    }));

    setEditingCell(null);

    try {
      await api.saveScore(assessmentId, studentId, val);
    } catch (err: any) {
      console.warn('Failed to save score online:', err);
    }
  };

  // Inline score delete / clear handler
  const handleScoreDelete = async (studentId: string, assessmentId: string) => {
    setScoreMap((prev) => {
      const next = { ...prev };
      if (next[assessmentId]) {
        const studentScores = { ...next[assessmentId] };
        delete studentScores[studentId];
        next[assessmentId] = studentScores;
      }
      return next;
    });

    setEditingCell(null);

    try {
      await api.deleteScore(assessmentId, studentId);
    } catch (err: any) {
      console.warn('Failed to delete score online:', err);
    }
  };

  // Reusable Score Cell Renderer (Fixed dimension 64px width, never shrinks when blank)
  const renderScoreCell = (ass: Assessment, student: User, bgClass: string, isFixed = false) => {
    const currentScore = scoreMap[ass.id]?.[student.id];
    const isEditing = editingCell?.studentId === student.id && editingCell?.assessmentId === ass.id;
    const maxScore = ass.max_score || ass.maxScore || 100;

    return (
      <td
        key={ass.id}
        className={`py-2 px-2 text-center border-r border-slate-800/60 min-w-[80px] ${bgClass}`}
      >
        <div className="flex items-center justify-center">
          {isEditing ? (
            <input
              autoFocus
              type="number"
              min={0}
              max={maxScore}
              value={cellInputValue}
              onChange={(e) => setCellInputValue(e.target.value)}
              onBlur={() => {
                const trimmed = cellInputValue.trim();
                if (trimmed === '') {
                  handleScoreDelete(student.id, ass.id);
                } else {
                  const num = Number(trimmed);
                  if (!isNaN(num)) {
                    handleScoreSave(student.id, ass.id, Math.max(0, num));
                  } else {
                    setEditingCell(null);
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const trimmed = cellInputValue.trim();
                  if (trimmed === '') {
                    handleScoreDelete(student.id, ass.id);
                  } else {
                    const num = Number(trimmed);
                    if (!isNaN(num)) {
                      handleScoreSave(student.id, ass.id, Math.max(0, num));
                    } else {
                      setEditingCell(null);
                    }
                  }
                } else if (e.key === 'Escape') {
                  setEditingCell(null);
                }
              }}
              className="w-16 h-8 min-w-[64px] max-w-[64px] py-1 px-1 bg-[#0B111E] border-2 border-[#0284C7] rounded-xl text-xs text-center font-bold text-white focus:outline-none shadow-sm shrink-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingCell({ studentId: student.id, assessmentId: ass.id });
                setCellInputValue(currentScore !== undefined ? String(currentScore) : '');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' || e.key === 'Delete') {
                  e.preventDefault();
                  handleScoreDelete(student.id, ass.id);
                }
              }}
              title={
                currentScore !== undefined
                  ? `Score: ${currentScore}/${maxScore} (${Math.round((currentScore / maxScore) * 100)}%${isFixed ? ' Fixed' : ''}) — Press Backspace/Delete to clear`
                  : isFixed
                  ? 'No Attempt (0% Fixed) — Click to grade'
                  : 'No Attempt (Transmuted: 50%) — Click to grade'
              }
              className="inline-flex items-center justify-center w-16 h-8 min-w-[64px] max-w-[64px] py-1 px-1 rounded-xl bg-[#111A2D] hover:bg-[#16233D] border border-slate-700/80 hover:border-[#0284C7] transition cursor-pointer font-bold text-xs text-white shadow-sm shrink-0"
            >
              {currentScore !== undefined ? currentScore : <span className="text-slate-500 font-normal">—</span>}
            </button>
          )}
        </div>
      </td>
    );
  };

  const handleEditAssessment = async (ass: Assessment) => {
    const newTitle = window.prompt('Update assessment title:', ass.title);
    if (!newTitle || !newTitle.trim()) return;
    const currentMax = ass.max_score || ass.maxScore || 100;
    const newMaxStr = window.prompt('Update maximum points (must be > 0):', String(currentMax));
    if (!newMaxStr) return;
    const newMax = Number(newMaxStr);
    if (isNaN(newMax) || newMax <= 0) {
      alert('Maximum score must be greater than zero.');
      return;
    }

    try {
      await api.updateAssessment(ass.id, {
        title: newTitle.trim(),
        maxScore: newMax,
      });

      setSubjectAssessments((prev) =>
        prev.map((a) =>
          a.id === ass.id
            ? { ...a, title: newTitle.trim(), max_score: newMax, maxScore: newMax }
            : a
        )
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to update assessment');
    }
  };

  const handleDeleteAssessment = async (assessmentId: string, title: string) => {
    if (!window.confirm(`Delete assessment column "${title}"?`)) return;
    try {
      await api.deleteAssessment(assessmentId);
      setSubjectAssessments((prev) => prev.filter((a) => a.id !== assessmentId));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete assessment');
    }
  };

  // Export School SMS CSV
  const handleExportCSV = () => {
    if (!processedStudents.length) return;

    const headers = ['Student ID', 'Full Name', 'Section', 'Period', 'Raw Average', 'Transmuted Grade', 'Status'];
    const rows = processedStudents.map((s, idx) => {
      const calc = computeStudentRow(s, idx);
      return [
        s.studentNumber || s.id,
        `"${s.name}"`,
        activeSection?.name || 'BSIT',
        activePeriod.toUpperCase(),
        `${calc.rawAverage}%`,
        `${calc.transmutedGrade}%`,
        calc.isPassing ? 'Passing' : 'Failing',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeSubject?.code || 'Gradebook'}_${activePeriod}_Grades.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Subject / Section Selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Table className="w-5 h-5 text-[#38BDF8]" />
              <span>Interactive Gradebook</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-[#0284C7]/20 border border-[#0284C7]/40 text-[#38BDF8] text-xs font-black">
              {activeSubject?.code || 'IPT101'}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
              3-Period Quarter System
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Manage Prelim (30%), Midterm (30%), and Finals (40%) period sheets with live matrix calculations.
          </p>
        </div>

        {/* Section & Subject Selectors */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 block">Class / Section</label>
            <select
              value={activeSectionId}
              onChange={(e) => handleSectionChange(e.target.value)}
              className="bg-[#0D1525] border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#0284C7] max-w-[220px] truncate font-semibold cursor-pointer"
            >
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name} ({sec.gradeLevelOrYear || '2nd Year'})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 block">Subject Course</label>
            <select
              value={activeSubject?.id || ''}
              onChange={(e) => handleSubjectChange(e.target.value)}
              disabled={availableSubjectsForSection.length === 0}
              className="bg-[#0D1525] border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#0284C7] max-w-[280px] truncate font-bold text-[#38BDF8] cursor-pointer disabled:opacity-50"
            >
              {availableSubjectsForSection.length === 0 ? (
                <option value="">No subjects in this section</option>
              ) : (
                availableSubjectsForSection.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} - {sub.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Period Navigation & Action Buttons Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
        {/* Left: 4 Period Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActivePeriod('prelim')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activePeriod === 'prelim'
                ? 'bg-[#0284C7] text-white shadow-lg shadow-sky-500/25'
                : 'bg-[#111A2D] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">1</span>
            <span>Prelim</span>
            <span className="text-[10px] opacity-80">30% • {subjectAssessments.filter((a) => a.period === 'prelim').length || 4}</span>
          </button>

          <button
            onClick={() => setActivePeriod('midterm')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activePeriod === 'midterm'
                ? 'bg-[#0284C7] text-white shadow-lg shadow-sky-500/25'
                : 'bg-[#111A2D] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">2</span>
            <span>Midterm</span>
            <span className="text-[10px] opacity-80">30% • {subjectAssessments.filter((a) => a.period === 'midterm').length || 0}</span>
          </button>

          <button
            onClick={() => setActivePeriod('finals')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activePeriod === 'finals'
                ? 'bg-[#0284C7] text-white shadow-lg shadow-sky-500/25'
                : 'bg-[#111A2D] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">3</span>
            <span>Finals</span>
            <span className="text-[10px] opacity-80">40% • {subjectAssessments.filter((a) => a.period === 'finals').length || 0}</span>
          </button>

          <button
            onClick={() => setActivePeriod('summary')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activePeriod === 'summary'
                ? 'bg-[#0284C7] text-white shadow-lg shadow-sky-500/25'
                : 'bg-[#111A2D] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Summary (100%)</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Transmutation Toggle Button */}
          <button
            onClick={() => setTransmutationOn((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
              transmutationOn
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${transmutationOn ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} />
            <span>Transmutation: {transmutationOn ? 'ON (BCP Annex A)' : 'OFF (Raw Only)'}</span>
          </button>

          {/* Grading Matrix Button */}
          <button
            onClick={() => setIsMatrixModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#111A2D] hover:bg-slate-800 border border-slate-700/80 text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Grading Matrix</span>
          </button>

          {/* Roll Call / Attendance Button */}
          <button
            onClick={() => onNavigate?.('attendance', activeSubject?.id)}
            className="px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-600/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
            <span>Roll Call</span>
          </button>

          {/* + Add Assessment Button */}
          <button
            onClick={() => setIsAddAssessmentOpen(true)}
            className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Assessment</span>
          </button>
        </div>
      </div>

      {/* 3. Search & Utilities Toolbar */}
      <div className="bg-[#0D1525] border border-slate-800/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left Toolbar: Search, Sort, Name Format */}
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search student name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          <div className="flex items-center gap-1">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="bg-[#111A2D] border border-slate-700/80 rounded-xl py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-[#0284C7]"
            >
              <option value="asc">Sort: Last Name (A-Z)</option>
              <option value="desc">Sort: Last Name (Z-A)</option>
            </select>
          </div>

          <button
            onClick={() => setNameFormat((prev) => (prev === 'lastFirst' ? 'firstLast' : 'lastFirst'))}
            className="px-2.5 py-1.5 rounded-xl bg-[#111A2D] hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
            title="Toggle name format"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#0EA5E9]" />
            <span>{nameFormat === 'lastFirst' ? 'Last, First' : 'First Last'}</span>
          </button>
        </div>

        {/* Right Toolbar: Import/Export Utilities */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsUploadMasterlistOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-[#111A2D] hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Import Masterlist</span>
          </button>

          <button
            onClick={() => setIsImportGradesOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-[#111A2D] hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import Grades (CSV)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 rounded-xl bg-[#111A2D] hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export School SMS CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-2.5 py-1.5 rounded-xl bg-[#111A2D] hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* 4. Multi-level Spreadsheet Table (Matching media_1793236344924_47ac2e5b.png) */}
      <div className="bg-[#090E17] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            {/* Level 1 Group Header */}
            <thead>
              <tr className="bg-[#070B13] border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                {/* Student Group */}
                <th colSpan={2} className="py-2.5 px-4 text-slate-400 border-r border-slate-800">
                  STUDENT ({processedStudents.length})
                </th>

                {/* Class Standing Group */}
                <th
                  colSpan={1 + assessmentsByCategory.csAssessments.length}
                  className="py-2.5 px-4 text-center border-r border-slate-800 bg-[#0A101D] text-slate-300"
                >
                  <div className="inline-flex items-center gap-1.5">
                    <span className="font-bold text-white">Class Standing</span>
                    <span className="px-2 py-0.5 rounded bg-[#1E1B4B] text-[#A5B4FC] text-[10px] font-bold">
                      {csWeight}%
                    </span>
                  </div>
                </th>

                {/* Exams Group */}
                <th
                  colSpan={Math.max(1, assessmentsByCategory.examAssessments.length)}
                  className="py-2.5 px-4 text-center border-r border-slate-800 bg-[#0C1220] text-slate-300"
                >
                  <div className="inline-flex items-center gap-1.5">
                    <span className="font-bold text-white">Exams</span>
                    <span className="px-2 py-0.5 rounded bg-[#1E1B4B] text-[#A5B4FC] text-[10px] font-bold">
                      {examWeight}%
                    </span>
                  </div>
                </th>

                {/* Projects Group */}
                <th
                  colSpan={Math.max(1, assessmentsByCategory.projectAssessments.length)}
                  className="py-2.5 px-4 text-center border-r border-slate-800 bg-[#0A101D] text-slate-300"
                >
                  <div className="inline-flex items-center gap-1.5">
                    <span className="font-bold text-white">Projects</span>
                    <span className="px-2 py-0.5 rounded bg-[#1E1B4B] text-[#A5B4FC] text-[10px] font-bold">
                      {projWeight}%
                    </span>
                  </div>
                </th>

                {/* Standing Group */}
                <th colSpan={2} className="py-2.5 px-4 text-center bg-[#070D18] text-indigo-200 font-bold">
                  {activePeriod.toUpperCase()} STANDING
                </th>
              </tr>

              {/* Level 2 Specific Column Header */}
              <tr className="bg-[#090E17] border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-3 w-28 border-r border-slate-800/80">ID</th>
                <th className="py-2.5 px-4 w-52 border-r border-slate-800/80">Name</th>

                {/* Class Standing Sub-columns */}
                {/* 1. Attendance */}
                <th className="py-2.5 px-3 text-center w-28 border-r border-slate-800/80 bg-[#0A101D]/70">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => onNavigate?.('attendance', activeSubject?.id)}
                      className="text-white hover:text-sky-400 font-bold flex items-center gap-1 text-xs transition"
                      title="Open Roll Call"
                    >
                      <span>Attendance</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </button>
                    <span className="text-[10px] text-indigo-400 font-semibold mt-0.5">10% of CS</span>
                  </div>
                </th>

                {/* 2. CS Assessment Columns (Performance Tasks & Quizzes) */}
                {assessmentsByCategory.csAssessments.map((ass) => (
                  <th
                    key={ass.id}
                    className="py-2.5 px-3 text-center min-w-[130px] max-w-[160px] border-r border-slate-800/80 bg-[#0A101D]/70 group"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {getAssessmentSubLabel(ass)}
                      </span>
                      <span className="text-xs font-bold text-white truncate max-w-[130px] mt-0.5" title={ass.title}>
                        {ass.title}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                        <span>Max: {ass.max_score || ass.maxScore || 100}</span>
                        <button
                          onClick={() => handleEditAssessment(ass)}
                          className="text-slate-500 hover:text-sky-400 transition"
                          title="Edit assessment"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteAssessment(ass.id, ass.title)}
                          className="text-slate-500 hover:text-rose-400 transition"
                          title="Delete column"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </th>
                ))}

                {/* Exam Sub-columns */}
                {assessmentsByCategory.examAssessments.length === 0 ? (
                  <th className="py-2 px-3 text-center text-slate-600 italic text-[10px] border-r border-slate-800/80">
                    No Exam Column
                  </th>
                ) : (
                  assessmentsByCategory.examAssessments.map((ass) => (
                    <th
                      key={ass.id}
                      className="py-2.5 px-3 text-center min-w-[130px] max-w-[160px] border-r border-slate-800/80 bg-[#0C1220]/70 group"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black uppercase tracking-wider text-rose-400">
                          {getAssessmentSubLabel(ass)}
                        </span>
                        <span className="text-xs font-bold text-white truncate max-w-[130px] mt-0.5" title={ass.title}>
                          {ass.title}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                          <span>Max: {ass.max_score || ass.maxScore || 100}</span>
                          <button
                            onClick={() => handleEditAssessment(ass)}
                            className="text-slate-500 hover:text-sky-400 transition"
                            title="Edit assessment"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteAssessment(ass.id, ass.title)}
                            className="text-slate-500 hover:text-rose-400 transition"
                            title="Delete column"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </th>
                  ))
                )}

                {/* Projects Sub-columns */}
                {assessmentsByCategory.projectAssessments.length === 0 ? (
                  <th className="py-2 px-3 text-center text-slate-600 italic text-[10px] border-r border-slate-800/80">
                    No Project Column
                  </th>
                ) : (
                  assessmentsByCategory.projectAssessments.map((ass) => (
                    <th
                      key={ass.id}
                      className="py-2.5 px-3 text-center min-w-[130px] max-w-[160px] border-r border-slate-800/80 bg-[#0A101D]/70 group"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black uppercase tracking-wider text-purple-400">
                          {getAssessmentSubLabel(ass)}
                        </span>
                        <span className="text-xs font-bold text-white truncate max-w-[130px] mt-0.5" title={ass.title}>
                          {ass.title}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                          <span>Max: {ass.max_score || ass.maxScore || 100}</span>
                          <button
                            onClick={() => handleEditAssessment(ass)}
                            className="text-slate-500 hover:text-sky-400 transition"
                            title="Edit assessment"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteAssessment(ass.id, ass.title)}
                            className="text-slate-500 hover:text-rose-400 transition"
                            title="Delete column"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </th>
                  ))
                )}

                {/* Standing Sub-columns */}
                <th className="py-2.5 px-3 text-center w-28 border-r border-slate-800/80 bg-[#070D18]">
                  {activePeriod.toUpperCase()} %
                </th>
                <th className="py-2.5 px-3 text-center w-28 bg-[#070D18]">STATUS</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/70">
              {!activeSubject ? (
                <tr>
                  <td colSpan={24} className="py-12 text-center text-slate-500 text-xs">
                    No subjects have been assigned to this section yet. Add a subject or select a different section.
                  </td>
                </tr>
              ) : processedStudents.length === 0 ? (
                <tr>
                  <td colSpan={24} className="py-12 text-center text-slate-500 text-xs">
                    No students currently enrolled in this class. Upload a masterlist or add students to populate the gradebook.
                  </td>
                </tr>
              ) : (
                processedStudents.map((student, idx) => {
                  const calc = computeStudentRow(student, idx);
                  const nameParts = parseNameParts(student.name || '');

                  return (
                    <tr key={student.id} className="hover:bg-[#111A2D]/50 transition group">
                      {/* Student ID */}
                      <td className="py-3 px-3 font-mono text-slate-400 text-xs border-r border-slate-800/60">
                        {student.studentNumber || student.id}
                      </td>

                      {/* Student Name */}
                      <td className="py-3 px-4 border-r border-slate-800/60">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs overflow-hidden shrink-0">
                            {student.avatar ? (
                              <img src={student.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-sky-400 text-xs">
                                {nameParts.lastName.charAt(0) || student.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-white text-xs truncate max-w-[180px]">
                            {nameFormat === 'lastFirst'
                              ? `${nameParts.lastName || student.name}${nameParts.firstNames ? `, ${nameParts.firstNames}` : ''}`
                              : student.name}
                          </span>
                        </div>
                      </td>

                      {/* Attendance Percentage Pill */}
                      <td className="py-3 px-3 text-center border-r border-slate-800/60 bg-[#0A101D]/40">
                        {calc.hasAttendance && calc.attPct !== null ? (
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-block ${
                              calc.attPct >= 90
                                ? 'bg-[#10B981]/20 border-[#10B981]/40 text-[#10B981]'
                                : calc.attPct >= 75
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                                : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                            }`}
                          >
                            {calc.attPct}%
                          </span>
                        ) : (
                          <span className="text-slate-500 font-normal text-xs" title="No roll call recorded yet">
                            —
                          </span>
                        )}
                      </td>

                      {/* Class Standing Score Cells */}
                      {assessmentsByCategory.csAssessments.map((ass) =>
                        renderScoreCell(ass, student, 'bg-[#0A101D]/40', false)
                      )}

                      {/* Exam Score Cells */}
                      {assessmentsByCategory.examAssessments.length === 0 ? (
                        <td className="py-3 px-3 text-center border-r border-slate-800/60 text-slate-600 min-w-[80px]">-</td>
                      ) : (
                        assessmentsByCategory.examAssessments.map((ass) =>
                          renderScoreCell(ass, student, 'bg-[#0C1220]/40', false)
                        )
                      )}

                      {/* Project Score Cells */}
                      {assessmentsByCategory.projectAssessments.length === 0 ? (
                        <td className="py-3 px-3 text-center border-r border-slate-800/60 text-slate-600 min-w-[80px]">-</td>
                      ) : (
                        assessmentsByCategory.projectAssessments.map((ass) =>
                          renderScoreCell(ass, student, 'bg-[#0A101D]/40', true)
                        )
                      )}

                      {/* Period Standing Grade */}
                      <td className="py-3 px-3 text-center border-r border-slate-800/60 bg-[#070D18]">
                        {calc.displayGrade !== null ? (
                          <div className="flex flex-col items-center">
                            <span className="font-black text-white text-sm">
                              {calc.displayGrade}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                              Raw: {calc.rawAverage}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-normal text-xs" title="No graded assessments or roll call recorded yet">
                            —
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center bg-[#070D18]">
                        {calc.isPassing !== null ? (
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${
                              calc.isPassing
                                ? 'bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]'
                                : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                calc.isPassing ? 'bg-[#10B981]' : 'bg-rose-400'
                              }`}
                            />
                            <span>{calc.isPassing ? 'Passing' : 'Failing'}</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800/80 border border-slate-700/60 text-slate-400 inline-block">
                            Ungraded
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Assessment Modal */}
      <AddAssessmentModal
        isOpen={isAddAssessmentOpen}
        onClose={() => setIsAddAssessmentOpen(false)}
        subjectId={activeSubject?.id || ''}
        subjectName={activeSubject?.name || 'Integrative Programming Technologies'}
        period={activePeriod === 'summary' ? 'prelim' : activePeriod}
        categories={categories}
        onAssessmentCreated={(newAss) => {
          setSubjectAssessments((prev) => {
            const filtered = prev.filter((a) => a.id !== newAss.id);
            return [...filtered, newAss];
          });
          // Also immediately refresh the gradebook from backend to ensure all synced assessments and columns are up to date!
          if (activeSubject?.id) {
            api.getSubjectGradebook(activeSubject.id).then((data) => {
              if (data?.assessments) setSubjectAssessments(data.assessments);
            }).catch(() => {});
          }
        }}
      />

      {/* Import Grades Modal */}
      <ImportGradesModal
        isOpen={isImportGradesOpen}
        onClose={() => setIsImportGradesOpen(false)}
        assessments={periodAssessments}
        students={sectionStudents}
        onGradesImported={(assId, newScores) => {
          setScoreMap((prev) => ({
            ...prev,
            [assId]: {
              ...(prev[assId] || {}),
              ...newScores,
            },
          }));
        }}
      />

      {/* Upload Masterlist Modal */}
      <UploadRosterModal
        isOpen={isUploadMasterlistOpen}
        onClose={() => setIsUploadMasterlistOpen(false)}
        sections={sections}
        initialSectionId={activeSubject?.sectionId}
        onSuccess={(enrolled, secId) => enrollStudentsLocal(enrolled, secId)}
      />

      {/* Global Templates / Matrix Modal */}
      <GlobalTemplatesModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        templates={templates}
        subjects={subjects}
      />
    </div>
  );
};
