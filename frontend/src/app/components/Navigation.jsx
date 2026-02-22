import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function Navigation() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const syncUser = () => {
      try {
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      }
    };

    syncUser();
    window.addEventListener('storage', syncUser);
    window.addEventListener('auth-changed', syncUser);

    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('auth-changed', syncUser);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem('currentUser');
    window.dispatchEvent(new Event('auth-changed'));
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
            <span className="font-bold text-gray-900 text-lg">Smart Resume Interview</span>
          </Link>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex space-x-6">
              <Link to="/" className="text-gray-700 font-medium hover:text-indigo-600 transition-colors">Home</Link>
              <Link to="/about" className="text-gray-700 font-medium hover:text-indigo-600 transition-colors">About Us</Link>
              <Link to="/contact" className="text-gray-700 font-medium hover:text-indigo-600 transition-colors">Contact Us</Link>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-sm text-gray-700">{currentUser.full_name}</span>
                <button onClick={logout} className="px-5 py-2 bg-gray-100 text-gray-800 font-semibold rounded-full hover:bg-gray-200 transition-colors">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-colors shadow-md">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
