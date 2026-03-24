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

  return (
    <div className="mx-auto min-h-[1120px] max-w-[820px] bg-white px-8 py-10 font-serif text-black">
      <header className="text-center">
        <h1 className="text-5xl leading-tight">{name || 'Your Name'}</h1>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[15px] text-[#0b48b8]">
          <span>{email || 'email@mysite.com'}</span>
          <span>{phone || '+00.00.000.000'}</span>
        </div>
      </header>

      {!skippedSections.summary ? (
        <>
          <SectionHeading>Summary</SectionHeading>
          <p className="mt-3 min-h-[52px] whitespace-pre-line text-[15px] leading-7">{summary || ''}</p>
        </>
      ) : null}

      {!skippedSections.workExperience ? (
        <>
          <SectionHeading>Work Experience</SectionHeading>
          <div className="mt-4 space-y-5 text-[15px] leading-7">
            {workExperience.length ? (
              workExperience.map((item, index) => (
                <article key={`${item.title}-${index}`}>
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                      {item.company ? <p className="italic">{item.company}</p> : null}
                    </div>
                    <div className="text-right">
                      <p>{item.date}</p>
                      {item.location ? <p>{item.location}</p> : null}
                    </div>
                  </div>
                  <p className="mt-1 whitespace-pre-line">{item.description}</p>
                </article>
              ))
            ) : (
              <div className="min-h-[72px]" />
            )}
          </div>
        </>
      ) : null}

      {!skippedSections.projects ? (
        <>
          <SectionHeading>Projects</SectionHeading>
          <div className="mt-4 space-y-5 text-[15px] leading-7">
            {projects.length ? (
              projects.map((project, index) => (
                <article key={`${project.title}-${index}`}>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-xl font-semibold">{project.title}</h3>
                    <span className="text-[#0b48b8]">Link to Demo</span>
                  </div>
                  <p className="mt-1 whitespace-pre-line">{project.description}</p>
                </article>
              ))
            ) : (
              <div className="min-h-[72px]" />
            )}
          </div>
        </>
      ) : null}

      {!skippedSections.education ? (
        <>
          <SectionHeading>Education</SectionHeading>
          <div className="mt-4 space-y-2 text-[15px] leading-7">
            {education.length ? (
              education.map((item, index) => (
                <div key={`${item.degree}-${index}`} className="grid grid-cols-[110px_1fr] gap-4">
                  <span>{item.year || 'YYYY'}</span>
                  <div>
                    <p className="font-semibold">{item.degree || 'Degree / Program'}</p>
                    <p>{item.institution || 'University / College'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-[110px_1fr] gap-4">
                <span>YYYY</span>
                <div>
                  <p className="font-semibold">Degree / Program</p>
                  <p>University / College</p>
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}

      {!skippedSections.skills ? (
        <>
          <SectionHeading>Skills</SectionHeading>
          <div className="mt-4 grid gap-3 text-[15px] leading-7 md:grid-cols-[140px_1fr]">
            <p className="font-semibold">Technical Skills</p>
            <p>{skills.join(', ')}</p>
          </div>
        </>
      ) : null}

      {!skippedSections.customSections
        ? customSections.map((section, index) => (
            <div key={`${section.name}-${index}`}>
              <SectionHeading>{section.name}</SectionHeading>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-7">{section.content}</p>
            </div>
          ))
        : null}
    </div>
  );
}
