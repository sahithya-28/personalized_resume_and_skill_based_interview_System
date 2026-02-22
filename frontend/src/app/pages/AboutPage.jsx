import { Target, Users, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 text-center mb-6">About SRIS</h1>
        <p className="text-xl text-gray-600 text-center mb-16">Smart Resume-Based Interview System</p>

        <div className="bg-white p-10 rounded-2xl shadow-xl mb-12">
          <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Target className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Our Mission</h2>
          <p className="text-gray-700 text-lg leading-relaxed text-center">
            To empower job seekers with AI-driven interview preparation tools that build confidence, 
            identify weaknesses, and maximize success in technical and behavioral interviews.
          </p>
        </div>

        <div className="bg-white p-10 rounded-2xl shadow-xl mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">What Problem Does SRIS Solve?</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              <span className="font-semibold text-gray-900">The Challenge:</span> Many engineering students 
              and job seekers struggle with interview preparation. They often face:
            </p>
            <ul className="space-y-3 ml-6">
              <li className="flex items-start">
                <span className="text-indigo-600 mr-3 mt-1">•</span>
                <span>Lack of personalized feedback on their resume and interview skills</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-3 mt-1">•</span>
                <span>Uncertainty about weak areas that might be questioned by interviewers</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-3 mt-1">•</span>
                <span>Limited access to company-specific interview preparation</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-3 mt-1">•</span>
                <span>Difficulty verifying their claimed skills objectively</span>
              </li>
            </ul>
            <p className="mt-6">
              <span className="font-semibold text-gray-900">Our Solution:</span> SRIS analyzes your resume, 
              identifies vulnerabilities, verifies skills through targeted questions, and provides personalized 
              interview preparation based on your background and target company.
            </p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-2xl shadow-xl mb-12">
          <div className="w-16 h-16 bg-sky-100 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-sky-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Who Benefits from SRIS?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Engineering Students</h3>
              <p className="text-gray-700">
                Build confidence, practice interviews, and prepare for campus placements with 
                resume-based personalized questions.
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-sky-50 to-white rounded-xl border border-sky-100">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Job Seekers</h3>
              <p className="text-gray-700">
                Professionals looking to switch careers or advance their positions with 
                company-specific interview preparation.
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-teal-50 to-white rounded-xl border border-teal-100">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Career Changers</h3>
              <p className="text-gray-700">
                Validate new skills, identify gaps, and prepare for interviews in a different 
                industry or role.
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Bootcamp Graduates</h3>
              <p className="text-gray-700">
                Bridge the gap between learning and employment with practical interview 
                experience and skill verification.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Award className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">What Makes SRIS Unique?</h2>
          <div className="space-y-4">
            {[
              { title: 'Resume-Based Analysis', description: 'Questions tailored to YOUR specific background and experience' },
              { title: 'Vulnerability Detection', description: 'Identify weak spots before interviewers do' },
              { title: 'Skill Verification', description: 'Prove your proficiency through progressive question difficulty' },
              { title: 'Company-Specific Prep', description: 'Customized preparation for your target companies' },
              { title: 'ATS Optimization', description: 'Improve resume compatibility with applicant tracking systems' },
              { title: 'Comprehensive Feedback', description: 'Detailed evaluation with actionable improvement suggestions' }
            ].map((feature, index) => (
              <div key={index} className="flex items-start p-4 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center mr-4 flex-shrink-0 font-bold text-sm">{index + 1}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-gray-700 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
