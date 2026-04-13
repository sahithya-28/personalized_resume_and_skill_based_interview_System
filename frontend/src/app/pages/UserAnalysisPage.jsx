import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, FileUp, Sparkles, Target } from 'lucide-react';

function toTitleCase(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function getScoreLabel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Improvement';
  return 'Weak';
}

function normalizeSkill(skill) {
  if (!skill) return '';
  if (typeof skill === 'string') return skill.trim();
  if (typeof skill === 'object') {
    return String(skill.skill || skill.name || skill.title || '').trim();
  }
  return String(skill).trim();
}

function detectExperienceLevel(analysis) {
  const sections = analysis?.sections || analysis?.parsed_data?.sections || {};
  const experienceText = String(sections.experience || '').toLowerCase();

  if (
    experienceText.includes('intern') ||
    experienceText.includes('engineer') ||
    experienceText.includes('developer') ||
    experienceText.includes('analyst') ||
    experienceText.includes('years')
  ) {
    return 'Experienced';
  }

  return 'Fresher';
}

function detectRecommendedRole(analysis, skills) {
  const profile =
    analysis?.overview?.predicted_career_profile ||
    analysis?.resume_profile_classification?.predicted_profile ||
    '';

  if (profile && profile !== 'Unknown') {
    return toTitleCase(profile);
  }

  const lowerSkills = skills.map((skill) => skill.toLowerCase());

  if (lowerSkills.some((skill) => ['machine learning', 'tensorflow', 'pytorch', 'scikit-learn', 'data analysis'].includes(skill))) {
    return 'Data Scientist';
  }
  if (lowerSkills.some((skill) => ['spring boot', 'java', 'node.js', 'express', 'django', 'flask'].includes(skill))) {
    return 'Backend Developer';
  }
  if (lowerSkills.some((skill) => ['react', 'javascript', 'typescript', 'html', 'css'].includes(skill))) {
    return 'Frontend Developer';
  }
  if (lowerSkills.some((skill) => ['python', 'sql', 'pandas'].includes(skill))) {
    return 'Software Developer';
  }

  return 'Role Prediction Pending';
}

function readJson(storage, key) {
  try {
    return JSON.parse(storage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function buildPageData() {
  const analysis = readJson(sessionStorage, 'resumeAnalysis');
  const history = readJson(localStorage, 'analysisHistory') || [];
  const latestHistory = history[history.length - 1] || null;

  const rawSkills = analysis?.skills || analysis?.skill_extraction?.detected_skills || analysis?.entities?.skills || [];
  const skills = Array.from(new Set(rawSkills.map(normalizeSkill).filter(Boolean)));

  const atsScore = Math.max(
    0,
    Math.min(
      100,
      Number(
        analysis?.overview?.resume_score ??
          analysis?.ats_score ??
          analysis?.overall_score ??
          latestHistory?.resumeScore ??
          0,
      ) || 0,
    ),
  );

  return {
    atsScore,
    scoreLabel: getScoreLabel(atsScore),
    recommendedRole: detectRecommendedRole(analysis, skills),
    experienceLevel: detectExperienceLevel(analysis),
  };
}

function MinimalMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function UserAnalysisPage() {
  const page = buildPageData();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fbff_45%,_#ffffff_100%)] px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-[2rem] border border-slate-100 bg-white/90 px-6 py-10 shadow-2xl backdrop-blur md:px-10">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              <Sparkles className="h-4 w-4" />
              Resume Analysis
            </div>
            <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">User Analysis</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 md:text-lg">
              A clean launch screen for your next resume review.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl">
            <div className="mb-6 rounded-[2rem] border border-blue-100 bg-[linear-gradient(145deg,_#eff6ff,_#ffffff)] p-8 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">ATS Score</p>
              <div className="mt-4 flex items-end justify-center gap-2">
                <span className="text-6xl font-bold text-slate-900">{page.atsScore}</span>
                <span className="pb-2 text-lg font-medium text-slate-400">/100</span>
              </div>
              <p className="mt-3 inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                {page.scoreLabel}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <MinimalMetric icon={Target} label="Recommended Role" value={page.recommendedRole} />
              <MinimalMetric icon={Briefcase} label="Experience Level" value={page.experienceLevel} />
            </div>

            <div className="mt-10 text-center">
              <Link
                to="/resume-upload"
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-10 py-4 text-lg font-semibold text-white shadow-[0_18px_45px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-cyan-600"
              >
                <FileUp className="h-5 w-5" />
                Start Analysis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <p className="mt-4 text-sm text-slate-500">
                Run detailed analysis and test your skills.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
