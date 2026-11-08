import React, { useState } from 'react';
import { api } from '../api/client';
import { Assessment, User } from '../api/types';
import { parseCSVLine } from '../utils/csvParser';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

interface ImportGradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessments: Assessment[];
  students: User[];
  onGradesImported: (assessmentId: string, scores: Record<string, number>) => void;
}

export const ImportGradesModal: React.FC<ImportGradesModalProps> = ({
  isOpen,
  onClose,
  assessments,
  students,
  onGradesImported,
}) => {
  const [targetAssessmentId, setTargetAssessmentId] = useState<string>(
    assessments[0]?.id || ''
  );
  const [pasteText, setPasteText] = useState('');
  const [parsedRows, setParsedRows] = useState<
    Array<{ studentId: string; studentName: string; studentNumber: string; score: number }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetAssessment = assessments.find((a) => a.id === targetAssessmentId) || assessments[0];

  const handleParse = (text: string) => {
    setError(null);
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const studentMapByNumber = new Map(
      students.map((s) => [(s.studentNumber || s.id).toLowerCase(), s])
    );
    const studentMapById = new Map(students.map((s) => [s.id.toLowerCase(), s]));

    const results: Array<{
      studentId: string;
      studentName: string;
      studentNumber: string;
      score: number;
    }> = [];

    // Check if line 0 is header
    let startIdx = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('student') || firstLine.includes('id') || firstLine.includes('score')) {
      startIdx = 1;
    }

    for (let i = startIdx; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < 2) continue;

      const rawId = cols[0].replace(/["']/g, '').trim().toLowerCase();
      const rawScore = Number(cols[1].replace(/["']/g, '').trim());

      if (isNaN(rawScore)) continue;

      const matchedStudent = studentMapByNumber.get(rawId) || studentMapById.get(rawId);
      if (matchedStudent) {
        results.push({
          studentId: matchedStudent.id,
          studentName: matchedStudent.name,
          studentNumber: matchedStudent.studentNumber || matchedStudent.id,
          score: rawScore,
        });
      }
    }

    if (results.length === 0) {
      setError('No matching students found in the provided CSV text. Make sure column 1 is Student ID and column 2 is Score.');
    } else {
      setParsedRows(results);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setPasteText(text);
      handleParse(text);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!targetAssessmentId) {
      setError('Please select an assessment column to import scores into.');
      return;
    }
    if (parsedRows.length === 0) {
      setError('No valid scores to import.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const scoreMap: Record<string, number> = {};
      for (const row of parsedRows) {
        await api.saveScore(targetAssessmentId, row.studentId, row.score);
        scoreMap[row.studentId] = row.score;
      }

      onGradesImported(targetAssessmentId, scoreMap);
      setParsedRows([]);
      setPasteText('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save scores.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0D1525] border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span>Import Assessment Grades (CSV)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Quickly paste or upload spreadsheet scores mapped to student IDs
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Target Assessment Column</label>
            <select
              value={targetAssessmentId}
              onChange={(e) => setTargetAssessmentId(e.target.value)}
              className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#0284C7]"
            >
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} (Max: {a.max_score || a.maxScore || 100}) - {a.period?.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Paste CSV Content <span className="text-slate-500 font-normal">(Format: student_id, score)</span>
            </label>
            <textarea
              rows={4}
              value={pasteText}
              onChange={(e) => {
                setPasteText(e.target.value);
                handleParse(e.target.value);
              }}
              placeholder={`250102531, 95\n250103247, 88\n250103294, 92`}
              className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>Or upload file:</span>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 cursor-pointer"
            />
          </div>

          {parsedRows.length > 0 && (
            <div className="bg-[#111A2D]/80 border border-slate-800 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
              <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready to import {parsedRows.length} student scores:</span>
              </div>
              {parsedRows.slice(0, 10).map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-0.5 border-b border-slate-800/40">
                  <span className="text-white font-medium">{r.studentName}</span>
                  <span className="font-mono text-[#38BDF8] font-bold">{r.score}</span>
                </div>
              ))}
              {parsedRows.length > 10 && (
                <div className="text-[10px] text-slate-500 italic pt-1">
                  ...and {parsedRows.length - 10} more students
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || parsedRows.length === 0}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Scores...</span>
                </>
              ) : (
                <span>Save All Grades</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
