import { ResumeTemplateRenderer } from './ResumeTemplatePreview';
import { sampleResumeData } from '../../utils/resumeTemplates';

const SCALE = 0.35;
const PREVIEW_WIDTH = 820;
const PREVIEW_HEIGHT = 1120;

export default function TemplateCard({ template, onSelect, isFeatured = false }) {
  return (
    <div
      className={`group relative rounded-[28px] border bg-[#edf4ff] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
        isFeatured ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'
      }`}
    >
      {template.ribbon ? (
        <div className={`absolute right-8 top-8 z-10 rotate-45 px-10 py-2 text-sm font-bold text-white shadow ${template.ribbonColor}`}>
          {template.ribbon}
        </div>
      ) : null}

      <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white">
        <div className="relative h-[392px] overflow-hidden">
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{
              width: `${PREVIEW_WIDTH}px`,
              height: `${PREVIEW_HEIGHT}px`,
              transform: `scale(${SCALE})`,
            }}
          >
            <ResumeTemplateRenderer template={template.id} data={sampleResumeData[template.id]} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelect(template.id)}
          className="absolute inset-x-6 bottom-6 rounded-xl bg-blue-500 px-4 py-4 text-2xl font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100"
        >
          Select
        </button>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-[2rem] font-medium tracking-tight text-slate-900">{template.name}</h3>
          <p className="mt-1 max-w-xs text-sm text-slate-600">{template.description}</p>
        </div>
      </div>
    </div>
  );
}
