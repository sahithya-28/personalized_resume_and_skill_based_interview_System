import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, FileSearch } from 'lucide-react';

function labelize(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ResumeScorePage() {
  const analysis = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('resumeAnalysis') || 'null');
    } catch {
      return null;
    }
  }, []);

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 px-4 py-12">
        <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl shadow-xl text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">No Resume Analysis Found</h1>
          <p className="text-gray-600 mb-6">Upload and analyze a resume first.</p>
          <Link to="/resume-upload" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
            Go to Resume Upload
          </Link>
        </div>
      </div>
    );
  }

  const sectionEntries = Object.entries(analysis.sections || {}).filter(([, value]) => value?.trim?.());

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">Resume Analysis Report</h1>
        <p className="text-gray-600 text-center mb-10">
          Step 2: Extracted resume content
          {analysis.fileName ? ` (${analysis.fileName})` : ''}
        </p>

        <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileSearch className="w-6 h-6 text-sky-700" />
            Extracted Resume Data
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
              <p className="text-sm text-sky-900 font-semibold mb-2">Skills</p>
              {(analysis.skills || []).length ? (
                <div className="flex flex-wrap gap-2">
                  {analysis.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 bg-white border border-sky-200 rounded-full text-sm text-sky-900">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No skills detected.</p>
              )}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-900 font-semibold mb-2">Vulnerabilities Found</p>
              <p className="text-2xl font-bold text-amber-700">{(analysis.vulnerabilities || []).length}</p>
            </div>
          </div>
          <div className="space-y-3">
            {sectionEntries.map(([name, text]) => (
              <div key={name} className="rounded-xl border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-1">{labelize(name)}</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {String(text).slice(0, 400)}
                  {String(text).length > 400 ? '...' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            Weak Points (Vulnerabilities)
          </h3>
          {(analysis.vulnerabilities || []).length ? (
            <ul className="space-y-2 text-gray-700">
              {analysis.vulnerabilities.map((item, idx) => (
                <li key={`${item}-${idx}`} className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              No major vulnerabilities detected.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/resume-upload" className="px-6 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50">
            Analyze Another Resume
          </Link>
          <Link to="/resume-building" className="px-6 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50">
            Go to Resume Building
          </Link>
          <Link to="/skill-verification" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 flex items-center gap-2">
            Continue to Skill Verification
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
