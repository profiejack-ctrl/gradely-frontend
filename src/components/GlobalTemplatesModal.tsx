import React, { useState } from 'react';
import { api } from '../api/client';
import { GradingMatrixTemplate, Subject, MatrixCategory } from '../api/types';
import {
  X,
  Globe,
  Sliders,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Zap,
  Sparkles,
  Percent,
  Check,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface GlobalTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: GradingMatrixTemplate[];
  subjects: Subject[];
  onTemplateCreated?: (template: GradingMatrixTemplate) => void;
  onTemplateDeleted?: (templateId: string) => void;
  onApplyGlobally?: (templateId: string) => void;
}

export const GlobalTemplatesModal: React.FC<GlobalTemplatesModalProps> = ({
  isOpen,
  onClose,
  templates,
  subjects,
  onTemplateCreated,
  onTemplateDeleted,
  onApplyGlobally,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id || ''
  );
  const [isCreatingOrEditing, setIsCreatingOrEditing] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState<string | null>(null);

  // Form states for creating / editing
  const [tmplName, setTmplName] = useState('');
  const [tmplDesc, setTmplDesc] = useState('');
  const [tmplPassing, setTmplPassing] = useState(75);
  const [csWeight, setCsWeight] = useState(40);
  const [projectWeight, setProjectWeight] = useState(25);
  const [examWeight, setExamWeight] = useState(35);

  const [attWeight, setAttWeight] = useState(10);
  const [wwWeight, setWwWeight] = useState(50);
  const [ptWeight, setPtWeight] = useState(40);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const currentTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0] || null;

  const totalCategoryWeight = Number(csWeight) + Number(projectWeight) + Number(examWeight);
  const totalCsSubWeight = Number(attWeight) + Number(wwWeight) + Number(ptWeight);

  const handleStartCreate = () => {
    setEditTemplateId(null);
    setTmplName('');
    setTmplDesc('');
    setTmplPassing(75);
    setCsWeight(40);
    setProjectWeight(25);
    setExamWeight(35);
    setAttWeight(10);
    setWwWeight(50);
    setPtWeight(40);
    setIsCreatingOrEditing(true);
    setFeedback(null);
  };

  const handleStartEdit = (tmpl: GradingMatrixTemplate) => {
    setEditTemplateId(tmpl.id);
    setTmplName(tmpl.name);
    setTmplDesc(tmpl.description || '');
    setTmplPassing(tmpl.passingGrade ?? tmpl.passing_grade ?? 75);

    const cs = tmpl.matrix?.find((c) => c.name.toLowerCase().includes('standing') || c.name.toLowerCase().includes('class'));
    const proj = tmpl.matrix?.find((c) => c.name.toLowerCase().includes('project') || c.name.toLowerCase().includes('output'));
    const exam = tmpl.matrix?.find((c) => c.name.toLowerCase().includes('exam'));

    setCsWeight(cs?.weight ?? 40);
    setProjectWeight(proj?.weight ?? 25);
    setExamWeight(exam?.weight ?? 35);

    const att = cs?.subCategories?.find((s) => s.name.toLowerCase().includes('attendance'));
    const ww = cs?.subCategories?.find((s) => s.name.toLowerCase().includes('written') || s.name.toLowerCase().includes('quiz'));
    const pt = cs?.subCategories?.find((s) => s.name.toLowerCase().includes('task') || s.name.toLowerCase().includes('performance'));

    setAttWeight(att?.weight ?? 10);
    setWwWeight(ww?.weight ?? 50);
    setPtWeight(pt?.weight ?? 40);

    setIsCreatingOrEditing(true);
    setFeedback(null);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmplName.trim()) {
      setFeedback({ type: 'error', message: 'Template name is required.' });
      return;
    }
    if (totalCategoryWeight !== 100) {
      setFeedback({
        type: 'error',
        message: `Total category weights must equal 100%. Current total: ${totalCategoryWeight}%`,
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const matrixPayload: MatrixCategory[] = [
        {
          id: 'cat-cs',
          name: 'Class Standing',
          weight: Number(csWeight),
          color: 'emerald',
          description: `Attendance (${attWeight}%), Written Works (${wwWeight}%), Performance Tasks (${ptWeight}%)`,
          subCategories: [
            { id: 'sub-att', name: 'Attendance', weight: Number(attWeight) },
            { id: 'sub-ww', name: 'Written Works', weight: Number(wwWeight) },
            { id: 'sub-pt', name: 'Performance Tasks', weight: Number(ptWeight) },
          ],
        },
        {
          id: 'cat-project',
          name: 'Project (CBO)',
          weight: Number(projectWeight),
          color: 'indigo',
          description: 'Course-based Outputs (100%)',
          subCategories: [
            { id: 'sub-cbo', name: 'Course-based Outputs', weight: 100 },
          ],
        },
        {
          id: 'cat-exam',
          name: 'Examination (WE)',
          weight: Number(examWeight),
          color: 'rose',
          description: 'Periodic Written Examination (100%)',
          subCategories: [
            { id: 'sub-we', name: 'Written Examination', weight: 100 },
          ],
        },
      ];

      const saved = await api.saveMatrixTemplate({
        id: editTemplateId || undefined,
        name: tmplName.trim(),
        description: tmplDesc.trim() || undefined,
        passingGrade: Number(tmplPassing) || 75,
        matrix: matrixPayload,
      });

      if (onTemplateCreated) {
        onTemplateCreated(saved);
      }

      setSelectedTemplateId(saved.id);
      setIsCreatingOrEditing(false);
      setFeedback({ type: 'success', message: 'Template saved successfully!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to save template.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this grading matrix template?')) return;
    try {
      await api.deleteMatrixTemplate(templateId);
      if (onTemplateDeleted) {
        onTemplateDeleted(templateId);
      }
      const remaining = templates.filter((t) => t.id !== templateId);
      if (remaining.length > 0) {
        setSelectedTemplateId(remaining[0].id);
      }
      setFeedback({ type: 'success', message: 'Template deleted.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to delete template.' });
    }
  };

  const handleApplyToAllCourses = async (templateId: string) => {
    if (!subjects.length) {
      setFeedback({ type: 'error', message: 'No active courses found to apply template to.' });
      return;
    }

    if (
      !window.confirm(
        `Apply this grading matrix to all ${subjects.length} active courses? This will synchronize grading criteria across all classes.`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      await api.applyTemplateToAllSubjects(
        templateId,
        subjects.map((s) => s.id)
      );

      if (onApplyGlobally) {
        onApplyGlobally(templateId);
      }

      setFeedback({
        type: 'success',
        message: `Successfully synchronized grading matrix across all ${subjects.length} courses!`,
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to apply matrix.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#090E17] border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Globe className="w-5 h-5 text-[#38BDF8]" />
              <span>Global Grading Matrix Templates</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Standardize and apply grading criteria formulas across all subjects and sections
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Template Selector Pills Bar (Matching Image 2) */}
        <div className="p-6 pb-3 overflow-x-auto flex items-center gap-2 border-b border-slate-800/60 no-scrollbar">
          {templates.map((tmpl) => {
            const isActive = currentTemplate?.id === tmpl.id && !isCreatingOrEditing;
            return (
              <button
                key={tmpl.id}
                onClick={() => {
                  setSelectedTemplateId(tmpl.id);
                  setIsCreatingOrEditing(false);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#4F46E5] text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/30'
                    : 'bg-[#111A2D] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <span>{tmpl.name}</span>
              </button>
            );
          })}

          <button
            onClick={handleStartCreate}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1.5 border border-dashed ${
              isCreatingOrEditing && !editTemplateId
                ? 'bg-[#4F46E5] text-white border-indigo-400'
                : 'bg-[#111A2D]/40 hover:bg-[#111A2D] border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Template</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {isCreatingOrEditing ? (
            /* Creation / Edit Form */
            <form onSubmit={handleSaveTemplate} className="space-y-5 bg-[#0D1525] border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-black text-white">
                  {editTemplateId ? 'Edit Grading Weights' : 'Create New Grading Template'}
                </h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    totalCategoryWeight === 100
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  }`}
                >
                  Total Weight: {totalCategoryWeight}% {totalCategoryWeight === 100 ? '✓ Balanced' : '(Must be 100%)'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-300">Template Name</label>
                  <input
                    type="text"
                    required
                    value={tmplName}
                    onChange={(e) => setTmplName(e.target.value)}
                    placeholder="e.g. BCP - Professional Subjects (Laboratory)"
                    className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Passing Threshold (%)</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={tmplPassing}
                    onChange={(e) => setTmplPassing(Number(e.target.value))}
                    className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Description</label>
                <input
                  type="text"
                  value={tmplDesc}
                  onChange={(e) => setTmplDesc(e.target.value)}
                  placeholder="Official Bestlink College grading distribution..."
                  className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              {/* 3 Categories Weight Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Class Standing */}
                <div className="bg-[#111A2D] border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">Class Standing</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={csWeight}
                      onChange={(e) => setCsWeight(Number(e.target.value))}
                      className="w-16 bg-[#0D1525] border border-slate-700 rounded-lg py-1 px-2 text-xs font-black text-[#38BDF8] text-right"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Sub-Components</span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Attendance</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={attWeight}
                        onChange={(e) => setAttWeight(Number(e.target.value))}
                        className="w-14 bg-[#0D1525] border border-slate-700 rounded py-0.5 px-1.5 text-xs text-right text-slate-200"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Written Works</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={wwWeight}
                        onChange={(e) => setWwWeight(Number(e.target.value))}
                        className="w-14 bg-[#0D1525] border border-slate-700 rounded py-0.5 px-1.5 text-xs text-right text-slate-200"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Performance Tasks</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={ptWeight}
                        onChange={(e) => setPtWeight(Number(e.target.value))}
                        className="w-14 bg-[#0D1525] border border-slate-700 rounded py-0.5 px-1.5 text-xs text-right text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Project (CBO) */}
                <div className="bg-[#111A2D] border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">Project (CBO)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={projectWeight}
                      onChange={(e) => setProjectWeight(Number(e.target.value))}
                      className="w-16 bg-[#0D1525] border border-slate-700 rounded-lg py-1 px-2 text-xs font-black text-[#38BDF8] text-right"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Sub-Components</span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Course-based Outputs</span>
                      <span className="text-xs font-bold text-slate-400">100%</span>
                    </div>
                  </div>
                </div>

                {/* Examination (WE) */}
                <div className="bg-[#111A2D] border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">Examination (WE)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={examWeight}
                      onChange={(e) => setExamWeight(Number(e.target.value))}
                      className="w-16 bg-[#0D1525] border border-slate-700 rounded-lg py-1 px-2 text-xs font-black text-[#38BDF8] text-right"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Sub-Components</span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Written Examination</span>
                      <span className="text-xs font-bold text-slate-400">100%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingOrEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || totalCategoryWeight !== 100}
                  className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-sky-500/20 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Template...</span>
                    </>
                  ) : (
                    <span>Save Template</span>
                  )}
                </button>
              </div>
            </form>
          ) : currentTemplate ? (
            /* Selected Template Detail View (Exact Match to Image 2) */
            <div className="space-y-6">
              {/* Template Main Card */}
              <div className="bg-[#0D1525] border border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-lg font-black text-white tracking-tight">
                        {currentTemplate.name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#0284C7]/20 border border-[#0284C7]/40 text-[#38BDF8] text-xs font-bold">
                        Pass: {currentTemplate.passingGrade ?? currentTemplate.passing_grade ?? 75}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold flex items-center gap-1.5">
                        <Zap className="w-3 h-3 fill-amber-400" />
                        <span>BCP Transmuted (Annex A)</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 max-w-xl">
                      {currentTemplate.description ||
                        'Official Bestlink College grading distribution criteria formula.'}
                    </p>
                  </div>

                  {/* Template Card Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDeleteTemplate(currentTemplate.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>

                    <button
                      onClick={() => handleStartEdit(currentTemplate)}
                      className="px-3 py-1.5 rounded-xl bg-[#111A2D] hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Edit Weights</span>
                    </button>

                    <button
                      onClick={() => handleApplyToAllCourses(currentTemplate.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Apply Globally</span>
                    </button>
                  </div>
                </div>

                {/* 3 Category Bento Cards (Exact Match to Image 2) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                  {(currentTemplate.matrix || []).map((cat, idx) => (
                    <div
                      key={cat.id || idx}
                      className="bg-[#111A2D]/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between"
                    >
                      <div>
                        {/* Header & Percentage Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-black text-white">{cat.name}</h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#0284C7]/20 border border-[#0284C7]/40 text-[#38BDF8] text-xs font-black">
                            {cat.weight}%
                          </span>
                        </div>

                        {/* Sub-Components List */}
                        <div className="space-y-2 pt-2 border-t border-slate-800/80">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Sub-Components:
                          </span>

                          {cat.subCategories && cat.subCategories.length > 0 ? (
                            cat.subCategories.map((sub, sIdx) => (
                              <div
                                key={sub.id || sIdx}
                                className="flex items-center justify-between text-xs py-1"
                              >
                                <span className="text-slate-300 font-medium">{sub.name}</span>
                                <span className="font-bold text-[#38BDF8]">{sub.weight}%</span>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-between text-xs py-1">
                              <span className="text-slate-300 font-medium">Single Assessment</span>
                              <span className="font-bold text-[#38BDF8]">100%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Banner: Standardize All Courses (Exact Match to Image 2) */}
              <div className="bg-[#0D1525] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/20 border border-[#4F46E5]/30 flex items-center justify-center text-[#818CF8] shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Standardize All Courses</h4>
                    <p className="text-[11px] text-slate-400">
                      Synchronize this exact matrix calculation across all active subjects and sections.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleApplyToAllCourses(currentTemplate.id)}
                  disabled={isSubmitting}
                  className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 transition shrink-0"
                >
                  <Globe className="w-4 h-4" />
                  <span>Apply to All Courses</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              No template selected. Create a new template to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
