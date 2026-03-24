function SectionHeading({ children }) {
  return (
    <div className="mt-6">
      <h2 className="font-serif text-[1.75rem] uppercase leading-none text-black">{children}</h2>
      <div className="mt-1 h-px bg-black/70" />
    </div>
  );
}

function getEducationItems(education, educationEntries = []) {
  const items = [...educationEntries];
  if (education?.degree || education?.institution || education?.year) {
    items.push(education);
  }
  return items;
}

function CustomSections({ sections = [] }) {
  if (!sections.length) return null;

  return (
    <>
      {sections.map((section, index) => (
        <div key={`${section.name}-${index}`} className="mt-6">
          <h2 className="font-serif text-[1.75rem] uppercase leading-none text-black">{section.name}</h2>
          <div className="mt-1 h-px bg-black/70" />
          <p className="mt-3 whitespace-pre-line text-[15px] leading-7">{section.content}</p>
        </div>
      ))}
    </>
  );
}

export default function ModernTemplate({ name, email, phone, skills, projects, education, educationEntries, customSections }) {
  const educationItems = getEducationItems(education, educationEntries);

  return (
    <div className="mx-auto min-h-[1120px] max-w-[820px] bg-white px-8 py-10 font-serif text-black">
      <header className="text-center">
        <h1 className="text-5xl leading-tight">{name || 'Your Name'}</h1>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[15px] text-[#0b48b8]">
          <span>{email || 'email@mysite.com'}</span>
          <span>{phone || '+00.00.000.000'}</span>
          <span>{education.institution || 'mysite.com'}</span>
        </div>
      </header>

      <SectionHeading>Summary</SectionHeading>
      <p className="mt-3 min-h-[52px] text-[15px] leading-7">{name ? `${name} ` : ''}</p>

      <SectionHeading>Projects</SectionHeading>
      <div className="mt-4 space-y-5 text-[15px] leading-7">
        {projects.length ? (
          projects.map((project, index) => (
            <article key={`${project.title}-${index}`}>
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-xl font-semibold">{project.title}</h3>
                <span className="text-[#0b48b8]">Link to Demo</span>
              </div>
              <p className="mt-1">{project.description}</p>
            </article>
          ))
        ) : (
          <div className="min-h-[72px]" />
        )}
      </div>

      <SectionHeading>Education</SectionHeading>
      <div className="mt-4 space-y-1 text-[15px] leading-7">
        {educationItems.length ? (
          educationItems.map((item, index) => (
            <div key={`${item.degree}-${item.institution}-${index}`} className="grid grid-cols-[80px_1fr_auto] gap-4">
              <span>{item.year || 'YYYY'}</span>
              <div>
                <p className="font-semibold">{item.degree || 'Degree / Program'}</p>
                <p>{item.institution || 'University / College'}</p>
              </div>
              <span>(GPA: 4.0/4.0)</span>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-[80px_1fr_auto] gap-4">
            <span>YYYY</span>
            <div>
              <p className="font-semibold">Degree / Program</p>
              <p>University / College</p>
            </div>
            <span>(GPA: 4.0/4.0)</span>
          </div>
        )}
      </div>

      <SectionHeading>Skills</SectionHeading>
      <div className="mt-4 grid gap-3 text-[15px] leading-7 md:grid-cols-[120px_1fr]">
        <p className="font-semibold">Technical</p>
        <p>{skills.length ? skills.join(', ') : ''}</p>
      </div>

      <CustomSections sections={customSections} />
    </div>
  );
}
