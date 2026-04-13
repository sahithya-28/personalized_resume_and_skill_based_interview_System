import { hasMeaningfulArray, hasMeaningfulText, toBullets } from './renderUtils';

function SectionTitle({ children }) {
  return (
    <div className="mt-5">
      <h2 className="border-b border-[#335b96] pb-1 text-lg font-bold uppercase tracking-wide text-[#244a82]">
        {children}
      </h2>
    </div>
  );
}

export default function ClassicTemplate({ data }) {
  const {
    name,
    email,
    phone,
    summary,
    skills = [],
    workExperience = [],
    education = [],
    links = [],
    customSections = [],
    skippedSections = {},
  } = data;

  const visibleSummary = !skippedSections.summary && hasMeaningfulText(summary);
  const visibleSkills = !skippedSections.skills && hasMeaningfulArray(skills);
  const visibleExperience = !skippedSections.workExperience && hasMeaningfulArray(workExperience);
  const visibleEducation = !skippedSections.education && hasMeaningfulArray(education);
  const visibleLinks = !skippedSections.links && hasMeaningfulArray(links);
  const visibleCustomSections = !skippedSections.customSections
    ? (customSections || []).filter((section) => hasMeaningfulText(section?.name) && hasMeaningfulText(section?.content))
    : [];

  return (
    <div className="mx-auto min-h-[1120px] max-w-[820px] bg-white px-8 py-10 text-black">
      <header className="text-center">
        <h1 className="text-[3rem] font-bold leading-none">{name || 'Your Name'}</h1>
        <p className="mt-1 text-[1.6rem] text-[#244a82]">Data Specialist / Junior Developer</p>
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm text-[#244a82]">
          <div className="text-left">
            <p>{phone || '(xxx) xxx-xxxx'}</p>
            <p>somewhere, state</p>
            <p>{email || 'yourname@gmail.com'}</p>
          </div>
          <div className="text-right">
            {(links.length
              ? links
              : [
                  { label: 'Portfolio', value: 'portfolio.dev' },
                  { label: 'GitHub', value: 'github.com/username' },
                  { label: 'LinkedIn', value: 'linkedin.com/in/username' },
                ]
            ).map((link, index) => (
              <p key={`${link.label}-${index}`}>
                {link.label}: {link.value}
              </p>
            ))}
          </div>
        </div>
      </header>

      {visibleSummary ? (
        <>
          <p className="mt-5 text-[15px] leading-7">{summary}</p>
        </>
      ) : null}

      {visibleSkills ? (
        <>
          <SectionTitle>Skills</SectionTitle>
          <div className="mt-2 grid gap-x-6 gap-y-2 text-[15px] leading-7 md:grid-cols-[180px_1fr]">
            <p className="font-bold">Tools and Languages</p>
            <p>{skills.join(', ')}</p>
          </div>
        </>
      ) : null}

      {visibleExperience ? (
        <>
          <SectionTitle>Technical Experience</SectionTitle>
          <div className="mt-3 space-y-5 text-[15px] leading-7">
            {workExperience.map((item, index) => (
              <article key={`${item.title}-${index}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold uppercase">{item.title || 'Role / Project'}</p>
                    {hasMeaningfulText(item.company) ? <p className="italic text-sm">{item.company}</p> : null}
                  </div>
                  <div className="text-right text-sm font-semibold">
                    {hasMeaningfulText(item.date) ? <p>{item.date}</p> : null}
                    {hasMeaningfulText(item.location) ? <p className="italic font-normal">{item.location}</p> : null}
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

      {visibleEducation ? (
        <>
          <SectionTitle>Education</SectionTitle>
          <div className="mt-2 space-y-2 text-[15px]">
            {education.map((item, index) => (
              <div key={`${item.degree}-${index}`} className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold">{item.degree}</p>
                  {hasMeaningfulText(item.institution) ? <p className="italic">{item.institution}</p> : null}
                </div>
                {hasMeaningfulText(item.year) ? <p className="font-semibold">{item.year}</p> : null}
              </div>
            ))}
          </div>
        </>
      ) : null}

      {visibleLinks ? (
        <>
          <SectionTitle>Links</SectionTitle>
          <div className="mt-2 space-y-1 text-[15px]">
            {links.map((link, index) => (
              <p key={`${link.label}-${index}`}>{link.label}: {link.value}</p>
            ))}
          </div>
        </>
      ) : null}

      {visibleCustomSections.length
        ? visibleCustomSections.map((section, index) => (
            <div key={`${section.name}-${index}`}>
              <SectionTitle>{section.name}</SectionTitle>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] leading-7">
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
