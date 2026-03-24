export const initialResumeData = {
  name: '',
  email: '',
  phone: '',
  summary: '',
  about: '',
  skills: [],
  projects: [],
  workExperience: [],
  education: [],
  coursework: [],
  links: [],
  customSections: [],
};

const arraySections = ['skills', 'projects', 'workExperience', 'education', 'coursework', 'links', 'customSections'];

export const initialSkippedSections = {
  summary: false,
  about: false,
  skills: false,
  projects: false,
  workExperience: false,
  education: false,
  coursework: false,
  links: false,
  customSections: false,
};

export const templateConfig = {
  academic: {
    id: 'academic',
    name: 'Academic',
    description: 'Centered serif resume with summary, work experience, projects, education, and skills.',
    sections: ['summary', 'workExperience', 'projects', 'education', 'skills'],
    requiredSections: ['summary', 'workExperience', 'projects', 'education', 'skills'],
    accent: 'blue',
    ribbon: 'Most Selected',
    ribbonColor: 'bg-emerald-400',
  },
  executive: {
    id: 'executive',
    name: 'Executive',
    description: 'Dark-header executive resume with about, experience, education, links, and skills.',
    sections: ['about', 'workExperience', 'education', 'links', 'skills'],
    requiredSections: ['about', 'workExperience', 'education', 'links', 'skills'],
    accent: 'slate',
    ribbon: 'Recommended',
    ribbonColor: 'bg-sky-500',
  },
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Structured technical resume with summary, skills, experience, education, and links.',
    sections: ['summary', 'skills', 'workExperience', 'education', 'links'],
    requiredSections: ['summary', 'skills', 'workExperience', 'education'],
    accent: 'blue',
    ribbon: 'New',
    ribbonColor: 'bg-amber-400',
  },
};

export const templateList = Object.values(templateConfig);

export const sampleResumeData = {
  academic: {
    name: 'Your Name',
    email: 'email@mysite.com',
    phone: '+00.00.000.000',
    summary:
      'This CV can also be automatically compiled and published using GitHub Actions. For details, click here.',
    skills: ['Some Skills', 'Some More Skills'],
    workExperience: [
      {
        title: 'Designation',
        company: '',
        date: 'Jan 2021 - present',
        location: '',
        description:
          'long long line of blah blah that will wrap when the table fills the column width long long line of blah blah.',
      },
      {
        title: 'Designation',
        company: '',
        date: 'Mar 2019 - Jan 2021',
        location: '',
        description:
          'again, long long line of blah blah that will wrap when the table fills the column width but this time even more long line of blah blah.',
      },
    ],
    projects: [
      {
        title: 'Some Project',
        description:
          'long long line of blah blah that will wrap when the table fills the column width long long line of blah blah.',
      },
    ],
    education: [
      { degree: 'PhD (Subject) at University', institution: '', year: '2030 - present' },
      { degree: "Bachelor's Degree at College", institution: '', year: '2023 - 2027' },
      { degree: 'Class 12th Some Board', institution: '', year: '2022' },
    ],
    coursework: [],
    links: [],
    about: '',
    customSections: [
      {
        name: 'Skills',
        content: 'Some Skills\nThis, That, Some of this and that etc.',
      },
    ],
  },
  executive: {
    name: 'First-Name LastName',
    email: 'email',
    phone: 'phone',
    summary: '',
    about: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.',
    skills: ['Python', 'Ansible', 'Linux', 'Open Source Tools', 'Django', 'Html/CSS'],
    workExperience: [
      {
        title: 'Name - Title',
        company: '',
        date: 'Date',
        location: '',
        description: 'Dictum varius duis at consectetur lorem donec massa sapien faucibus.',
      },
      {
        title: 'Name - Title',
        company: '',
        date: 'Date',
        location: '',
        description: 'Aliquet nec ullamcorper sit amet risus. Ultrices neque ornare aenean euismod.',
      },
    ],
    projects: [],
    education: [
      { degree: 'M.Sc. in -', institution: 'University of -', year: 'Date - Date' },
      { degree: 'B.Sc. in -', institution: 'University of -', year: 'Date - Date' },
    ],
    coursework: [],
    links: [
      { label: 'github', value: 'github' },
      { label: 'linkedin', value: 'linkedin' },
      { label: 'website', value: 'website' },
    ],
    customSections: [],
  },
  classic: {
    name: 'Your Name',
    email: 'yourname@gmail.com',
    phone: '(xxx) xxx-xxxx',
    summary:
      'Hello, here is some text without a meaning. This text should show what a printed text will look like in this place.',
    about: '',
    skills: ['Python', 'Git', 'Markdown', 'PHP', 'R', 'MySQL'],
    workExperience: [
      {
        title: 'Role / Project A',
        company: 'company A',
        date: 'MMM YYYY - Present',
        location: 'somewhere, state',
        description:
          'Built and maintained technical solutions with clear ownership, strong delivery, and practical implementation details.',
      },
      {
        title: 'Role / Project B',
        company: 'company B',
        date: 'MMM YYYY - MMM YYYY',
        location: 'somewhere, state',
        description:
          'Contributed to project delivery, collaboration, and technical execution across a multi-step workflow.',
      },
    ],
    projects: [
      {
        title: 'Project Highlight',
        description: 'Highlighted relevant technical work, workflow design, and implementation choices.',
      },
    ],
    education: [
      { degree: 'Master of Arts in Mathematics', institution: 'Texas Institute of Technology & Science', year: 'MMM 2021' },
      { degree: 'Bachelor of Arts in Mathematics', institution: 'Somewhere Technical Institute', year: 'MMM YYYY' },
    ],
    coursework: [],
    links: [
      { label: 'Portfolio', value: 'MathToData.com' },
      { label: 'GitHub', value: 'github.com/TimmyChan' },
      { label: 'LinkedIn', value: 'linkedin.com/in/timmy-l-chan' },
    ],
    customSections: [],
  },
};

