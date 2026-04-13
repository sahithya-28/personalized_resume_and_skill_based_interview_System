import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeResume } from '../app/api/resumeApi';

export default function ResumeUploadPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  async function handleContinue() {
    if (!selectedFile) {
      setError('Please choose a PDF file first.');
      return;
    }

    try {
      setIsExtracting(true);
      setError('');
      
      const result = await analyzeResume(selectedFile);

      const normalized = result?.normalized_resume || {};
      const fallbackName = selectedFile.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
      const parsedResume = {
        ...result,
        normalized_resume: {
          ...normalized,
          name: normalized.name || fallbackName,
        },
      };

      sessionStorage.setItem('uploadedResumeDraft', JSON.stringify(parsedResume));
      navigate('/resume/templates?mode=upload');
    } catch (err) {
      setError(err.message || 'Failed to extract resume. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Upload Existing Resume</h1>
        <p className="mt-3 text-slate-600">
          Upload your resume and we will extract the text, map the detected sections, and pre-fill the selected template with your editable data.
        </p>

        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <label className="mb-3 block text-sm font-medium text-slate-700">Upload PDF / DOCX</label>
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              setSelectedFile(file);
              setError('');
            }}
            className="block w-full text-sm text-slate-700"
            disabled={isExtracting}
          />
          {selectedFile ? (
            <p className="mt-4 text-sm text-slate-600">Selected file: <span className="font-semibold">{selectedFile.name}</span></p>
          ) : null}
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleContinue}
            disabled={isExtracting}
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60 flex items-center gap-2"
          >
            {isExtracting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Extracting...
              </>
            ) : (
              'Extract and Continue'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/resume')}
            disabled={isExtracting}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
