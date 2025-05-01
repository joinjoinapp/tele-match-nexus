
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  isAuthenticated: boolean;
  onAuthClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated, onAuthClick }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-md bg-opacity-60 border-b border-gray-800">
      <div className="container mx-auto px-4 flex justify-between items-center h-16">
        <Link to="/" className="flex items-center">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 text-transparent bg-clip-text">
            TeleMatch
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                className="hover:bg-gray-800"
                onClick={() => navigate('/leaderboard')}
              >
                Таблица лидеров
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={() => navigate('/video-chat')}
              >
                Начать чат
              </Button>
              <Button
                variant="outline"
                className="border-gray-700 hover:bg-gray-800"
                onClick={handleSignOut}
              >
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                className="hover:bg-gray-800"
                onClick={() => navigate('/leaderboard')}
              >
                Таблица лидеров
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={onAuthClick}
              >
                Начать
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
