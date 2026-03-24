import { getSectionDisplayName } from '../../utils/resumeTemplates';

function Field({ label, value, onChange, placeholder, invalid = false, disabled = false }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={`w-full rounded-md border px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
          invalid ? 'border-red-400 bg-red-50' : 'border-slate-300'
        }`}
        placeholder={placeholder}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder, rows = 4, invalid = false, disabled = false }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        disabled={disabled}
        className={`w-full rounded-md border px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
          invalid ? 'border-red-400 bg-red-50' : 'border-slate-300'
        }`}
        placeholder={placeholder}
      />
    </div>
  );
}

function EntryCard({ title, details = [], onRemove }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">{title}</p>
          <div className="mt-1 space-y-1 text-sm text-slate-600">
            {details.filter(Boolean).map((detail, index) => (
              <p key={index} className="whitespace-pre-line">
                {detail}
              </p>
            ))}
          </div>
        </div>
        <button type="button" onClick={onRemove} className="text-sm font-medium text-red-600 hover:text-red-700">
          Remove
        </button>
      </div>
    </div>
  );
}

function SectionBlock({ sectionKey, title, isMissing = false, skipped = false, onSkip, onUndo, children }) {
  return (
    <div
      id={sectionKey ? `resume-section-${sectionKey}` : undefined}
      className={`rounded-2xl border p-4 ${skipped ? 'border-slate-300 bg-slate-100' : isMissing ? 'border-red-300 bg-red-50/60' : 'border-slate-200'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {skipped ? <p className="mt-1 text-sm text-slate-500">Section skipped.</p> : null}
          {!skipped && isMissing ? <p className="mt-1 text-sm text-red-600">{title} section is missing. Please add details.</p> : null}
        </div>
        {skipped ? (
          <button type="button" onClick={onUndo} className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-white">
            Undo Skip
          </button>
        ) : (
          <button type="button" onClick={onSkip} className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Skip
          </button>
        )}
      </div>
      {!skipped ? <div className="mt-4 space-y-4">{children}</div> : null}
    </div>
  );
}

export default function ResumeForm({
  template,
  resumeData,
  missingFields,
  skippedSections,
  drafts,
  onFieldChange,
  onSkillInputChange,
  onProjectDraftChange,
  onEducationDraftChange,
  onWorkExperienceDraftChange,
  onCourseworkDraftChange,
  onLinkDraftChange,
  onSectionNameChange,
  onSectionContentChange,
  onAddSkill,
  onRemoveSkill,
  onAddProject,
  onRemoveProject,
  onAddEducation,
  onRemoveEducation,
  onAddWorkExperience,
  onRemoveWorkExperience,
  onAddCoursework,
  onRemoveCoursework,
  onAddLink,
  onRemoveLink,
  onAddCustomSection,
  onRemoveCustomSection,
  onSkipSection,
  onUndoSkipSection,
  onDownload,
}) {
  const sections = template.sections;
  const isMissing = (section) => missingFields.includes(section);
  const isSkipped = (section) => Boolean(skippedSections[section]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Resume Details</h2>
          <p className="mt-1 text-sm text-slate-600">The form adapts to the selected template sections.</p>
        </div>
        <button
          type="button"
          onClick={onDownload}
          className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
        >
          Download Resume
        </button>
      </div>

      <div className="mt-6 space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Personal Info</h3>
          <Field label="Name" value={resumeData.name} onChange={(value) => onFieldChange('name', value)} placeholder="Enter your full name" />
          <Field label="Email" value={resumeData.email} onChange={(value) => onFieldChange('email', value)} placeholder="Enter your email" />
          <Field label="Phone" value={resumeData.phone} onChange={(value) => onFieldChange('phone', value)} placeholder="Enter your phone number" />
        </div>

        {sections.includes('summary') ? (
          <SectionBlock
            sectionKey="summary"
            title={getSectionDisplayName('summary')}
            isMissing={isMissing('summary')}
            skipped={isSkipped('summary')}
            onSkip={() => onSkipSection('summary')}
            onUndo={() => onUndoSkipSection('summary')}
          >
            <TextAreaField
              label="Professional Summary"
              value={resumeData.summary}
              onChange={(value) => onFieldChange('summary', value)}
              placeholder="Write a short summary"
              invalid={isMissing('summary')}
            />
          </SectionBlock>
        ) : null}

        {sections.includes('about') ? (
          <SectionBlock
            sectionKey="about"
            title={getSectionDisplayName('about')}
            isMissing={isMissing('about')}
            skipped={isSkipped('about')}
            onSkip={() => onSkipSection('about')}
            onUndo={() => onUndoSkipSection('about')}
          >
            <TextAreaField
              label="About Section"
              value={resumeData.about}
              onChange={(value) => onFieldChange('about', value)}
              placeholder="Write an about/profile section"
              invalid={isMissing('about')}
            />
          </SectionBlock>
        ) : null}

        {sections.includes('skills') ? (
          <SectionBlock
            sectionKey="skills"
            title={getSectionDisplayName('skills')}
            isMissing={isMissing('skills')}
            skipped={isSkipped('skills')}
            onSkip={() => onSkipSection('skills')}
            onUndo={() => onUndoSkipSection('skills')}
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={drafts.skillInput}
                onChange={(event) => onSkillInputChange(event.target.value)}
                className={`flex-1 rounded-md border px-4 py-3 outline-none focus:border-blue-500 ${
                  isMissing('skills') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
                placeholder="Add a skill"
              />
              <button type="button" onClick={onAddSkill} className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600">
                Add Skill
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {resumeData.skills.map((skill, index) => (
                <span key={`${skill}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                  {skill}
                  <button type="button" onClick={() => onRemoveSkill(index)} className="text-blue-700 hover:text-blue-900">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </SectionBlock>
        ) : null}

        {sections.includes('projects') ? (
          <SectionBlock
            sectionKey="projects"
            title={getSectionDisplayName('projects')}
            isMissing={isMissing('projects')}
            skipped={isSkipped('projects')}
            onSkip={() => onSkipSection('projects')}
            onUndo={() => onUndoSkipSection('projects')}
          >
            <Field
              label="Project Title"
              value={drafts.projectDraft.title}
              onChange={(value) => onProjectDraftChange('title', value)}
              placeholder="Project title"
              invalid={isMissing('projects')}
            />
            <TextAreaField
              label="Project Description"
              value={drafts.projectDraft.description}
              onChange={(value) => onProjectDraftChange('description', value)}
              placeholder="Describe the project"
              invalid={isMissing('projects')}
            />
            <button type="button" onClick={onAddProject} className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600">
              Add Project
            </button>
            <div className="space-y-3">
              {resumeData.projects.map((project, index) => (
                <EntryCard key={`${project.title}-${index}`} title={project.title || 'Project'} details={[project.description]} onRemove={() => onRemoveProject(index)} />
              ))}
            </div>
          </SectionBlock>
        ) : null}

        {sections.includes('workExperience') ? (
          <SectionBlock
            sectionKey="workExperience"
            title={getSectionDisplayName('workExperience')}
            isMissing={isMissing('workExperience')}
            skipped={isSkipped('workExperience')}
            onSkip={() => onSkipSection('workExperience')}
            onUndo={() => onUndoSkipSection('workExperience')}
          >
            <Field
              label="Role / Title"
              value={drafts.workExperienceDraft.title}
              onChange={(value) => onWorkExperienceDraftChange('title', value)}
              placeholder="Software Engineer"
              invalid={isMissing('workExperience')}
            />
            <Field
              label="Company"
              value={drafts.workExperienceDraft.company}
              onChange={(value) => onWorkExperienceDraftChange('company', value)}
              placeholder="Company name"
              invalid={isMissing('workExperience')}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Date"
                value={drafts.workExperienceDraft.date}
                onChange={(value) => onWorkExperienceDraftChange('date', value)}
                placeholder="2023 - Present"
                invalid={isMissing('workExperience')}
              />
              <Field
                label="Location"
                value={drafts.workExperienceDraft.location}
                onChange={(value) => onWorkExperienceDraftChange('location', value)}
                placeholder="City, Country"
                invalid={isMissing('workExperience')}
              />
            </div>
            <TextAreaField
              label="Description"
              value={drafts.workExperienceDraft.description}
              onChange={(value) => onWorkExperienceDraftChange('description', value)}
              placeholder="Describe responsibilities and achievements"
              invalid={isMissing('workExperience')}
            />
            <button type="button" onClick={onAddWorkExperience} className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600">
              Add Work Experience
            </button>
            <div className="space-y-3">
              {resumeData.workExperience.map((item, index) => (
                <EntryCard
                  key={`${item.title}-${index}`}
                  title={item.title || 'Experience'}
                  details={[item.company, item.date, item.location, item.description]}
                  onRemove={() => onRemoveWorkExperience(index)}
                />
              ))}
            </div>
          </SectionBlock>
        ) : null}

        {sections.includes('education') ? (
          <SectionBlock
            sectionKey="education"
            title={getSectionDisplayName('education')}
            isMissing={isMissing('education')}
            skipped={isSkipped('education')}
            onSkip={() => onSkipSection('education')}
            onUndo={() => onUndoSkipSection('education')}
          >
            <Field
              label="Degree"
              value={drafts.educationDraft.degree}
              onChange={(value) => onEducationDraftChange('degree', value)}
              placeholder="Degree / Program"
              invalid={isMissing('education')}
            />
            <Field
              label="Institution"
              value={drafts.educationDraft.institution}
              onChange={(value) => onEducationDraftChange('institution', value)}
              placeholder="Institution name"
              invalid={isMissing('education')}
            />
            <Field
              label="Year / Date Range"
              value={drafts.educationDraft.year}
              onChange={(value) => onEducationDraftChange('year', value)}
              placeholder="2021 - 2025"
              invalid={isMissing('education')}
            />
            <button type="button" onClick={onAddEducation} className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600">
              Add Education
            </button>
            <div className="space-y-3">
              {resumeData.education.map((entry, index) => (
                <EntryCard key={`${entry.degree}-${index}`} title={entry.degree || 'Education'} details={[entry.institution, entry.year]} onRemove={() => onRemoveEducation(index)} />
              ))}
            </div>
          </SectionBlock>
        ) : null}

        {sections.includes('coursework') ? (
          <SectionBlock
            sectionKey="coursework"
            title={getSectionDisplayName('coursework')}
            isMissing={isMissing('coursework')}
            skipped={isSkipped('coursework')}
            onSkip={() => onSkipSection('coursework')}
            onUndo={() => onUndoSkipSection('coursework')}
          >
            <Field
              label="Course Title"
              value={drafts.courseworkDraft.title}
              onChange={(value) => onCourseworkDraftChange('title', value)}
              placeholder="Advanced Procrastination Techniques"
              invalid={isMissing('coursework')}
            />
            <Field
              label="Subtitle"
              value={drafts.courseworkDraft.subtitle}
              onChange={(value) => onCourseworkDraftChange('subtitle', value)}
              placeholder="Professor / Track"
              invalid={isMissing('coursework')}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Date"
                value={drafts.courseworkDraft.date}
                onChange={(value) => onCourseworkDraftChange('date', value)}
                placeholder="Fall 2020"
                invalid={isMissing('coursework')}
              />
              <Field
                label="Location"
                value={drafts.courseworkDraft.location}
                onChange={(value) => onCourseworkDraftChange('location', value)}
                placeholder="Campus"
                invalid={isMissing('coursework')}
              />
            </div>
            <TextAreaField
              label="Description"
              value={drafts.courseworkDraft.description}
              onChange={(value) => onCourseworkDraftChange('description', value)}
              placeholder="Describe the course or learning outcome"
              invalid={isMissing('coursework')}
            />
            <button type="button" onClick={onAddCoursework} className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600">
              Add Coursework
            </button>
            <div className="space-y-3">
              {resumeData.coursework.map((item, index) => (
                <EntryCard
                  key={`${item.title}-${index}`}
                  title={item.title || 'Coursework'}
                  details={[item.subtitle, item.date, item.location, item.description]}
                  onRemove={() => onRemoveCoursework(index)}
                />
              ))}
            </div>
          </SectionBlock>
        ) : null}

        {sections.includes('links') ? (
          <SectionBlock
            sectionKey="links"
            title={getSectionDisplayName('links')}
            isMissing={isMissing('links')}
            skipped={isSkipped('links')}
            onSkip={() => onSkipSection('links')}
            onUndo={() => onUndoSkipSection('links')}
          >
            <Field
              label="Link Label"
              value={drafts.linkDraft.label}
              onChange={(value) => onLinkDraftChange('label', value)}
              placeholder="LinkedIn"
              invalid={isMissing('links')}
            />
            <Field
              label="Link Value"
              value={drafts.linkDraft.value}
              onChange={(value) => onLinkDraftChange('value', value)}
              placeholder="linkedin.com/in/username"
              invalid={isMissing('links')}
            />
            <button type="button" onClick={onAddLink} className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600">
              Add Link
            </button>
            <div className="space-y-3">
              {resumeData.links.map((item, index) => (
                <EntryCard key={`${item.label}-${index}`} title={item.label || 'Link'} details={[item.value]} onRemove={() => onRemoveLink(index)} />
              ))}
            </div>
          </SectionBlock>
        ) : null}

        <SectionBlock
          sectionKey="customSections"
          title="Add Custom Section"
          skipped={isSkipped('customSections')}
          onSkip={() => onSkipSection('customSections')}
          onUndo={() => onUndoSkipSection('customSections')}
        >
          <Field label="Section Name" value={drafts.sectionName} onChange={onSectionNameChange} placeholder="Certifications" />
          <TextAreaField label="Section Content" value={drafts.sectionContent} onChange={onSectionContentChange} placeholder="AWS Certified Developer" />
          <button type="button" onClick={onAddCustomSection} className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600">
            Add Section
          </button>
          <div className="space-y-3">
            {resumeData.customSections.map((section, index) => (
              <EntryCard key={`${section.name}-${index}`} title={section.name || 'Custom Section'} details={[section.content]} onRemove={() => onRemoveCustomSection(index)} />
            ))}
          </div>
        </SectionBlock>
      </div>
    </section>
  );
}
