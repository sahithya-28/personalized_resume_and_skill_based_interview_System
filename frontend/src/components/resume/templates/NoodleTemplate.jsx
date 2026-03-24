export default function NoodleTemplate({ resumeData }) {
  const { name, email, phone, education = [], workExperience = [], coursework = [], customSections = [], skippedSections = {} } = resumeData;

  return (
    <div className="mx-auto min-h-[1120px] max-w-[820px] bg-white px-10 py-8 text-slate-800">
      <header className="flex items-start justify-between gap-8">
        <div>
          <h1 className="text-6xl font-extrabold tracking-tight text-[#0d5e94]">{name || 'Noodle Brain'}</h1>
        </div>
        <div className="grid gap-1 text-sm text-slate-700">
          <p>{phone || '+1 420-420-6969'}</p>
          <p>{email || 'example@gmail.com'}</p>
        </div>
      </header>

      {!skippedSections.education ? (
        <section className="mt-7">
          <h2 className="border-b border-[#7da2b8] pb-1 text-2xl font-semibold italic text-[#295d7a]">Education</h2>
          <div className="mt-3 space-y-5">
            {(education.length ? education : [{ degree: 'Degree Name', institution: 'University / College', year: 'YYYY' }]).map((item, index) => (
              <div key={`${item.degree}-${index}`} className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-2xl font-semibold">{item.degree}</p>
                  {item.institution ? <p className="italic text-slate-600">{item.institution}</p> : null}
                </div>
                <div className="text-right italic text-slate-600">
                  <p>{item.institution}</p>
                  <p>{item.year}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!skippedSections.workExperience ? (
        <section className="mt-8">
          <h2 className="border-b border-[#7da2b8] pb-1 text-2xl font-semibold italic text-[#295d7a]">Work Experience</h2>
          <div className="mt-3 space-y-6">
            {(workExperience.length ? workExperience : [{ title: 'Work Experience', description: '' }]).map((item, index) => (
              <div key={`${item.title}-${index}`} className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <p className="text-2xl font-semibold">{item.title}</p>
                  {item.company ? <p className="italic text-slate-600">{item.company}</p> : null}
                  <p className="mt-2 whitespace-pre-line text-base">{item.description}</p>
                </div>
                <div className="min-w-[150px] text-right italic text-slate-600">
                  <p>{item.date}</p>
                  <p>{item.location}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!skippedSections.coursework ? (
        <section className="mt-8">
          <h2 className="border-b border-[#7da2b8] pb-1 text-2xl font-semibold italic text-[#295d7a]">Coursework</h2>
          <div className="mt-3 space-y-5">
            {(coursework.length ? coursework : [{ title: 'Course Topic', description: '' }]).map((item, index) => (
              <div key={`${item.title}-${index}`} className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-2xl font-semibold">{item.title}</p>
                  {item.subtitle ? <p className="italic text-slate-600">{item.subtitle}</p> : null}
                  <p className="mt-1 whitespace-pre-line text-base text-slate-700">{item.description}</p>
                </div>
                <div className="text-right italic text-slate-600">
                  <p>{item.date}</p>
                  <p>{item.location}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!skippedSections.customSections
        ? customSections.map((section, index) => (
            <section key={`${section.name}-${index}`} className="mt-8">
              <h2 className="border-b border-[#7da2b8] pb-1 text-2xl font-semibold italic text-[#295d7a]">{section.name}</h2>
              <p className="mt-3 whitespace-pre-line text-base text-slate-700">{section.content}</p>
            </section>
          ))
        : null}
    </div>
  );
}
