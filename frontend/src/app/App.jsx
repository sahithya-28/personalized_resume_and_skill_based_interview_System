import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import UserAnalysisPage from './pages/UserAnalysisPage';
import InterviewPrepPage from './pages/InterviewPrepPage';
import CompanyPrepPage from './pages/CompanyPrepPage';
import ResumeUploadPage from './pages/ResumeUploadPage';
import ResumeScorePage from './pages/ResumeScorePage';
import VulnerabilitiesPage from './pages/VulnerabilitiesPage';
import SkillVerificationPage from './pages/SkillVerificationPage';
import InterviewQuestionsPage from './pages/InterviewQuestionsPage';
import FeedbackPage from './pages/FeedbackPage';
import SkillVerificationHistoryPage from './pages/SkillVerificationHistoryPage';
import ResumeBuildingPage from './pages/ResumeBuildingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/user-analysis" element={<UserAnalysisPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/interview-prep" element={<InterviewPrepPage />} />
          <Route path="/company-prep" element={<CompanyPrepPage />} />
          <Route path="/resume-upload" element={<ResumeUploadPage />} />
          <Route path="/resume-score" element={<ResumeScorePage />} />
          <Route path="/vulnerabilities" element={<VulnerabilitiesPage />} />
          <Route path="/skill-verification" element={<SkillVerificationPage />} />
          <Route path="/interview-questions" element={<InterviewQuestionsPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/skill-verification-history" element={<SkillVerificationHistoryPage />} />
          <Route path="/resume-building" element={<ResumeBuildingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </div>
    </Router>
  );
}
