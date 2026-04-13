import { useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ResumeForm from '../components/resume/ResumeForm';
import ResumeTemplatePreview from '../components/resume/ResumeTemplatePreview';
import { getAtsSuggestions } from '../app/api/resumeApi';
import {
  getMissingFields,
  getSectionDisplayName,
  getUploadGuidance,
  initialResumeData,
  initialSkippedSections,
  mapExtractedResumeData,
  templateConfig,
  autoMapUnsupportedSections,
} from '../utils/resumeTemplates';

export default function ResumeBuilderPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const previewRef = useRef(null);
  const params = new URLSearchParams(location.search);
  const rawTemplateId = params.get('template') || 'academic';
  const selectedTemplateId = rawTemplateId === 'noodle' ? 'classic' : rawTemplateId;
  const mode = params.get('mode') || 'create';
  const selectedTemplate = templateConfig[selectedTemplateId] || templateConfig.academic;

  const sessionDraft = useMemo(() => {
    const raw = sessionStorage.getItem('uploadedResumeDraft');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const [resumeData, setResumeData] = useState(() => {
    if (mode === 'upload' && sessionDraft) {
      const mapped = mapExtractedResumeData(sessionDraft);
      return autoMapUnsupportedSections(selectedTemplate, mapped);
    }
    return initialResumeData;
  });
  
  const [atsScore, setAtsScore] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [skillInput, setSkillInput] = useState('');
  const [projectDraft, setProjectDraft] = useState({ title: '', description: '' });
  const [educationDraft, setEducationDraft] = useState({ degree: '', institution: '', year: '' });
  const [workExperienceDraft, setWorkExperienceDraft] = useState({
    title: '',
    company: '',
    date: '',
    location: '',
    description: '',
  });
  const [courseworkDraft, setCourseworkDraft] = useState({
    title: '',
    subtitle: '',
    date: '',
    location: '',
    description: '',
  });
  const [linkDraft, setLinkDraft] = useState({ label: '', value: '' });
  const [sectionName, setSectionName] = useState('');
  const [sectionContent, setSectionContent] = useState('');
  const [skippedSections, setSkippedSections] = useState(initialSkippedSections);
  const [dismissedCustomSuggestions, setDismissedCustomSuggestions] = useState([]);
  const missingFields = useMemo(
    () => getMissingFields(selectedTemplate, resumeData, skippedSections),
    [selectedTemplate, resumeData, skippedSections]
  );
  const uploadGuidance = useMemo(
    () => (mode === 'upload' ? getUploadGuidance(selectedTemplate, resumeData, skippedSections) : null),
    [mode, selectedTemplate, resumeData, skippedSections]
  );

  console.log('Selected template:', selectedTemplateId);
  console.log('Resume data:', resumeData);

  function updateField(field, value) {
    setResumeData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateDraft(setter, field, value) {
    setter((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addListItem(field, draft, resetDraft) {
    const hasValue = Object.values(draft).some((value) => String(value).trim());
    if (!hasValue) return;

    const normalizedDraft = Object.fromEntries(
      Object.entries(draft).map(([key, value]) => [key, String(value).trim()])
    );

    setResumeData((current) => ({
      ...current,
      [field]: [...current[field], normalizedDraft],
    }));
    resetDraft();
  }

  function removeListItem(field, indexToRemove) {
    setResumeData((current) => ({
      ...current,
      [field]: current[field].filter((_, index) => index !== indexToRemove),
    }));
  }

  function addSkill() {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    setResumeData((current) => ({
      ...current,
      skills: [...current.skills, trimmed],
    }));
    setSkillInput('');
  }

  function addProject() {
    addListItem('projects', projectDraft, () => setProjectDraft({ title: '', description: '' }));
  }

  function addEducation() {
    addListItem('education', educationDraft, () => setEducationDraft({ degree: '', institution: '', year: '' }));
  }

  function addWorkExperience() {
    addListItem('workExperience', workExperienceDraft, () =>
      setWorkExperienceDraft({ title: '', company: '', date: '', location: '', description: '' })
    );
  }

  function addCoursework() {
    addListItem('coursework', courseworkDraft, () =>
      setCourseworkDraft({ title: '', subtitle: '', date: '', location: '', description: '' })
    );
  }

  function addLink() {
    addListItem('links', linkDraft, () => setLinkDraft({ label: '', value: '' }));
  }

  function addCustomSection() {
    const trimmedName = sectionName.trim();
    const trimmedContent = sectionContent.trim();
    if (!trimmedName || !trimmedContent) return;

    setResumeData((current) => ({
      ...current,
      customSections: [...current.customSections, { name: trimmedName, content: trimmedContent }],
    }));
    setSectionName('');
    setSectionContent('');
  }

  function addSuggestedCustomSection(section) {
    const trimmedName = (section.name || '').trim();
    const trimmedContent = (section.content || '').trim();
    if (!trimmedName || !trimmedContent) return;

    setResumeData((current) => {
      const alreadyExists = current.customSections.some(
        (customSection) => customSection.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );

      if (alreadyExists) return current;

      return {
        ...current,
        customSections: [...current.customSections, { name: trimmedName, content: trimmedContent }],
      };
    });

    setDismissedCustomSuggestions((current) => [...new Set([...current, trimmedName.toLowerCase()])]);
  }

  function dismissSuggestedCustomSection(sectionNameToDismiss) {
    const normalizedName = sectionNameToDismiss.trim().toLowerCase();
    if (!normalizedName) return;
    setDismissedCustomSuggestions((current) => [...new Set([...current, normalizedName])]);
  }

  function jumpToSection(section) {
    const sectionNode = document.getElementById(`resume-section-${section}`);
    if (!sectionNode) return;
    sectionNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function clearSectionData(section) {
    if (section === 'summary' || section === 'about') {
      setResumeData((current) => ({ ...current, [section]: '' }));
      return;
    }

    const listSections = ['skills', 'projects', 'workExperience', 'education', 'coursework', 'links', 'customSections'];
    if (listSections.includes(section)) {
      setResumeData((current) => ({ ...current, [section]: [] }));
    }
  }

  function skipSection(section) {
    clearSectionData(section);
    setSkippedSections((current) => ({
      ...current,
      [section]: true,
    }));
  }

  function undoSkipSection(section) {
    setSkippedSections((current) => ({
      ...current,
      [section]: false,
    }));
  }

  const visibleCustomSuggestions = (uploadGuidance?.suggestedCustomSections || []).filter(
    (section) => !dismissedCustomSuggestions.includes(section.name.trim().toLowerCase())
  );

  async function handleDownload() {
    if (!previewRef.current) return;

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      html2pdf()
        .set({
          margin: 0.3,
          filename: `${(resumeData.name || 'resume').replace(/\s+/g, '_').toLowerCase()}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        })
        .from(previewRef.current)
        .save();
    } catch (error) {
      console.error('html2pdf.js is not available yet.', error);
      window.alert('Download is not ready because html2pdf.js is not installed yet.');
    }
  }

  async function handleGetSuggestions() {
    try {
      setIsAnalyzing(true);
      const res = await getAtsSuggestions(resumeData);
      if (res.score !== undefined) setAtsScore(res.score);
      if (res.suggestions) setAiSuggestions(res.suggestions);
    } catch (err) {
      console.error(err);
      window.alert('Failed to get suggestions. Please check your connection.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Resume Builder</h1>
            <p className="mt-2 text-slate-600">
              Template: <span className="font-semibold">{selectedTemplate.name}</span>
              {mode === 'upload' ? ' | Pre-filled from uploaded resume' : ' | Start from scratch'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/resume/templates?mode=${mode}`)}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Change Template
          </button>
        </div>

        {missingFields.length ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            Complete missing sections to improve resume: {missingFields.join(', ')}.
          </div>
        ) : null}

        {mode === 'upload' && uploadGuidance ? (
          <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Uploaded Resume Mapping</h2>
              <p className="mt-1 text-sm text-slate-600">
                We mapped the uploaded resume into the selected <span className="font-semibold">{selectedTemplate.name}</span> template.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {uploadGuidance.mappedSections.length ? (
                  uploadGuidance.mappedSections.map((section) => (
                    <span key={section} className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm">
                      {getSectionDisplayName(section)}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-600">No matching sections were detected yet.</p>
                )}
              </div>
              {Array.isArray(resumeData.sectionMapping) && resumeData.sectionMapping.length ? (
                <div className="mt-4 rounded-xl border border-blue-100 bg-white/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Section Mapping Confidence</p>
                  <div className="mt-2 space-y-2">
                    {resumeData.sectionMapping.map((item, index) => (
                      <div key={`${item.source}-${index}`} className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                        <span className="font-medium">{item.source}</span>
                        <span className="text-slate-400">→</span>
                        <span>{getSectionDisplayName(item.target === 'experience' ? 'workExperience' : item.target)}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {Math.round(Number(item.confidence || 0) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-900">Template Sections To Complete</h2>
                <p className="mt-1 text-sm text-slate-600">
                  If the selected template expects extra sections, add details below or skip them.
                </p>
                <div className="mt-4 space-y-3">
                  {uploadGuidance.missingTemplateSections.length ? (
                    uploadGuidance.missingTemplateSections.map((section) => (
                      <div key={section} className="rounded-xl border border-amber-200 bg-white px-3 py-3">
                        <p className="text-sm font-semibold text-slate-900">{getSectionDisplayName(section)} is missing from the uploaded resume.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => jumpToSection(section)}
                            className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
                          >
                            Add Details
                          </button>
                          <button
                            type="button"
                            onClick={() => skipSection(section)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Skip Section
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600">All selected template sections already have mapped content or were skipped.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-900">Custom Section Suggestions</h2>
                <p className="mt-1 text-sm text-slate-600">
                  These uploaded sections do not have a dedicated place in the selected template. Add them as custom sections if you want to keep them.
                </p>
                <div className="mt-4 space-y-3">
                  {visibleCustomSuggestions.length ? (
                    visibleCustomSuggestions.map((section) => (
                      <div key={section.name} className="rounded-xl border border-emerald-200 bg-white px-3 py-3">
                        <p className="text-sm font-semibold text-slate-900">{section.name}</p>
                        <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{section.content}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => addSuggestedCustomSection(section)}
                            className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
                          >
                            Add as Custom Section
                          </button>
                          <button
                            type="button"
                            onClick={() => dismissSuggestedCustomSection(section.name)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600">No extra uploaded sections need custom mapping right now.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mb-8 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-indigo-50 bg-indigo-50/50 px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                ATS Copilot
              </h2>
            </div>
            <button
              type="button"
              onClick={handleGetSuggestions}
              disabled={isAnalyzing}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2 shadow-sm"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" fill="currentColor"></path></svg>
                  Analyzing...
                </>
              ) : (
                'Check ATS Score'
              )}
            </button>
          </div>
          {(atsScore !== null || aiSuggestions.length > 0) && (
            <div className="px-6 py-5 bg-white">
              {atsScore !== null && (
                <div className="mb-4">
                  <span className="text-sm font-semibold text-slate-900 opacity-60 uppercase tracking-wider block mb-1">ATS Score</span>
                  <div className="text-3xl font-bold text-indigo-700">{atsScore}<span className="text-lg text-slate-500 font-medium">/100</span></div>
                </div>
              )}
              {aiSuggestions.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Suggestions:</h3>
                  <ul className="space-y-3">
                    {aiSuggestions.map((suggestion, index) => (
                      <li key={index} className="flex gap-3 text-sm text-slate-700">
                        <span className="flex-shrink-0 mt-0.5 rounded-full bg-indigo-100 p-1 text-indigo-600">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </span>
                        <span className="leading-relaxed">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-8 xl:grid-cols-[440px_minmax(0,1fr)]">
          <ResumeForm
            template={selectedTemplate}
            resumeData={resumeData}
            missingFields={missingFields}
            skippedSections={skippedSections}
            drafts={{
              skillInput,
              projectDraft,
              educationDraft,
              workExperienceDraft,
              courseworkDraft,
              linkDraft,
              sectionName,
              sectionContent,
            }}
            onFieldChange={updateField}
            onSkillInputChange={setSkillInput}
            onProjectDraftChange={(field, value) => updateDraft(setProjectDraft, field, value)}
            onEducationDraftChange={(field, value) => updateDraft(setEducationDraft, field, value)}
            onWorkExperienceDraftChange={(field, value) => updateDraft(setWorkExperienceDraft, field, value)}
            onCourseworkDraftChange={(field, value) => updateDraft(setCourseworkDraft, field, value)}
            onLinkDraftChange={(field, value) => updateDraft(setLinkDraft, field, value)}
            onSectionNameChange={setSectionName}
            onSectionContentChange={setSectionContent}
            onAddSkill={addSkill}
            onRemoveSkill={(index) => removeListItem('skills', index)}
            onAddProject={addProject}
            onRemoveProject={(index) => removeListItem('projects', index)}
            onAddEducation={addEducation}
            onRemoveEducation={(index) => removeListItem('education', index)}
            onAddWorkExperience={addWorkExperience}
            onRemoveWorkExperience={(index) => removeListItem('workExperience', index)}
            onAddCoursework={addCoursework}
            onRemoveCoursework={(index) => removeListItem('coursework', index)}
            onAddLink={addLink}
            onRemoveLink={(index) => removeListItem('links', index)}
            onAddCustomSection={addCustomSection}
            onRemoveCustomSection={(index) => removeListItem('customSections', index)}
            onSkipSection={skipSection}
            onUndoSkipSection={undoSkipSection}
            onDownload={handleDownload}
          />

          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Live Preview</p>
            <ResumeTemplatePreview template={selectedTemplateId} data={resumeData} skippedSections={skippedSections} previewRef={previewRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
