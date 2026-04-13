import { hasMeaningfulArray, hasMeaningfulText, toBullets } from './renderUtils';

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

  const visibleAbout = !skippedSections.about && hasMeaningfulText(about);
  const visibleEducation = !skippedSections.education && hasMeaningfulArray(education);
  const visibleLinks = !skippedSections.links && hasMeaningfulArray(links);
  const visibleSkills = !skippedSections.skills && hasMeaningfulArray(skills);
  const visibleExperience = !skippedSections.workExperience && hasMeaningfulArray(workExperience);
  const visibleCustomSections = !skippedSections.customSections
    ? (customSections || []).filter((section) => hasMeaningfulText(section?.name) && hasMeaningfulText(section?.content))
    : [];

  return (
    <div className="mx-auto min-h-[1120px] max-w-[820px] bg-white px-1 py-2 text-black">
      <div className="mx-1 overflow-hidden border border-slate-300 bg-white">
        <header className="bg-[#262323] px-8 py-6 text-center text-white">
          <h1 className="font-serif text-5xl">{name || 'First-Name LastName'}</h1>
          <p className="mt-2 text-lg text-zinc-200">{[email || 'email', phone || 'phone'].join(' | ')}</p>
        </header>

        <div className="grid gap-8 px-6 py-5 md:grid-cols-[0.78fr_1.5fr]">
          <aside className="space-y-6">
            {visibleAbout ? (
              <SidebarSection title="About Me">
                <p className="whitespace-pre-line">{about}</p>
              </SidebarSection>
            ) : null}

            {visibleEducation ? (
              <SidebarSection title="Education">
                {education.map((item, index) => (
                  <div key={`${item.degree}-${index}`} className={index > 0 ? 'mt-3' : ''}>
                    <p className="font-semibold">{item.degree}</p>
                    {hasMeaningfulText(item.institution) ? <p>{item.institution}</p> : null}
                    {hasMeaningfulText(item.year) ? <p>{item.year}</p> : null}
                  </div>
                ))}
              </SidebarSection>
            ) : null}

            {visibleLinks ? (
              <SidebarSection title="Links">
                {links.map((item, index) => (
                  <p key={`${item.label}-${index}`}>{item.label}{item.value ? ` - ${item.value}` : ''}</p>
                ))}
              </SidebarSection>
            ) : null}

            {visibleSkills ? (
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
            {visibleExperience ? (
              <MainSection title="Experience">
                <div className="space-y-4">
                  {workExperience.map((item, index) => (
                    <div key={`${item.title}-${index}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold">{item.title}</p>
                          {hasMeaningfulText(item.company) ? <p>{item.company}</p> : null}
                        </div>
                        {hasMeaningfulText(item.date) ? <p className="whitespace-nowrap">{item.date}</p> : null}
                      </div>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {toBullets(item.description).map((bullet, bulletIndex) => (
                          <li key={`${item.title}-${bulletIndex}`}>{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </MainSection>
            ) : null}

            {visibleCustomSections.length
              ? visibleCustomSections.map((section, index) => (
                  <MainSection key={`${section.name}-${index}`} title={section.name}>
                    <ul className="list-disc space-y-1 pl-5">
                      {toBullets(section.content, 6).map((bullet, bulletIndex) => (
                        <li key={`${section.name}-${bulletIndex}`}>{bullet}</li>
                      ))}
                    </ul>
                  </MainSection>
                ))
              : null}
          </main>
        </div>
      </div>
    </div>
  );
}
