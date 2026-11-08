import React from 'react';
import { Assessment } from '../api/types';
import { Zap, Calendar } from 'lucide-react';

interface AssessmentListProps {
  assessments: Assessment[];
  onSelectAssessment?: (assessment: Assessment) => void;
}

export const AssessmentList: React.FC<AssessmentListProps> = ({
  assessments,
  onSelectAssessment,
}) => {
  return (
    <div className="bg-[#0D1525] border border-slate-800/80 rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Assessment Activity
          </h3>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/60 text-slate-300 text-xs font-semibold">
          Recent
        </span>
      </div>

      {/* List */}
      <div className="space-y-3">
        {assessments.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No recent assessment activity recorded.
          </div>
        ) : (
          assessments.map((item, idx) => {
            const maxPts = item.maxScore || item.max_score || item.points || 100;
            const isLowPts = maxPts <= 30;

            return (
              <div
                key={item.id || idx}
                onClick={() => onSelectAssessment?.(item)}
                className="bg-[#111A2D] border border-slate-800/70 hover:border-slate-700 rounded-xl p-3.5 flex items-center justify-between transition cursor-pointer group"
              >
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-[#38BDF8] transition">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span className="text-[#0EA5E9] font-medium">
                      {item.subjectCode || 'Course'} - {item.status || 'Graded'}
                    </span>
                    <span className="text-slate-600">•</span>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>{item.date || 'Today'}</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`px-3 py-1 rounded-lg border text-xs font-bold tracking-tight shrink-0 ${
                    isLowPts
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}
                >
                  {maxPts} pts
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
