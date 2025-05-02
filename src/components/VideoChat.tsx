
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RefreshCcw, VideoOff, MicOff, Maximize2, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Utility function for logging with timestamps
const logWithTime = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
};

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
  const [signalChannel, setSignalChannel] = useState<any>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [connectionState, setConnectionState] = useState<string>('new');
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Add logging function to track app events
  const addLog = (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    setDebugLogs(prev => [logEntry, ...prev].slice(0, 50)); // Keep last 50 logs
    
    if (level === 'error') {
      console.error(message);
    } else if (level === 'warn') {
      console.warn(message);
    }
  };

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
  
  // Enhanced WebRTC configuration with more STUN servers
  const RTCconfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
      { urls: "stun:stun.stunprotocol.org:3478" },
      { urls: "stun:stun.ekiga.net:3478" },
      { urls: "stun:openrelay.metered.ca:80" }
    ],
    iceCandidatePoolSize: 10,
    sdpSemantics: 'unified-plan'
  };

  // Unified function to create peer connections with consistent event handling
  const createPeerConnection = () => {
    addLog("Creating new RTCPeerConnection");
    const pc = new RTCPeerConnection(RTCconfig);
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addLog(`Generated ICE candidate: ${event.candidate.candidate.substring(0, 50)}...`);
        const otherUserId = onlineUsers.find(id => id !== currentUserId);
        if (otherUserId && signalChannel) {
          addLog(`Sending ICE candidate to: ${otherUserId.substring(0, 8)}...`);
          signalChannel.send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: {
              candidate: event.candidate,
              from: currentUserId,
              target: otherUserId
            }
          });
        } else {
          addLog("Cannot send ICE candidate: missing otherUserId or signalChannel", "warn");
        }
      }
    };
    
    pc.oniceconnectionstatechange = () => {
      addLog(`ICE connection state changed to: ${pc.iceConnectionState}`);
      setConnectionState(pc.iceConnectionState);
      
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        if (connectionAttempts < 5) {
          addLog(`Connection attempt ${connectionAttempts + 1} failed, retrying...`, "warn");
          setConnectionAttempts(prev => prev + 1);
          
          // Close the current connection and try again after a delay
          pc.close();
          setTimeout(() => {
            const isInitiator = currentUserId && otherUserId ? currentUserId < otherUserId : false;
            const otherUserId = onlineUsers.find(id => id !== currentUserId);
            
            if (otherUserId) {
              initiateCall(isInitiator);
            } else {
              addLog("No other user available to connect to", "warn");
            }
          }, 1000);
        } else {
          addLog("Max connection attempts reached, giving up", "error");
          handleDisconnect(true);
          toast({
            title: "Не удалось установить соединение",
            description: "Сетевое соединение не удается установить. Возможно проблемы с NAT или брандмауэром",
            variant: "destructive",
          });
        }
      } else if (pc.iceConnectionState === 'connected') {
        addLog("ICE connection established successfully!");
        setIsSearching(false);
        setIsConnected(true);
      }
    };
    
    pc.onconnectionstatechange = () => {
      addLog(`Connection state changed to: ${pc.connectionState}`);
      
      if (pc.connectionState === 'connected') {
        addLog("Peer connection established successfully!");
        sonnerToast.success("Соединение установлено!");
      }
    };
    
    pc.onsignalingstatechange = () => {
      addLog(`Signaling state changed to: ${pc.signalingState}`);
    };
    
    pc.ontrack = (event) => {
      addLog(`Received remote track: ${event.track.kind}`);
      if (remoteVideoRef.current && event.streams[0]) {
        addLog("Setting remote video stream");
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsSearching(false);
        setIsConnected(true);
        startCounter();
        
        toast({
          title: "Соединение установлено!",
          description: "Вы подключены к собеседнику",
        });
      } else {
        addLog("Cannot set remote stream: missing remoteVideoRef or stream", "error");
      }
    };
    
    return pc;
  };

  // Enhanced presence system with better error handling
  useEffect(() => {
    const checkSession = async () => {
      if (!user) {
        addLog("No authenticated user, redirecting to login", "warn");
        navigate('/');
        toast({
          title: "Требуется авторизация",
          description: "Для использования видеочата необходимо войти в систему",
          variant: "destructive",
        });
        return;
      }
      
      setCurrentUserId(user.id);
      addLog(`Current user authenticated: ${user.id.substring(0, 8)}...`);
      
      // Setup presence
      setupPresence(user.id);
    };
    
    checkSession();
    
    return () => {
      cleanup();
    };
  }, [user, navigate]);
  
  const cleanup = () => {
    addLog("Cleaning up resources");
    
    if (currentChannel) {
      addLog("Removing presence channel");
      supabase.removeChannel(currentChannel);
    }
    
    if (signalChannel) {
      addLog("Removing signal channel");
      supabase.removeChannel(signalChannel);
    }
    
    if (peerConnection) {
      addLog("Closing peer connection");
      peerConnection.close();
    }
    
    stopCounter();
    
    if (localStreamRef.current) {
      addLog("Stopping local media tracks");
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };
  
  const setupPresence = (userId: string) => {
    addLog(`Setting up presence for user: ${userId.substring(0, 8)}...`);
    
    // Create presence channel with better error handling
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
        addLog(`Presence sync - Online users: ${userIds.length}`);
        setOnlineUsers(userIds);
        
        // If there are only 2 users online, establish connection
        if (userIds.length === 2 && userIds.includes(userId) && !isConnected) {
          const otherUserId = userIds.find(id => id !== userId);
          if (otherUserId) {
            addLog(`Two users online, initiating call between ${userId.substring(0, 8)}... and ${otherUserId.substring(0, 8)}...`);
            initiateCall(userId < otherUserId);
          }
        } else if (userIds.length < 2 && isConnected) {
          addLog("Less than 2 users online, disconnecting", "warn");
          handleDisconnect();
        } else if (userIds.length > 2) {
          addLog(`${userIds.length} users online, waiting for connection pairing`);
        }
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        addLog(`User joined: ${key.substring(0, 8)}...`);
        toast({
          title: "Пользователь онлайн",
          description: `ID: ${key.substring(0, 8)}...`,
        });
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        addLog(`User left: ${key.substring(0, 8)}...`, "warn");
        if (isConnected) {
          handleDisconnect();
        }
      })
      .subscribe(async (status) => {
        addLog(`Presence channel status: ${status}`);
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
            .then(() => addLog("Presence tracked successfully"))
            .catch(error => addLog(`Error tracking presence: ${error.message}`, "error"));
        }
      });
    
    // Create signaling channel for WebRTC
    const signalChan = supabase.channel('webrtc-signaling');
    
    signalChan.on(
      'broadcast',
      { event: 'offer' },
      async ({ payload }) => {
        addLog(`Received offer from: ${payload.from.substring(0, 8)}...`);
        if (payload.target === userId) {
          handleOffer(payload.offer, payload.from);
        }
      }
    ).on(
      'broadcast',
      { event: 'answer' },
      async ({ payload }) => {
        addLog(`Received answer from: ${payload.from.substring(0, 8)}...`);
        if (payload.target === userId) {
          handleAnswer(payload.answer);
        }
      }
    ).on(
      'broadcast',
      { event: 'ice-candidate' },
      async ({ payload }) => {
        addLog(`Received ICE candidate from: ${payload.from.substring(0, 8)}...`);
        if (payload.target === userId) {
          handleIceCandidate(payload.candidate);
        }
      }
    ).subscribe((status) => {
      addLog(`Signal channel status: ${status}`);
    });
    
    setCurrentChannel(channel);
    setSignalChannel(signalChan);
    
    // Setup media devices
    setupMediaDevices();
  };
  
  const setupMediaDevices = async () => {
    try {
      addLog("Setting up media devices");
      
      // Request permissions with constraints that work across browsers
      const constraints = {
        audio: true,
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      addLog(`Got media stream with ${stream.getVideoTracks().length} video and ${stream.getAudioTracks().length} audio tracks`);
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // Always mute local video to prevent echo
        addLog("Local video stream set up successfully");
      } else {
        addLog("No local video element reference available", "warn");
      }
      
    } catch (error: any) {
      addLog(`Error accessing media devices: ${error.message}`, "error");
      console.error('Error accessing media devices:', error);
      
      toast({
        title: "Ошибка доступа к камере",
        description: "Проверьте разрешения и попробуйте снова",
        variant: "destructive",
      });
      
      // Try again with just audio if video fails
      try {
        addLog("Retrying with audio only");
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = audioStream;
        setIsVideoOff(true);
        
        toast({
          title: "Видео недоступно",
          description: "Используется только аудио",
        });
      } catch (audioError) {
        addLog(`Failed to get even audio: ${(audioError as any).message}`, "error");
      }
    }
  };
  
  const initiateCall = async (isInitiator: boolean) => {
    if (!localStreamRef.current) {
      addLog("No local stream available", "error");
      return;
    }
    
    addLog(`Initiating call as ${isInitiator ? 'initiator' : 'receiver'}`);
    
    // Create new RTC connection using the unified function
    const pc = createPeerConnection();
    setPeerConnection(pc);
    
    // Add local tracks to the connection
    try {
      localStreamRef.current.getTracks().forEach(track => {
        if (localStreamRef.current) {
          addLog(`Adding ${track.kind} track to peer connection`);
          pc.addTrack(track, localStreamRef.current);
        }
      });
    } catch (error) {
      addLog(`Error adding tracks to peer connection: ${(error as Error).message}`, "error");
      return;
    }
    
    // If initiator, create and send offer
    if (isInitiator && currentUserId) {
      try {
        addLog("Creating offer as initiator");
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        
        addLog(`Created offer: ${JSON.stringify(offer).substring(0, 100)}...`);
        
        await pc.setLocalDescription(offer);
        addLog("Local description set");
        
        const otherUserId = onlineUsers.find(id => id !== currentUserId);
        if (otherUserId && signalChannel) {
          addLog(`Sending offer to: ${otherUserId.substring(0, 8)}...`);
          signalChannel.send({
            type: 'broadcast',
            event: 'offer',
            payload: {
              offer: offer,
              from: currentUserId,
              target: otherUserId
            }
          });
        } else {
          addLog("Cannot send offer: missing otherUserId or signalChannel", "warn");
        }
      } catch (error) {
        addLog(`Error creating or sending offer: ${(error as Error).message}`, "error");
        console.error('Error creating offer:', error);
      }
    }
  };
  
  const handleOffer = async (offer: RTCSessionDescriptionInit, fromUserId: string) => {
    if (!localStreamRef.current) {
      addLog("No local stream available when handling offer", "error");
      return;
    }
    
    addLog(`Handling offer from: ${fromUserId.substring(0, 8)}...`);
    
    // Create new RTC connection for answer using the unified function
    const pc = createPeerConnection();
    setPeerConnection(pc);
    
    // Add local tracks to the connection
    try {
      localStreamRef.current.getTracks().forEach(track => {
        if (localStreamRef.current) {
          addLog(`Adding ${track.kind} track to peer connection as answerer`);
          pc.addTrack(track, localStreamRef.current);
        }
      });
    } catch (error) {
      addLog(`Error adding tracks to peer connection: ${(error as Error).message}`, "error");
      return;
    }
    
    // Set remote description (offer) with error handling
    try {
      addLog("Setting remote description (offer)");
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      addLog("Remote description set");
      
      // Create answer
      addLog("Creating answer");
      const answer = await pc.createAnswer();
      addLog(`Created answer: ${JSON.stringify(answer).substring(0, 100)}...`);
      
      await pc.setLocalDescription(answer);
      addLog("Local description set");
      
      if (signalChannel) {
        addLog(`Sending answer to: ${fromUserId.substring(0, 8)}...`);
        signalChannel.send({
          type: 'broadcast',
          event: 'answer',
          payload: {
            answer: answer,
            from: currentUserId,
            target: fromUserId
          }
        });
      } else {
        addLog("Cannot send answer: missing signalChannel", "warn");
      }
    } catch (error) {
      addLog(`Error handling offer or creating answer: ${(error as Error).message}`, "error");
      console.error('Error handling offer or creating answer:', error);
    }
  };
  
  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (peerConnection) {
      try {
        addLog("Setting remote description (answer)");
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        addLog("Remote description (answer) set successfully");
      } catch (error) {
        addLog(`Error handling answer: ${(error as Error).message}`, "error");
        console.error('Error handling answer:', error);
      }
    } else {
      addLog("Cannot handle answer: no peer connection", "warn");
    }
  };
  
  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (peerConnection) {
      try {
        addLog(`Adding ICE candidate: ${JSON.stringify(candidate).substring(0, 100)}...`);
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        addLog("ICE candidate added successfully");
      } catch (error) {
        addLog(`Error adding ICE candidate: ${(error as Error).message}`, "error");
        console.error('Error adding ICE candidate:', error);
      }
    } else {
      addLog("Cannot add ICE candidate: no peer connection", "warn");
    }
  };

  const handleDisconnect = (forceReset = false) => {
    addLog(`Disconnecting${forceReset ? ' (forced)' : ''}`);
    setIsConnected(false);
    setIsSearching(true);
    
    if (!forceReset) {
      setConnectionAttempts(0);
    }
    
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
      description: forceReset ? "Не удалось установить соединение" : "Собеседник отключился",
    });
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
        addLog(`Audio track ${track.id} ${track.enabled ? 'enabled' : 'disabled'}`);
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
        addLog(`Video track ${track.id} ${track.enabled ? 'enabled' : 'disabled'}`);
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
    handleDisconnect();
    setIsSearching(true);
    setConnectionAttempts(0);
    
    toast({
      title: "Поиск нового собеседника",
      description: "Ожидайте подключения...",
    });
  };

  const exitChat = () => {
    stopCounter();
    cleanup();
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
            <p className="text-gray-500 mt-1">
              {`Онлайн пользователей: ${onlineUsers.length}`}
            </p>
            {connectionAttempts > 0 && (
              <p className="text-yellow-400 mt-2">
                Попытка соединения: {connectionAttempts}/5
              </p>
            )}
            {connectionState !== 'new' && (
              <p className="text-blue-400 mt-2">
                Состояние соединения: {connectionState}
              </p>
            )}
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
          
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full bg-gray-800 hover:bg-gray-700 w-12 h-12"
            onClick={() => setShowDebug(!showDebug)}
          >
            <Info className="text-white" />
          </Button>
        </div>
      </div>
      
      {/* Debug overlay */}
      {showDebug && (
        <div className="absolute right-4 top-4 bg-black bg-opacity-70 p-2 rounded-lg text-xs text-white w-80 h-60 overflow-auto z-30">
          <h3 className="font-bold mb-1">Debug Info:</h3>
          <p>User ID: {currentUserId?.substring(0, 8)}...</p>
          <p>Online Users: {onlineUsers.length}</p>
          <p>Connection State: {connectionState}</p>
          <p>Connection Attempts: {connectionAttempts}</p>
          <div className="mt-2">
            <h4 className="font-bold">Logs:</h4>
            <div className="text-xs h-32 overflow-y-auto">
              {debugLogs.map((log, i) => (
                <div key={i} className="text-gray-300">{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}
      
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
