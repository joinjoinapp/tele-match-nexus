
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  VideoOff,
  MicOff, 
  Maximize2,
  Heart,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLocalization } from '@/hooks/useLocalization';
import MatchCounter from './MatchCounter';
import BoostModal from './BoostModal';

const EnhancedVideoChat: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isSearching, setIsSearching] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [matchTokens, setMatchTokens] = useState(0);
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [peerUsername, setPeerUsername] = useState("User123");
  const [peerFollowers, setPeerFollowers] = useState(345);
  const [hasFrontCamera, setHasFrontCamera] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Check for "followed" filter from URL params
  const followedOnly = searchParams.get('filter') === 'followed';
  
  useEffect(() => {
    // Mock video chat connection
    const timer = setTimeout(() => {
      setIsSearching(false);
      setIsConnected(true);
      
      // Start counter when connected
      startCounter();
      
      // Check for front camera
      checkFrontCamera();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const checkFrontCamera = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasFrontCamera(videoDevices.length > 0);
    } catch (err) {
      console.error("Error checking camera:", err);
      setHasFrontCamera(false);
    }
  };
  
  const startCounter = () => {
    const interval = setInterval(() => {
      setMatchTokens(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
  };
  
  const toggleFullscreen = () => {
    const element = document.getElementById('remote-video');
    
    if (!element) return;
    
    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(err => {
        toast({
          title: t('fullscreenError'),
          description: err.message,
          variant: "destructive",
        });
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    
    toast({
      title: isFollowing ? "Отписка" : "Подписка",
      description: isFollowing ? 
        `Вы отписались от ${peerUsername}` : 
        `Вы подписались на ${peerUsername}`,
    });
    
    // Update follower count
    if (isFollowing) {
      setPeerFollowers(prev => prev - 1);
    } else {
      setPeerFollowers(prev => prev + 1);
    }
  };
  
  const findNextPeer = () => {
    setIsSearching(true);
    setIsConnected(false);
    
    // Simulate finding a new peer
    setTimeout(() => {
      setIsSearching(false);
      setIsConnected(true);
      setIsFollowing(Math.random() > 0.7); // Randomly set following status for demo
    }, 2000);
  };
  
  const exitChat = () => {
    navigate('/');
  };

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden">
      {/* Remote Video */}
      <div className="w-full h-full">
        <div 
          id="remote-video" 
          className={`w-full h-full bg-gray-900 ${isVideoOff ? 'flex items-center justify-center' : ''}`}
        >
          {isVideoOff ? (
            <div className="text-center text-gray-400">
              <VideoOff size={48} className="mx-auto mb-2" />
              <p>Видео выключено</p>
            </div>
          ) : (
            <img 
              src="https://images.pexels.com/photos/1542085/pexels-photo-1542085.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              alt="Remote video" 
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Peer info overlay */}
          {isConnected && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg overflow-hidden">
              <div className="p-3 flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden mr-3">
                  <img 
                    src="https://i.pravatar.cc/100"
                    alt={peerUsername}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium">{peerUsername}</p>
                  <div className="flex items-center text-sm text-gray-300">
                    <Heart size={12} className="mr-1" />
                    <span>{peerFollowers} подписчиков</span>
                  </div>
                </div>
              </div>
              
              <Button 
                className={`w-full rounded-none ${isFollowing ? 'bg-gray-700 hover:bg-gray-600' : 'bg-primary'}`}
                onClick={handleFollow}
              >
                {isFollowing ? 'Отписаться' : 'Подписаться'}
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Local Video */}
      <div className="absolute bottom-24 right-4 w-[200px] h-[150px] rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg">
        <div className="w-full h-full bg-gray-800">
          <img 
            src="https://i.pravatar.cc/200"
            alt="You" 
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
          />
          {isVideoOff && (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <VideoOff size={24} />
            </div>
          )}
        </div>
        <div className="absolute top-1 right-1 bg-black bg-opacity-50 px-1 py-0.5 rounded text-white text-xs">
          {t('you')}
        </div>
      </div>
      
      {/* Match counter */}
      <div className="absolute top-6 left-0 right-0 flex justify-center items-center z-20">
        <MatchCounter value={matchTokens} />
      </div>
      
      {/* Searching overlay */}
      {isSearching && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10">
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin mx-auto"></div>
            </div>
            <p className="text-2xl font-bold text-white">
              {followedOnly ? 'Поиск среди подписок' : 'Поиск собеседника'}
            </p>
            <p className="text-gray-400 mt-2">
              {followedOnly ? 'Ищем кого-нибудь из тех, на кого вы подписаны' : 'Пожалуйста, подождите...'}
            </p>
          </div>
        </div>
      )}
      
      {/* Control panel */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center z-20">
        <div className="p-2 bg-black bg-opacity-50 rounded-full backdrop-blur-sm flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full bg-gray-800 hover:bg-gray-700 w-12 h-12"
            onClick={findNextPeer}
          >
            <ArrowRight className="text-white" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className={`rounded-full w-12 h-12 ${
              isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-800 hover:bg-gray-700'
            }`}
            onClick={toggleVideo}
          >
            <VideoOff className="text-white" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className={`rounded-full w-12 h-12 ${
              isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-800 hover:bg-gray-700'
            }`}
            onClick={toggleMute}
          >
            <MicOff className="text-white" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full bg-gray-800 hover:bg-gray-700 w-12 h-12"
            onClick={toggleFullscreen}
            disabled={!isConnected}
          >
            <Maximize2 className="text-white" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full bg-yellow-600 hover:bg-yellow-700 w-12 h-12"
            onClick={() => setIsBoostModalOpen(true)}
          >
            <Zap className="text-white" />
          </Button>
        </div>
      </div>
      
      {/* Camera expand error message */}
      {!hasFrontCamera && (
        <div className="absolute top-24 left-0 right-0 flex justify-center">
          <div className="bg-red-900 bg-opacity-80 text-white px-4 py-2 rounded-lg">
            У вас нет фронтальной камеры
          </div>
        </div>
      )}
      
      {/* Exit button */}
      <button 
        onClick={exitChat}
        className="absolute top-6 left-6 px-4 py-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-md text-white z-20"
      >
        ← {t('back')}
      </button>
      
      {/* Boost Modal */}
      <BoostModal 
        open={isBoostModalOpen} 
        onClose={() => setIsBoostModalOpen(false)} 
      />
    </div>
  );
};

export default EnhancedVideoChat;