export function createMockParsedResume(fileName = 'resume.pdf') {
  const normalizedName = fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();

  return {
    ...initialResumeData,
    name: normalizedName ? normalizedName.replace(/\b\w/g, (char) => char.toUpperCase()) : 'Uploaded Candidate',
    email: 'candidate@example.com',
    phone: '+91 98765 43210',
    summary: 'Entry-level developer focused on backend engineering and practical project work.',
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
    education: [
      {
        degree: 'B.Tech in Computer Science',
        institution: 'Sample Institute of Technology',
        year: '2025',
      },
    ],
    workExperience: [],
    coursework: [],
    links: [],
    customSections: [],
    rawText:
      'Sahithya\nexample@gmail.com\n+91 98765 43210\nBackend-focused developer with Java and Spring Boot experience. Built a portfolio website and task tracker app. Completed B.Tech in Computer Science. AWS Certified Developer. Internship at Sample Tech as Backend Intern.',
    sourceSections: ['summary', 'skills', 'projects', 'education', 'certifications', 'internships'],
    suggestedCustomSections: [
      {
        name: 'Certifications',
        content: 'AWS Certified Developer',
      },
      {
        name: 'Internships',
        content: 'Backend Intern at Sample Tech\nWorked on APIs, debugging, and test support.',
      },
    ],
  };
}

export function mapExtractedResumeData(extractedData = {}) {
  return {
    ...initialResumeData,
    ...extractedData,
    summary: extractedData.summary || extractedData.about || '',
    about: extractedData.about || extractedData.summary || '',
    skills: extractedData.skills || extractedData.techStack || [],
    projects: extractedData.projects || [],
    workExperience: extractedData.workExperience || extractedData.experience || extractedData.workHistory || [],
    education: extractedData.education || [],
    coursework: extractedData.coursework || [],
    links: extractedData.links || [],
    customSections: extractedData.customSections || [],
    rawText: extractedData.rawText || '',
    sourceSections: extractedData.sourceSections || [],
    suggestedCustomSections: extractedData.suggestedCustomSections || [],
  };
}

