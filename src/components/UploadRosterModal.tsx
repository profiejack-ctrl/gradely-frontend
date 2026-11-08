import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { Section, User } from '../api/types';
import { parseMasterlistCSV, ParsedStudentRow } from '../utils/csvParser';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Users,
  Lock,
  Layers,
  Loader2,
  ArrowRight,
  ClipboardPaste,
} from 'lucide-react';

interface UploadRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSectionId?: string;
  sections: Section[];
  onSuccess?: (enrolledStudents: User[], sectionId: string) => void;
}

export const UploadRosterModal: React.FC<UploadRosterModalProps> = ({
  isOpen,
  onClose,
  initialSectionId,
  sections,
  onSuccess,
}) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedStudents, setParsedStudents] = useState<ParsedStudentRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialSectionId) {
      setSelectedSectionId(initialSectionId);
    } else if (sections.length > 0) {
      setSelectedSectionId(sections[0].id);
    }
  }, [initialSectionId, sections]);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'text/plain') {
      setError('Please upload a valid .csv spreadsheet file.');
      return;
    }

    setFileName(file.name);
    setError(null);
    setSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const students = parseMasterlistCSV(text);
      if (students.length === 0) {
        setError('No valid student rows found in the CSV. Make sure it contains "student_id" and "student_name" columns.');
      } else {
        setParsedStudents(students);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file contents.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handlePasteProcess = () => {
    if (!pasteText.trim()) {
      setError('Please paste your CSV masterlist content.');
      return;
    }
    setError(null);
    const students = parseMasterlistCSV(pasteText);
    if (students.length === 0) {
      setError('No valid student rows found in the pasted text. Ensure header has student_id and student_name.');
    } else {
      setParsedStudents(students);
      setFileName('Pasted Masterlist Content');
    }
  };

  const handleReset = () => {
    setParsedStudents([]);
    setFileName(null);
    setPasteText('');
    setError(null);
    setSuccessMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEnroll = async () => {
    if (!selectedSectionId) {
      setError('Please select a target Section / Class to enroll these students into.');
      return;
    }
    if (parsedStudents.length === 0) {
      setError('No students to enroll.');
      return;
    }

    setIsEnrolling(true);
    setError(null);

    try {
      const payload = parsedStudents.map((s) => ({
        studentNumber: s.studentNumber,
        name: s.name,
        email: s.email,
      }));

      const res = await api.uploadSectionRoster(selectedSectionId, payload);

      const targetSec = sections.find((s) => s.id === selectedSectionId);
      setSuccessMessage(
        `Successfully enrolled and registered ${res.enrolledCount} students into ${targetSec?.name || 'the section'}!`
      );

      if (onSuccess) {
        onSuccess(res.students as User[], selectedSectionId);
      }

      setTimeout(() => {
        handleReset();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to enroll students. Please try again.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const activeSection = sections.find((s) => s.id === selectedSectionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0D1525] border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0284C7]/15 border border-[#0284C7]/30 flex items-center justify-center text-[#38BDF8]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>Upload Section Masterlist</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  Auto-Account Provisioning
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Enroll students and automatically generate their student portal login credentials
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body with scrolling */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Target Section Selector */}
          <div className="p-4 rounded-2xl bg-[#111A2D] border border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#0EA5E9]" />
                  <span>Target Class / Cohort</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Select the section where these students will be enrolled:
                </p>
              </div>

              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="bg-[#090E17] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#0284C7] max-w-xs"
              >
                {sections.length === 0 ? (
                  <option value="">No sections available</option>
                ) : (
                  sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name} ({sec.gradeLevelOrYear || 'Section'})
                    </option>
                  ))
                )}
              </select>
            </div>

            {activeSection && (
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-4 text-xs text-slate-400">
                <span>Room: <strong className="text-slate-200">{activeSection.room || 'MV208'}</strong></span>
                <span>•</span>
                <span>Term: <strong className="text-slate-200">{activeSection.academicYear} ({activeSection.semester})</strong></span>
              </div>
            )}
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Input Method Switcher (File Upload vs Paste Text) */}
          {parsedStudents.length === 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'upload'
                      ? 'bg-[#0284C7] text-white'
                      : 'bg-[#111A2D] text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload CSV File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'paste'
                      ? 'bg-[#0284C7] text-white'
                      : 'bg-[#111A2D] text-slate-400 hover:text-white'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Paste CSV Text</span>
                </button>
              </div>

              {activeTab === 'upload' ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                    isDragging
                      ? 'border-[#0284C7] bg-[#0284C7]/10'
                      : 'border-slate-800 hover:border-slate-700 bg-[#111A2D]/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileProcess(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-[#0284C7]/10 border border-[#0284C7]/20 flex items-center justify-center text-[#38BDF8] mb-3">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    Drop your masterlist CSV here, or <span className="text-[#0EA5E9]">browse</span>
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md">
                    Accepts official class masterlists or grading sheets with <code>student_id</code> and <code>student_name</code>.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    rows={6}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="student_id,student_name&#10;250102531,&quot;Abayon, Shawn Daniel&quot;&#10;250103247,&quot;Ajoc, Mark Gabriel&quot;"
                    className="w-full bg-[#111A2D] border border-slate-700/80 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#0284C7]"
                  />
                  <button
                    type="button"
                    onClick={handlePasteProcess}
                    className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-glow"
                  >
                    <span>Parse Roster Data</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Parsed Students Preview */}
          {parsedStudents.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111A2D] p-3.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {parsedStudents.length} Students Detected
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Source: {fileName || 'Masterlist Upload'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Choose Different File
                </button>
              </div>

              {/* Security & Non-grade policy alert */}
              <div className="p-3.5 rounded-xl bg-[#0284C7]/10 border border-[#0284C7]/30 flex items-start gap-2.5 text-xs text-slate-300">
                <Lock className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-white">Grades & activities are ignored:</strong> Only student identity
                  (Student ID & Name) will be saved. Each student account is automatically provisioned with their initial password set to their <strong>Student ID</strong> so they can log in via their student portal.
                </div>
              </div>

              {/* Preview Table */}
              <div className="bg-[#090E17] border border-slate-800 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0D1525] text-slate-400 uppercase tracking-wider text-[10px] font-bold sticky top-0 z-10 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 w-10">#</th>
                      <th className="py-2.5 px-3">Student ID</th>
                      <th className="py-2.5 px-3">Full Name</th>
                      <th className="py-2.5 px-3">Login Email</th>
                      <th className="py-2.5 px-3">Initial Password</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {parsedStudents.map((stud, idx) => (
                      <tr key={stud.studentNumber} className="hover:bg-slate-900/40 transition">
                        <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-[#38BDF8]">{stud.studentNumber}</td>
                        <td className="py-2 px-3 font-sans font-semibold text-white">{stud.name}</td>
                        <td className="py-2 px-3 text-slate-400 text-[11px]">{stud.email}</td>
                        <td className="py-2 px-3 text-emerald-400 font-semibold">{stud.studentNumber}</td>
                        <td className="py-2 px-3 text-right">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-sans font-bold">
                            Ready
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between shrink-0 bg-[#0D1525]">
          <div className="text-xs text-slate-400">
            {parsedStudents.length > 0 && (
              <span>Ready to register {parsedStudents.length} accounts into {activeSection?.name || 'selected section'}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isEnrolling}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleEnroll}
              disabled={parsedStudents.length === 0 || isEnrolling || !selectedSectionId}
              className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-glow transition disabled:opacity-50"
            >
              {isEnrolling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enrolling Students & Creating Accounts...</span>
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5" />
                  <span>Enroll & Register {parsedStudents.length} Students</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
