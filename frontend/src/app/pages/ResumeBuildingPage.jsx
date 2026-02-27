import { useMemo, useState } from 'react';
import { Award, FileUp, Loader2, PlusCircle, RefreshCw } from 'lucide-react';
import { API_BASE_URL, analyzeResume, generateResume } from '../api/resumeApi';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  summary: '',
  skills: '',
  projects: '',
  education: '',
  experience: '',
  certifications: '',
  achievements: '',
  internships: '',
  template: 'basic',
};

const scoreColors = {
  education: '#2563eb',
  skills: '#0891b2',
  projects: '#16a34a',
  experience: '#7c3aed',
};

const fallbackTemplates = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Balanced sections for most roles',
    preview_url: '/static/resume_previews/basic.svg',
    fields: [
      { key: 'skills', label: 'Skills', placeholder: 'Python, FastAPI, React, SQL', required: true },
      { key: 'projects', label: 'Projects', placeholder: 'Project name, your role, key impact', required: true },
      { key: 'experience', label: 'Experience', placeholder: 'Company, role, duration, measurable outcomes', required: true },
      { key: 'education', label: 'Education', placeholder: 'Degree, college, year range, GPA', required: true },
    ],
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean layout with modern hierarchy',
    preview_url: '/static/resume_previews/modern.svg',
    fields: [
      { key: 'summary', label: 'Professional Summary', placeholder: '2-4 lines overview of your profile and strengths', required: true },
      { key: 'skills', label: 'Skills', placeholder: 'Python, FastAPI, React, SQL', required: true },
      { key: 'projects', label: 'Projects', placeholder: 'Project name, your role, key impact', required: true },
      { key: 'experience', label: 'Experience', placeholder: 'Company, role, duration, measurable outcomes', required: true },
      { key: 'education', label: 'Education', placeholder: 'Degree, college, year range, GPA', required: true },
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Traditional structure for corporate roles',
    preview_url: '/static/resume_previews/professional.svg',
    fields: [
      { key: 'summary', label: 'Professional Summary', placeholder: '2-4 lines overview of your profile and strengths', required: true },
      { key: 'experience', label: 'Experience', placeholder: 'Company, role, duration, measurable outcomes', required: true },
      { key: 'projects', label: 'Projects', placeholder: 'Project name, your role, key impact', required: true },
      { key: 'skills', label: 'Skills', placeholder: 'Python, FastAPI, React, SQL', required: true },
      { key: 'education', label: 'Education', placeholder: 'Degree, college, year range, GPA', required: true },
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Lightweight one-page style',
    preview_url: '/static/resume_previews/minimal.svg',
    fields: [
      { key: 'summary', label: 'Professional Summary', placeholder: '2-4 lines overview of your profile and strengths', required: true },
      { key: 'skills', label: 'Skills', placeholder: 'Python, FastAPI, React, SQL', required: true },
      { key: 'experience', label: 'Experience', placeholder: 'Company, role, duration, measurable outcomes', required: true },
      { key: 'education', label: 'Education', placeholder: 'Degree, college, year range, GPA', required: true },
    ],
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Leadership-focused detail-rich format',
    preview_url: '/static/resume_previews/executive.svg',
    fields: [
      { key: 'summary', label: 'Professional Summary', placeholder: 'Leadership narrative and strategic strengths', required: true },
      { key: 'achievements', label: 'Achievements', placeholder: 'Awards, recognitions, ranking, impact metrics', required: true },
      { key: 'experience', label: 'Experience', placeholder: 'Company, role, duration, measurable outcomes', required: true },
      { key: 'projects', label: 'Projects', placeholder: 'Major programs delivered, scope, KPIs', required: true },
      { key: 'skills', label: 'Skills', placeholder: 'Leadership, program management, budgeting, analytics', required: true },
      { key: 'certifications', label: 'Certifications', placeholder: 'PMP, Six Sigma, etc.', required: false },
      { key: 'education', label: 'Education', placeholder: 'Degree, university, year range', required: true },
    ],
  },
  {
    id: 'student',
    name: 'Student',
    description: 'Highlights academics and internships',
    preview_url: '/static/resume_previews/student.svg',
    fields: [
      { key: 'summary', label: 'Career Objective', placeholder: 'Entry-level objective and interests', required: true },
      { key: 'education', label: 'Education', placeholder: 'Degree, college, expected graduation, GPA', required: true },
      { key: 'internships', label: 'Internships', placeholder: 'Company, role, tasks, outcomes', required: true },
      { key: 'projects', label: 'Projects', placeholder: 'Academic/personal projects with outcomes', required: true },
      { key: 'skills', label: 'Skills', placeholder: 'Languages, frameworks, tools', required: true },
      { key: 'certifications', label: 'Certifications', placeholder: 'NPTEL, Coursera, AWS, etc.', required: false },
      { key: 'achievements', label: 'Achievements', placeholder: 'Hackathons, competitions, scholarships', required: false },
    ],
  },
];

