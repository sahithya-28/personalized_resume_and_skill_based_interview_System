import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, Code, ChevronRight } from 'lucide-react';
import { getMatchedSkills } from '../api/resumeApi';

function detectLevel(skill, sections = {}) {
  const text = `${sections.projects || ''} ${sections.experience || ''}`.toLowerCase();
  const mentions = text.split(skill.toLowerCase()).length - 1;
  if (mentions >= 3) return 'Advanced';
  if (mentions >= 1) return 'Intermediate';
  return 'Beginner';
}

export default function SkillVerificationPage() {
  const analysis = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('resumeAnalysis') || 'null');
    } catch {
      return null;
    }
  }, []);

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [questionCount, setQuestionCount] = useState(6);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const resumeSkills = (analysis?.skills || []).slice(0, 12);
        if (!resumeSkills.length) {
          setSkills([]);
          return;
        }

        const cacheKey = `matchedSkills:${analysis?.analyzedAt || 'default'}`;
        const cachedRaw = sessionStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (Array.isArray(cached)) {
            setSkills(cached);
            return;
          }
        }

        const response = await getMatchedSkills(resumeSkills);
        const matched = (response.skills || []).map((item) => {
          const level = detectLevel(item.resume_skill, analysis?.sections || {});
          return {
            name: item.resume_skill,
            bankSkill: item.bank_skill,
            level,
            questions: item.question_count,
          };
        });

        sessionStorage.setItem(cacheKey, JSON.stringify(matched));
        setSkills(matched);
      } catch (err) {
        setError(err.message || 'Failed to load skill verification questions.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [analysis]);

  const difficultyColors = {
    Beginner: 'bg-green-100 text-green-700',
    Intermediate: 'bg-yellow-100 text-yellow-700',
    Advanced: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">Skill Claim Verification</h1>
        <p className="text-gray-600 text-center mb-12">
          Step 3: Pick a skill, set question count, and start adaptive verification
        </p>

        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Verification Setup</h3>
              <p className="text-sm text-gray-600">Choose how many questions should be asked in one verification run.</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="questionCount" className="text-sm font-semibold text-gray-700">Questions:</label>
              <select
                id="questionCount"
                value={questionCount}
                onChange={(event) => setQuestionCount(Number(event.target.value) || 6)}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-800"
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={6}>6</option>
                <option value={8}>8</option>
                <option value={10}>10</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? <div className="bg-white rounded-xl p-4 text-gray-700">Loading skill questions...</div> : null}
        {error ? <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-4">{error}</div> : null}

        {!loading && !error && !skills.length ? (
          <div className="bg-white rounded-xl p-6 text-gray-700">
            No matching skill question bank found for the detected resume skills.
          </div>
        ) : null}

        <div className="space-y-4">
          {skills.map((skill) => (
            <div key={skill.name} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Code className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{skill.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyColors[skill.level]}`}>
                        {skill.level}
                      </span>
                      <span className="text-sm text-gray-600">{skill.questions} questions in bank</span>
                    </div>
                  </div>
                </div>
                <Link
                  to={`/interview-questions?skill=${encodeURIComponent(skill.bankSkill)}&level=${skill.level.toLowerCase()}&numQuestions=${questionCount}`}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold flex items-center space-x-2"
                >
                  <Target className="w-5 h-5" />
                  <span>Verify</span>
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Question source:</span> data/questions JSON bank
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            to="/vulnerabilities"
            className="px-6 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
          >
            Continue to Vulnerabilities
          </Link>
        </div>
      </div>
    </div>
  );
}
