import { useNavigate, useSearchParams } from 'react-router-dom';
import TemplateCard from '../components/resume/TemplateCard';
import { templateList } from '../utils/resumeTemplates';

const colorOptions = [
  'bg-zinc-800',
  'bg-slate-700',
  'bg-violet-700',
  'bg-indigo-700',
  'bg-lime-600',
  'bg-red-600',
];

export default function TemplateSelectionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'create';

  function handleSelect(templateId) {
    navigate(`/resume-builder?template=${templateId}&mode=${mode}`);
  }

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex justify-center">
          <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {colorOptions.map((color, index) => (
              <div key={color} className="border-r border-slate-200 last:border-r-0">
                <button
                  type="button"
                  className={`flex h-12 w-12 items-center justify-center ${index === 0 ? 'bg-slate-50' : 'bg-white'}`}
                >
                  <span className={`h-8 w-8 rounded-full ${color} ${index === 0 ? 'ring-4 ring-white' : ''}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Choose Your Template</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Each card is a scaled preview of the actual resume layout. Pick a template and the builder will adapt its form to that structure.
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-3">
          {templateList.map((template, index) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={handleSelect}
              isFeatured={index === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
