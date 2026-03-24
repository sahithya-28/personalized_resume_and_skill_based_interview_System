import { fetchATSScore } from '../api/resumeApi';

export async function calculateATSScore(resumeText) {
  const normalizedText = String(resumeText || '').trim();

  if (!normalizedText) {
    throw new Error('Resume text is required to calculate ATS score.');
  }

  return fetchATSScore(normalizedText);
}
