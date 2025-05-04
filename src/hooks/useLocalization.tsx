
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ru' | 'en' | 'zh';

interface LocalizationContextType {
  t: (key: string, params?: Record<string, any>) => string;
  language: Language;
  setLanguage: (language: Language) => void;
}

const translations = {
  ru: {
    start: 'Начать',
    signIn: 'Войти',
    signUp: 'Регистрация',
    signOut: 'Выйти',
    email: 'Электронная почта',
    password: 'Пароль',
    leaderboard: 'Таблица лидеров',
    startChat: 'Начать чат',
    searchingPeer: 'Поиск собеседника...',
    waitingForUsers: 'Ждем других пользователей...',
    foundPotentialPeer: 'Найден подходящий собеседник, устанавливаем соединение...',
    onlineUsers: 'Онлайн пользователей: {count}',
    connectionAttempt: 'Попытка соединения с {peer}: {attempt}/{max}',
    connectionState: 'Соединение с {peer}: {state}',
    connectionFailed: 'Соединение не установлено',
    connectionFailedDesc: 'Не удалось установить соединение с собеседником',
    connectionEstablished: 'Соединение установлено',
    peerConnected: 'Собеседник подключен',
    connectionClosed: 'Соединение закрыто',
    peerDisconnected: 'Собеседник отключился',
    allPeersDisconnected: 'Все собеседники отключились',
    cameraAccessError: 'Ошибка доступа к камере',
    checkPermissions: 'Проверьте разрешения браузера',
    videoUnavailable: 'Видео недоступно',
    audioOnlyMode: 'Режим только аудио',
    noPeersConnected: 'Нет подключенных собеседников',
    waitingForPeers: 'Ожидание подключения собеседников...',
    you: 'Вы',
    fullscreen: 'Полный экран',
    debugInfo: 'Отладочная информация',
    userId: 'ID пользователя',
    connectedPeers: 'Подключено собеседников',
    logs: 'Логи',
    back: 'Назад',
    searchingNewPeer: 'Поиск нового собеседника',
    waitingForConnection: 'Ожидание соединения...',
    user: 'Пользователь',
    rank: 'Ранг',
    score: 'Очки',
    startMatch: 'Начать матч',
    loadingLeaderboard: 'Загрузка таблицы лидеров...',
    noUsersFound: 'Пользователи не найдены',
    leaderboardDescription: 'Лучшие пользователи по количеству очков',
    error: 'Ошибка',
    errorFetchingUsers: 'Ошибка при загрузке пользователей',
    somethingWentWrong: 'Что-то пошло не так',
    authRequired: 'Требуется авторизация',
    authRequiredDesc: 'Для доступа к этой странице требуется авторизация',
    pleaseLoginFirst: 'Пожалуйста, войдите в систему',
    language: 'Язык'
  },
  en: {
    start: 'Start',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    email: 'Email',
    password: 'Password',
    leaderboard: 'Leaderboard',
    startChat: 'Start Chat',
    searchingPeer: 'Searching for a peer...',
    waitingForUsers: 'Waiting for other users...',
    foundPotentialPeer: 'Found a potential peer, establishing connection...',
    onlineUsers: 'Online users: {count}',
    connectionAttempt: 'Connection attempt with {peer}: {attempt}/{max}',
    connectionState: 'Connection with {peer}: {state}',
    connectionFailed: 'Connection failed',
    connectionFailedDesc: 'Failed to establish connection with peer',
    connectionEstablished: 'Connection established',
    peerConnected: 'Peer connected',
    connectionClosed: 'Connection closed',
    peerDisconnected: 'Peer disconnected',
    allPeersDisconnected: 'All peers disconnected',
    cameraAccessError: 'Camera access error',
    checkPermissions: 'Check browser permissions',
    videoUnavailable: 'Video unavailable',
    audioOnlyMode: 'Audio only mode',
    noPeersConnected: 'No peers connected',
    waitingForPeers: 'Waiting for peers to connect...',
    you: 'You',
    fullscreen: 'Fullscreen',
    debugInfo: 'Debug info',
    userId: 'User ID',
    connectedPeers: 'Connected peers',
    logs: 'Logs',
    back: 'Back',
    searchingNewPeer: 'Searching for a new peer',
    waitingForConnection: 'Waiting for connection...',
    user: 'User',
    rank: 'Rank',
    score: 'Score',
    startMatch: 'Start Match',
    loadingLeaderboard: 'Loading leaderboard...',
    noUsersFound: 'No users found',
    leaderboardDescription: 'Top users by score',
    error: 'Error',
    errorFetchingUsers: 'Error fetching users',
    somethingWentWrong: 'Something went wrong',
    authRequired: 'Authentication required',
    authRequiredDesc: 'Authentication is required to access this page',
    pleaseLoginFirst: 'Please login first',
    language: 'Language'
  },
  zh: {
    start: '开始',
    signIn: '登录',
    signUp: '注册',
    signOut: '退出',
    email: '电子邮箱',
    password: '密码',
    leaderboard: '排行榜',
    startChat: '开始聊天',
    searchingPeer: '搜索对话者...',
    waitingForUsers: '等待其他用户...',
    foundPotentialPeer: '找到潜在对话者，正在建立连接...',
    onlineUsers: '在线用户：{count}',
    connectionAttempt: '与 {peer} 的连接尝试：{attempt}/{max}',
    connectionState: '与 {peer} 的连接：{state}',
    connectionFailed: '连接失败',
    connectionFailedDesc: '无法与对话者建立连接',
    connectionEstablished: '连接已建立',
    peerConnected: '对话者已连接',
    connectionClosed: '连接已关闭',
    peerDisconnected: '对话者已断开连接',
    allPeersDisconnected: '所有对话者已断开连接',
    cameraAccessError: '相机访问错误',
    checkPermissions: '检查浏览器权限',
    videoUnavailable: '视频不可用',
    audioOnlyMode: '仅音频模式',
    noPeersConnected: '没有连接的对话者',
    waitingForPeers: '等待对话者连接...',
    you: '你',
    fullscreen: '全屏',
    debugInfo: '调试信息',
    userId: '用户ID',
    connectedPeers: '已连接的对话者',
    logs: '日志',
    back: '返回',
    searchingNewPeer: '搜索新的对话者',
    waitingForConnection: '等待连接...',
    user: '用户',
    rank: '排名',
    score: '分数',
    startMatch: '开始匹配',
    loadingLeaderboard: '加载排行榜...',
    noUsersFound: '未找到用户',
    leaderboardDescription: '按分数排名的顶级用户',
    error: '错误',
    errorFetchingUsers: '获取用户时出错',
    somethingWentWrong: '出现错误',
    authRequired: '需要认证',
    authRequiredDesc: '访问此页面需要认证',
    pleaseLoginFirst: '请先登录',
    language: '语言'
  }
};

// Create context
const LocalizationContext = createContext<LocalizationContextType>({
  t: () => '',
  language: 'ru',
  setLanguage: () => {}
});

export const LocalizationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ru');
  
  // Load saved language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language || 'ru';
    setLanguage(savedLanguage);
  }, []);
  
  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);
  
  const t = (key: string, params?: Record<string, any>) => {
    let text = translations[language][key as keyof typeof translations[typeof language]] || key;
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, value.toString());
      });
    }
    
    return text;
  };
  
  return (
    <LocalizationContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => useContext(LocalizationContext);