export function hasSectionContent(resumeData, section) {
  if (section === 'summary') return Boolean((resumeData.summary || '').trim());
  if (section === 'about') return Boolean((resumeData.about || resumeData.summary || '').trim());
  if (arraySections.includes(section)) return Array.isArray(resumeData[section]) && resumeData[section].length > 0;
  return false;
}

export function getUploadGuidance(template, resumeData, skippedSections = {}) {
  const mappedSections = (template.sections || []).filter((section) => hasSectionContent(resumeData, section));
  const missingTemplateSections = (template.sections || []).filter(
    (section) => !skippedSections[section] && !hasSectionContent(resumeData, section)
  );

  const suggestedCustomSections = (resumeData.suggestedCustomSections || []).filter((section) => {
    const trimmedName = (section.name || '').trim().toLowerCase();
    return trimmedName && !(resumeData.customSections || []).some((customSection) => customSection.name.trim().toLowerCase() === trimmedName);
  });

  return {
    mappedSections,
    missingTemplateSections,
    suggestedCustomSections,
  };
}

export function getMissingFields(template, resumeData, skippedSections = {}) {
  const requiredSections = template.requiredSections || template.sections || [];

  return requiredSections.filter((section) => {
    if (skippedSections[section]) return false;
    if (section === 'summary') return !resumeData.summary.trim();
    if (section === 'about') return !(resumeData.about || resumeData.summary).trim();
    if (section === 'skills') return !resumeData.skills.length;
    if (section === 'projects') return !resumeData.projects.length;
    if (section === 'workExperience') return !resumeData.workExperience.length;
    if (section === 'education') return !resumeData.education.length;
    if (section === 'coursework') return !resumeData.coursework.length;
    if (section === 'links') return !resumeData.links.length;
    return false;
  });
}

export function getSectionDisplayName(section) {
  const labels = {
    summary: 'Summary',
    about: 'About',
    skills: 'Skills',
    projects: 'Projects',
    workExperience: 'Work Experience',
    education: 'Education',
    coursework: 'Coursework',
    links: 'Links',
  };

  return labels[section] || section;
}

export function autoMapUnsupportedSections(template, resumeData) {
  const templateSections = template.sections || [];
  const newData = { ...resumeData };
  const customSectionsToAdd = [];

  const allSections = [
    { key: 'skills', label: 'Skills' },
    { key: 'projects', label: 'Projects' },
    { key: 'workExperience', label: 'Work Experience' },
    { key: 'education', label: 'Education' },
    { key: 'coursework', label: 'Coursework' },
    { key: 'links', label: 'Links' },
  ];

  allSections.forEach(({ key, label }) => {
    if (!templateSections.includes(key) && hasSectionContent(newData, key)) {
      let content = '';
      if (typeof newData[key] === 'string') {
        content = newData[key];
      } else if (Array.isArray(newData[key])) {
        content = newData[key].map(item => {
          return Object.values(item).filter(v => typeof v === 'string' && v.trim()).join('\n');
        }).join('\n\n');
      }
      
      if (content.trim()) {
        customSectionsToAdd.push({ name: label, content: content.trim() });
      }
    }
  });

  if (!templateSections.includes('summary') && !templateSections.includes('about')) {
      if (hasSectionContent(newData, 'summary')) {
          customSectionsToAdd.push({ name: 'Summary', content: newData['summary'] });
      } else if (hasSectionContent(newData, 'about')) {
          customSectionsToAdd.push({ name: 'About', content: newData['about'] });
      }
  }

  const suggested = (newData.suggestedCustomSections || []).filter((section) => {
    const trimmedName = (section.name || '').trim().toLowerCase();
    return trimmedName && !(newData.customSections || []).some((customSection) => customSection.name.trim().toLowerCase() === trimmedName)
      && !customSectionsToAdd.some(c => c.name.toLowerCase() === trimmedName);
  });

  suggested.forEach(s => customSectionsToAdd.push({ name: s.name, content: s.content }));

  if (customSectionsToAdd.length > 0) {
    newData.customSections = [...(newData.customSections || []), ...customSectionsToAdd];
  }

  newData.suggestedCustomSections = [];
  return newData;
}
