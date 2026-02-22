import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ClipboardList, FileUp } from 'lucide-react';

const flowSteps = [
  'Upload resume',
  'Extract and display skills, education, projects, and other sections',
  'Find weak points (vulnerabilities)',
  'Skill checking (level-wise)',
  'Smart difficulty question flow',
  'Answer checking and score',
  'Final feedback',
];

export default function UserAnalysisPage() {
  let history = [];

  try {
    history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
  } catch {
    history = [];
  }

  const latest = history[history.length - 1] || null;
  const previous = history.length > 1 ? history[history.length - 2] : null;
  const delta = latest && previous ? latest.finalScore - previous.finalScore : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">User Analysis</h1>
        <p className="text-gray-600 text-center mb-10">
          End-to-end resume analysis and interview readiness flow
        </p>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <ClipboardList className="w-6 h-6 text-cyan-700" />
            <h2 className="text-2xl font-bold text-gray-900">Analysis Flow</h2>
          </div>
          <div className="space-y-3">
            {flowSteps.map((step, index) => (
              <div key={step} className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div className="w-7 h-7 rounded-full bg-cyan-700 text-white text-sm font-semibold flex items-center justify-center">
                  {index + 1}
                </div>
                <p className="text-gray-800">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Past Analysis Snapshot</h3>
          {latest ? (
            <div className="space-y-2 text-gray-700">
              <p>
                Latest final score: <span className="font-semibold">{latest.finalScore}</span>
              </p>
              {delta !== null ? (
                <p>
                  Performance change: {' '}
                  <span className={`font-semibold ${delta >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {delta >= 0 ? `+${delta}` : delta} points
                  </span>
                </p>
              ) : (
                <p className="text-sm text-gray-600">Run one more analysis to see change tracking.</p>
              )}
            </div>
          ) : (
            <p className="text-gray-600">No past analysis report found yet.</p>
          )}
        </div>

        <div className="flex justify-center">
          <Link
            to="/resume-upload"
            className="px-8 py-3 bg-cyan-700 text-white rounded-xl hover:bg-cyan-800 font-semibold flex items-center gap-2"
          >
            <FileUp className="w-5 h-5" />
            Start User Analysis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {!!history.length && (
          <div className="mt-8 flex items-center justify-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{history.length} analysis report(s) stored</span>
          </div>
        )}
      </div>
    </div>
  );
}
