function SidebarSection({ title, children }) {
  return (
    <section>
      <h2 className="border-b border-black/70 pb-1 font-serif text-[1.05rem] uppercase">{title}</h2>
      <div className="mt-2 text-[15px] leading-6">{children}</div>
    </section>
  );
}

function MainSection({ title, children }) {
  return (
    <section>
      <h2 className="border-b border-black/70 pb-1 font-serif text-[1.1rem] uppercase">{title}</h2>
      <div className="mt-2 text-[15px] leading-6">{children}</div>
    </section>
  );
}

export default function ExecutiveTemplate({ data }) {
  const {
    name,
    email,
    phone,
    about,
    skills = [],
    workExperience = [],
    education = [],
    links = [],
    customSections = [],
    skippedSections = {},
  } = data;

  return (
    <div className="mx-auto min-h-[1120px] max-w-[820px] bg-white px-1 py-2 text-black">
      <div className="mx-1 overflow-hidden border border-slate-300 bg-white">
        <header className="bg-[#262323] px-8 py-6 text-center text-white">
          <h1 className="font-serif text-5xl">{name || 'First-Name LastName'}</h1>
          <p className="mt-2 text-lg text-zinc-200">{[email || 'email', phone || 'phone'].join(' | ')}</p>
        </header>

        <div className="grid gap-8 px-6 py-5 md:grid-cols-[0.78fr_1.5fr]">
          <aside className="space-y-6">
            {!skippedSections.about ? (
              <SidebarSection title="About Me">
                <p className="whitespace-pre-line">{about || ''}</p>
              </SidebarSection>
            ) : null}

            {!skippedSections.education ? (
              <SidebarSection title="Education">
                {(education.length ? education : [{ degree: 'Degree Name', institution: 'University / College', year: 'Date - Date' }]).map(
                  (item, index) => (
                    <div key={`${item.degree}-${index}`} className={index > 0 ? 'mt-3' : ''}>
                      <p className="font-semibold">{item.degree}</p>
                      <p>{item.institution}</p>
                      <p>{item.year}</p>
                    </div>
                  )
                )}
              </SidebarSection>
            ) : null}

            {!skippedSections.links ? (
              <SidebarSection title="Links">
                {(links.length ? links : [{ label: 'website', value: '' }]).map((item, index) => (
                  <p key={`${item.label}-${index}`}>{item.label}{item.value ? ` - ${item.value}` : ''}</p>
                ))}
              </SidebarSection>
            ) : null}

            {!skippedSections.skills ? (
              <SidebarSection title="Skills">
                <div className="space-y-2">
                  {skills.map((skill, index) => (
                    <p key={`${skill}-${index}`}>{skill}</p>
                  ))}
                </div>
              </SidebarSection>
            ) : null}
          </aside>

          <main className="space-y-6">
            {!skippedSections.workExperience ? (
              <MainSection title="Experience">
                <div className="space-y-4">
                  {(workExperience.length ? workExperience : [{ title: 'Name - Title', date: 'Date', description: '' }]).map((item, index) => (
                    <div key={`${item.title}-${index}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold">{item.title}</p>
                          {item.company ? <p>{item.company}</p> : null}
                        </div>
                        <p className="whitespace-nowrap">{item.date}</p>
                      </div>
                      <p className="mt-1 whitespace-pre-line">{item.description}</p>
                    </div>
                  ))}
                </div>
              </MainSection>
            ) : null}

            {!skippedSections.customSections
              ? customSections.map((section, index) => (
                  <MainSection key={`${section.name}-${index}`} title={section.name}>
                    <p className="whitespace-pre-line">{section.content}</p>
                  </MainSection>
                ))
              : null}
          </main>
        </div>
      </div>
    </div>
  );
}
