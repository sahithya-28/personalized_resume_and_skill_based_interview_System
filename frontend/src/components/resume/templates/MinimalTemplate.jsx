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

function getEducationItems(education, educationEntries = []) {
  const items = [...educationEntries];
  if (education?.degree || education?.institution || education?.year) {
    items.push(education);
  }
  return items;
}

function CustomSections({ sections = [] }) {
  if (!sections.length) return null;

  return sections.map((section, index) => (
    <MainSection key={`${section.name}-${index}`} title={section.name}>
      <p className="whitespace-pre-line">{section.content}</p>
    </MainSection>
  ));
}

export default function MinimalTemplate({ name, email, phone, skills, projects, education, educationEntries, customSections }) {
  const educationItems = getEducationItems(education, educationEntries);

  return (
    <div className="mx-auto min-h-[1120px] max-w-[820px] bg-white px-1 py-2 text-black">
      <div className="mx-1 overflow-hidden border border-slate-300 bg-white">
        <header className="bg-[#262323] px-8 py-6 text-center text-white">
          <h1 className="font-serif text-5xl">{name || 'First-Name LastName'}</h1>
          <p className="mt-2 text-lg text-zinc-200">
            {[email || 'email', phone || 'phone', education.institution || 'address'].join(' | ')}
          </p>
        </header>

        <div className="grid gap-8 px-6 py-5 md:grid-cols-[0.78fr_1.5fr]">
          <aside className="space-y-6">
            <SidebarSection title="About Me">
              <p>{name ? `${name} ` : ''}</p>
            </SidebarSection>

            <SidebarSection title="Education">
              {(educationItems.length ? educationItems : [{ degree: 'Degree Name', institution: 'University / College', year: 'Date - Date' }]).map(
                (item, index) => (
                  <div key={`${item.degree}-${item.institution}-${index}`} className={index > 0 ? 'mt-3' : ''}>
                    <p className="font-semibold">{item.degree || 'Degree Name'}</p>
                    <p>{item.institution || 'University / College'}</p>
                    <p>{item.year || 'Date - Date'}</p>
                  </div>
                )
              )}
            </SidebarSection>

            <SidebarSection title="Links">
              <p>{email || ''}</p>
              <p>{phone || ''}</p>
              <p />
            </SidebarSection>

            <SidebarSection title="Honors & Awards">
              <p />
            </SidebarSection>

            <SidebarSection title="Hobbies & Interests">
              <p />
            </SidebarSection>
          </aside>

          <main className="space-y-6">
            <MainSection title="Experience">
              <div className="space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">Name - Title</p>
                      <div className="mt-1 min-h-[38px]" />
                    </div>
                    <p className="whitespace-nowrap" />
                  </div>
                </div>
              </div>
            </MainSection>

            <MainSection title="Personal Projects">
              <div className="space-y-4">
                {projects.length ? (
                  projects.map((project, index) => (
                    <div key={`${project.title}-${index}`}>
                      <div className="flex items-start justify-between gap-4">
                        <p className="font-semibold">{project.title}</p>
                        <p className="whitespace-nowrap">date</p>
                      </div>
                      <ul className="mt-1 list-disc pl-5">
                        <li>{project.description}</li>
                      </ul>
                    </div>
                  ))
                ) : (
                  <div className="min-h-[72px]" />
                )}
              </div>
            </MainSection>

            <MainSection title="Volunteering">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">Name - Title</p>
                    <div className="mt-1 min-h-[38px]" />
                  </div>
                  <p className="whitespace-nowrap" />
                </div>
              </div>
            </MainSection>

            <MainSection title="Skills">
              <p>{skills.length ? skills.join(', ') : ''}</p>
            </MainSection>

            <CustomSections sections={customSections} />
          </main>
        </div>
      </div>
    </div>
  );
}
