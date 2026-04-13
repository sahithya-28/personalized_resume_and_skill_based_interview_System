import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUpRight,
  Award,
  History,
  Lightbulb,
  MessageSquareText,
  Star,
  TrendingUp,
} from 'lucide-react';
import { evaluateSkillVerification } from '../api/resumeApi';

function getLabel(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good Performance';
  if (score >= 50) return 'Average';
  return 'Needs Improvement';
}

function buildEvaluationPayload(interview) {
  const answers = Array.isArray(interview?.answers) ? interview.answers : [];
  const correctCount = answers.filter((item) => Number(item?.score || 0) >= 60).length;

  return {
    skill: interview?.skill || 'Skill',
    score: correctCount,
    total_questions: answers.length,
    answers: answers.map((item) => ({
      question: item?.question || '',
      user_answer: item?.answer || '',
      correct: Number(item?.score || 0) >= 60,
    })),
  };
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
  const currentAnswers = Array.isArray(interview?.answers) ? interview.answers : [];

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
  const [evaluation, setEvaluation] = useState(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState('');

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

  useEffect(() => {
    if (!interview || !currentAnswers.length) return;

    const cacheKey = `skillEvaluation:${interview.answeredAt || interview.skill || 'default'}`;
    const cachedRaw = sessionStorage.getItem(cacheKey);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw);
        if (cached && typeof cached === 'object') {
          setEvaluation(cached);
          return;
        }
      } catch {
        // ignore broken cache
      }
    }

    const load = async () => {
      try {
        setEvaluationLoading(true);
        setEvaluationError('');
        const result = await evaluateSkillVerification(buildEvaluationPayload(interview));
        sessionStorage.setItem(cacheKey, JSON.stringify(result));
        setEvaluation(result);
      } catch (err) {
        setEvaluationError(err.message || 'Unable to generate interview evaluation.');
      } finally {
        setEvaluationLoading(false);
      }
    };

    load();
  }, [interview, currentAnswers.length]);

  const latest = history[history.length - 1] || null;
  const previous = history.length > 1 ? history[history.length - 2] : null;
  const delta = latest && previous ? latest.finalScore - previous.finalScore : null;

  const fallbackStrengths = [];
  const fallbackWeakAreas = [];
  const fallbackSuggestions = [];

  if (resumeScore >= 75) fallbackStrengths.push('Strong resume baseline score.');
  if ((analysis?.skills || []).length >= 5) fallbackStrengths.push('Good skill coverage extracted from resume.');
  if (interviewScore >= 75) fallbackStrengths.push('High interview answer quality and structure.');
  if (interviewScore < 60) fallbackWeakAreas.push('Answer quality needs better structure and measurable outcomes.');
  if (resumeScore < 60) fallbackWeakAreas.push('Resume sections need stronger and clearer content.');
  fallbackSuggestions.push(`Improve ${interview?.skill || 'the selected skill'} answers with clearer technical reasoning and more concrete examples.`);

  const strengths = evaluation?.strengths?.length ? evaluation.strengths : fallbackStrengths.length ? fallbackStrengths : ['Consistent effort across resume and interview steps.'];
  const weakAreas = evaluation?.weaknesses?.length ? evaluation.weaknesses : fallbackWeakAreas.length ? fallbackWeakAreas : ['Keep practicing and add more measurable impact in answers.'];
  const improvementSuggestions = evaluation?.improvement_suggestions?.length
    ? evaluation.improvement_suggestions
    : fallbackSuggestions;

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

        <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquareText className="w-6 h-6 text-indigo-600" />
            <h3 className="text-2xl font-bold text-gray-900">AI Interview Evaluation</h3>
          </div>

          {evaluationLoading ? (
            <p className="text-gray-600">Generating personalized evaluation...</p>
          ) : evaluation ? (
            <div className="space-y-3">
              <p className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                {evaluation.performance_level} - {interview?.skill || 'Skill'}
              </p>
              <p className="text-gray-700 leading-relaxed">{evaluation.summary}</p>
            </div>
          ) : (
            <p className="text-gray-600">
              {evaluationError || 'Interview evaluation is not available for this attempt.'}
            </p>
          )}
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
              {strengths.map((strength) => (
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
              <h3 className="text-2xl font-bold text-gray-900">Weaknesses</h3>
            </div>
            <ul className="space-y-3">
              {weakAreas.map((area) => (
                <li key={area} className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Improvement Suggestions</h3>
              <p className="text-gray-600">Actionable next steps based on your skill verification answers.</p>
            </div>
          </div>
          <div className="space-y-3">
            {improvementSuggestions.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-4 text-sm text-indigo-950">
                {item}
              </div>
            ))}
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
