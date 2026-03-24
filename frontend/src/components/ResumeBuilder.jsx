import { useState } from 'react';
import { initialResumeData } from '../utils/resumeData';

export default function ResumeBuilder() {
  const [resume, setResume] = useState(initialResumeData);
  const [skillInput, setSkillInput] = useState('');
  const [projectInput, setProjectInput] = useState({ title: '', description: '' });

  function handleBasicChange(event) {
    const { name, value } = event.target;
    setResume((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleAddSkill() {
    const trimmedSkill = skillInput.trim();
    if (!trimmedSkill) {
      return;
    }

    setResume((current) => ({
      ...current,
      skills: [...current.skills, trimmedSkill],
    }));
    setSkillInput('');
  }

  function handleAddProject() {
    const trimmedTitle = projectInput.title.trim();
    const trimmedDescription = projectInput.description.trim();

    if (!trimmedTitle || !trimmedDescription) {
      return;
    }

    setResume((current) => ({
      ...current,
      projects: [
        ...current.projects,
        {
          title: trimmedTitle,
          description: trimmedDescription,
        },
      ],
    }));

    setProjectInput({ title: '', description: '' });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Resume Form</h2>
        <p className="mt-2 text-sm text-slate-600">
          Fill in your details and watch the preview update live.
        </p>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Basic Details</h3>
            <div className="mt-3 space-y-3">
              <input
                type="text"
                name="name"
                value={resume.name}
                onChange={handleBasicChange}
                placeholder="Full name"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              />
              <input
                type="email"
                name="email"
                value={resume.email}
                onChange={handleBasicChange}
                placeholder="Email address"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              />
              <input
                type="text"
                name="phone"
                value={resume.phone}
                onChange={handleBasicChange}
                placeholder="Phone number"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900">Skills</h3>
            <div className="mt-3 flex gap-3">
              <input
                type="text"
                value={skillInput}
                onChange={(event) => setSkillInput(event.target.value)}
                placeholder="Add a skill"
                className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Add Skill
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900">Projects</h3>
            <div className="mt-3 space-y-3">
              <input
                type="text"
                value={projectInput.title}
                onChange={(event) =>
                  setProjectInput((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Project title"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              />
              <textarea
                value={projectInput.description}
                onChange={(event) =>
                  setProjectInput((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Project description"
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleAddProject}
                className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Add Project
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Live Preview</h2>
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-2xl font-bold text-slate-900">
              {resume.name || 'Your Name'}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {resume.email || 'email@example.com'}
            </p>
            <p className="text-sm text-slate-600">{resume.phone || '+91 00000 00000'}</p>
          </div>

          <div className="mt-6">
            <h4 className="text-lg font-semibold text-slate-900">Skills</h4>
            {resume.skills.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {resume.skills.map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="rounded-full bg-sky-100 px-3 py-1 text-sm text-sky-900"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Skills will appear here.</p>
            )}
          </div>

          <div className="mt-6">
            <h4 className="text-lg font-semibold text-slate-900">Projects</h4>
            {resume.projects.length ? (
              <div className="mt-3 space-y-4">
                {resume.projects.map((project, index) => (
                  <div key={`${project.title}-${index}`} className="rounded-xl border border-slate-200 p-4">
                    <p className="font-semibold text-slate-900">{project.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{project.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Projects will appear here.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
