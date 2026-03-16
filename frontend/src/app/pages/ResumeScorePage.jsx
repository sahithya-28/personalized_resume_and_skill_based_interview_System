import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeCheck,
  Briefcase,
  Building2,
  ChevronDown,
  FileSearch,
  GraduationCap,
  Info,
  Lightbulb,
  ListChecks,
  Rocket,
  Sparkles,
  Target,
  Wrench,
} from 'lucide-react';
import { Bar, Radar } from 'react-chartjs-2';
import 'chart.js/auto';

const ANALYSIS_SECTIONS = [
  { id: 'skill_analysis', label: 'Skill Analysis', icon: Wrench },
  { id: 'project_analysis', label: 'Project Analysis', icon: Briefcase },
  { id: 'entity_extraction', label: 'Entity Extraction', icon: FileSearch },
  { id: 'career_profile_analysis', label: 'Career Profile', icon: Target },
  { id: 'similarity_analysis', label: 'Similarity', icon: Sparkles },
];

const SUPPORTING_SKILL_KEYWORDS = [
  'git',
  'github',
  'docker',
  'kubernetes',
  'jenkins',
  'aws',
  'azure',
  'gcp',
  'flask',
  'django',
  'react',
  'node',
  'express',
  'spring',
  'mysql',
  'postgres',
  'mongodb',
  'redis',
  'linux',
  'jira',
  'figma',
  'postman',
];

function labelize(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeRecommendation(item) {
  if (!item) return '';
  if (typeof item === 'string') return item;
  if (typeof item === 'object') return item.suggestion || item.title || item.message || JSON.stringify(item);
  return String(item);
}

function prioritizeRecommendations(recommendations, weaknesses, overview) {
  const weaknessItems = weaknesses.flatMap((group) => group.items || []).map((item) => String(item).toLowerCase());
  return recommendations
    .map((item) => normalizeRecommendation(item))
    .filter(Boolean)
    .map((item) => {
      const lower = item.toLowerCase();
      let score = 0;

      if (lower.includes('experience')) score += 6;
      if (lower.includes('project')) score += 5;
      if (lower.includes('quantified') || lower.includes('achievement') || lower.includes('metric')) score += 4;
      if (lower.includes('skill')) score += 3;
      if (lower.includes('technical') || lower.includes('framework') || lower.includes('tool')) score += 3;
      if (weaknessItems.some((weakness) => lower.includes(weakness.split(' ')[0]))) score += 2;
      if ((overview.resume_score ?? 0) < 60) score += 2;

      return { item, score };
    })
    .sort((a, b) => b.score - a.score || a.item.localeCompare(b.item))
    .map(({ item }) => item);
}

function buildAiInsights({ overview, verification, completeness, projects, sections, density }) {
  const insights = [];
  const limitedEvidenceCount = Object.values(verification).filter((item) => item?.status === 'Limited Evidence').length;
  const hasExperience = Boolean(String(sections?.experience || '').trim());
  const missingSections = Object.entries(completeness).filter(([, present]) => !present);

  if (!projects.length) insights.push('Resume lacks project descriptions');
  if (limitedEvidenceCount > 0) insights.push('Skills detected but limited usage evidence');
  if ((overview.technical_keyword_density ?? density?.technical_density ?? 0) < 8) insights.push('Technical keyword density is low');
  if (!hasExperience) insights.push('No experience section detected');
  if (!overview.detected_skills_count) insights.push('No skills detected in this resume');
  if (!overview.predicted_career_profile || overview.predicted_career_profile === 'Unknown') insights.push('No career profile could be predicted');
  if (!insights.length && missingSections.length) insights.push(`${labelize(missingSections[0][0])} section needs improvement`);
  if (!insights.length) insights.push('Resume shows a usable baseline with room to strengthen evidence and specificity');

  return insights.slice(0, 5);
}

function getMetricBenchmark(metric, value) {
  if (metric === 'resume_score') {
    if (value >= 85) return { label: 'Excellent', detail: 'Strong resume strength', tone: 'text-emerald-700' };
    if (value >= 65) return { label: 'Moderate', detail: 'Moderate resume strength', tone: 'text-amber-700' };
    return { label: 'Needs improvement', detail: 'Resume needs stronger evidence', tone: 'text-rose-700' };
  }

  if (metric === 'technical_keyword_density') {
    if (value >= 15) return { label: 'Excellent', detail: 'Above recommended level', tone: 'text-emerald-700' };
    if (value >= 8) return { label: 'Moderate', detail: 'Within acceptable range', tone: 'text-amber-700' };
    return { label: 'Needs improvement', detail: 'Below recommended level', tone: 'text-rose-700' };
  }

  return null;
}

function buildStrengthMeter(score) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const filledBars = Math.round(safeScore / 10);
  return `${'█'.repeat(filledBars)}${'░'.repeat(10 - filledBars)} ${safeScore}%`;
}

