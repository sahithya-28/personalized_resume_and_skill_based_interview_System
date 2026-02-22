import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowUpRight, Award, History, Star, TrendingUp } from 'lucide-react';

function getLabel(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good Performance';
  if (score >= 50) return 'Average';
  return 'Needs Improvement';
}

export default function FeedbackPage() {
  const analysis = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('resumeAnalysis') || 'null');
    } catch {
      return null;
    }
  }, []);

  const interview = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('interviewSession') || 'null');
    } catch {
      return null;
    }
  }, []);

  const resumeScore = analysis?.overall_score || 0;
  const interviewScore = interview?.totalScore || 0;
  const finalScore = Math.round((resumeScore * 0.4) + (interviewScore * 0.6));

  const strengths = [];
  const weakAreas = [];

  if (resumeScore >= 75) strengths.push('Strong resume baseline score.');
  if ((analysis?.skills || []).length >= 5) strengths.push('Good skill coverage extracted from resume.');
  if (interviewScore >= 75) strengths.push('High interview answer quality and structure.');
  if ((analysis?.vulnerabilities || []).length === 0) strengths.push('No major resume vulnerabilities detected.');

  if ((analysis?.vulnerabilities || []).length > 0) weakAreas.push(...analysis.vulnerabilities.slice(0, 3));
  if (interviewScore < 60) weakAreas.push('Answer quality needs better structure and measurable outcomes.');
  if (resumeScore < 60) weakAreas.push('Resume sections need stronger and clearer content.');

  const defaultStrengths = strengths.length ? strengths : ['Consistent effort across resume and interview steps.'];
  const defaultWeakAreas = weakAreas.length ? weakAreas : ['Keep practicing and add more measurable impact in answers.'];

  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('analysisHistory') || '[]');
    } catch {
      return [];
    }
  });
  const [verificationHistory, setVerificationHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('skillVerificationHistory') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!analysis || !interview) return;

    const saveKey = `analysis-report-saved-${interview.answeredAt || ''}`;
    if (sessionStorage.getItem(saveKey)) return;

    const report = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      fileName: analysis.fileName || 'Resume',
      resumeScore,
      interviewScore,
      finalScore,
      vulnerabilities: analysis.vulnerabilities || [],
      skill: interview.skill,
    };

    const updated = [...history, report];
    localStorage.setItem('analysisHistory', JSON.stringify(updated));
    sessionStorage.setItem(saveKey, '1');
    setHistory(updated);
  }, [analysis, interview, finalScore, history, interviewScore, resumeScore]);

  useEffect(() => {
    if (!analysis || !interview) return;
    if (!Array.isArray(interview.answers) || !interview.answers.length) return;

    const saveKey = `skill-verification-saved-${interview.answeredAt || ''}`;
    if (sessionStorage.getItem(saveKey)) return;

    const attempt = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      answeredAt: interview.answeredAt || new Date().toISOString(),
      skill: interview.skill,
      interviewScore,
      resumeScore,
      finalScore,
      answers: interview.answers.map((item, index) => {
        const expectedKeywords = Array.isArray(item.expectedKeywords)
          ? item.expectedKeywords
          : [...(item.foundKeywords || []), ...(item.missingKeywords || [])];
        return {
          questionNumber: item.questionNumber || index + 1,
          question: item.question || '',
          userAnswer: item.answer || '',
          actualAnswer: item.expectedAnswer || expectedKeywords.join(', '),
          score: item.score || 0,
          difficulty: item.difficulty || '',
        };
      }),
    };

    const updated = [...verificationHistory, attempt];
    localStorage.setItem('skillVerificationHistory', JSON.stringify(updated));
    sessionStorage.setItem(saveKey, '1');
    setVerificationHistory(updated);
  }, [analysis, interview, finalScore, interviewScore, resumeScore, verificationHistory]);
  const latest = history[history.length - 1] || null;
  const previous = history.length > 1 ? history[history.length - 2] : null;
  const delta = latest && previous ? latest.finalScore - previous.finalScore : null;
  const currentAnswers = Array.isArray(interview?.answers) ? interview.answers : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">Final Feedback</h1>
        <p className="text-gray-600 text-center mb-12">Step 7: Consolidated feedback and progress tracking</p>

        <div className="bg-white p-12 rounded-2xl shadow-xl mb-8 text-center">
          <div className="w-48 h-48 mx-auto mb-6 relative">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="88" stroke="#e5e7eb" strokeWidth="12" fill="none" />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="#10b981"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${(finalScore * 2 * Math.PI * 88) / 100} ${2 * Math.PI * 88}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-bold text-gray-900">{finalScore}</span>
              <span className="text-gray-600 font-medium">Final Score</span>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Award className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">{getLabel(finalScore)}</h2>
          </div>
          <p className="text-gray-600">
            Resume score: <span className="font-semibold">{resumeScore}</span> | Interview score:{' '}
            <span className="font-semibold">{interviewScore}</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Strengths</h3>
            </div>
            <ul className="space-y-3">
              {defaultStrengths.map((strength) => (
                <li key={strength} className="flex items-start">
                  <Star className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mr-4">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Weak Points</h3>
            </div>
            <ul className="space-y-3">
              {defaultWeakAreas.map((area) => (
                <li key={area} className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-2xl font-bold text-gray-900">Skill Verification Review</h3>
            <Link
              to="/skill-verification-history"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 font-semibold text-sm"
            >
              <History className="w-4 h-4" />
              View Full History
            </Link>
          </div>
          {currentAnswers.length ? (
            <div className="space-y-4">
              {currentAnswers.map((item, index) => {
                const expectedKeywords = Array.isArray(item.expectedKeywords)
                  ? item.expectedKeywords
                  : [...(item.foundKeywords || []), ...(item.missingKeywords || [])];
                const actualAnswer = item.expectedAnswer || expectedKeywords.join(', ');
                return (
                  <div key={`${item.questionId || index}-${index}`} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                      <p className="text-sm font-semibold text-gray-800">Q{item.questionNumber || index + 1}</p>
                      <p className="text-sm text-gray-700">
                        Score: <span className="font-semibold">{item.score || 0}/100</span>
                      </p>
                      <p className="text-sm text-gray-700">
                        Difficulty: <span className="font-semibold capitalize">{item.difficulty || 'n/a'}</span>
                      </p>
                    </div>
                    <p className="text-gray-900 font-medium mb-2">{item.question}</p>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="font-semibold text-gray-800">Your answer</p>
                        <p className="text-gray-700 whitespace-pre-wrap">{item.answer || '-'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Actual answer (expected points)</p>
                        <p className="text-gray-700">{actualAnswer || 'No expected answer provided.'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600">No skill verification answers found for this attempt.</p>
          )}
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Past Analysis Reports</h3>
          {history.length ? (
            <div className="space-y-3">
              <p className="text-gray-700">
                Total stored reports: <span className="font-semibold">{history.length}</span>
              </p>
              {delta !== null ? (
                <p className="flex items-center gap-2 text-gray-700">
                  <ArrowUpRight className={`w-5 h-5 ${delta >= 0 ? 'text-green-700' : 'text-red-700'}`} />
                  Performance change from previous attempt:{' '}
                  <span className={`font-semibold ${delta >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {delta >= 0 ? `+${delta}` : delta} points
                  </span>
                </p>
              ) : (
                <p className="text-gray-600">No previous report to compare yet.</p>
              )}
              <div className="space-y-2">
                {history.slice(-5).reverse().map((item) => (
                  <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700">
                    {new Date(item.createdAt).toLocaleString()} | Final: {item.finalScore} | Resume: {item.resumeScore} | Interview: {item.interviewScore}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No reports found.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/user-analysis" className="px-6 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50">
            Back to User Analysis
          </Link>
          <Link to="/resume-upload" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
            Start New Analysis
          </Link>
        </div>
      </div>
    </div>
  );
}
