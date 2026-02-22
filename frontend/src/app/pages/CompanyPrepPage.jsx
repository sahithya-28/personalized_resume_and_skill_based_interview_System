import { Link } from 'react-router-dom';
import { Upload, CheckCircle2, AlertTriangle, Target, MessageSquare, Star } from 'lucide-react';

export default function CompanyPrepPage() {
  const steps = [
    { icon: Upload, title: 'Upload Resume', description: 'Submit your resume for analysis', link: '/resume-upload', color: 'indigo' },
    { icon: CheckCircle2, title: 'Resume Score', description: 'Get detailed scoring and evaluation', link: '/resume-score', color: 'green' },
    { icon: AlertTriangle, title: 'Vulnerabilities', description: 'Identify weak points and gaps', link: '/vulnerabilities', color: 'amber' },
    { icon: Target, title: 'Skill Verification', description: 'Validate claimed skills with tests', link: '/skill-verification', color: 'purple' },
    { icon: MessageSquare, title: 'Interview Questions', description: 'Practice company-specific questions', link: '/interview-questions?type=company', color: 'sky' },
    { icon: Star, title: 'Feedback', description: 'Receive comprehensive evaluation', link: '/feedback', color: 'pink' }
  ];

  const colors = {
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200' },
    green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
    sky: { bg: 'bg-sky-100', text: 'text-sky-600', border: 'border-sky-200' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200' }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">
          Company Preparation Flow
        </h1>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Complete resume-based company-specific interview preparation in 6 steps
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const colorScheme = colors[step.color];
            return (
              <Link
                key={index}
                to={step.link}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-transparent hover:border-gray-200"
              >
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 ${colorScheme.bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${colorScheme.text}`} />
                  </div>
                  <span className="ml-3 text-sm font-semibold text-gray-500">Step {index + 1}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                <div className="mt-4 flex items-center text-indigo-600 font-semibold text-sm">
                  Start
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 bg-white p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Progress Tracker</h2>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '0%' }}></div>
            </div>
            <span className="text-sm font-semibold text-gray-600">0/6 Complete</span>
          </div>
        </div>
      </div>
    </div>
  );
}
