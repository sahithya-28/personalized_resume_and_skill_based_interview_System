function getEducationItems(education, educationEntries = []) {
  const items = [...educationEntries];
  if (education?.degree || education?.institution || education?.year) {
    items.push(education);
  }
  return items;
}

function SkillBar({ label, years }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-slate-900">{label}</span>
        <span className="text-sm text-red-500">{years}</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-red-100">
        <div className="h-1.5 w-full rounded-full bg-red-500" />
      </div>
    </div>
  );
}

function CustomSections({ sections = [] }) {
  if (!sections.length) return null;

  return sections.map((section, index) => (
    <section key={`${section.name}-${index}`} className="mt-8">
      <h2 className="border-b-4 border-red-500 pb-1 text-4xl font-bold uppercase text-slate-700">{section.name}</h2>
      <p className="mt-4 whitespace-pre-line text-lg leading-8 text-slate-700">{section.content}</p>
    </section>
  ));
}

export default function ProfileTemplate({ name, email, phone, skills, projects, education, educationEntries, customSections }) {
  const educationItems = getEducationItems(education, educationEntries);
  const initials = (name || 'IR')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="mx-auto min-h-[1120px] max-w-[820px] bg-white px-7 py-7 text-slate-800">
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="border-r border-slate-200 pr-5">
          <div className="flex aspect-[4/5] items-center justify-center bg-slate-100 text-6xl font-bold text-slate-500">
            {initials || 'IR'}
          </div>

          <section className="mt-6">
            <h2 className="border-b-4 border-red-500 pb-1 text-4xl font-bold uppercase text-slate-700">Skills</h2>
            <div className="mt-5 space-y-4">
              {(skills.length ? skills.slice(0, 7) : ['Python', 'Ansible', 'Linux']).map((skill, index) => (
                <SkillBar key={`${skill}-${index}`} label={skill} years={index < 4 ? '5+ yrs' : '3+ yrs'} />
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="border-b-4 border-red-500 pb-1 text-4xl font-bold uppercase text-slate-700">Contact</h2>
            <div className="mt-5 space-y-3 text-base text-slate-700">
              <p>{education.institution || 'Example St. 1'}</p>
              <p>{phone || '+49 178 910 11 12 13'}</p>
              <p>{email || 'contact@example.com'}</p>
            </div>
          </section>

          <div className="mt-10 flex aspect-square w-32 items-center justify-center border-8 border-slate-900 text-xs font-bold tracking-[0.4em] text-slate-900">
            QR
          </div>
        </aside>

        <main>
          <header className="bg-[#4a4747] px-8 py-6 text-center text-white">
            <h1 className="text-5xl font-bold uppercase">{name || 'Ilya Rumyantsev'}</h1>
            <div className="mx-auto mt-3 h-0.5 w-16 bg-white/80" />
            <p className="mt-3 text-xl text-zinc-200">Freelance Automation Consultant and Developer</p>
          </header>

          <section className="mt-7">
            <h2 className="border-b-4 border-red-500 pb-1 text-4xl font-bold uppercase text-slate-700">Profile</h2>
            <div className="mt-4 space-y-4 text-lg leading-8 text-slate-700">
              <p>{name ? `${name} ` : ''}</p>
              <p>Add a concise profile summary here describing your strengths and focus.</p>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="border-b-4 border-red-500 pb-1 text-4xl font-bold uppercase text-slate-700">Work Experience</h2>
            <div className="mt-5 space-y-6">
              {(projects.length
                ? projects
                : [{ title: 'Project / Experience', description: '' }]
              ).map((project, index) => (
                <div key={`${project.title}-${index}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xl font-bold text-slate-900">{project.title || 'Project / Experience'}</p>
                      <p className="font-semibold text-red-500">{skills[0] || 'Role / Department'}</p>
                    </div>
                    <div className="bg-red-500 px-4 py-1 text-sm font-semibold text-white">
                      {index === 0 ? 'Sep 15 - NOW' : 'Past Role'}
                    </div>
                  </div>

                  <p className="mt-3 text-lg leading-8 text-slate-700">
                    {project.description || 'Add achievements, responsibilities, and measurable results here.'}
                  </p>

                  <p className="mt-4 text-lg font-bold text-slate-900">Technologies include:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-6 text-lg text-slate-700">
                    {(skills.length ? skills.slice(0, 4) : ['Django', 'Angular', 'HTML / CSS']).map((skill, skillIndex) => (
                      <li key={`${skill}-${skillIndex}`}>{skill}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="border-b-4 border-red-500 pb-1 text-4xl font-bold uppercase text-slate-700">Education</h2>
            <div className="mt-4 space-y-3 text-lg text-slate-700">
              {(educationItems.length
                ? educationItems
                : [{ degree: 'Degree Name', institution: 'University / College', year: 'YYYY' }]
              ).map((item, index) => (
                <div key={`${item.degree}-${item.institution}-${index}`}>
                  <p className="font-bold text-slate-900">{item.degree || 'Degree Name'}</p>
                  <p>{item.institution || 'University / College'}</p>
                  <p>{item.year || 'YYYY'}</p>
                </div>
              ))}
            </div>
          </section>

          <CustomSections sections={customSections} />
        </main>
      </div>
    </div>
  );
}