function buildSkillGroups(skills, skillStrengthAnalysis, verification) {
  const frequencyEntries = Object.entries(skillStrengthAnalysis?.by_skill || {}).map(([skill, item]) => ({
    skill,
    mentions: item?.mentions || 0,
  }));

  const rankedSkills = frequencyEntries.length
    ? frequencyEntries.sort((a, b) => b.mentions - a.mentions || a.skill.localeCompare(b.skill)).map((item) => item.skill)
    : [...skills];

  const uniqueSkills = Array.from(new Set(rankedSkills.length ? rankedSkills : skills));
  const supportingSkills = uniqueSkills.filter((skill) =>
    SUPPORTING_SKILL_KEYWORDS.some((keyword) => String(skill).toLowerCase().includes(keyword))
  );
  const coreSkills = uniqueSkills.filter((skill) => !supportingSkills.includes(skill));

  const evidenceBackfill = Object.entries(verification)
    .filter(([, item]) => item?.status === 'Strong Evidence')
    .map(([skill]) => skill)
    .filter((skill) => !coreSkills.includes(skill) && !supportingSkills.includes(skill));

  return [
    ...(coreSkills.length ? [{ title: 'Core Skills', items: coreSkills.concat(evidenceBackfill).slice(0, 12) }] : []),
    ...(supportingSkills.length ? [{ title: 'Supporting Skills', items: supportingSkills.slice(0, 12) }] : []),
  ];
}

function buildInterpretationSummary({ overview, completeness, projects, entities, strengths, weaknesses }) {
  const predictedProfile = overview.predicted_career_profile || 'technical';
  const coreSkills = strengths.find((group) => group.title === 'Core Skills')?.items || [];
  const topStrengths = coreSkills.slice(0, 3).join(', ');
  const criticalIssues = weaknesses.find((group) => group.title === 'Critical Issues')?.items || [];
  const mainWeakness = criticalIssues[0] || weaknesses[0]?.items?.[0];
  const strengthClause = topStrengths
    ? `based on detected strengths such as ${topStrengths}`
    : projects.length
      ? 'based on detected skills and project technologies'
      : 'based on detected technical signals';
  const weaknessClause = mainWeakness
    ? ` However, ${String(mainWeakness).replace(/\.$/, '').toLowerCase()} reduces the overall resume strength.`
    : (!(entities?.certifications || []).length
        ? ' However, limited certification evidence reduces the overall resume strength.'
        : ' The main opportunity is to strengthen evidence with more quantified project and experience detail.');

  return `Your resume aligns most strongly with ${predictedProfile} roles ${strengthClause}.${weaknessClause}`;
}

