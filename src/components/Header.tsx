
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLocalization } from '@/hooks/useLocalization';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from 'lucide-react';

interface HeaderProps {
  isAuthenticated: boolean;
  onAuthClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated, onAuthClick }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t, language, setLanguage } = useLocalization();

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
                {t('leaderboard')}
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={() => navigate('/video-chat')}
              >
                {t('startChat')}
              </Button>
              <Button
                variant="outline"
                className="border-gray-700 hover:bg-gray-800"
                onClick={handleSignOut}
              >
                {t('signOut')}
              </Button>
              <LanguageSelector />
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                className="hover:bg-gray-800"
                onClick={() => navigate('/leaderboard')}
              >
                {t('leaderboard')}
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={onAuthClick}
              >
                {t('start')}
              </Button>
              <LanguageSelector />
            </>
          )}
        </div>
      </div>
    </header>
  );
};

// Компонент для выбора языка
const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLocalization();
  
  const languages = [
    { code: 'ru', name: 'Русский' },
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' },
  ];
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
          <Globe className="h-[1.2rem] w-[1.2rem] rotate-0 text-white scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem 
            key={lang.code}
            className={language === lang.code ? "bg-muted" : ""}
            onClick={() => setLanguage(lang.code as 'ru' | 'en' | 'zh')}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Header;
