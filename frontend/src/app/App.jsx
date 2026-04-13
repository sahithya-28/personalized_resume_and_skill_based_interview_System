import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import UserAnalysisPage from './pages/UserAnalysisPage';
import InterviewPrepPage from './pages/InterviewPrepPage';
import CompanyPrepPage from './pages/CompanyPrepPage';
import ResumeUploadPage from './pages/ResumeUploadPage';
import ResumeScorePage from './pages/ResumeScorePage';
import SkillVerificationPage from './pages/SkillVerificationPage';
import InterviewQuestionsPage from './pages/InterviewQuestionsPage';
import FeedbackPage from './pages/FeedbackPage';
import SkillVerificationHistoryPage from './pages/SkillVerificationHistoryPage';
import ResumeBuilderPage from '../pages/ResumeBuilderPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import TemplateSelectionPage from "../pages/TemplateSelectionPage.jsx";
import ResumeEntryPage from '../pages/ResumeEntryPage';
import ResumeFlowUploadPage from '../pages/ResumeUploadPage';
import ATSScorePage from '../pages/ATSScorePage';
import ResumeImprovePage from '../pages/ResumeImprovePage';

function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <ScrollToTopOnRouteChange />
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
          <Route path="/skill-verification" element={<SkillVerificationPage />} />
          <Route path="/interview-questions" element={<InterviewQuestionsPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/skill-verification-history" element={<SkillVerificationHistoryPage />} />
          <Route path="/resume" element={<ResumeEntryPage />} />
          <Route path="/resume/upload" element={<ResumeFlowUploadPage />} />
          <Route path="/resume/templates" element={<TemplateSelectionPage />} />
          <Route path="/resume-builder" element={<ResumeBuilderPage />} />
          <Route path="/resume-building" element={<ResumeEntryPage />} />
          <Route path="/ats-score" element={<ATSScorePage />} />
          <Route path="/resume-improve" element={<ResumeImprovePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/resume-templates" element={<TemplateSelectionPage />} />
        </Routes>
      </div>
    </Router>
  );
}
