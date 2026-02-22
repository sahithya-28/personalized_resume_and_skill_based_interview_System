import { Link } from 'react-router-dom';
import { AlertTriangle, Lightbulb } from 'lucide-react';

export default function VulnerabilitiesPage() {
  let vulnerabilities = [];

  try {
    const analysis = JSON.parse(sessionStorage.getItem('resumeAnalysis') || 'null');
    vulnerabilities = analysis?.vulnerabilities || [];
  } catch {
    vulnerabilities = [];
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">Resume Vulnerabilities</h1>
        <p className="text-gray-600 text-center mb-10">Step 4: Areas that may be questioned during interviews</p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-amber-600 mr-3 flex-shrink-0 mt-1" />
            <p className="text-amber-800 text-sm">
              These are improvement opportunities. Use them to prepare stronger interview explanations.
            </p>
          </div>
        </div>

        {(vulnerabilities || []).length ? (
          <div className="space-y-4">
            {vulnerabilities.map((item, index) => (
              <div key={`${item}-${index}`} className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-amber-500">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-amber-700 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 mb-3">{item}</p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-green-700 mt-0.5" />
                      <p className="text-sm text-green-800">Prepare a concise example with measurable impact to address this point.</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
            <p className="text-green-700 font-semibold">No vulnerabilities found. Your resume appears solid.</p>
            <p className="text-gray-600 text-sm mt-2">Upload and analyze another resume to refresh this section.</p>
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link to="/resume-upload" className="px-7 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold">
            Analyze Another Resume
          </Link>
          <Link to="/interview-prep" className="px-7 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold">
            Continue to Interview Prep
          </Link>
        </div>
      </div>
    </div>
  );
}
