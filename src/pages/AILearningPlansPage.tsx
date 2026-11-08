import React, { useState } from 'react';
import { Sparkles, Brain, Bot, Lightbulb, BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';

export const AILearningPlansPage: React.FC = () => {
  const [topic, setTopic] = useState('Full-Stack REST Architecture & JWT Security');
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(true);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGeneratedPlan(true);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>AI Learning Plans</span>
            </h1>
            <span className="bg-purple-500/20 text-purple-400 border border-purple-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded">
              BETA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated lesson plan generation, diagnostic student remediation & syllabus intelligence
          </p>
        </div>
      </div>

      {/* Generator Prompt Box */}
      <div className="bg-[#0D1525] border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#0EA5E9]" />
          <span>Generate Adaptive Curriculum Plan</span>
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter subject topic or course competency..."
            className="flex-1 bg-[#111A2D] border border-slate-700/80 rounded-xl py-2.5 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7]"
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shrink-0"
          >
            <Bot className="w-4 h-4" />
            <span>{generating ? 'Synthesizing Plan...' : 'Generate AI Plan'}</span>
          </button>
        </div>
      </div>

      {/* Generated Preview Card */}
      {generatedPlan && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[#0D1525] border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#0EA5E9] font-bold text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>Competency Breakdown</span>
            </div>
            <h3 className="text-sm font-bold text-white">Module 3: REST & Stateless Auth</h3>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>JWT Signing and Session State Isolation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Bcrypt Password Hashing & Vault Integrity</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Role-Based Access Control (RBAC) Middleware</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#0D1525] border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Lightbulb className="w-4 h-4" />
              <span>Diagnostic Remediation</span>
            </div>
            <h3 className="text-sm font-bold text-white">Targeted Support for 14 Students</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Based on Written Work 2 results, 14 students showed difficulty with asymmetric token expiration headers. Recommended 20-minute lab walk-through scheduled for Thursday online session.
            </p>
          </div>

          <div className="bg-[#0D1525] border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Laboratory Tasks</span>
            </div>
            <h3 className="text-sm font-bold text-white">Practical Output 2 Rubric</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI-generated grading rubric with 4 criteria: Token verification, route protection, error handling, and unit test coverage.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