function deriveStructuredAnalysis(raw) {
  const parsed = raw?.parsed_data || {};
  const sections = raw?.sections || parsed?.sections || {};
  const skills = raw?.skills || raw?.skill_extraction?.detected_skills || [];
  const projects = raw?.project_analysis || [];
  const profile = raw?.resume_profile_classification || {};
  const density = raw?.keyword_density || {};
  const verification = raw?.skill_verification || {};
  const completeness = raw?.section_completeness?.required || {};
  const entities = raw?.entities || {};
  const visualization = raw?.visualization || {};
  const recommendations = raw?.recommendations || raw?.improvement_suggestions || [];
  const skillStrengthAnalysis = raw?.skill_strength_analysis || {};

  const overview = raw?.overview || {
    resume_score: raw?.resume_score?.total ?? raw?.overall_score ?? 0,
    predicted_career_profile: profile?.predicted_profile || 'Unknown',
    detected_skills_count: skills.length,
    projects_detected_count: projects.length,
    technical_keyword_density: density?.technical_density ?? 0,
  };

  const strengths = [
    ...buildSkillGroups(skills, skillStrengthAnalysis, verification),
    ...(
      Object.entries(completeness).filter(([, present]) => present).length
        ? [{
            title: 'Well-defined resume sections',
            items: Object.entries(completeness)
              .filter(([, present]) => present)
              .map(([name]) => labelize(name)),
          }]
        : []
    ),
  ];

  const missingSectionNames = Object.entries(completeness)
    .filter(([, present]) => !present)
    .map(([name]) => labelize(name));
  const otherMissingSections = missingSectionNames.filter((name) => name !== 'Experience');
  const criticalIssues = [];

  if (missingSectionNames.includes('Experience')) {
    criticalIssues.push('Missing Experience Section');
  }
  if (!projects.length) {
    criticalIssues.push('Projects not detected');
  }
  if ((density?.technical_density ?? 0) < 8) {
    criticalIssues.push('Low technical keyword density');
  }

  const weaknesses = raw?.weaknesses?.length
    ? raw.weaknesses
    : [
        ...(criticalIssues.length
          ? [{
              title: 'Critical Issues',
              items: criticalIssues,
            }]
          : []),
        ...(otherMissingSections.length
          ? [{
              title: 'Other Missing Sections',
              items: otherMissingSections,
            }]
          : []),
        ...(
          Object.entries(verification).filter(([, item]) => item?.status === 'Limited Evidence').length
            ? [{
                title: 'Skills with weak evidence',
                items: Object.entries(verification)
                  .filter(([, item]) => item?.status === 'Limited Evidence')
                  .map(([skill]) => `${skill}: detected, but resume shows limited usage evidence.`)
                  .slice(0, 8),
              }]
            : []
        ),
      ];

  const analysis = raw?.analysis || {
    skill_analysis: {
      graph: visualization?.skill_strength || { labels: [], values: [] },
      evidence_table: Object.entries(verification).map(([skill, item]) => ({
        skill,
        strength: raw?.skill_strength_analysis?.by_skill?.[skill]?.mentions || 0,
        evidence: item?.status || 'Unknown',
        locations: item?.locations || item?.evidence || [],
      })),
      empty_message: !skills.length
        ? 'No skill analysis available because no skills were detected.'
        : '',
    },
    project_analysis: {
      projects,
      empty_message: !projects.length
        ? 'No projects detected. Adding project descriptions will improve resume strength.'
        : '',
    },
    entity_extraction: {
      skills: entities?.skills || [],
      organizations: entities?.organizations || [],
      universities: entities?.universities || [],
      certifications: entities?.certifications || [],
      empty_messages: {
        skills: !(entities?.skills || []).length ? 'No skills detected in this resume. Add a Skills section to improve analysis.' : '',
        organizations: !(entities?.organizations || []).length ? 'No organizations detected. Add company or internship names if relevant.' : '',
        universities: !(entities?.universities || []).length ? 'No universities detected. Add education details if applicable.' : '',
        certifications: !(entities?.certifications || []).length ? 'No certifications detected. Add relevant certifications if available.' : '',
      },
    },
    career_profile_analysis: {
      prediction: profile,
      chart: visualization?.career_profile_scores || { labels: [], values: [] },
      empty_message:
        !profile?.predicted_profile || profile.predicted_profile === 'Unknown'
          ? 'No career profile could be predicted. Provide more technical experience or projects.'
          : '',
    },
    similarity_analysis: {
      scores: raw?.resume_similarity_analysis || [],
      chart: visualization?.profile_similarity_scores || { labels: [], values: [] },
      empty_message: !(raw?.resume_similarity_analysis || []).length
        ? 'No similarity analysis available because the resume does not yet provide enough profile-specific evidence.'
        : '',
    },
  };

  return {
    overview,
    strengths,
    weaknesses,
    analysis,
    aiInsights: buildAiInsights({ overview, verification, completeness, projects, sections, density }),
    interpretation: buildInterpretationSummary({ overview, completeness, projects, entities, strengths, weaknesses }),
    recommendations: prioritizeRecommendations(recommendations, weaknesses, overview),
  };
}

