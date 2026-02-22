export const resumeScoreData = {
  overall: 78,
  sections: {
    skills: 80,
    projects: 70,
    internships: 85,
    companyFit: 'Medium',
  },
};

export const vulnerabilitiesData = [
  { title: 'Education Gap', type: 'gap', explanation: 'Interviewers may question consistency.' },
  { title: 'Few Projects', type: 'skills-mismatch', explanation: 'Depth-testing questions expected.' },
  { title: 'Domain Switch', type: 'domain', explanation: 'Why this transition?' },
];

export const skillQuestionsData = [
  {
    skill: 'React',
    questions: [
      { level: 'Beginner', question: 'What is JSX?' },
      { level: 'Depth', question: 'Explain React lifecycle methods.' },
      { level: 'Scenario', question: 'How to optimize React app performance?' },
      { level: 'Trap', question: 'Why using index as key is bad?' },
    ],
  },
  {
    skill: 'Python',
    questions: [
      { level: 'Beginner', question: 'What is a list comprehension?' },
      { level: 'Depth', question: 'Explain decorators.' },
      { level: 'Scenario', question: 'Handle large data efficiently.' },
      { level: 'Trap', question: 'Mutable default arguments issues?' },
    ],
  },
];
