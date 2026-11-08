import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import { Assessment, MatrixCategory } from '../api/types';
import {
  X,
  Loader2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';

interface AddAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  subjectName?: string;
  period: 'prelim' | 'midterm' | 'finals' | string;
  categories: MatrixCategory[];
  onAssessmentCreated: (newAssessment: Assessment) => void;
}

interface CategoryOption {
  key: string;
  categoryId: string;
  parentCategoryId: string;
  subLabel: string;
  label: string;
}

export const AddAssessmentModal: React.FC<AddAssessmentModalProps> = ({
  isOpen,
  onClose,
  subjectId,
  subjectName = 'Integrative Programming Technologies',
  period,
  categories,
  onAssessmentCreated,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'prelim' | 'midterm' | 'finals'>('prelim');
  const [title, setTitle] = useState('');
  const [selectedOptionKey, setSelectedOptionKey] = useState<string>('');
  const [maxScore, setMaxScore] = useState<number | string>(50);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initial period when modal opens
  useEffect(() => {
    if (isOpen) {
      if (period === 'midterm' || period === 'finals') {
        setSelectedPeriod(period);
      } else {
        setSelectedPeriod('prelim');
      }
      setError(null);
    }
  }, [isOpen, period]);

  // Build hierarchical category options (e.g. Class Standing ▸ Performance Task (50% of Class Standing))
  const categoryOptions = useMemo<CategoryOption[]>(() => {
    const options: CategoryOption[] = [];

    categories.forEach((cat) => {
      const lowerCatName = cat.name.toLowerCase();

      if (cat.subCategories && cat.subCategories.length > 0) {
        cat.subCategories.forEach((sub) => {
          let subLabel = sub.name.toUpperCase();
          if (sub.name.toLowerCase().includes('task') || sub.name.toLowerCase().includes('performance') || sub.name.toLowerCase().includes('lab')) {
            subLabel = 'PERFORMANCE TASK';
          } else if (sub.name.toLowerCase().includes('written') || sub.name.toLowerCase().includes('quiz')) {
            subLabel = 'QUIZZES';
          } else if (sub.name.toLowerCase().includes('attendance')) {
            subLabel = 'ATTENDANCE';
          }

          // Skip Attendance from assessment creation dropdown as it is auto-calculated
          if (subLabel === 'ATTENDANCE') return;

          options.push({
            key: `${cat.id}:::${sub.id}`,
            categoryId: sub.id,
            parentCategoryId: cat.id,
            subLabel,
            label: `${cat.name} ▸ ${sub.name} (${sub.weight}% of ${cat.name})`,
          });
        });
      } else {
        // Sensible hierarchical breakdown
        if (lowerCatName.includes('standing') || lowerCatName.includes('class')) {
          options.push({
            key: `${cat.id}:::pt`,
            categoryId: 'sub-proflab-pt',
            parentCategoryId: cat.id,
            subLabel: 'PERFORMANCE TASK',
            label: `${cat.name} ▸ Performance Task (50% of ${cat.name})`,
          });
          options.push({
            key: `${cat.id}:::ww`,
            categoryId: 'sub-proflab-ww',
            parentCategoryId: cat.id,
            subLabel: 'QUIZZES',
            label: `${cat.name} ▸ Written Work / Quizzes (40% of ${cat.name})`,
          });
        } else if (lowerCatName.includes('exam')) {
          options.push({
            key: `${cat.id}:::exam`,
            categoryId: cat.id,
            parentCategoryId: cat.id,
            subLabel: 'EXAM',
            label: `${cat.name} ▸ Periodical Examination (${cat.weight}% of Total)`,
          });
        } else if (lowerCatName.includes('project') || lowerCatName.includes('output') || lowerCatName.includes('cbo')) {
          options.push({
            key: `${cat.id}:::proj`,
            categoryId: cat.id,
            parentCategoryId: cat.id,
            subLabel: 'PROJECT',
            label: `${cat.name} ▸ Course-based Project (${cat.weight}% of Total)`,
          });
        } else {
          options.push({
            key: `${cat.id}:::default`,
            categoryId: cat.id,
            parentCategoryId: cat.id,
            subLabel: cat.name.toUpperCase(),
            label: `${cat.name} (${cat.weight}% of Total)`,
          });
        }
      }
    });

    return options;
  }, [categories]);

  // Set default selected option to Performance Task
  useEffect(() => {
    if (categoryOptions.length > 0 && !selectedOptionKey) {
      const defaultPt =
        categoryOptions.find((opt) => opt.subLabel === 'PERFORMANCE TASK') || categoryOptions[0];
      setSelectedOptionKey(defaultPt.key);
    }
  }, [categoryOptions, selectedOptionKey]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an assessment title.');
      return;
    }

    const matchedOption =
      categoryOptions.find((opt) => opt.key === selectedOptionKey) || categoryOptions[0];

    const categoryId = matchedOption?.categoryId || categories[0]?.id;
    const parentCategoryId = matchedOption?.parentCategoryId || categories[0]?.id;
    const subLabel = matchedOption?.subLabel || 'PERFORMANCE TASK';

    if (!categoryId || !subjectId) {
      setError('Please select a valid subject course and grading category.');
      return;
    }
    if (Number(maxScore) <= 0) {
      setError('Maximum score must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await api.createAssessment({
        subjectId,
        categoryId,
        parentCategoryId,
        subCategoryName: subLabel,
        period: selectedPeriod,
        title: title.trim(),
        maxScore: Number(maxScore),
        date,
        description: description.trim() || undefined,
      });

      onAssessmentCreated(created);
      setTitle('');
      setDescription('');
      setMaxScore(50);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0C1220] border border-slate-800 rounded-3xl w-full max-w-[460px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              New Assessment Item
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Add a graded quiz, activity, project, or exam to{' '}
              <span className="text-slate-300 font-medium">{subjectName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition -mr-1 -mt-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mb-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* 1. Grading Period / Quarter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Grading Period / Quarter
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Prelim */}
              <button
                type="button"
                onClick={() => setSelectedPeriod('prelim')}
                className={`py-3 px-3 rounded-2xl flex flex-col items-center justify-center transition text-center ${
                  selectedPeriod === 'prelim'
                    ? 'bg-[#181832] border-2 border-[#4F46E5] text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-[#0B111E] border border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-xs text-white">Prelim</span>
                <span
                  className={`text-[10px] mt-0.5 ${
                    selectedPeriod === 'prelim' ? 'text-indigo-300 font-semibold' : 'text-slate-500'
                  }`}
                >
                  30% Term Wt
                </span>
              </button>

              {/* Midterm */}
              <button
                type="button"
                onClick={() => setSelectedPeriod('midterm')}
                className={`py-3 px-3 rounded-2xl flex flex-col items-center justify-center transition text-center ${
                  selectedPeriod === 'midterm'
                    ? 'bg-[#181832] border-2 border-[#4F46E5] text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-[#0B111E] border border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-xs text-white">Midterm</span>
                <span
                  className={`text-[10px] mt-0.5 ${
                    selectedPeriod === 'midterm' ? 'text-indigo-300 font-semibold' : 'text-slate-500'
                  }`}
                >
                  30% Term Wt
                </span>
              </button>

              {/* Finals */}
              <button
                type="button"
                onClick={() => setSelectedPeriod('finals')}
                className={`py-3 px-3 rounded-2xl flex flex-col items-center justify-center transition text-center ${
                  selectedPeriod === 'finals'
                    ? 'bg-[#181832] border-2 border-[#4F46E5] text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-[#0B111E] border border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-xs text-white">Finals</span>
                <span
                  className={`text-[10px] mt-0.5 ${
                    selectedPeriod === 'finals' ? 'text-indigo-300 font-semibold' : 'text-slate-500'
                  }`}
                >
                  40% Term Wt
                </span>
              </button>
            </div>
          </div>

          {/* 2. Assessment Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Assessment Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Quiz 3: Binary Search Trees or Lab 4"
              className="w-full bg-[#0B111E] border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] transition"
            />
          </div>

          {/* 3. Grading Matrix Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Grading Matrix Category
            </label>
            <div className="relative">
              <select
                value={selectedOptionKey}
                onChange={(e) => setSelectedOptionKey(e.target.value)}
                className="w-full bg-[#0B111E] border-2 border-[#0284C7] rounded-xl py-2.5 px-3.5 text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-[#0284C7] appearance-none cursor-pointer pr-10"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.key} value={opt.key} className="bg-[#0C1220] text-white py-1.5">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400 pointer-events-none" />
            </div>
          </div>

          {/* 4. Total Max Score & Date Given */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Total Max Score (Points)
              </label>
              <input
                type="number"
                min={1}
                required
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#0B111E] border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Date Given
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0B111E] border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] transition [color-scheme:dark]"
              />
            </div>
          </div>

          {/* 5. Instructions / Description (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Instructions / Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description or coverage of the assessment..."
              className="w-full bg-[#0B111E] border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] resize-none transition"
            />
          </div>

          {/* 6. Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#111A2D] hover:bg-slate-800 border border-slate-700/80 text-white transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Assessment</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
