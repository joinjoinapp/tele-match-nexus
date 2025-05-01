
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RefreshCcw, VideoOff, MicOff, Maximize2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const VideoChat: React.FC = () => {
  const [isSearching, setIsSearching] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [matchTokens, setMatchTokens] = useState(0);
  const [showCoin, setShowCoin] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const animateCoin = () => {
    setShowCoin(true);
    setTimeout(() => setShowCoin(false), 2000);
  };

  const startCounter = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setMatchTokens(prev => {
        if (prev % 5 === 0) {
          animateCoin();
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopCounter = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const setupMediaDevices = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      streamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Simulate connecting to another user after 3 seconds
      setTimeout(() => {
        simulateConnection();
      }, 3000);
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "Ошибка доступа к камере",
        description: "Проверьте разрешения и попробуйте снова",
        variant: "destructive",
      });
    }
  };

  const simulateConnection = () => {
    setIsSearching(false);
    setIsConnected(true);
    
    // Simulate remote video using the same stream (for demo purposes)
    if (remoteVideoRef.current && streamRef.current) {
      // In a real app, this would be the remote peer's stream
      // For demo, we're just using our own stream
      remoteVideoRef.current.srcObject = streamRef.current;
    }
    
    startCounter();
    
    toast({
      title: "Соединение установлено!",
      description: "Вы подключены к собеседнику",
    });
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const fullscreenVideo = () => {
    const videoElement = remoteVideoRef.current;
    if (!videoElement) return;
    
    if (videoElement.requestFullscreen) {
      videoElement.requestFullscreen();
    } else if ((videoElement as any).webkitRequestFullscreen) {
      (videoElement as any).webkitRequestFullscreen();
    } else if ((videoElement as any).mozRequestFullScreen) {
      (videoElement as any).mozRequestFullScreen();
    } else if ((videoElement as any).msRequestFullscreen) {
      (videoElement as any).msRequestFullscreen();
    }
  };

  const findNextPeer = () => {
    setIsConnected(false);
    setIsSearching(true);
    stopCounter();
    
    toast({
      title: "Поиск нового собеседника",
      description: "Ожидайте подключения...",
    });
    
    // Simulate finding a new peer after 2 seconds
    setTimeout(() => {
      simulateConnection();
    }, 2000);
  };

  const exitChat = () => {
    stopCounter();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    navigate('/');
  };

  useEffect(() => {
    setupMediaDevices();
    
    return () => {
      stopCounter();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const generateCoinPositions = () => {
    return {
      left: `${Math.random() * 80 + 10}%`,
      top: `${Math.random() * 30 + 10}%`,
    };
  };

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden">
      {/* Remote Video (full screen) */}
      <div className="video-container">
        <video 
          ref={remoteVideoRef}
          autoPlay 
          playsInline
          className={`w-full h-full object-cover ${isConnected ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Local Video (small overlay) */}
        <div className="local-video">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      
      {/* Match counter */}
      <div className="absolute top-6 left-0 right-0 flex justify-center items-center z-20">
        <div className="px-6 py-3 bg-black bg-opacity-50 rounded-full backdrop-blur-sm flex items-center">
          <span className="text-match font-bold text-2xl mr-2">$match</span>
          <span className="text-white text-2xl">{matchTokens}</span>
        </div>
      </div>
      
      {/* Coin animation */}
      {showCoin && (
        <div 
          className="coin animate-coin-float"
          style={generateCoinPositions()}
        >
          $
        </div>
      )}
      
      {/* Searching overlay */}
      {isSearching && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10">
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin mx-auto"></div>
            </div>
            <p className="text-2xl font-bold text-white">Поиск собеседника...</p>
            <p className="text-gray-400 mt-2">Пожалуйста, подождите</p>
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
            <RefreshCcw className="text-white" />
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
            onClick={fullscreenVideo}
          >
            <Maximize2 className="text-white" />
          </Button>
        </div>
      </div>
      
      {/* Exit button */}
      <button 
        onClick={exitChat}
        className="absolute top-6 left-6 px-4 py-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-md text-white z-20"
      >
        ← Назад
      </button>
    </div>
  );
};

export default VideoChat;