const templateSampleText = {
  basic: {
    name: 'Rahul Sharma',
    role: 'Software Engineer',
    contact: 'rahul.sharma@email.com | +91 98XXXXXX10 | github.com/rahul-sharma',
    summary: [
      'Results-driven engineer with 3+ years of experience building scalable web applications.',
      'Strong in backend APIs, frontend integration, and performance optimization.',
    ],
    skills: ['Python', 'FastAPI', 'React', 'PostgreSQL', 'REST APIs', 'Git', 'Docker'],
    experience: [
      {
        title: 'Software Engineer',
        company: 'TechNova Solutions',
        duration: 'Jun 2022 - Present',
        bullets: [
          'Developed reporting dashboard that reduced manual effort by 40%.',
          'Built REST APIs consumed by 5+ internal product teams.',
        ],
      },
      {
        title: 'Associate Developer',
        company: 'ByteGrid Labs',
        duration: 'Jan 2021 - May 2022',
        bullets: [
          'Improved query performance and reduced API latency by 28%.',
          'Automated release checks and reduced rollback incidents by 20%.',
        ],
      },
    ],
    projects: [
      {
        name: 'Interview Prep Platform',
        stack: 'React, FastAPI, PostgreSQL',
        bullets: ['Built mock interview workflows and analytics dashboard.', 'Enabled progress tracking for 2000+ monthly users.'],
      },
      {
        name: 'Resume Analyzer',
        stack: 'Python, NLP',
        bullets: ['Created ATS scoring engine with section-wise suggestions.'],
      },
    ],
    education: ['B.Tech in Computer Science - SRM Institute (2017 - 2021)', 'CGPA: 8.6/10'],
    certifications: ['AWS Cloud Practitioner', 'Google Data Analytics'],
  },
  modern: {
    name: 'Aisha Khan',
    role: 'Full Stack Developer',
    contact: 'aisha.khan@email.com | +91 97XXXXXX04 | linkedin.com/in/aisha-khan',
    summary: ['Full stack developer focused on clean architecture and user-centric interfaces.'],
    skills: ['TypeScript', 'Node.js', 'React', 'MongoDB', 'Redis', 'Docker', 'CI/CD'],
    experience: [{ title: 'Full Stack Developer', company: 'Nimbus Apps', duration: 'Mar 2022 - Present', bullets: ['Built reusable UI library and reduced defects by 30%.', 'Improved API response times by 35% using caching.'] }],
    projects: [{ name: 'E-commerce Admin Suite', stack: 'React, Node.js', bullets: ['Implemented inventory, orders, and role-based controls.'] }],
    education: ['B.E. Information Technology - Anna University (2016 - 2020)'],
    certifications: ['Meta Front-End Developer'],
  },
  professional: {
    name: 'Vikram Patel',
    role: 'Senior Business Analyst',
    contact: 'vikram.patel@email.com | +91 96XXXXXX88 | linkedin.com/in/vikram-patel',
    summary: ['Business analyst with 7+ years in process optimization and KPI strategy.'],
    skills: ['SQL', 'Power BI', 'Excel', 'Stakeholder Management', 'BRD/FRD', 'Agile'],
    experience: [{ title: 'Senior Business Analyst', company: 'FinEdge Consulting', duration: 'Apr 2021 - Present', bullets: ['Led requirements workshops for 4 enterprise programs.', 'Designed executive dashboards for sales and operations.'] }],
    projects: [{ name: 'Revenue Forecasting Program', stack: 'Power BI, SQL', bullets: ['Improved forecast accuracy by 18% through data modeling.'] }],
    education: ['MBA - Operations, NMIMS University (2014 - 2016)'],
    certifications: ['CBAP'],
  },
  minimal: {
    name: 'Neha Gupta',
    role: 'Frontend Developer',
    contact: 'neha.gupta@email.com | +91 93XXXXXX76 | github.com/nehagupta',
    summary: ['Frontend engineer focused on responsive UI and accessibility.'],
    skills: ['React', 'Tailwind CSS', 'JavaScript', 'Accessibility', 'Figma'],
    experience: [{ title: 'Frontend Developer', company: 'SparkWave', duration: 'Aug 2021 - Present', bullets: ['Improved Lighthouse score from 62 to 91.', 'Built internal design system for 3 product teams.'] }],
    projects: [{ name: 'Design System Kit', stack: 'React, Storybook', bullets: ['Created reusable components and docs.'] }],
    education: ['B.Sc. Computer Science - Delhi University (2017 - 2020)'],
    certifications: ['Google UX Design'],
  },
  executive: {
    name: 'Sandeep Rao',
    role: 'Engineering Manager',
    contact: 'sandeep.rao@email.com | +91 99XXXXXX42 | linkedin.com/in/sandeeprao',
    summary: ['Engineering leader with 10+ years of experience scaling teams and reliability.'],
    skills: ['Leadership', 'Program Management', 'Cloud Architecture', 'SRE', 'Budgeting'],
    experience: [{ title: 'Engineering Manager', company: 'CloudFleet Technologies', duration: 'Jan 2020 - Present', bullets: ['Managed 18-member engineering team.', 'Reduced production incidents by 35%.'] }],
    projects: [{ name: 'Platform Reliability Program', stack: 'AWS, Kubernetes', bullets: ['Improved uptime SLA from 99.3% to 99.9%.'] }],
    education: ['B.Tech - Computer Engineering, VIT University (2011 - 2015)'],
    certifications: ['PMP', 'AWS Solutions Architect'],
  },
  student: {
    name: 'Priya Reddy',
    role: 'Computer Science Student',
    contact: 'priya.reddy@email.com | +91 90XXXXXX17 | github.com/priyareddy',
    summary: ['Final-year student with internship and project experience in web development and ML.'],
    skills: ['Python', 'C++', 'HTML/CSS', 'React', 'DSA', 'GitHub'],
    experience: [{ title: 'Software Intern', company: 'EduTech Labs', duration: 'May 2024 - Jul 2024', bullets: ['Built ERP admin modules used by faculty teams.', 'Improved attendance reporting performance by 25%.'] }],
    projects: [{ name: 'Student Performance Predictor', stack: 'Python, scikit-learn', bullets: ['Built model with 82% accuracy on validation data.'] }],
    education: ['B.Tech in CSE - JNTU Hyderabad (2021 - 2025)', 'CGPA: 8.8/10'],
    certifications: ['NPTEL Python for Data Science'],
  },
};

