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
    <section className="mt-8">
      {sections.map((section, index) => (
        <div key={`${section.name}-${index}`} className={index > 0 ? 'mt-6' : ''}>
          <h2 className="border-b border-[#7da2b8] pb-1 text-2xl font-semibold italic text-[#295d7a]">{section.name}</h2>
          <p className="mt-3 whitespace-pre-line text-base text-slate-700">{section.content}</p>
        </div>
      ))}
    </section>
  );
}

export default function TimelineTemplate({ name, email, phone, skills, projects, education, educationEntries, customSections }) {
  const educationItems = getEducationItems(education, educationEntries);

  return (
    <div className="mx-auto min-h-[1120px] max-w-[820px] bg-white px-10 py-8 text-slate-800">
      <header className="flex items-start justify-between gap-8">
        <div>
          <h1 className="text-6xl font-extrabold tracking-tight text-[#0d5e94]">{name || 'Noodle Brain'}</h1>
        </div>
        <div className="grid gap-1 text-sm text-slate-700">
          <p>{phone || '+1 420-420-6969'}</p>
          <p>{email || 'example@gmail.com'}</p>
          <p>{education.institution || 'United States'}</p>
        </div>
      </header>

      <section className="mt-7">
        <h2 className="border-b border-[#7da2b8] pb-1 text-2xl font-semibold italic text-[#295d7a]">Education</h2>
        <div className="mt-3 space-y-5">
          {(educationItems.length
            ? educationItems
            : [{ degree: 'Degree Name', institution: 'University / College', year: 'YYYY' }]
          ).map((item, index) => (
            <div key={`${item.degree}-${item.institution}-${index}`} className="flex items-start justify-between gap-6">
              <div>
                <p className="text-2xl font-semibold">{item.degree || 'Degree Name'}</p>
                <p className="italic text-slate-600">{item.institution || 'University / College'}</p>
              </div>
              <div className="text-right italic text-slate-600">
                <p>{item.institution || 'University / College'}</p>
                <p>{item.year || 'YYYY'}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="border-b border-[#7da2b8] pb-1 text-2xl font-semibold italic text-[#295d7a]">Work Experience</h2>
        <div className="mt-3 space-y-6">
          {(projects.length
            ? projects
            : [{ title: 'Project / Experience', description: '' }]
          ).map((project, index) => (
            <div key={`${project.title}-${index}`} className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <p className="text-2xl font-semibold">{project.title || 'Project / Experience'}</p>
                <p className="italic text-slate-600">{skills[0] || 'Professional Role'}</p>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-base">
                  {project.description
                    ? project.description
                        .split(/[.;]/)
                        .map((point) => point.trim())
                        .filter(Boolean)
                        .slice(0, 3)
                        .map((point, pointIndex) => <li key={pointIndex}>{point}</li>)
                    : null}
                </ul>
              </div>
              <div className="min-w-[150px] text-right italic text-slate-600">
                <p>{index === 0 ? '2015 - Present' : 'March 2018 - July 2022'}</p>
                <p>{education.institution || 'Location'}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="border-b border-[#7da2b8] pb-1 text-2xl font-semibold italic text-[#295d7a]">Coursework</h2>
        <div className="mt-3 space-y-5">
          {(skills.length ? skills.slice(0, 3) : ['Course Topic']).map((skill, index) => (
            <div key={`${skill}-${index}`} className="flex items-start justify-between gap-6">
              <div>
                <p className="text-2xl font-semibold">{skill}</p>
                <p className="italic text-slate-600">Professor / Learning Track</p>
                <p className="mt-1 text-base text-slate-700">
                  Add supporting notes, achievements, or coursework details for this entry.
                </p>
              </div>
              <div className="text-right italic text-slate-600">
                <p>{index === 0 ? 'Fall 2020' : index === 1 ? 'Fall 2019' : 'Spring 2019'}</p>
                <p>{education.institution || 'Campus'}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CustomSections sections={customSections} />
    </div>
  );
}
