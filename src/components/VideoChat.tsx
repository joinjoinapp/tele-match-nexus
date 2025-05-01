
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RefreshCcw, VideoOff, MicOff, Maximize2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const VideoChat: React.FC = () => {
  const [isSearching, setIsSearching] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [matchTokens, setMatchTokens] = useState(0);
  const [showCoin, setShowCoin] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [currentChannel, setCurrentChannel] = useState<any>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
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
  
  // Конфигурация WebRTC
  const RTCconfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
    ]
  };

  // Обработка присутствия пользователей
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        toast({
          title: "Требуется авторизация",
          description: "Для использования видеочата необходимо войти в систему",
          variant: "destructive",
        });
        return;
      }
      setCurrentUserId(session.user.id);
      
      // Настройка присутствия
      setupPresence(session.user.id);
    };
    
    checkSession();
    
    return () => {
      if (currentChannel) {
        supabase.removeChannel(currentChannel);
      }
      if (peerConnection) {
        peerConnection.close();
      }
      stopCounter();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  const setupPresence = (userId: string) => {
    // Создаем канал присутствия
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: userId,
        },
      },
    });
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userIds = Object.keys(state);
        setOnlineUsers(userIds);
        
        // Если есть только 2 пользователя онлайн, устанавливаем соединение
        if (userIds.length === 2 && userIds.includes(userId) && !isConnected) {
          const otherUserId = userIds.find(id => id !== userId);
          if (otherUserId) {
            initiateCall(userId < otherUserId);
          }
        } else if (userIds.length < 2 && isConnected) {
          handleDisconnect();
        }
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        toast({
          title: "Пользователь онлайн",
          description: `ID: ${key.substring(0, 8)}...`,
        });
      })
      .on('presence', { event: 'leave' }, () => {
        if (isConnected) {
          handleDisconnect();
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });
    
    // Создаем канал для сигналов WebRTC
    const signalChannel = supabase.channel('webrtc-signaling');
    
    signalChannel.on(
      'broadcast',
      { event: 'offer' },
      async ({ payload }) => {
        if (payload.target === userId) {
          handleOffer(payload.offer, payload.from);
        }
      }
    ).on(
      'broadcast',
      { event: 'answer' },
      async ({ payload }) => {
        if (payload.target === userId) {
          handleAnswer(payload.answer);
        }
      }
    ).on(
      'broadcast',
      { event: 'ice-candidate' },
      async ({ payload }) => {
        if (payload.target === userId) {
          handleIceCandidate(payload.candidate);
        }
      }
    ).subscribe();
    
    setCurrentChannel(signalChannel);
    
    // Инициализируем медиа устройства
    setupMediaDevices();
  };
  
  const setupMediaDevices = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "Ошибка доступа к камере",
        description: "Проверьте разрешения и попробуйте снова",
        variant: "destructive",
      });
    }
  };
  
  const initiateCall = async (isInitiator: boolean) => {
    if (!localStreamRef.current) return;
    
    // Создаем новое RTC соединение
    const pc = new RTCPeerConnection(RTCconfig);
    setPeerConnection(pc);
    
    // Добавляем локальное видео в соединение
    localStreamRef.current.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!);
    });
    
    // Обрабатываем получение медиапотока от удаленного пользователя
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsSearching(false);
        setIsConnected(true);
        startCounter();
        
        toast({
          title: "Соединение установлено!",
          description: "Вы подключены к собеседнику",
        });
      }
    };
    
    // Обработка ICE кандидатов
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const otherUserId = onlineUsers.find(id => id !== currentUserId);
        if (otherUserId) {
          currentChannel.send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: {
              candidate: event.candidate,
              from: currentUserId,
              target: otherUserId
            }
          });
        }
      }
    };
    
    // Инициатор создает предложение
    if (isInitiator && currentUserId) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        const otherUserId = onlineUsers.find(id => id !== currentUserId);
        if (otherUserId) {
          currentChannel.send({
            type: 'broadcast',
            event: 'offer',
            payload: {
              offer: offer,
              from: currentUserId,
              target: otherUserId
            }
          });
        }
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    }
  };
  
  const handleOffer = async (offer: RTCSessionDescriptionInit, fromUserId: string) => {
    if (!localStreamRef.current) return;
    
    // Создаем новое RTC соединение для ответа
    const pc = new RTCPeerConnection(RTCconfig);
    setPeerConnection(pc);
    
    // Добавляем локальное видео в соединение
    localStreamRef.current.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!);
    });
    
    // Обрабатываем получение медиапотока от удаленного пользователя
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsSearching(false);
        setIsConnected(true);
        startCounter();
        
        toast({
          title: "Соединение установлено!",
          description: "Вы подключены к собеседнику",
        });
      }
    };
    
    // Обработка ICE кандидатов
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        currentChannel.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            candidate: event.candidate,
            from: currentUserId,
            target: fromUserId
          }
        });
      }
    };
    
    // Устанавливаем удаленное описание (offer)
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    
    // Создаем ответ
    try {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      currentChannel.send({
        type: 'broadcast',
        event: 'answer',
        payload: {
          answer: answer,
          from: currentUserId,
          target: fromUserId
        }
      });
    } catch (error) {
      console.error('Error creating answer:', error);
    }
  };
  
  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  };
  
  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setIsSearching(true);
    stopCounter();
    
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    toast({
      title: "Соединение разорвано",
      description: "Собеседник отключился",
    });
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
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
    // В будущей реализации здесь будет логика для отключения от текущего
    // собеседника и поиска другого
    handleDisconnect();
    
    // Для демонстрации просто показываем поиск снова
    setIsSearching(true);
    
    toast({
      title: "Поиск нового собеседника",
      description: "Ожидайте подключения...",
    });
  };

  const exitChat = () => {
    stopCounter();
    
    if (peerConnection) {
      peerConnection.close();
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (currentChannel) {
      supabase.removeChannel(currentChannel);
    }
    
    navigate('/');
  };

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
        <div className="absolute bottom-24 right-4 w-[200px] h-[150px] rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg">
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
            <p className="text-gray-400 mt-2">
              {onlineUsers.length > 1 
                ? "Найден подходящий собеседник, устанавливаем соединение..."
                : "Ожидаем других пользователей..."}
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