function escapeForSvg(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildFallbackPreviewDataUri(templateId, templateName) {
  const sample = templateSampleText[templateId] || templateSampleText.basic;
  const safeTemplateName = String(templateName || 'Resume');
  let y = 84;
  const lines = [];
  const push = (text, options = {}) => {
    const x = options.x ?? 110;
    const size = options.size ?? 12;
    const weight = options.weight ?? 400;
    const fill = options.fill ?? '#1f2937';
    const anchor = options.anchor ?? 'start';
    lines.push(
      `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeForSvg(text)}</text>`
    );
    y += options.step ?? 19;
  };
  const hr = () => {
    lines.push(`<line x1="110" y1="${y}" x2="790" y2="${y}" stroke="#9ca3af" stroke-width="1"/>`);
    y += 18;
  };
  const section = (title) => {
    push(title, { size: 15, weight: 700, fill: '#111827', step: 18 });
    hr();
  };

  push(sample.name || `${safeTemplateName} Candidate`, { x: 450, size: 34, weight: 700, fill: '#111827', anchor: 'middle', step: 24 });
  push(sample.role || `${safeTemplateName} Sample`, { x: 450, size: 16, fill: '#374151', anchor: 'middle', step: 16 });
  push(sample.contact || 'email@example.com | +00 0000000000 | linkedin.com/in/profile', { x: 450, size: 11, fill: '#4b5563', anchor: 'middle', step: 15 });
  hr();

  section('PROFESSIONAL SUMMARY');
  (sample.summary || []).slice(0, 3).forEach((line) => push(line, { size: 12 }));
  y += 4;
  hr();

  section('SKILLS');
  push((sample.skills || []).join(' | '), { size: 12 });
  y += 4;
  hr();

  section('EXPERIENCE');
  (sample.experience || []).slice(0, 2).forEach((job) => {
    push(`${job.title} | ${job.company}`, { size: 12, weight: 700, fill: '#111827', step: 16 });
    push(job.duration, { size: 11, fill: '#4b5563', step: 16 });
    (job.bullets || []).slice(0, 2).forEach((bullet) => push(`- ${bullet}`, { x: 118, size: 11, step: 15 }));
    y += 4;
  });
  hr();

  section('PROJECTS');
  (sample.projects || []).slice(0, 2).forEach((project) => {
    push(`${project.name} (${project.stack})`, { size: 12, weight: 700, fill: '#111827', step: 16 });
    (project.bullets || []).slice(0, 2).forEach((bullet) => push(`- ${bullet}`, { x: 118, size: 11, step: 15 }));
    y += 4;
  });
  hr();

  section('EDUCATION');
  (sample.education || []).slice(0, 2).forEach((line) => push(line, { size: 12, step: 17 }));
  y += 2;

  if ((sample.certifications || []).length) {
    hr();
    section('CERTIFICATIONS');
    push((sample.certifications || []).join(' | '), { size: 12 });
  }

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
  <rect width="900" height="1200" fill="#eef2f7"/>
  <rect x="80" y="40" width="740" height="1120" rx="3" fill="#ffffff" stroke="#111827"/>
  ${lines.join('\n  ')}
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function resolvePreviewUrl(previewUrl, templateName, templateId) {
  // Use inline preview for local static paths to avoid backend /static dependency and 404 noise.
  if (!previewUrl || previewUrl.startsWith('/static/resume_previews/')) {
    return buildFallbackPreviewDataUri(templateId, templateName);
  }
  if (previewUrl.startsWith('http://') || previewUrl.startsWith('https://')) return previewUrl;
  return `${API_BASE_URL}${previewUrl}`;
}

function getStatusLabel(score) {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Medium';
  return 'Needs Improvement';
}

function buildChangeSuggestions(report) {
  const suggestions = [];
  const category = report?.category_scores || {};
  const sections = report?.sections || {};

  if ((category.education || 0) < 70) suggestions.push('Improve education section with degree, institute, dates, and achievements.');
  if ((category.experience || 0) < 70) suggestions.push('Rewrite experience with measurable outcomes and impact numbers.');
  if ((category.projects || 0) < 70) suggestions.push('Add 2-3 detailed projects with tools, role, and result.');
  if ((category.skills || 0) < 70) suggestions.push('Organize skills by category (languages, frameworks, tools, databases).');

  if (!String(sections.projects || '').toLowerCase().includes('github')) {
    suggestions.push('Add GitHub/portfolio links in projects section.');
  }

  (report?.vulnerabilities || []).forEach((item) => {
    suggestions.push(item);
  });

  return Array.from(new Set(suggestions));
}

export default function ResumeBuildingPage() {
  const analysis = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('resumeAnalysis') || 'null');
    } catch {
      return null;
    }
  }, []);

  const [mode, setMode] = useState('');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [templates] = useState(fallbackTemplates);

  const [resumeFile, setResumeFile] = useState(null);
  const [modifyLoading, setModifyLoading] = useState(false);
  const [modifyReport, setModifyReport] = useState(null);
  const [modifyError, setModifyError] = useState('');
  const [modifyInfo, setModifyInfo] = useState('');
  const [modifyRaw, setModifyRaw] = useState(null);

  const categoryEntries = Object.entries(analysis?.category_scores || {});
  const statusLabel = analysis ? getStatusLabel(analysis.overall_score) : '';

  const modifyCategoryEntries = Object.entries(modifyReport?.category_scores || {});
  const modifyStatus = modifyReport ? getStatusLabel(modifyReport.overall_score) : '';
  const modifySuggestions = modifyReport ? buildChangeSuggestions(modifyReport) : [];

  const selectedTemplate = templates.find((item) => item.id === form.template) || templates[0] || fallbackTemplates[0];
  const visibleFields = selectedTemplate?.fields || [];

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onTemplateSelect = (template) => {
    setForm((prev) => ({ ...prev, template }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Name, email and phone are required.');
      return;
    }

    const missingTemplateField = visibleFields.find(
      (field) => field?.required && !String(form[field.key] || '').trim(),
    );
    if (missingTemplateField) {
      setError(`${missingTemplateField.label || missingTemplateField.key} is required for the selected template.`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const { blob, filename } = await generateResume(form);

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      setSuccess(`Resume generated and downloaded successfully using ${selectedTemplate?.name || 'selected'} template.`);
    } catch (err) {
      setError(err.message || 'Failed to generate resume.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeExistingResume = async () => {
    if (!resumeFile) {
      setModifyError('Please upload a PDF or DOCX resume first.');
      return;
    }

    try {
      setModifyLoading(true);
      setModifyError('');
      setModifyInfo('Uploading and analyzing resume...');
      setModifyReport(null);
      setModifyRaw(null);
      const result = await analyzeResume(resumeFile);
      setModifyRaw(result);
      const normalized = {
        overall_score: Number(result?.overall_score ?? result?.score ?? 0),
        category_scores: result?.category_scores || {},
        sections: result?.sections || {},
        skills: Array.isArray(result?.skills) ? result.skills : [],
        vulnerabilities: Array.isArray(result?.vulnerabilities) ? result.vulnerabilities : [],
      };
      setModifyReport(normalized);
      setModifyInfo('ATS analysis completed.');
    } catch (err) {
      setModifyError(err.message || 'Failed to analyze resume for ATS score.');
      setModifyInfo('');
    } finally {
      setModifyLoading(false);
    }
  };

  const useExtractedInCreateNew = () => {
    if (!modifyReport) return;

    const extractedSkills = Array.isArray(modifyReport.skills) ? modifyReport.skills.join(', ') : '';

    setForm((prev) => ({
      ...prev,
      summary: prev.summary || '',
      skills: extractedSkills || prev.skills,
      projects: String(modifyReport.sections?.projects || '').trim() || prev.projects,
      experience: String(modifyReport.sections?.experience || '').trim() || prev.experience,
      education: String(modifyReport.sections?.education || '').trim() || prev.education,
    }));
    setMode('create');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">Resume Builder</h1>
        <p className="text-gray-600 text-center mb-10">Modify existing resume with ATS insights or create a new one with templates.</p>

        {!mode ? (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <button
              onClick={() => setMode('modify')}
              className="bg-white p-8 rounded-2xl shadow-lg text-left hover:shadow-xl transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Modify Existing</h2>
              <p className="text-gray-600">Upload your resume, get ATS score (Resume Worded-style), and view changes needed.</p>
            </button>

            <button
              onClick={() => setMode('create')}
              className="bg-white p-8 rounded-2xl shadow-lg text-left hover:shadow-xl transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New</h2>
              <p className="text-gray-600">Pick a template and enter details based on that template structure.</p>
            </button>
          </div>
        ) : null}

        {mode ? (
          <div className="mb-6 flex flex-wrap gap-3">
            <button onClick={() => setMode('modify')} className={`px-4 py-2 rounded-lg font-semibold ${mode === 'modify' ? 'bg-amber-600 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}>
              Modify Existing
            </button>
            <button onClick={() => setMode('create')} className={`px-4 py-2 rounded-lg font-semibold ${mode === 'create' ? 'bg-teal-600 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}>
              Create New
            </button>
            <button onClick={() => setMode('')} className="px-4 py-2 rounded-lg font-semibold bg-white border border-gray-300 text-gray-700">
              Back
            </button>
          </div>
        ) : null}

        {mode === 'modify' ? (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Modify Existing Resume</h2>
              <label className="block border-2 border-dashed border-amber-300 rounded-xl p-8 text-center cursor-pointer hover:border-amber-500 transition-colors">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileUp className="w-7 h-7 text-amber-700" />
                </div>
                <p className="font-semibold text-gray-900">Upload existing resume</p>
                <p className="text-sm text-gray-500 mt-1">Accepted formats: PDF, DOCX</p>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => {
                    setResumeFile(e.target.files?.[0] || null);
                    setModifyError('');
                    setModifyInfo('');
                    setModifyReport(null);
                    setModifyRaw(null);
                  }}
                />
              </label>

              {resumeFile ? <p className="text-sm text-gray-700">Selected: <span className="font-semibold">{resumeFile.name}</span></p> : null}
              {modifyLoading ? <p className="text-sm text-amber-700">Analyzing resume and calculating ATS score...</p> : null}
              {!modifyLoading && modifyInfo ? <p className="text-sm text-green-700">{modifyInfo}</p> : null}
              {modifyError ? <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">{modifyError}</div> : null}

              <button type="button" onClick={analyzeExistingResume} disabled={modifyLoading} className="px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-60 font-semibold inline-flex items-center gap-2">
                {modifyLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {modifyLoading ? 'Analyzing...' : 'Get ATS Score & Changes'}
              </button>
            </div>

            {modifyReport ? (
              <div className="bg-white p-8 rounded-2xl shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">ATS Analysis (Resume Worded-style)</h3>

                <div className="bg-gray-50 rounded-xl p-6 mb-6 text-center">
                  <div className="text-5xl font-bold text-gray-900">{modifyReport.overall_score}</div>
                  <p className="text-gray-600">ATS compatibility score (out of 100)</p>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-gray-800">{modifyStatus}</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {modifyCategoryEntries.map(([name, score]) => (
                    <div key={name} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-900 capitalize">{name}</h3>
                        <span className="font-semibold text-amber-700">{score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: scoreColors[name] || '#d97706' }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-3">Recommended Changes</h4>
                  {modifySuggestions.length ? (
                    <ul className="space-y-2 text-sm text-gray-800">
                      {modifySuggestions.map((item, idx) => (
                        <li key={`${item}-${idx}`} className="bg-white border border-amber-200 rounded-lg px-3 py-2">{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-green-700">No major changes required.</p>
                  )}
                </div>

                <button onClick={useExtractedInCreateNew} className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-semibold">
                  Use Extracted Details in Create New
                </button>
              </div>
            ) : null}

            {!modifyLoading && !modifyError && resumeFile && !modifyReport ? (
              <div className="bg-white p-4 rounded-xl border border-gray-200 text-gray-600 text-sm">
                ATS report will appear here after analysis completes.
              </div>
            ) : null}

            {!modifyLoading && modifyRaw ? (
              <details className="bg-white p-4 rounded-xl border border-gray-200">
                <summary className="cursor-pointer font-semibold text-gray-800">Debug: Raw ATS API Response</summary>
                <pre className="mt-3 text-xs text-gray-700 whitespace-pre-wrap break-words">
                  {JSON.stringify(modifyRaw, null, 2)}
                </pre>
              </details>
            ) : null}
          </div>
        ) : null}

        {mode === 'create' ? (
          <>
            {analysis ? (
              <div className="bg-white p-8 rounded-2xl shadow-xl mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Resume Score</h2>
                <div className="bg-gray-50 rounded-xl p-6 mb-6 text-center">
                  <div className="text-5xl font-bold text-gray-900">{analysis.overall_score}</div>
                  <p className="text-gray-600">Overall score (out of 100)</p>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <span className="font-semibold text-gray-800">{statusLabel}</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {categoryEntries.map(([name, score]) => (
                    <div key={name} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-900 capitalize">{name}</h3>
                        <span className="font-semibold text-indigo-700">{score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${score}%`, backgroundColor: scoreColors[name] || '#4f46e5' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="bg-white p-8 rounded-2xl shadow-xl space-y-5">
              <div className="grid md:grid-cols-3 gap-4">
                <input name="name" value={form.name} onChange={onChange} placeholder="Name" className="border rounded-lg px-3 py-2" />
                <input name="email" value={form.email} onChange={onChange} placeholder="Email" className="border rounded-lg px-3 py-2" />
                <input name="phone" value={form.phone} onChange={onChange} placeholder="Phone" className="border rounded-lg px-3 py-2" />
              </div>

              <div>
                <h3 className="block text-sm font-semibold text-gray-700 mb-2">Choose Template</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => {
                    const isSelected = form.template === template.id;
                    const previewUrl = resolvePreviewUrl(template.preview_url, template.name, template.id);
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => onTemplateSelect(template.id)}
                        className={`text-left rounded-xl border transition-all p-3 ${
                          isSelected
                            ? 'border-teal-600 ring-2 ring-teal-200 shadow-md'
                            : 'border-gray-200 hover:border-teal-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="rounded-lg border border-gray-200 bg-gray-100 h-44 overflow-hidden">
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt={`${template.name} sample resume`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = buildFallbackPreviewDataUri(template.id, template.name);
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-100 via-white to-slate-50" />
                          )}
                        </div>
                        <div className="mt-3">
                          <p className="font-semibold text-gray-900">{template.name}</p>
                          <p className="text-xs text-gray-600">{template.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-600 mt-2">Selected template: <span className="font-semibold">{selectedTemplate?.name}</span></p>
                {resolvePreviewUrl(selectedTemplate?.preview_url, selectedTemplate?.name, selectedTemplate?.id) ? (
                  <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50 p-3">
                    <p className="text-sm font-semibold text-teal-800 mb-2">Selected Template Preview</p>
                    <img
                      src={resolvePreviewUrl(selectedTemplate?.preview_url, selectedTemplate?.name, selectedTemplate?.id)}
                      alt={`${selectedTemplate?.name || 'Selected'} resume preview`}
                      className="w-full max-w-2xl h-auto rounded-lg border border-teal-100 bg-white"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = buildFallbackPreviewDataUri(selectedTemplate?.id, selectedTemplate?.name);
                      }}
                    />
                  </div>
                ) : null}
              </div>

              {visibleFields.map((field) => (
                <div key={field.key}>
                  <label htmlFor={field.key} className="block text-sm font-semibold text-gray-700 mb-2">
                    {field.label}
                    {field.required ? <span className="text-red-600"> *</span> : null}
                  </label>
                  <textarea
                    id={field.key}
                    name={field.key}
                    value={form[field.key]}
                    onChange={onChange}
                    placeholder={field.placeholder || ''}
                    className="border rounded-lg px-3 py-2 w-full min-h-24"
                  />
                </div>
              ))}

              {error ? <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">{error}</div> : null}
              {success ? <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3">{success}</div> : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-60 font-semibold flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? 'Generating...' : 'Generate & Download Resume'}
              </button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}
