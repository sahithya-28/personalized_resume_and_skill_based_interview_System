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

      {!skippedSections.summary ? (
        <>
          <p className="mt-5 min-h-[56px] text-[15px] leading-7">
            {summary ||
              'Write a short summary that explains your strengths, technical focus, and the type of work you enjoy.'}
          </p>
        </>
      ) : null}

      {!skippedSections.skills ? (
        <>
          <SectionTitle>Skills</SectionTitle>
          <div className="mt-2 grid gap-x-6 gap-y-2 text-[15px] leading-7 md:grid-cols-[180px_1fr]">
            <p className="font-bold">Tools and Languages</p>
            <p>{skills.length ? skills.join(', ') : 'Add your technical skills here.'}</p>
          </div>
        </>
      ) : null}

      {!skippedSections.workExperience ? (
        <>
          <SectionTitle>Technical Experience</SectionTitle>
          <div className="mt-3 space-y-5 text-[15px] leading-7">
            {(workExperience.length
              ? workExperience
              : [
                  {
                    title: 'Role / Project A',
                    company: 'company A',
                    date: 'MMM YYYY - Present',
                    location: 'somewhere, state',
                    description: 'Describe your experience, responsibilities, and technical work here.',
                  },
                ]
            ).map((item, index) => (
              <article key={`${item.title}-${index}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold uppercase">{item.title || 'Role / Project'}</p>
                    <p className="italic text-sm">{item.company || 'company / context'}</p>
                  </div>
                  <div className="text-right text-sm font-semibold">
                    <p>{item.date || 'MMM YYYY - Present'}</p>
                    <p className="italic font-normal">{item.location || 'somewhere, state'}</p>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-line">{item.description}</p>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {!skippedSections.education ? (
        <>
          <SectionTitle>Education</SectionTitle>
          <div className="mt-2 space-y-2 text-[15px]">
            {(education.length
              ? education
              : [{ degree: 'Degree Name', institution: 'University / College', year: 'YYYY' }]
            ).map((item, index) => (
              <div key={`${item.degree}-${index}`} className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold">{item.degree || 'Degree Name'}</p>
                  <p className="italic">{item.institution || 'University / College'}</p>
                </div>
                <p className="font-semibold">{item.year || 'YYYY'}</p>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {!skippedSections.customSections
        ? customSections.map((section, index) => (
            <div key={`${section.name}-${index}`}>
              <SectionTitle>{section.name}</SectionTitle>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-7">{section.content}</p>
            </div>
          ))
        : null}
    </div>
  );
}
