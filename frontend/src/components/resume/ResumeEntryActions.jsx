import { useNavigate } from 'react-router-dom';

function ActionCard({ title, description, buttonLabel, onClick }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <button
        type="button"
        onClick={onClick}
        className="mt-6 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

export default function ResumeEntryActions() {
  const navigate = useNavigate();

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <ActionCard
        title="Create New Resume"
        description="Start with a template, fill in your information, and watch the resume update live as you type."
        buttonLabel="Create Resume"
        onClick={() => navigate('/resume/templates?mode=create')}
      />
      <ActionCard
        title="Upload Existing Resume"
        description="Upload a PDF, simulate parsing on the frontend, and continue editing the extracted information."
        buttonLabel="Upload Resume"
        onClick={() => navigate('/resume/upload')}
      />
      <ActionCard
        title="ATS Score"
        description="Upload your resume, extract the text, and get an ATS score with focused AI improvement suggestions."
        buttonLabel="Check ATS Score"
        onClick={() => navigate('/ats-score')}
      />
    </div>
  );
}
