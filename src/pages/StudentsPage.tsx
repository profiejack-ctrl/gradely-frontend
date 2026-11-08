import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { User } from '../api/types';
import {
  Users,
  Search,
  Key,
  Upload,
  Mail,
  GraduationCap,
  Layers,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowDownAZ,
  ArrowUpAZ,
  UserCheck,
  X,
} from 'lucide-react';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { UploadRosterModal } from '../components/UploadRosterModal';

type SortField = 'lastName' | 'firstName' | 'studentNumber' | 'section' | 'email';
type SortDirection = 'asc' | 'desc';
type NameFormat = 'lastFirst' | 'firstLast';

/**
 * Extracts lastName and firstNames from a student's full name.
 * Robustly handles:
 * - "Lastname, Firstname Middle"
 * - "Firstname Middle Lastname"
 * - Suffixes: Jr., Sr., II, III, IV, etc.
 */
export function parseNameParts(fullName: string): { lastName: string; firstNames: string } {
  if (!fullName) return { lastName: '', firstNames: '' };
  const trimmed = fullName.trim();

  // If already formatted as "Lastname, Firstname"
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((p) => p.trim());
    return {
      lastName: parts[0] || '',
      firstNames: parts.slice(1).join(', ') || '',
    };
  }

  // Otherwise "Firstname [Middle...] Lastname [Suffix]"
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { lastName: parts[0], firstNames: '' };
  }

  const suffixes = new Set(['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv', 'v']);
  let lastIdx = parts.length - 1;
  let suffix = '';

  if (lastIdx > 0 && suffixes.has(parts[lastIdx].toLowerCase())) {
    suffix = ` ${parts[lastIdx]}`;
    lastIdx--;
  }

  const lastName = (parts[lastIdx] || '') + suffix;
  const firstNames = parts.slice(0, lastIdx).join(' ');

  return { lastName, firstNames };
}

