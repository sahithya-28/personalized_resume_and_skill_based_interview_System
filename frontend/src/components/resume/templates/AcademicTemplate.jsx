import { hasMeaningfulArray, hasMeaningfulText, toBullets } from './renderUtils';

function SectionHeading({ children }) {
  return (
    <div className="mt-6">
      <h2 className="font-serif text-[1.75rem] uppercase leading-none text-black">{children}</h2>
      <div className="mt-1 h-px bg-black/70" />
    </div>
  );
}

export default function AcademicTemplate({ data }) {
  const {
    name,
    email,
    phone,
    summary,
    workExperience = [],
    projects = [],
    education = [],
    skills = [],
    customSections = [],
    skippedSections = {},
  } = data;

  const visibleSummary = !skippedSections.summary && hasMeaningfulText(summary);
  const visibleExperience = !skippedSections.workExperience && hasMeaningfulArray(workExperience);
  const visibleProjects = !skippedSections.projects && hasMeaningfulArray(projects);
  const visibleEducation = !skippedSections.education && hasMeaningfulArray(education);
  const visibleSkills = !skippedSections.skills && hasMeaningfulArray(skills);
  const visibleCustomSections = !skippedSections.customSections
    ? (customSections || []).filter((section) => hasMeaningfulText(section?.name) && hasMeaningfulText(section?.content))
    : [];

  return (
    <div className="mx-auto min-h-[1120px] max-w-[820px] bg-white px-8 py-10 font-serif text-black">
      <header className="text-center">
        <h1 className="text-5xl leading-tight">{name || 'Your Name'}</h1>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[15px] text-[#0b48b8]">
          <span>{email || 'email@mysite.com'}</span>
          <span>{phone || '+00.00.000.000'}</span>
        </div>
      </header>

      {visibleSummary ? (
        <>
          <SectionHeading>Summary</SectionHeading>
          <p className="mt-3 whitespace-pre-line text-[15px] leading-7">{summary}</p>
        </>
      ) : null}

      {visibleExperience ? (
        <>
          <SectionHeading>Work Experience</SectionHeading>
          <div className="mt-4 space-y-5 text-[15px] leading-7">
            {workExperience.map((item, index) => (
                <article key={`${item.title}-${index}`}>
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">{item.title || item.role}</h3>
                      {hasMeaningfulText(item.company) ? <p className="italic">{item.company}</p> : null}
                    </div>
                    <div className="text-right">
                      {hasMeaningfulText(item.date) ? <p>{item.date}</p> : null}
                      {hasMeaningfulText(item.location) ? <p>{item.location}</p> : null}
                    </div>
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {toBullets(item.description).map((bullet, bulletIndex) => (
                      <li key={`${item.title}-${bulletIndex}`}>{bullet}</li>
                    ))}
                  </ul>
                </article>
              ))}
          </div>
        </>
      ) : null}

      {visibleProjects ? (
        <>
          <SectionHeading>Projects</SectionHeading>
          <div className="mt-4 space-y-5 text-[15px] leading-7">
            {projects.map((project, index) => (
                <article key={`${project.title}-${index}`}>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-xl font-semibold">{project.title}</h3>
                    {hasMeaningfulArray(project.tech_stack) ? <span className="text-[#0b48b8]">{project.tech_stack.join(', ')}</span> : null}
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {toBullets(project.description).map((bullet, bulletIndex) => (
                      <li key={`${project.title}-${bulletIndex}`}>{bullet}</li>
                    ))}
                  </ul>
                </article>
              ))}
          </div>
        </>
      ) : null}

      {visibleEducation ? (
        <>
          <SectionHeading>Education</SectionHeading>
          <div className="mt-4 space-y-2 text-[15px] leading-7">
            {education.map((item, index) => (
                <div key={`${item.degree}-${index}`} className="grid grid-cols-[110px_1fr] gap-4">
                  <span>{item.year}</span>
                  <div>
                    <p className="font-semibold">{item.degree}</p>
                    {hasMeaningfulText(item.institution) ? <p>{item.institution}</p> : null}
                    {hasMeaningfulText(item.description) ? <p>{item.description}</p> : null}
                  </div>
              </div>
              ))}
          </div>
        </>
      ) : null}

      {visibleSkills ? (
        <>
          <SectionHeading>Skills</SectionHeading>
          <div className="mt-4 grid gap-3 text-[15px] leading-7 md:grid-cols-[140px_1fr]">
            <p className="font-semibold">Technical Skills</p>
            <p>{skills.join(', ')}</p>
          </div>
        </>
      ) : null}

      {visibleCustomSections.length
        ? visibleCustomSections.map((section, index) => (
            <div key={`${section.name}-${index}`}>
              <SectionHeading>{section.name}</SectionHeading>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-[15px] leading-7">
                {toBullets(section.content, 6).map((bullet, bulletIndex) => (
                  <li key={`${section.name}-${bulletIndex}`}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))
        : null}
    </div>
  );
}
