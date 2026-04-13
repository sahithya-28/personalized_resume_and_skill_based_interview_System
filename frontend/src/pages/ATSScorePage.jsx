import { useState } from 'react';
import { Loader2, Sparkles, Upload } from 'lucide-react';
import { fetchATSScoreFromFile } from '../app/api/resumeApi';
import { buildResumeImproveDataFromAnalysis } from '../app/utils/resumeImproveData';

function normalizeSuggestionList(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function normalizeSuggestionsError(error) {
  if (!error) {
    return '';
  }
  if (typeof error === 'string') {
    return error.trim();
  }
  if (typeof error === 'object') {
    const title = String(error.error || '').trim();
    const details = String(error.details || '').trim();
    return [title, details].filter(Boolean).join(': ');
  }
  return '';
}

export default function ATSScorePage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [error, setError] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [atsScore, setAtsScore] = useState(null);
  const [summary, setSummary] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [resumeData, setResumeData] = useState(null);
  const [suggestionsError, setSuggestionsError] = useState('');

  async function handleGenerateScore() {
    if (!selectedFile) {
      setError('Please upload a PDF resume first.');
      return;
    }

    try {
      setLoading(true);
      setSuggestionsLoading(false);
      setError('');
      setAtsScore(null);
      setSummary('');
      setSuggestions([]);
      setResumeData(null);
      setSuggestionsError('');

      const result = await fetchATSScoreFromFile(selectedFile);
      const normalizedText = String(result?.resume_text || '').trim();
      if (!normalizedText) {
        throw new Error('Could not extract text from the uploaded resume.');
      }

      const mappedResume = buildResumeImproveDataFromAnalysis(result?.analysis || {});

      setExtractedText(normalizedText);
      setResumeData(mappedResume);
      setAtsScore(Number(result?.score ?? 0));
      setSummary(String(result?.summary || '').trim());
      setSuggestionsLoading(false);
      setSuggestions(normalizeSuggestionList(result?.suggestions));
      setSuggestionsError(normalizeSuggestionsError(result?.suggestions_error));
    } catch (err) {
      setError(err.message || 'Failed to generate ATS score.');
      setExtractedText('');
      setSummary('');
      setResumeData(null);
      setSuggestionsLoading(false);
      setSuggestionsError('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900">ATS Score</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Upload your PDF resume to get an ATS score and concise AI suggestions, then continue improving it in the editor.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Upload className="h-7 w-7" />
            </div>
            <p className="font-semibold text-slate-900">Upload Resume</p>
            <p className="mt-1 text-sm text-slate-500">Accepted format: PDF</p>
            <input
              type="file"
              accept=".pdf"
              className="mt-4 block w-full text-sm text-slate-700"
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] || null);
                setError('');
                setExtractedText('');
                setAtsScore(null);
                setSummary('');
                setSuggestions([]);
                setResumeData(null);
              }}
              disabled={loading}
            />
          </label>

          {selectedFile ? (
            <p className="mt-4 text-sm text-slate-600">
              Selected file: <span className="font-semibold">{selectedFile.name}</span>
            </p>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <button
            type="button"
            onClick={handleGenerateScore}
            disabled={loading}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? 'Analyzing Resume...' : 'Generate ATS Score'}
          </button>
        </div>

        {atsScore !== null ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="rounded-2xl bg-slate-50 p-6">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">ATS Score</p>
              <div className="mt-3 text-5xl font-bold text-slate-900">{atsScore}%</div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-2xl font-semibold text-slate-900">Summary</h2>
              <p className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                {summary || 'A concise resume summary is unavailable for this upload.'}
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Suggestions
              </h2>

              {suggestionsLoading ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating AI suggestions...
                </div>
              ) : suggestions.length ? (
                <ul className="mt-4 space-y-3">
                  {suggestions.map((item, index) => (
                    <li key={`${item}-${index}`} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : suggestionsError ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {suggestionsError}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-600">AI suggestions are unavailable right now, but your ATS score is ready.</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
