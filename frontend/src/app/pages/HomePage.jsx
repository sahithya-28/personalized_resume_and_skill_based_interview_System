import { Link } from 'react-router-dom';
import { FileText, SearchCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Smart Resume-Based Interview System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Analyze your resume end-to-end and build polished resumes from one dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/user-analysis"
              className="px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold text-lg"
            >
              Start User Analysis
            </Link>
            <Link
              to="/about"
              className="px-8 py-4 bg-white text-indigo-600 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg border-2 border-indigo-600"
            >
              Know How It Works?
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-2 gap-8">
          <Link
            to="/user-analysis"
            className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-cyan-100 rounded-xl flex items-center justify-center mb-6">
              <SearchCheck className="w-7 h-7 text-cyan-700" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              User Analysis
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Upload resume, extract skills and sections, detect weak points, verify skills, answer adaptive questions, and get scored feedback.
            </p>
          </Link>

          <Link
            to="/resume-building"
            className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
              <FileText className="w-7 h-7 text-teal-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Resume Building
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Build and download resume PDFs with template-based generation.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
