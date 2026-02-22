import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Gauge, MessageSquare } from 'lucide-react';
import { getSkillQuestions, scoreSkillAnswer } from '../api/resumeApi';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const RECENT_QUESTION_LIMIT = 30;

function pickRandom(items) {
  if (!items.length) return null;
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

function getNextDifficulty(current, score, correctStreak, weakStreak) {
  const index = DIFFICULTIES.indexOf(current);
  if ((score >= 90 || (score >= 75 && correctStreak >= 2)) && index < DIFFICULTIES.length - 1) {
    return DIFFICULTIES[index + 1];
  }
  if ((score <= 35 || weakStreak >= 2) && index > 0) {
    return DIFFICULTIES[index - 1];
  }
  return current;
}

function mapQuestionLevelToBand(level) {
  const value = String(level || '').toLowerCase();
  if (['beginner', 'basic', 'foundation', 'easy'].some((x) => value.includes(x))) return 'beginner';
  if (['trap', 'advanced', 'expert', 'hard'].some((x) => value.includes(x))) return 'advanced';
  return 'intermediate';
}

function pickQuestion(targetDifficulty, questions, usedIds, recentIds = new Set()) {
  const byDifficulty = questions.filter(
    (q) => mapQuestionLevelToBand(q.level) === targetDifficulty && !usedIds.has(q.id) && !recentIds.has(q.id)
  );
  const fallbackDifficulty = questions.filter(
    (q) => mapQuestionLevelToBand(q.level) === targetDifficulty && !usedIds.has(q.id)
  );
  const byAnyDifficulty = questions.filter((q) => !usedIds.has(q.id) && !recentIds.has(q.id));
  const fallbackAny = questions.filter((q) => !usedIds.has(q.id));

  return (
    pickRandom(byDifficulty) ||
    pickRandom(fallbackDifficulty) ||
    pickRandom(byAnyDifficulty) ||
    pickRandom(fallbackAny) ||
    null
  );
}

function getRecentQuestionIds(skill) {
  try {
    const raw = localStorage.getItem(`skillRecentQuestionIds:${skill.toLowerCase()}`);
    const parsed = JSON.parse(raw || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === 'string');
  } catch {
    return [];
  }
}

function saveRecentQuestionIds(skill, ids) {
  const key = `skillRecentQuestionIds:${skill.toLowerCase()}`;
  const deduped = Array.from(new Set(ids)).slice(-RECENT_QUESTION_LIMIT);
  localStorage.setItem(key, JSON.stringify(deduped));
}

export default function InterviewQuestionsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const skill = searchParams.get('skill') || 'General Skill';
  const startLevel = (searchParams.get('level') || 'intermediate').toLowerCase();
  const initialDifficulty = DIFFICULTIES.includes(startLevel) ? startLevel : 'intermediate';
  const requestedQuestions = Number(searchParams.get('numQuestions') || 6);
  const questionCount = Number.isFinite(requestedQuestions)
    ? Math.max(1, Math.min(20, Math.floor(requestedQuestions)))
    : 6;

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [answer, setAnswer] = useState('');
  const [lastScore, setLastScore] = useState(null);
  const [records, setRecords] = useState([]);
  const [usedIds, setUsedIds] = useState(new Set());
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [weakStreak, setWeakStreak] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getSkillQuestions(skill);
        const items = data.questions || [];
        setQuestions(items);
        const recentIds = new Set(getRecentQuestionIds(skill));
        const first = pickQuestion(initialDifficulty, items, new Set(), recentIds);
        setActiveQuestion(first);
        if (first) {
          setUsedIds(new Set([first.id]));
        }
      } catch (err) {
        setError(err.message || 'Failed to load skill questions.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [skill, initialDifficulty]);

  const totalQuestions = useMemo(
    () => Math.min(questionCount, questions.length || 0),
    [questionCount, questions.length]
  );

  const submitCurrent = async () => {
    if (!activeQuestion) return;
    if (!answer.trim()) {
      setError('Please write an answer before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const scored = await scoreSkillAnswer({
        skill,
        questionId: activeQuestion.id,
        answer,
      });

      const score = Number(scored.percentage || 0);
      const nextCorrectStreak = score >= 75 ? correctStreak + 1 : 0;
      const nextWeakStreak = score <= 45 ? weakStreak + 1 : 0;
      const nextDifficulty = getNextDifficulty(difficulty, score, nextCorrectStreak, nextWeakStreak);
      const expectedKeywords = Array.isArray(scored.expected_keywords)
        ? scored.expected_keywords
        : [...(scored.found_keywords || []), ...(scored.missing_keywords || [])];
      const updated = [
        ...records,
        {
          questionNumber: currentQuestion,
          question: activeQuestion.question,
          questionId: activeQuestion.id,
          answer,
          score,
          difficulty,
          verdict: scored.verdict,
          marksAwarded: scored.marks_awarded,
          totalMarks: scored.total_marks,
          foundKeywords: scored.found_keywords,
          missingKeywords: scored.missing_keywords,
          expectedKeywords,
          expectedAnswer: scored.expected_answer || expectedKeywords.join(', '),
        },
      ];

      setRecords(updated);
      setLastScore(score);
      setCorrectStreak(nextCorrectStreak);
      setWeakStreak(nextWeakStreak);

      if (currentQuestion >= totalQuestions) {
        const total = Math.round(updated.reduce((sum, item) => sum + item.score, 0) / updated.length);
        saveRecentQuestionIds(skill, [...getRecentQuestionIds(skill), ...updated.map((item) => item.questionId)]);
        sessionStorage.setItem(
          'interviewSession',
          JSON.stringify({
            skill,
            totalScore: total,
            answeredAt: new Date().toISOString(),
            answers: updated,
          })
        );
        navigate('/feedback');
        return;
      }

      const nextUsed = new Set(usedIds);
      const recentIds = new Set(getRecentQuestionIds(skill));
      const nextQuestion = pickQuestion(nextDifficulty, questions, nextUsed, recentIds);
      if (!nextQuestion) {
        const total = Math.round(updated.reduce((sum, item) => sum + item.score, 0) / updated.length);
        saveRecentQuestionIds(skill, [...getRecentQuestionIds(skill), ...updated.map((item) => item.questionId)]);
        sessionStorage.setItem(
          'interviewSession',
          JSON.stringify({
            skill,
            totalScore: total,
            answeredAt: new Date().toISOString(),
            answers: updated,
          })
        );
        navigate('/feedback');
        return;
      }

      nextUsed.add(nextQuestion.id);
      setUsedIds(nextUsed);
      setDifficulty(nextDifficulty);
      setActiveQuestion(nextQuestion);
      setCurrentQuestion((prev) => prev + 1);
      setAnswer('');
    } catch (err) {
      setError(err.message || 'Failed to score answer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{skill} Skill Verification</h1>
          <p className="text-gray-600">Step 5-6: Questions and scoring from data/questions bank</p>
        </div>

        {loading ? <div className="bg-white rounded-xl p-4 mb-4">Loading questions...</div> : null}
        {error ? <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-4">{error}</div> : null}
        {!loading && !error && !activeQuestion ? (
          <div className="bg-white rounded-xl p-4 mb-4 text-gray-700">No questions available for this skill.</div>
        ) : null}

        {activeQuestion ? (
          <>
            <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">
                  Question {currentQuestion} of {totalQuestions}
                </span>
                <span className="text-sm font-semibold text-indigo-600">
                  {Math.round((currentQuestion / (totalQuestions || 1)) * 100)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-3">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(currentQuestion / (totalQuestions || 1)) * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Gauge className="w-4 h-4 text-indigo-600" />
                <span className="text-gray-700">
                  Current difficulty: <span className="font-semibold capitalize">{difficulty}</span>
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-1">
                Target question count: <span className="font-semibold">{totalQuestions}</span>
              </p>
              <p className="text-sm text-gray-700 mt-2">
                Question level: <span className="font-semibold">{activeQuestion.level}</span>
              </p>
              {lastScore !== null ? (
                <p className="text-sm text-gray-700 mt-1">
                  Last answer score: <span className="font-semibold">{lastScore}/100</span>
                </p>
              ) : null}
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{activeQuestion.question}</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Answer
                  </label>
                  <textarea
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                    rows={8}
                    placeholder="Write your answer using clear points and relevant technical terms."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                  Score is calculated from question-specific keywords and marks in the data/questions JSON file.
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                disabled
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl transition-colors font-semibold flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Adaptive Flow</span>
              </button>

              <button
                onClick={submitCurrent}
                disabled={submitting}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold flex items-center space-x-2 disabled:opacity-60"
              >
                <span>{submitting ? 'Scoring...' : currentQuestion < totalQuestions ? 'Check & Next' : 'Submit & Get Feedback'}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
