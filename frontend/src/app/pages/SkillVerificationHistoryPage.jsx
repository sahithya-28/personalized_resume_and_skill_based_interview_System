import { useMemo } from 'react';
import { Link } from 'react-router-dom';

export default function SkillVerificationHistoryPage() {
  const history = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('skillVerificationHistory') || '[]');
    } catch {
      return [];
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">Skill Verification History</h1>
        <p className="text-gray-600 text-center mb-10">All your past skill verification attempts</p>

        <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
          <p className="text-gray-700">
            Total attempts: <span className="font-semibold">{history.length}</span>
          </p>
        </div>

        {history.length ? (
          <div className="space-y-6">
            {history.slice().reverse().map((attempt) => (
              <div key={attempt.id} className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Date:</span> {new Date(attempt.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Skill:</span> {attempt.skill || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Interview:</span> {attempt.interviewScore || 0}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Final:</span> {attempt.finalScore || 0}
                  </p>
                </div>

                <div className="space-y-3">
                  {(attempt.answers || []).map((item, index) => (
                    <details key={`${attempt.id}-${index}`} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                      <summary className="cursor-pointer font-semibold text-gray-800">
                        Q{item.questionNumber || index + 1}: {item.question || 'Question'}
                      </summary>
                      <div className="mt-3 space-y-2 text-sm">
                        <p className="text-gray-700">
                          <span className="font-semibold">Your answer:</span> {item.userAnswer || '-'}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-semibold">Actual answer:</span>{' '}
                          {item.actualAnswer || 'No expected answer provided.'}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-semibold">Score:</span> {item.score || 0}/100
                        </p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-lg text-gray-700">No skill verification attempts found.</div>
        )}

        <div className="mt-8 text-center">
          <Link to="/feedback" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
            Back to Feedback
          </Link>
        </div>
      </div>
    </div>
  );
}
