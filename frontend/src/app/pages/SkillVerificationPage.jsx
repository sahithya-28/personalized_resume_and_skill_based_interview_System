import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Code, RotateCcw, Target } from 'lucide-react';
import { getMatchedSkills, getSkillQuestions } from '../api/resumeApi';

function detectLevel(skill, sections = {}) {
  const text = `${sections.projects || ''} ${sections.experience || ''}`.toLowerCase();
  const mentions = text.split(skill.toLowerCase()).length - 1;
  if (mentions >= 3) return 'Advanced';
  if (mentions >= 1) return 'Intermediate';
  return 'Beginner';
}

function getExtractedSkills(analysis) {
  const rawSkills =
    analysis?.skills ||
    analysis?.skill_extraction?.detected_skills ||
    analysis?.entities?.skills ||
    [];

  const seen = new Set();
  return rawSkills
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((skill) => {
      const key = skill.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function sortMatchedSkills(items, analysis) {
  const evidence = analysis?.skill_verification || {};
  const frequencies = analysis?.skill_strength_analysis?.by_skill || {};
  const sections = analysis?.sections || {};

  return [...items]
    .map((item) => {
      const resumeSkill = String(item.resume_skill || '').trim();
      const evidenceEntry = evidence[resumeSkill] || {};
      const locations = Array.isArray(evidenceEntry.locations) ? evidenceEntry.locations : [];
      const sourceSection = String(evidenceEntry.source_section || '').toLowerCase();
      const supportedByWork =
        locations.includes('projects') ||
        locations.includes('experience') ||
        sourceSection === 'projects' ||
        sourceSection === 'experience';

      return {
        name: resumeSkill,
        bankSkill: String(item.bank_skill || resumeSkill).trim(),
        questionCount: Number(item.question_count || 0),
        level: detectLevel(resumeSkill, sections),
        supportedByWork,
        mentions: Number(frequencies[resumeSkill]?.mentions || 0),
      };
    })
    .sort((left, right) => {
      if (left.supportedByWork !== right.supportedByWork) {
        return left.supportedByWork ? -1 : 1;
      }
      if (left.mentions !== right.mentions) {
        return right.mentions - left.mentions;
      }
      return left.name.localeCompare(right.name);
    });
}

export default function SkillVerificationPage() {
  const navigate = useNavigate();
  const analysis = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('resumeAnalysis') || 'null');
    } catch {
      return null;
    }
  }, []);

  const extractedSkills = useMemo(() => getExtractedSkills(analysis), [analysis]);
  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [questionCount, setQuestionCount] = useState(6);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!extractedSkills.length) {
        setSkills([]);
        setSelectedSkill('');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await getMatchedSkills(extractedSkills);
        const matchedSkills = sortMatchedSkills(response.skills || [], analysis);

        setSkills(matchedSkills);
        setSelectedSkill((current) => {
          if (current && matchedSkills.some((item) => item.name === current)) {
            return current;
          }
          return matchedSkills[0]?.name || '';
        });
      } catch (err) {
        setSkills([]);
        setSelectedSkill('');
        setError(err.message || 'Backend not running or API unreachable.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [analysis, extractedSkills, reloadKey]);

  const selectedMeta = skills.find((item) => item.name === selectedSkill) || null;
  const hasExtractedSkills = extractedSkills.length > 0;
  const hasVerifiableSkills = skills.length > 0;

  const difficultyColors = {
    Beginner: 'bg-green-100 text-green-700',
    Intermediate: 'bg-yellow-100 text-yellow-700',
    Advanced: 'bg-orange-100 text-orange-700',
  };

  const handleRetry = () => {
    setReloadKey((current) => current + 1);
  };

  const handleStart = async () => {
    if (!selectedMeta) {
      setError('Select one supported skill to continue.');
      return;
    }

    try {
      setStarting(true);
      setError('');
      await getSkillQuestions(selectedMeta.bankSkill);
      navigate(
        `/interview-questions?skill=${encodeURIComponent(selectedMeta.bankSkill)}&level=${selectedMeta.level.toLowerCase()}&numQuestions=${questionCount}`,
      );
    } catch (err) {
      setError(err.message || 'Backend not running or API unreachable.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">Skill Claim Verification</h1>
        <p className="text-gray-600 text-center mb-12">
          Only skills common between your resume and the question bank are available for verification.
        </p>

        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Verification Setup</h3>
              <p className="text-sm text-gray-600">Only valid, supported resume skills are shown below.</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="questionCount" className="text-sm font-semibold text-gray-700">Questions:</label>
              <select
                id="questionCount"
                value={questionCount}
                onChange={(event) => setQuestionCount(Number(event.target.value) || 6)}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-800"
                disabled={!hasVerifiableSkills || loading || starting}
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

        {loading ? <div className="bg-white rounded-2xl p-6 text-gray-700 shadow-lg">Loading supported skills...</div> : null}

        {!loading && !hasExtractedSkills ? (
          <div className="bg-white rounded-2xl p-6 text-gray-700 shadow-lg">
            No skills detected from resume. Please update your resume.
          </div>
        ) : null}

        {!loading && hasExtractedSkills && !hasVerifiableSkills && !error ? (
          <div className="bg-white rounded-2xl p-6 text-gray-700 shadow-lg">
            No verifiable skills found. Your resume skills are not supported for testing yet.
          </div>
        ) : null}

        {hasVerifiableSkills ? (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center">
                <Code className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Verifiable Skills</h2>
                <p className="text-sm text-gray-600">These skills exist in both your resume and the system question bank.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {skills.map((skill) => (
                <button
                  key={skill.name}
                  type="button"
                  onClick={() => setSelectedSkill(skill.name)}
                  disabled={starting}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                    selectedSkill === skill.name
                      ? 'border-purple-600 bg-purple-600 text-white shadow-md'
                      : 'border-gray-200 bg-gray-50 text-gray-800 hover:border-purple-300 hover:bg-purple-50'
                  } ${starting ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {skill.name}
                </button>
              ))}
            </div>

            {selectedMeta ? (
              <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyColors[selectedMeta.level]}`}>
                  {selectedMeta.level}
                </span>
                <span className="text-sm text-gray-700">{selectedMeta.questionCount} questions available</span>
                <span className="text-sm text-gray-700">
                  {selectedMeta.supportedByWork ? 'Supported by projects or experience.' : 'Matched through extracted resume skill data.'}
                </span>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Selected skill: <span className="font-semibold text-gray-900">{selectedMeta?.name || 'None'}</span>
              </p>
              <button
                type="button"
                onClick={handleStart}
                disabled={!selectedMeta || starting}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
              >
                <Target className="w-5 h-5" />
                {starting ? 'Loading Questions...' : 'Start Verification'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            <p className="font-semibold">Skill verification is unavailable right now.</p>
            <p className="mt-1 text-sm">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              disabled={loading || starting}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : null}

        <div className="mt-8 flex justify-center">
          <Link
            to="/feedback"
            className="px-6 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
          >
            Continue to Feedback
          </Link>
        </div>
      </div>
    </div>
  );
}
