import { useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Download, Plus, Sparkles, Trash2 } from 'lucide-react';
import {
  findSuggestionMatchesForSection,
  getWeakSectionIds,
  initialImproveResumeData,
} from '../app/utils/resumeImproveData';

function readImproveSession() {
  try {
    const raw = sessionStorage.getItem('resumeImproveSession');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
      />
    </label>
  );
}

function SuggestionPanel({ atsScore, suggestions }) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <div className="flex flex-wrap items-start gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">ATS Score</p>
          <p className="mt-2 text-4xl font-bold text-slate-900">{Number(atsScore || 0)}%</p>
        </div>
        <div className="h-14 w-px bg-blue-200" />
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Improvement Suggestions
          </h2>
          {suggestions?.length ? (
            <ul className="mt-3 space-y-2">
              {suggestions.map((item, index) => (
                <li key={`${item}-${index}`} className="rounded-xl bg-white px-4 py-3 text-sm text-slate-700">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-600">No suggestions are available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionEditor({ section, weak, sectionSuggestions, onTitleChange, onEntryChange, onAddEntry, onRemoveEntry }) {
  return (
    <section className={`rounded-2xl border p-5 ${weak ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Field label="Section Title" value={section.title} onChange={onTitleChange} placeholder="Section title" />
        </div>
        {weak ? <span className="mt-8 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">Needs work</span> : null}
      </div>

      {sectionSuggestions.length ? (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Related Suggestions</p>
          <ul className="mt-2 space-y-2">
            {sectionSuggestions.map((item, index) => (
              <li key={`${section.id}-suggestion-${index}`} className="text-sm text-slate-700">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-3">
        {section.content.map((entry, index) => (
          <div key={`${section.id}-entry-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex justify-end">
              <button type="button" onClick={() => onRemoveEntry(index)} className="text-sm font-medium text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={entry}
              onChange={(event) => onEntryChange(index, event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
              placeholder="Add section content"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddEntry}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <Plus className="h-4 w-4" />
        Add Entry
      </button>
    </section>
  );
}

export default function ResumeImprovePage() {
  const session = useMemo(() => readImproveSession(), []);
  const previewRef = useRef(null);
  const [resumeData, setResumeData] = useState(() => session?.resumeData || initialImproveResumeData);
  const [suggestions] = useState(() => session?.suggestions || []);
  const [atsScore] = useState(() => session?.atsScore || 0);

  const weakSectionIds = getWeakSectionIds(resumeData);

  if (!session) {
    return <Navigate to="/ats-score" replace />;
  }

  function updateField(field, value) {
    setResumeData((current) => ({ ...current, [field]: value }));
  }

  function updateSection(sectionId, updater) {
    setResumeData((current) => ({
      ...current,
      sections: current.sections.map((section) => (section.id === sectionId ? updater(section) : section)),
    }));
  }

  function updateSectionTitle(sectionId, title) {
    updateSection(sectionId, (section) => ({ ...section, title }));
  }

  function updateSectionEntry(sectionId, entryIndex, value) {
    updateSection(sectionId, (section) => ({
      ...section,
      content: section.content.map((entry, index) => (index === entryIndex ? value : entry)),
    }));
  }

  function addSectionEntry(sectionId) {
    updateSection(sectionId, (section) => ({
      ...section,
      content: [...section.content, ''],
    }));
  }

  function removeSectionEntry(sectionId, entryIndex) {
    updateSection(sectionId, (section) => ({
      ...section,
      content: section.content.filter((_, index) => index !== entryIndex),
    }));
  }

  async function handleDownload() {
    if (!previewRef.current) return;

    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default || html2pdfModule;

    html2pdf()
      .set({
        margin: 0.35,
        filename: `${(resumeData.name || 'improved_resume').replace(/\s+/g, '_').toLowerCase()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      })
      .from(previewRef.current)
      .save();
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Improve Resume</h1>
            <p className="mt-2 text-slate-600">Edit the uploaded resume while preserving its original section order and titles.</p>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Download Resume
          </button>
        </div>

        <div className="mb-8">
          <SuggestionPanel atsScore={atsScore} suggestions={suggestions} />
          {weakSectionIds.length ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              Some sections look sparse and may need stronger content.
            </div>
          ) : null}
        </div>

        <div className="grid gap-8 xl:grid-cols-[460px_minmax(0,1fr)]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Basic Details</h2>
              <div className="space-y-4">
                <Field label="Name" value={resumeData.name} onChange={(value) => updateField('name', value)} placeholder="Full name" />
                <Field label="Email" value={resumeData.email} onChange={(value) => updateField('email', value)} placeholder="Email address" />
              </div>
            </section>

            {resumeData.sections.map((section) => (
              <SectionEditor
                key={section.id}
                section={section}
                weak={weakSectionIds.includes(section.id)}
                sectionSuggestions={findSuggestionMatchesForSection(section.title, suggestions)}
                onTitleChange={(value) => updateSectionTitle(section.id, value)}
                onEntryChange={(entryIndex, value) => updateSectionEntry(section.id, entryIndex, value)}
                onAddEntry={() => addSectionEntry(section.id)}
                onRemoveEntry={(entryIndex) => removeSectionEntry(section.id, entryIndex)}
              />
            ))}
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Live Preview</p>
            <div className="overflow-auto rounded-3xl border border-slate-200 bg-slate-200 p-4 shadow-sm">
              <div ref={previewRef} className="mx-auto w-full max-w-[820px] bg-white p-10 text-slate-900 shadow-sm">
                <header className="border-b border-slate-200 pb-6">
                  <h1 className="text-3xl font-bold uppercase tracking-[0.12em]">{resumeData.name || 'Your Name'}</h1>
                  <p className="mt-2 text-sm text-slate-600">{resumeData.email || 'email@example.com'}</p>
                </header>

                {resumeData.sections.map((section) => {
                  const visibleEntries = section.content.filter((entry) => String(entry || '').trim());
                  if (!visibleEntries.length) return null;

                  return (
                    <section key={`preview-${section.id}`} className="mt-6">
                      <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-slate-500">{section.title}</h2>
                      <div className="mt-3 space-y-3">
                        {visibleEntries.map((entry, index) => (
                          <p key={`preview-${section.id}-${index}`} className="whitespace-pre-line text-sm leading-7 text-slate-700">
                            {entry}
                          </p>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