export const StudentsPage: React.FC = () => {
  const { students, sections, enrollStudentsLocal } = useData();
  const [search, setSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [sortField, setSortField] = useState<SortField>('lastName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [nameFormat, setNameFormat] = useState<NameFormat>('lastFirst');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState<User | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Section lookup map for fast badge rendering
  const sectionMap = useMemo(() => new Map(sections.map((sec) => [sec.id, sec.name])), [sections]);

  // Handle header click to toggle sort
  const handleSortHeader = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered and sorted student list
  const processedStudents = useMemo(() => {
    const filtered = students.filter((s) => {
      const matchesSearch =
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.studentNumber?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase());

      const matchesSection =
        selectedSection === 'all' ||
        s.sectionId === selectedSection ||
        (s.sectionIds && s.sectionIds.includes(selectedSection));

      return matchesSearch && matchesSection;
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;

      if (sortField === 'lastName') {
        const pA = parseNameParts(a.name || '');
        const pB = parseNameParts(b.name || '');
        cmp = pA.lastName.localeCompare(pB.lastName, undefined, { sensitivity: 'base' });
        if (cmp === 0) {
          cmp = pA.firstNames.localeCompare(pB.firstNames, undefined, { sensitivity: 'base' });
        }
      } else if (sortField === 'firstName') {
        const pA = parseNameParts(a.name || '');
        const pB = parseNameParts(b.name || '');
        cmp = pA.firstNames.localeCompare(pB.firstNames, undefined, { sensitivity: 'base' });
        if (cmp === 0) {
          cmp = pA.lastName.localeCompare(pB.lastName, undefined, { sensitivity: 'base' });
        }
      } else if (sortField === 'studentNumber') {
        const idA = a.studentNumber || a.id || '';
        const idB = b.studentNumber || b.id || '';
        cmp = idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortField === 'section') {
        const secA = a.sectionId ? sectionMap.get(a.sectionId) || '' : '';
        const secB = b.sectionId ? sectionMap.get(b.sectionId) || '' : '';
        cmp = secA.localeCompare(secB, undefined, { sensitivity: 'base' });
        if (cmp === 0) {
          const pA = parseNameParts(a.name || '');
          const pB = parseNameParts(b.name || '');
          cmp = pA.lastName.localeCompare(pB.lastName, undefined, { sensitivity: 'base' });
        }
      } else if (sortField === 'email') {
        const emA = a.email || '';
        const emB = b.email || '';
        cmp = emA.localeCompare(emB, undefined, { sensitivity: 'base' });
      }

      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [students, search, selectedSection, sortField, sortDirection, sectionMap]);

  // Helper icon for table headers
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition ml-1" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#38BDF8] ml-1 shrink-0" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#38BDF8] ml-1 shrink-0" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[#0EA5E9]" />
            <span>Student Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse enrolled cohorts, inspect student profiles, and manage authentication credentials.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300">
            Total Enrolled: <span className="text-[#38BDF8] font-bold">{students.length || 0}</span>
          </span>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-glow transition"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Masterlist</span>
          </button>
        </div>
      </div>

      {/* Search, Filter & Sort Bar */}
      <div className="bg-[#0D1525] border border-slate-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, student number, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl py-2 pl-9 pr-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Section Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="bg-[#111A2D] border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#0284C7]"
          >
            <option value="all">All Cohorts & Sections ({students.length})</option>
            {sections.map((sec) => {
              const count = students.filter(
                (s) => s.sectionId === sec.id || (s.sectionIds && s.sectionIds.includes(sec.id))
              ).length;
              return (
                <option key={sec.id} value={sec.id}>
                  {sec.name} ({count} students)
                </option>
              );
            })}
          </select>
        </div>

        {/* Sort Selector Dropdown */}
        <div className="flex items-center gap-1.5">
          {sortDirection === 'asc' ? (
            <ArrowDownAZ className="w-4 h-4 text-[#38BDF8]" />
          ) : (
            <ArrowUpAZ className="w-4 h-4 text-[#38BDF8]" />
          )}
          <select
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field, dir] = e.target.value.split('-') as [SortField, SortDirection];
              setSortField(field);
              setSortDirection(dir);
            }}
            className="bg-[#111A2D] border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#0284C7] font-medium"
          >
            <option value="lastName-asc">Sort: Last Name (A → Z)</option>
            <option value="lastName-desc">Sort: Last Name (Z → A)</option>
            <option value="firstName-asc">Sort: First Name (A → Z)</option>
            <option value="firstName-desc">Sort: First Name (Z → A)</option>
            <option value="studentNumber-asc">Sort: Student ID (0 → 9)</option>
            <option value="studentNumber-desc">Sort: Student ID (9 → 0)</option>
            <option value="section-asc">Sort: Section (A → Z)</option>
            <option value="email-asc">Sort: Email (A → Z)</option>
          </select>
        </div>

        {/* Display Format Toggle Button: "Last, First" vs "First Last" */}
        <button
          onClick={() => setNameFormat((prev) => (prev === 'lastFirst' ? 'firstLast' : 'lastFirst'))}
          className="px-3 py-2 rounded-xl bg-[#111A2D] hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
          title="Toggle name format: Lastname, Firstname vs Firstname Lastname"
        >
          <UserCheck className="w-3.5 h-3.5 text-[#0EA5E9]" />
          <span>Format: {nameFormat === 'lastFirst' ? 'Last, First' : 'First Last'}</span>
        </button>
      </div>

      {/* Active Sort Banner Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <span>Displaying <strong>{processedStudents.length}</strong> of {students.length} students</span>
          <span className="text-slate-600">•</span>
          <span className="inline-flex items-center gap-1 text-[#38BDF8] bg-[#0284C7]/10 px-2 py-0.5 rounded-md border border-[#0284C7]/20 font-medium">
            <span>Sorted by:</span>
            <strong className="capitalize">
              {sortField === 'lastName'
                ? 'Last Name'
                : sortField === 'firstName'
                ? 'First Name'
                : sortField === 'studentNumber'
                ? 'Student ID'
                : sortField}
            </strong>
            <span>({sortDirection === 'asc' ? 'A → Z' : 'Z → A'})</span>
          </span>
        </div>

        {sortField !== 'lastName' && (
          <button
            onClick={() => {
              setSortField('lastName');
              setSortDirection('asc');
            }}
            className="text-[11px] text-[#0EA5E9] hover:underline"
          >
            Reset to Last Name (A-Z)
          </button>
        )}
      </div>

      {/* Students Table / Grid */}
      <div className="bg-[#0D1525] border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090E17] text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800 select-none">
              <tr>
                <th className="py-3 px-4 w-12 text-slate-500">#</th>

                {/* Clickable Student Name Header (Sorts by Last Name) */}
                <th
                  onClick={() => handleSortHeader('lastName')}
                  className={`py-3 px-4 cursor-pointer group transition ${
                    sortField === 'lastName' ? 'text-[#38BDF8]' : 'hover:text-white'
                  }`}
                  title="Click to sort by Last Name"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Student Name</span>
                    <span className="text-[9px] font-normal lowercase tracking-normal text-slate-500 bg-slate-800/60 px-1.5 py-0.2 rounded border border-slate-700/50">
                      by last name
                    </span>
                    {renderSortIndicator('lastName')}
                  </div>
                </th>

                {/* Clickable Student ID Header */}
                <th
                  onClick={() => handleSortHeader('studentNumber')}
                  className={`py-3 px-4 cursor-pointer group transition ${
                    sortField === 'studentNumber' ? 'text-[#38BDF8]' : 'hover:text-white'
                  }`}
                  title="Click to sort by Student ID"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Student ID / Login</span>
                    {renderSortIndicator('studentNumber')}
                  </div>
                </th>

                {/* Clickable Section Header */}
                <th
                  onClick={() => handleSortHeader('section')}
                  className={`py-3 px-4 cursor-pointer group transition ${
                    sortField === 'section' ? 'text-[#38BDF8]' : 'hover:text-white'
                  }`}
                  title="Click to sort by Section"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Section / Cohort</span>
                    {renderSortIndicator('section')}
                  </div>
                </th>

                {/* Clickable Email Header */}
                <th
                  onClick={() => handleSortHeader('email')}
                  className={`py-3 px-4 cursor-pointer group transition ${
                    sortField === 'email' ? 'text-[#38BDF8]' : 'hover:text-white'
                  }`}
                  title="Click to sort by Email"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Email Address</span>
                    {renderSortIndicator('email')}
                  </div>
                </th>

                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {processedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    <div className="flex flex-col items-center justify-center">
                      <GraduationCap className="w-8 h-8 text-slate-600 mb-2" />
                      <p className="font-semibold text-slate-400">
                        {students.length === 0 ? 'No students enrolled yet' : 'No matching students found'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                        {students.length === 0
                          ? 'Upload a section masterlist CSV file to automatically enroll students and provision their credentials.'
                          : `No students match your filter criteria.`}
                      </p>
                      {students.length === 0 && (
                        <button
                          onClick={() => setIsUploadModalOpen(true)}
                          className="mt-4 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-glow transition"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload Student Masterlist</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                processedStudents.map((student, idx) => {
                  const sectionName = student.sectionId
                    ? sectionMap.get(student.sectionId) || 'Assigned Section'
                    : 'Unassigned';

                  const nameParts = parseNameParts(student.name || '');
                  const initialLetter = nameFormat === 'lastFirst'
                    ? (nameParts.lastName.charAt(0) || student.name.charAt(0))
                    : (student.name.charAt(0));

                  return (
                    <tr key={student.id} className="hover:bg-[#111A2D]/40 transition group">
                      <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>

                      {/* Student Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#0284C7]/20 border border-[#0284C7]/40 flex items-center justify-center text-[#38BDF8] font-bold text-xs shrink-0">
                            {initialLetter.toUpperCase()}
                          </div>
                          <div>
                            {nameFormat === 'lastFirst' ? (
                              <div className="flex items-baseline gap-1">
                                <span className="font-bold text-white tracking-wide">
                                  {nameParts.lastName || student.name}
                                  {nameParts.firstNames ? ',' : ''}
                                </span>
                                {nameParts.firstNames && (
                                  <span className="text-slate-300 font-medium text-[11px]">
                                    {nameParts.firstNames}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="font-bold text-white">{student.name}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Student ID */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-semibold text-[#38BDF8] bg-[#0284C7]/10 px-2 py-0.5 rounded border border-[#0284C7]/20">
                          {student.studentNumber || student.id}
                        </span>
                      </td>

                      {/* Section */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700/60 inline-flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-500" />
                          <span>{sectionName}</span>
                        </span>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {student.email}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Enrolled</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setTargetStudent(student);
                            setIsResetModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[11px] font-semibold inline-flex items-center gap-1.5 transition"
                          title="Reset student password"
                        >
                          <Key className="w-3 h-3" />
                          <span>Reset Password</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset Modal */}
      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        students={targetStudent ? [targetStudent] : students}
      />

      {/* Upload Masterlist Modal */}
      <UploadRosterModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        sections={sections}
        onSuccess={(enrolled, secId) => enrollStudentsLocal(enrolled, secId)}
      />
    </div>
  );
};
