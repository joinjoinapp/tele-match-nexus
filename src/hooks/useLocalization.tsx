
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Поддерживаемые языки
type Language = 'ru' | 'en' | 'zh';

// Интерфейс для контекста локализации
interface LocalizationContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

// Создаем контекст
const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

// Словари для каждого языка
const translations: Record<Language, Record<string, string>> = {
  ru: {
    // Общее
    back: 'Назад',
    you: 'Вы',
    debugInfo: 'Отладочная информация',
    logs: 'Логи',
    userId: 'ID пользователя',
    language: 'Язык',
    onlineUsers: 'Онлайн пользователей: {count}',
    fullscreen: 'Полный экран',
    
    // Заголовки страниц
    leaderboard: 'Таблица лидеров',
    startChat: 'Начать чат',
    signOut: 'Выйти',
    start: 'Начать',
    
    // Поиск и соединение
    searchingPeer: 'Поиск собеседника...',
    foundPotentialPeer: 'Найден подходящий собеседник, устанавливаем соединение...',
    waitingForUsers: 'Ожидаем других пользователей...',
    connectionAttempt: 'Попытка соединения с {peer}...: {attempt}/{max}',
    connectionState: 'Соединение с {peer}...: {state}',
    connectedPeers: 'Подключенные пользователи',
    searchingNewPeer: 'Поиск нового собеседника',
    waitingForConnection: 'Ожидайте подключения...',
    
    // Статусы и уведомления
    connectionEstablished: 'Соединение установлено!',
    peerConnected: 'Вы подключены к собеседнику',
    connectionClosed: 'Соединение разорвано',
    peerDisconnected: 'Собеседник отключился',
    allPeersDisconnected: 'Все собеседники отключились',
    userOnline: 'Пользователь онлайн',
    connectionFailed: 'Не удалось установить соединение',
    connectionFailedDesc: 'Сетевое соединение не удается установить. Возможно проблемы с NAT или брандмауэром',
    cameraAccessError: 'Ошибка доступа к камере',
    checkPermissions: 'Проверьте разрешения и попробуйте снова',
    videoUnavailable: 'Видео недоступно',
    audioOnlyMode: 'Используется только аудио',
    authRequired: 'Требуется авторизация',
    authRequiredDesc: 'Для использования видеочата необходимо войти в систему',
    
    // Состояние пустой комнаты
    noPeersConnected: 'Нет подключенных собеседников',
    waitingForPeers: 'Ожидаем подключения пользователей...',
  },
  
  en: {
    // General
    back: 'Back',
    you: 'You',
    debugInfo: 'Debug Information',
    logs: 'Logs',
    userId: 'User ID',
    language: 'Language',
    onlineUsers: 'Online users: {count}',
    fullscreen: 'Fullscreen',
    
    // Page headers
    leaderboard: 'Leaderboard',
    startChat: 'Start Chat',
    signOut: 'Sign Out',
    start: 'Start',
    
    // Search and connection
    searchingPeer: 'Searching for conversation partner...',
    foundPotentialPeer: 'Found a potential match, establishing connection...',
    waitingForUsers: 'Waiting for other users...',
    connectionAttempt: 'Connection attempt with {peer}...: {attempt}/{max}',
    connectionState: 'Connection with {peer}...: {state}',
    connectedPeers: 'Connected peers',
    searchingNewPeer: 'Searching for new partner',
    waitingForConnection: 'Waiting for connection...',
    
    // Statuses and notifications
    connectionEstablished: 'Connection established!',
    peerConnected: 'You are connected to a conversation partner',
    connectionClosed: 'Connection closed',
    peerDisconnected: 'Partner disconnected',
    allPeersDisconnected: 'All partners disconnected',
    userOnline: 'User online',
    connectionFailed: 'Connection failed',
    connectionFailedDesc: 'Network connection cannot be established. Possible NAT or firewall issues',
    cameraAccessError: 'Camera access error',
    checkPermissions: 'Check permissions and try again',
    videoUnavailable: 'Video unavailable',
    audioOnlyMode: 'Audio only mode',
    authRequired: 'Authentication required',
    authRequiredDesc: 'You need to be logged in to use video chat',
    
    // Empty room state
    noPeersConnected: 'No partners connected',
    waitingForPeers: 'Waiting for users to connect...',
  },
  
  zh: {
    // 通用
    back: '返回',
    you: '您',
    debugInfo: '调试信息',
    logs: '日志',
    userId: '用户ID',
    language: '语言',
    onlineUsers: '在线用户: {count}',
    fullscreen: '全屏',
    
    // 页面标题
    leaderboard: '排行榜',
    startChat: '开始聊天',
    signOut: '登出',
    start: '开始',
    
    // 搜索和连接
    searchingPeer: '正在搜索对话伙伴...',
    foundPotentialPeer: '找到潜在匹配，正在建立连接...',
    waitingForUsers: '等待其他用户...',
    connectionAttempt: '与 {peer}... 的连接尝试: {attempt}/{max}',
    connectionState: '与 {peer}... 的连接状态: {state}',
    connectedPeers: '已连接的伙伴',
    searchingNewPeer: '搜索新伙伴',
    waitingForConnection: '等待连接...',
    
    // 状态和通知
    connectionEstablished: '连接已建立!',
    peerConnected: '您已连接到对话伙伴',
    connectionClosed: '连接已关闭',
    peerDisconnected: '对方已断开连接',
    allPeersDisconnected: '所有伙伴已断开连接',
    userOnline: '用户在线',
    connectionFailed: '连接失败',
    connectionFailedDesc: '无法建立网络连接。可能存在NAT或防火墙问题',
    cameraAccessError: '相机访问错误',
    checkPermissions: '检查权限并重试',
    videoUnavailable: '视频不可用',
    audioOnlyMode: '仅音频模式',
    authRequired: '需要认证',
    authRequiredDesc: '您需要登录才能使用视频聊天',
    
    // 空房间状态
    noPeersConnected: '没有连接的伙伴',
    waitingForPeers: '等待用户连接...',
  }
};

// Форматирование строк с параметрами
const formatString = (template: string, params?: Record<string, any>): string => {
  if (!params) return template;
  
  return Object.entries(params).reduce((result, [key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    return result.replace(regex, String(value));
  }, template);
};

// Провайдер локализации
export const LocalizationProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // Используем локальное хранилище для сохранения выбранного языка
  const [language, setLanguageState] = useState<Language>(() => {
    // Пытаемся получить сохраненный язык
    const savedLanguage = localStorage.getItem('language') as Language;
    // Пытаемся определить язык браузера
    const browserLanguage = navigator.language.split('-')[0] as Language;
    
    // Если язык сохранен и он поддерживается, используем его
    if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
      return savedLanguage;
    }
    
    // Иначе пытаемся определить язык браузера
    if (browserLanguage && Object.keys(translations).includes(browserLanguage)) {
      return browserLanguage;
    }
    
    // По умолчанию используем русский
    return 'ru';
  });
  
  // Сохраняем выбранный язык в локальное хранилище
  const setLanguage = (newLanguage: Language) => {
    localStorage.setItem('language', newLanguage);
    setLanguageState(newLanguage);
  };
  
  // Функция перевода
  const t = (key: string, params?: Record<string, any>): string => {
    const translation = translations[language][key];
    
    // Если перевод не найден, возвращаем ключ
    if (!translation) {
      console.warn(`Translation not found for key: ${key}`);
      return key;
    }
    
    return formatString(translation, params);
  };
  
  const value = {
    language,
    setLanguage,
    t,
  };
  
  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

// Хук для использования локализации
export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  
  return context;
};
