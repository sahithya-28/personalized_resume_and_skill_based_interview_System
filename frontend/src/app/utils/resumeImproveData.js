export const initialImproveResumeData = {
  name: '',
  email: '',
  sections: [],
};

function normalizeString(value) {
  return String(value || '').trim();
}

function fallbackSectionsFromFlatData(analysis = {}) {
  const flatSections = analysis?.sections || {};
  const orderedKeys = ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'achievements'];

  return orderedKeys
    .map((key) => {
      const raw = normalizeString(flatSections[key]);
      if (!raw) return null;
      return {
        key,
        title: key.charAt(0).toUpperCase() + key.slice(1),
        content: raw.split('\n').map((line) => line.trim()).filter(Boolean),
      };
    })
    .filter(Boolean);
}

export function buildResumeImproveDataFromAnalysis(analysis = {}) {
  const parsed = analysis?.parsed_data || {};
  const structuredSections = Array.isArray(analysis?.structured_sections)
    ? analysis.structured_sections
    : Array.isArray(parsed?.structured_sections)
      ? parsed.structured_sections
      : [];

  const normalizedSections = (structuredSections.length ? structuredSections : fallbackSectionsFromFlatData(analysis))
    .map((section, index) => ({
      id: `${normalizeString(section?.key || section?.title || 'section').toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'section'}-${index}`,
      key: normalizeString(section?.key).toLowerCase(),
      title: normalizeString(section?.title) || `Section ${index + 1}`,
      content: Array.isArray(section?.content)
        ? section.content.map((item) => normalizeString(item)).filter(Boolean)
        : normalizeString(section?.content)
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
    }))
    .filter((section) => section.title);

  return {
    ...initialImproveResumeData,
    name: normalizeString(parsed?.name),
    email: normalizeString(parsed?.email),
    sections: normalizedSections,
  };
}

export function getWeakSectionIds(resumeData) {
  return (resumeData?.sections || [])
    .filter((section) => !Array.isArray(section.content) || !section.content.some((item) => normalizeString(item)))
    .map((section) => section.id);
}

export function findSuggestionMatchesForSection(sectionTitle, suggestions = []) {
  const normalizedTitle = normalizeString(sectionTitle).toLowerCase();
  if (!normalizedTitle) return [];

  const titleTokens = normalizedTitle.split(/\s+/).filter(Boolean);
  return suggestions.filter((suggestion) => {
    const lower = normalizeString(suggestion).toLowerCase();
    return titleTokens.some((token) => token.length > 3 && lower.includes(token));
  });
}
