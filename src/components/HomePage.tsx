
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from './Header';
import AuthModal from './AuthModal';
import { useAuth } from '@/hooks/useAuth';

const HomePage: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAuthClick = () => {
    if (user) {
      navigate('/video-chat');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    navigate('/video-chat');
  };

  const handleAuthModalClose = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header isAuthenticated={!!user} onAuthClick={handleAuthClick} />
      
      <div className="container mx-auto px-4 min-h-screen flex flex-col lg:flex-row items-center justify-center lg:justify-between">
        <div className="lg:w-1/2 pt-16 lg:pt-0 text-center lg:text-left">
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            style={{ 
              background: 'linear-gradient(to right, #fff, #d1d1d1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Знакомьтесь с новыми людьми и зарабатывайте $match
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Общайтесь со случайными людьми через видеочат и зарабатывайте токен $match за каждую секунду общения
          </p>
          <div className="flex flex-col sm:flex-row justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              className="bg-primary hover:bg-primary/90 py-6 px-8 text-lg"
              onClick={handleAuthClick}
            >
              {user ? 'Начать чат' : 'Начать'}
            </Button>
            <Button 
              variant="outline" 
              className="border-gray-700 hover:bg-gray-800 py-6 px-8 text-lg"
              onClick={() => navigate('/leaderboard')}
            >
              Таблица лидеров
            </Button>
          </div>
        </div>
        
        <div className="lg:w-1/2 mt-12 lg:mt-0 relative">
          <div className="relative">
            <div className="absolute inset-0 bg-primary rounded-full blur-3xl opacity-10"></div>
            <div className="bg-gradient-to-br from-gray-900 to-black p-2 border border-gray-800 rounded-lg relative z-10">
              <div className="rounded-md overflow-hidden aspect-video">
                <img
                  src="/placeholder.svg"
                  alt="TeleMatch Preview"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                  <div className="p-4 rounded-lg bg-black bg-opacity-60 text-center">
                    <div className="text-match font-bold text-2xl flex items-center justify-center mb-2">
                      <span className="text-match animate-pulse-match">+123 $match</span>
                    </div>
                    <p className="text-gray-300 text-sm">Заработано за сегодня</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={handleAuthModalClose} 
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default HomePage;
