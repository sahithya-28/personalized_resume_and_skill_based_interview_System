import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2 } from 'lucide-react';
import { analyzeResume } from '../api/resumeApi';

export default function ResumeUploadPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingAnalysis, setPendingAnalysis] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();

  const buildExtractedPreview = (analysis) => {
    const sections = analysis?.sections || {};
    const sectionOrder = ['education', 'skills', 'projects', 'experience'];
    const lines = [];

    sectionOrder.forEach((name) => {
      const content = String(sections[name] || '').trim();
      if (!content) return;
      lines.push(`${name.toUpperCase()}:`);
      lines.push(content);
      lines.push('');
    });

    if (!lines.length) {
      return 'No extracted text found. Please re-upload a clearer resume.';
    }

    return lines.join('\n').trim();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a PDF or DOCX file.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await analyzeResume(file);
      const prepared = {
        ...result,
        fileName: file.name,
        analyzedAt: new Date().toISOString(),
      };
      setPendingAnalysis(prepared);
      setShowConfirmation(true);
    } catch (err) {
      setError(err.message || 'Failed to analyze resume.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (!pendingAnalysis) return;
    sessionStorage.setItem('resumeAnalysis', JSON.stringify(pendingAnalysis));
    sessionStorage.removeItem('interviewSession');
    navigate('/skill-verification');
  };

  const handleReupload = () => {
    setPendingAnalysis(null);
    setShowConfirmation(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">Upload Your Resume</h1>
        <p className="text-gray-600 text-center mb-10">Step 1: Upload resume to start user analysis.</p>

        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-2xl shadow-xl space-y-6">
          <label className="block border-2 border-dashed border-indigo-300 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition-colors">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="font-semibold text-gray-900">Click to choose resume file</p>
            <p className="text-sm text-gray-500 mt-1">Accepted formats: PDF, DOCX</p>
            <input
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          {file && (
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Selected file: <span className="font-semibold">{file.name}</span>
            </div>
          )}

          {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 font-semibold flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {loading ? 'Analyzing...' : 'Upload and Extract'}
          </button>
        </form>

        {showConfirmation && pendingAnalysis ? (
          <div className="mt-8 bg-white p-8 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Confirm Extracted Text</h2>
            <p className="text-gray-600 mb-4">
              Please verify this extracted content. Continue only if it looks correct.
            </p>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 max-h-96 overflow-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                {buildExtractedPreview(pendingAnalysis)}
              </pre>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleProceed}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold"
              >
                Extracted Text Is Correct, Proceed
              </button>
              <button
                type="button"
                onClick={handleReupload}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold"
              >
                Re-upload Resume
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
