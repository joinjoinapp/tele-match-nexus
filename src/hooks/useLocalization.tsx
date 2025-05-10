
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

type Language = 'ru' | 'en' | 'zh';

const getInitialLanguage = (): Language => {
  const storedLanguage = localStorage.getItem('language') as Language;
  return storedLanguage || (navigator.language.startsWith('ru') ? 'ru' : 'en');
};

type LocalizationContextType = {
  t: (key: string) => string;
  language: Language;
  setLanguage: (lang: Language) => void;
};

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

interface LocalizationProviderProps {
  children: ReactNode;
}

export const LocalizationProvider: React.FC<LocalizationProviderProps> = ({ children }) => {
  const localization = useLocalization();
  
  return (
    <LocalizationContext.Provider value={localization}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalizationContext = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalizationContext must be used within a LocalizationProvider');
  }
  return context;
};

export const useLocalization = () => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage());
  
  const translations: Record<Language, Record<string, string>> = {
    ru: {
      leaderboard: 'Таблица лидеров',
      signIn: 'Войти',
      signOut: 'Выйти',
      signUp: 'Регистрация',
      start: 'Начать',
      startChat: 'Начать чат',
      welcome: 'Добро пожаловать',
      enterEmail: 'Введите email',
      enterPassword: 'Введите пароль',
      notFoundTitle: 'Страница не найдена',
      notFoundMessage: 'Извините, страница, которую вы ищете, не существует.',
      backHome: 'Вернуться на главную',
      profile: 'Профиль'
    },
    en: {
      leaderboard: 'Leaderboard',
      signIn: 'Sign In',
      signOut: 'Sign Out',
      signUp: 'Sign Up',
      start: 'Start',
      startChat: 'Start Chat',
      welcome: 'Welcome',
      enterEmail: 'Enter email',
      enterPassword: 'Enter password',
      notFoundTitle: 'Page Not Found',
      notFoundMessage: 'Sorry, the page you are looking for does not exist.',
      backHome: 'Back to Home',
      profile: 'Profile'
    },
    zh: {
      leaderboard: '排行榜',
      signIn: '登录',
      signOut: '退出',
      signUp: '注册',
      start: '开始',
      startChat: '开始聊天',
      welcome: '欢迎',
      enterEmail: '输入电子邮箱',
      enterPassword: '输入密码',
      notFoundTitle: '找不到页面',
      notFoundMessage: '对不起，您要查找的页面不存在。',
      backHome: '回到主页',
      profile: '个人资料'
    },
  };

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return { t, language, setLanguage };
};
