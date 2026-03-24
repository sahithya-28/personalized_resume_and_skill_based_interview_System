export const initialResumeData = {
  name: '',
  email: '',
  phone: '',
  skills: [],
  projects: [],
  customSections: [],
  educationEntries: [],
  education: {
    degree: '',
    institution: '',
    year: '',
  },
};

export const templateCatalog = [
  {
    id: 'modern',
    name: 'Academic',
    description: 'Centered serif layout with section rules, based on your first provided template.',
    ribbon: 'Most Selected',
    ribbonColor: 'bg-emerald-400',
    accent: 'blue',
  },
  {
    id: 'classic',
    name: 'Research',
    description: 'Structured technical layout styled after your second provided template.',
    ribbon: 'Recommended',
    ribbonColor: 'bg-amber-400',
    accent: 'amber',
  },
  {
    id: 'minimal',
    name: 'Executive',
    description: 'Dark-header two-column format based on your third provided template.',
    ribbon: 'New',
    ribbonColor: 'bg-sky-500',
    accent: 'slate',
  },
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'Blue heading academic-professional layout based on the Noodle Brain style you shared.',
    ribbon: '',
    ribbonColor: 'bg-slate-500',
    accent: 'blue',
  },
  {
    id: 'profile',
    name: 'Profile',
    description: 'Sidebar profile resume with skill bars and bold content sections.',
    ribbon: '',
    ribbonColor: 'bg-slate-500',
    accent: 'red',
  },
];

export function createMockParsedResume(fileName = 'resume.pdf') {
  const normalizedName = fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();

  return {
    name: normalizedName ? normalizedName.replace(/\b\w/g, (char) => char.toUpperCase()) : 'Uploaded Candidate',
    email: 'candidate@example.com',
    phone: '+91 98765 43210',
    skills: ['Python', 'React', 'SQL'],
    projects: [
      {
        title: 'Portfolio Website',
        description: 'Built a responsive personal website to showcase projects and skills.',
      },
      {
        title: 'Task Tracker App',
        description: 'Created a task management app with CRUD functionality and clean UI.',
      },
    ],
    education: {
      degree: 'B.Tech in Computer Science',
      institution: 'Sample Institute of Technology',
      year: '2025',
    },
    educationEntries: [],
  };
}
