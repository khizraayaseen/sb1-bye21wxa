import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex flex-col justify-between">
      <Header onMenuClick={() => {}} />

      <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
        <AlertTriangle size={64} className="text-yellow-500 mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Page Not Found</h1>
        <p className="text-lg text-gray-400 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-primary text-white px-6 py-3 rounded-lg text-lg font-medium transition hover:bg-primary/80"
        >
          Go to Homepage
        </button>
      </div>

      <Footer />
    </div>
  );
};

export default NotFound;
