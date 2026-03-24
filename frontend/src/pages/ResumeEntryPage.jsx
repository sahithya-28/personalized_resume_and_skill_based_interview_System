import ResumeEntryActions from '../components/resume/ResumeEntryActions';

export default function ResumeEntryPage() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900">Resume Builder</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Start a new resume, upload an existing one for editing, or check its ATS score with AI suggestions.
          </p>
        </div>
        <ResumeEntryActions />
      </div>
    </div>
  );
}
