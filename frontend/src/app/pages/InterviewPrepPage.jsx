import { Link } from 'react-router-dom';
import { MessageSquare, Building2 } from 'lucide-react';

export default function InterviewPrepPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">
          Interview Preparation
        </h1>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Choose your preparation path based on your needs
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <Link
            to="/interview-questions?type=general"
            className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
              <MessageSquare className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              General Interview Questions
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Practice common HR and technical questions. No company selection required. Perfect for building foundational interview skills.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">HR Questions</span>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">Technical</span>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">Behavioral</span>
            </div>
            <div className="mt-6 text-indigo-600 font-semibold flex items-center">
              Start Practice
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="w-16 h-16 bg-sky-100 rounded-xl flex items-center justify-center mb-6">
              <Building2 className="w-8 h-8 text-sky-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Company-Specific Interview Questions
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Upload your resume and select target company for tailored interview preparation and personalized questions.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Target Company
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none">
                <option>Select a company...</option>
                <option>Google</option>
                <option>Microsoft</option>
                <option>Amazon</option>
                <option>Meta</option>
                <option>Apple</option>
              </select>
            </div>

            <Link
              to="/resume-upload"
              className="block w-full py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors font-semibold text-center"
            >
              Upload Resume & Start
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