function Tooltip({ text }) {
  return (
    <span className="group relative inline-flex items-center">
      <Info className="w-4 h-4 text-slate-400 cursor-help" />
      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden w-64 -translate-x-1/2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-medium text-white shadow-xl group-hover:block">
        {text}
      </span>
    </span>
  );
}

function MetricCard({ title, value, helper, tone = 'indigo', emphasis = 'secondary', tooltip, extra }) {
  const tones = {
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-950',
    sky: 'bg-sky-50 border-sky-200 text-sky-950',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-950',
    amber: 'bg-amber-50 border-amber-200 text-amber-950',
    rose: 'bg-rose-50 border-rose-200 text-rose-950',
  };

  return (
    <div
      className={`rounded-3xl border shadow-sm transition-transform hover:-translate-y-0.5 ${
        tones[tone] || tones.indigo
      } ${emphasis === 'primary' ? 'lg:col-span-2 min-h-[11rem] p-6' : 'min-h-[9rem] p-5'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{title}</p>
        {tooltip ? <Tooltip text={tooltip} /> : null}
      </div>
      <p className={`mt-3 font-bold ${emphasis === 'primary' ? 'text-4xl' : 'text-3xl'}`}>{value}</p>
      {helper ? <p className="mt-2 text-sm opacity-80">{helper}</p> : null}
      {extra ? <p className="mt-4 text-sm leading-relaxed opacity-90">{extra}</p> : null}
    </div>
  );
}

function ResumeStrengthMeter({ score }) {
  return (
    <div className="mt-4 rounded-2xl border border-indigo-200 bg-white/60 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Resume Strength</p>
      <p className="mt-2 font-mono text-lg text-indigo-950">{buildStrengthMeter(score)}</p>
    </div>
  );
}

function EmptyState({ title = 'No analysis available', message, suggestion }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-dashed border-slate-300">
      <p className="text-base font-semibold text-gray-900">{title}</p>
      <p className="mt-2 text-sm text-gray-600">{message}</p>
      {suggestion ? <p className="mt-3 text-sm text-sky-700">{suggestion}</p> : null}
    </div>
  );
}

function ExpandableSkillList({ items, limit = 6 }) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, limit);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {visibleItems.map((item) => (
          <span key={item} className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sm text-sky-900">
            {item}
          </span>
        ))}
      </div>
      {items.length > limit ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-3 text-sm font-semibold text-sky-700 hover:text-sky-900"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      ) : null}
    </div>
  );
}

function ChartPanel({ title, children, tooltip }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 min-w-0 border border-slate-100">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-lg font-bold text-gray-900">{title}</h4>
        {tooltip ? <Tooltip text={tooltip} /> : null}
      </div>
      <div className="relative h-64 w-full min-w-0">{children}</div>
    </div>
  );
}

function InsightColumn({ title, icon: Icon, toneClass, items, emptyMessage }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${toneClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
      </div>

      {items.length ? (
        <div className="space-y-4">
          {items.map((group) => (
            <details key={group.title} className="rounded-xl border border-gray-200 p-4 group" open>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-gray-900">
                <span>{group.title}</span>
                <ChevronDown className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180" />
              </summary>
              {group.title.includes('Skills') ? (
                <div className="mt-3">
                  <ExpandableSkillList items={group.items} />
                </div>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  {group.items.map((item) => (
                    <li key={item} className="leading-relaxed">{item}</li>
                  ))}
                </ul>
              )}
            </details>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-600">{emptyMessage}</p>
      )}
    </div>
  );
}

function InsightSummary({ insights }) {
  return (
    <section className="bg-white rounded-3xl shadow-xl p-7 border border-slate-100">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] uppercase text-sky-700">AI Insight Summary</p>
          <h2 className="text-2xl font-bold text-gray-900">What matters most in this report</h2>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {insights.map((insight) => (
          <div key={insight} className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4 text-sm text-slate-800">
            {insight}
          </div>
        ))}
      </div>
    </section>
  );
}

function SkillAnalysisTab({ data }) {
  if (!data?.evidence_table?.length) {
    return (
      <EmptyState
        title="No skill analysis available"
        message={data?.empty_message || 'No skill analysis available because no skills were detected.'}
        suggestion="Add a Skills section and connect each skill to project or experience bullets."
      />
    );
  }

  return (
    <div className="space-y-6">
      <ChartPanel title="Skill Strength Graph" tooltip="Shows how often each skill appears across the resume.">
        <Radar
          data={{
            labels: data.graph?.labels || [],
            datasets: [
              {
                label: 'Mentions',
                data: data.graph?.values || [],
                backgroundColor: 'rgba(14, 165, 233, 0.18)',
                borderColor: '#0284c7',
              },
            ],
          }}
          options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
        />
      </ChartPanel>

      <details className="bg-white rounded-2xl shadow-lg p-5 overflow-x-auto border border-slate-100" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <h4 className="text-lg font-bold text-gray-900">Skill Evidence Table</h4>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </summary>
        <table className="mt-4 w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="py-2 pr-4">Skill</th>
              <th className="py-2 pr-4">Mentions</th>
              <th className="py-2 pr-4">Evidence</th>
              <th className="py-2">Locations</th>
            </tr>
          </thead>
          <tbody>
            {data.evidence_table.map((item) => (
              <tr key={item.skill} className="border-b border-gray-100 text-gray-700">
                <td className="py-3 pr-4 font-semibold text-gray-900">{item.skill}</td>
                <td className="py-3 pr-4">{item.strength}</td>
                <td className="py-3 pr-4">{item.evidence}</td>
                <td className="py-3">{(item.locations || []).join(', ') || 'General'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function ProjectAnalysisTab({ data }) {
  if (!data?.projects?.length) {
    return (
      <EmptyState
        title="No projects detected"
        message={data?.empty_message || 'No project analysis available.'}
        suggestion="Adding project descriptions will improve resume strength."
      />
    );
  }

  return (
    <details className="bg-white rounded-2xl shadow-lg p-5 border border-slate-100" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <h4 className="text-lg font-bold text-gray-900">Extracted Projects and Technology Detection</h4>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </summary>
      <div className="mt-4 space-y-4">
        {data.projects.map((project, index) => (
          <div key={`${project.project_name}-${index}`} className="rounded-xl border border-gray-200 p-4">
            <p className="font-semibold text-gray-900">{project.project_name}</p>
            <p className="text-sm text-gray-600 mt-1">
              Technologies: {(project.technologies || []).join(', ') || 'No technologies detected'}
            </p>
            <p className="text-sm text-gray-700 mt-2">{project.description || 'No description available.'}</p>
          </div>
        ))}
      </div>
    </details>
  );
}

function EntityExtractionTab({ data }) {
  const entityGroups = [
    ['skills', 'Skills', Wrench],
    ['organizations', 'Organizations', Building2],
    ['universities', 'Universities', GraduationCap],
    ['certifications', 'Certifications', BadgeCheck],
  ];

  const hasAnyEntities = entityGroups.some(([key]) => (data?.[key] || []).length);
  if (!hasAnyEntities) {
    return (
      <EmptyState
        title="No entity extraction available"
        message="The analysis could not extract usable entities from this resume."
        suggestion="Add clearer section headings and explicit names for skills, organizations, education, and certifications."
      />
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {entityGroups.map(([key, label, Icon]) => {
        const values = data?.[key] || [];
        const emptyMessage = data?.empty_messages?.[key] || `No ${label.toLowerCase()} detected.`;
        return (
          <div key={key} className="bg-white rounded-2xl shadow-lg p-5 border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-sky-700" />
              <h4 className="text-lg font-bold text-gray-900">{label}</h4>
            </div>
            {values.length ? (
              <div className="flex flex-wrap gap-2">
                {values.map((value) => (
                  <span key={value} className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sm text-sky-900">
                    {value}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">{emptyMessage}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CareerProfileTab({ data }) {
  if (!data?.prediction?.predicted_profile || data.prediction.predicted_profile === 'Unknown') {
    return (
      <EmptyState
        title="No career profile predicted"
        message={data?.empty_message || 'No career profile could be predicted.'}
        suggestion="Provide more technical experience or projects."
      />
    );
  }

  const hasChart = (data?.chart?.labels || []).length && (data?.chart?.values || []).length;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-lg p-5 border border-slate-100">
        <p className="text-sm text-gray-600">Predicted profile</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{data?.prediction?.predicted_profile}</p>
      </div>
      {hasChart ? (
        <ChartPanel title="Career Profile Prediction Chart" tooltip="Compares how strongly the resume aligns with different role profiles.">
          <Bar
            data={{
              labels: data?.chart?.labels || [],
              datasets: [{ label: 'Score', data: data?.chart?.values || [], backgroundColor: '#7c3aed' }],
            }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
          />
        </ChartPanel>
      ) : (
        <EmptyState title="No profile chart available" message="A role was predicted, but detailed profile comparison data is unavailable." />
      )}
    </div>
  );
}

function SimilarityTab({ data }) {
  if (!data?.scores?.length) {
    return (
      <EmptyState
        title="No similarity analysis available"
        message={data?.empty_message || 'No similarity analysis available.'}
        suggestion="Add stronger project, experience, and tool evidence."
      />
    );
  }

  return (
    <div className="space-y-5">
      {(data.chart?.labels || []).length ? (
        <div className="space-y-3">
          <ChartPanel title="Resume Similarity Scores" tooltip="Similarity score is calculated by comparing your detected skills, projects, and experience signals against common role profile patterns.">
            <Bar
              data={{
                labels: data.chart?.labels || [],
                datasets: [{ label: 'Similarity %', data: data.chart?.values || [], backgroundColor: '#ec4899' }],
              }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
            />
          </ChartPanel>
          <p className="text-sm text-gray-600">
            Similarity scores represent how closely your resume matches common role profiles based on detected skills and experience signals.
          </p>
        </div>
      ) : null}
      <details className="bg-white rounded-2xl shadow-lg p-5 border border-slate-100" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <h4 className="text-lg font-bold text-gray-900">Similarity Breakdown</h4>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </summary>
        <div className="mt-3 space-y-3">
          {data.scores.map((item) => (
            <div key={item.profile} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
              <span className="font-medium text-gray-900">{item.profile}</span>
              <span className="text-gray-700">{item.score}%</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

export default function ResumeScorePage() {
  const analysisResponse = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('resumeAnalysis') || 'null');
    } catch {
      return null;
    }
  }, []);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

  if (!analysisResponse) {
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

  const structured = deriveStructuredAnalysis(analysisResponse);
  const overview = structured.overview;
  const strengths = structured.strengths;
  const weaknesses = structured.weaknesses;
  const analysis = structured.analysis;
  const recommendations = structured.recommendations;
  const visibleRecommendations = showAllRecommendations ? recommendations : recommendations.slice(0, 3);
  const resumeScoreBenchmark = getMetricBenchmark('resume_score', overview.resume_score ?? 0);
  const densityBenchmark = getMetricBenchmark('technical_keyword_density', overview.technical_keyword_density ?? 0);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe_0,_#f8fbff_40%,_#ffffff_100%)] px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
          <p className="text-sm font-semibold tracking-[0.18em] uppercase text-sky-700">Overview</p>
          <div className="mt-4 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">AI Resume Analysis Report</h1>
              <p className="text-gray-600 mt-2">A focused summary of your resume quality, evidence, and role alignment.</p>
            </div>
            <Link to="/resume-upload" className="px-5 py-3 rounded-xl bg-slate-100 text-slate-800 font-semibold hover:bg-slate-200">
              Analyze Another Resume
            </Link>
          </div>
        </section>

        <InsightSummary insights={structured.aiInsights} />

        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold tracking-[0.18em] uppercase text-sky-700">Priority Metrics</p>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="grid lg:grid-cols-6 md:grid-cols-2 gap-4">
            <MetricCard
              title="Resume Score"
              value={overview.resume_score ?? 'Not available'}
              helper="Out of 100"
              tone="indigo"
              emphasis="primary"
              tooltip="Calculated from resume completeness, evidence quality, technical detail, and structural quality."
              extra={`${resumeScoreBenchmark?.label || ''} - ${resumeScoreBenchmark?.detail || ''}`}
            />
            <MetricCard
              title="Predicted Career Profile"
              value={overview.predicted_career_profile || 'No prediction'}
              helper="Predicted role fit"
              tone="rose"
              emphasis="primary"
              tooltip="Calculated from the combination of detected skills, project technologies, and overall experience signals."
            />
            <MetricCard
              title="Skills Detected"
              value={overview.detected_skills_count ? overview.detected_skills_count : 'No skills detected'}
              helper={overview.detected_skills_count ? 'Recognized technical skills' : 'Add a Skills section to improve analysis'}
              tone="sky"
              tooltip="Counts technical skills explicitly found in the resume."
            />
            <MetricCard
              title="Projects Detected"
              value={overview.projects_detected_count ? overview.projects_detected_count : 'No projects detected'}
              helper={overview.projects_detected_count ? 'Project blocks found' : 'Adding project descriptions will improve resume strength'}
              tone="emerald"
              tooltip="Counts projects with enough structure to detect title, description, or technologies."
            />
            <MetricCard
              title="Technical Keyword Density"
              value={overview.technical_keyword_density ? `${overview.technical_keyword_density}%` : 'Low or unavailable'}
              helper={overview.technical_keyword_density ? 'Technical detail ratio' : 'Add tools, frameworks, and implementation details'}
              tone="amber"
              tooltip="Calculated as the share of resume content containing technical terms, frameworks, tools, and role-specific keywords."
              extra={`${densityBenchmark?.label || ''} - ${densityBenchmark?.detail || ''}`}
            />
          </div>
          <div className="max-w-md">
            <ResumeStrengthMeter score={overview.resume_score ?? 0} />
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700 leading-relaxed">
            {structured.interpretation}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold tracking-[0.18em] uppercase text-sky-700">Strengths and Weaknesses</p>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="grid xl:grid-cols-2 gap-6">
            <InsightColumn
              title="Strengths"
              icon={Rocket}
              toneClass="bg-emerald-100 text-emerald-700"
              items={strengths}
              emptyMessage="No strong signals detected yet. Add projects or quantified achievements."
            />
            <InsightColumn
              title="Weaknesses"
              icon={AlertTriangle}
              toneClass="bg-amber-100 text-amber-700"
              items={weaknesses}
              emptyMessage="No major weaknesses detected."
            />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold tracking-[0.18em] uppercase text-sky-700">Deep Analysis</p>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="space-y-3">
            {ANALYSIS_SECTIONS.map((section) => {
              const Icon = section.icon;
              const sectionData = analysis[section.id];
              return (
                <details key={section.id} className="bg-white rounded-3xl shadow-xl p-5 border border-slate-100" open={section.id === 'skill_analysis'}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{section.label}</h3>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </summary>
                  <div className="mt-5">
                    {section.id === 'skill_analysis' ? <SkillAnalysisTab data={sectionData} /> : null}
                    {section.id === 'project_analysis' ? <ProjectAnalysisTab data={sectionData} /> : null}
                    {section.id === 'entity_extraction' ? <EntityExtractionTab data={sectionData} /> : null}
                    {section.id === 'career_profile_analysis' ? <CareerProfileTab data={sectionData} /> : null}
                    {section.id === 'similarity_analysis' ? <SimilarityTab data={sectionData} /> : null}
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold tracking-[0.18em] uppercase text-sky-700">AI Recommendations</p>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="bg-white rounded-3xl shadow-xl p-7 border border-slate-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Top AI Suggestions</h3>
                <p className="text-gray-600">The highest-priority changes are shown first so the next actions are clear.</p>
              </div>
            </div>

            {recommendations.length ? (
              <>
                <div className="grid lg:grid-cols-2 gap-3">
                  {visibleRecommendations.map((item, index) => (
                    <div key={`${item}-${index}`} className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-4 text-sm text-indigo-950 flex items-start gap-3">
                      <ListChecks className="w-4 h-4 mt-0.5 text-indigo-700 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                {recommendations.length > 3 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllRecommendations((current) => !current)}
                    className="mt-5 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                  >
                    {showAllRecommendations ? 'Show fewer recommendations' : `Show ${recommendations.length - 3} more recommendations`}
                  </button>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-gray-600">No recommendations generated.</p>
            )}
          </div>
        </section>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/resume-upload" className="px-6 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50">
            Back to Upload
          </Link>
          <Link to="/skill-verification" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
            Continue to Skill Verification
          </Link>
        </div>
      </div>
    </div>
  );
}
