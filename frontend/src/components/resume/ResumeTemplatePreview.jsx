import AcademicTemplate from './templates/AcademicTemplate';
import ClassicTemplate from './templates/ClassicTemplate';
import ExecutiveTemplate from './templates/ExecutiveTemplate';

export function ResumeTemplateRenderer({ template, data }) {
  if (template === 'academic') {
    return <AcademicTemplate data={data} />;
  }

  if (template === 'executive') {
    return <ExecutiveTemplate data={data} />;
  }

  if (template === 'classic' || template === 'noodle') {
    return <ClassicTemplate data={data} />;
  }

  return <AcademicTemplate data={data} />;
}

export default function ResumeTemplatePreview({ template, data, skippedSections, previewRef }) {
  return (
    <div ref={previewRef} className="rounded-3xl border border-slate-200 bg-slate-100 p-4 shadow-sm">
      <ResumeTemplateRenderer template={template} data={{ ...data, skippedSections }} />
    </div>
  );
}
