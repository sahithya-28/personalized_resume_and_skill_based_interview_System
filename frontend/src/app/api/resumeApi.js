export const API_BASE_URL = 'http://localhost:8000';

async function parseError(response) {
  let detail = `Request failed with status ${response.status}`;
  try {
    const data = await response.json();
    if (data?.detail) {
      detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    }
  } catch {
    // keep default error detail
  }
  throw new Error(detail);
}

export async function analyzeResume(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/analyze-resume`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    await parseError(response);
  }

  return response.json();
}

export async function generateResume(payload) {
  const response = await fetch(`${API_BASE_URL}/generate-resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await parseError(response);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] || 'generated_resume.pdf';

  return { blob, filename };
}

export async function getResumeTemplates() {
  const response = await fetch(`${API_BASE_URL}/resume-templates`);

  if (!response.ok) {
    await parseError(response);
  }

  return response.json();
}

export async function getMatchedSkills(skills) {
  const response = await fetch(`${API_BASE_URL}/skill-verification/matched-skills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ skills }),
  });

  if (!response.ok) {
    await parseError(response);
  }

  return response.json();
}

export async function getSkillQuestions(skill) {
  const response = await fetch(`${API_BASE_URL}/skill-verification/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ skill }),
  });

  if (!response.ok) {
    await parseError(response);
  }

  return response.json();
}

export async function scoreSkillAnswer({ skill, questionId, answer }) {
  const response = await fetch(`${API_BASE_URL}/skill-verification/score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ skill, question_id: questionId, answer }),
  });

  if (!response.ok) {
    await parseError(response);
  }

  return response.json();
}
