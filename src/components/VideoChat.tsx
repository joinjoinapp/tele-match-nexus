
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RefreshCcw, VideoOff, MicOff, Maximize2, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLocalization } from '@/hooks/useLocalization';

// Utility function for logging with timestamps
const logWithTime = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
};

// Enhanced WebRTC configuration with STUN and TURN servers
const RTCconfig = {
  iceServers: [
    // STUN servers
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun.stunprotocol.org:3478" },
    { urls: "stun:stun.ekiga.net:3478" },
    { urls: "stun:openrelay.metered.ca:80" },
    // TURN server
    {
      urls: "turn:85.193.95.115:3478",
      username: "telematch",
      credential: "Gh2kHDu827dh2ndhfhqq"
    }
  ],
  iceCandidatePoolSize: 10,
  sdpSemantics: 'unified-plan'
};

const VideoChat: React.FC = () => {
  const { t, language } = useLocalization();
  const [isSearching, setIsSearching] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [matchTokens, setMatchTokens] = useState(0);
  const [showCoin, setShowCoin] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [peerConnections, setPeerConnections] = useState<Map<string, RTCPeerConnection>>(new Map());
  const [currentChannel, setCurrentChannel] = useState<any>(null);
  const [signalChannel, setSignalChannel] = useState<any>(null);
  const [connectionAttempts, setConnectionAttempts] = useState<Map<string, number>>(new Map());
  const [connectionStates, setConnectionStates] = useState<Map<string, string>>(new Map());
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [availableDevices, setAvailableDevices] = useState<{
    videoDevices: MediaDeviceInfo[],
    audioDevices: MediaDeviceInfo[]
  }>({ videoDevices: [], audioDevices: [] });
  const [selectedDevices, setSelectedDevices] = useState<{
    videoDevice: string | null,
    audioDevice: string | null
  }>({ videoDevice: null, audioDevice: null });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement | null>>(new Map());
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

  // Create peer connection and set up event handlers
  const createPeerConnection = (peerId: string) => {
    addLog(`Creating new RTCPeerConnection with peer: ${peerId.substring(0, 8)}...`);
    
    // Create a new peer connection with STUN/TURN config
    const pc = new RTCPeerConnection(RTCconfig);
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addLog(`Generated ICE candidate for peer ${peerId.substring(0, 8)}...: ${event.candidate.candidate.substring(0, 50)}...`);
        
        if (signalChannel && currentUserId) {
          addLog(`Sending ICE candidate to: ${peerId.substring(0, 8)}...`);
          signalChannel.send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: {
              candidate: event.candidate,
              from: currentUserId,
              target: peerId
            }
          });
        } else {
          addLog("Cannot send ICE candidate: missing signalChannel or currentUserId", "warn");
        }
      }
    };
    
    pc.oniceconnectionstatechange = () => {
      addLog(`ICE connection state changed for peer ${peerId.substring(0, 8)}...: ${pc.iceConnectionState}`);
      setConnectionStates(prev => new Map(prev).set(peerId, pc.iceConnectionState));
      
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        const attempts = connectionAttempts.get(peerId) || 0;
        
        if (attempts < 5) {
          addLog(`Connection attempt ${attempts + 1} with peer ${peerId.substring(0, 8)}... failed, retrying...`, "warn");
          setConnectionAttempts(prev => new Map(prev).set(peerId, attempts + 1));
          
          // Close the current connection and try again after a delay
          pc.close();
          setTimeout(() => {
            // Check if the peer is still online
            if (onlineUsers.includes(peerId)) {
              const isInitiator = currentUserId && currentUserId < peerId;
              initiateCallWithPeer(peerId, isInitiator);
            } else {
              addLog(`Peer ${peerId.substring(0, 8)}... is no longer online`, "warn");
              handlePeerDisconnect(peerId);
            }
          }, 1000);
        } else {
          addLog(`Max connection attempts reached with peer ${peerId.substring(0, 8)}..., giving up`, "error");
          handlePeerDisconnect(peerId);
          toast({
            title: t('connectionFailed'),
            description: t('connectionFailedDesc'),
            variant: "destructive",
          });
        }
      } else if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        addLog(`ICE connection established successfully with peer ${peerId.substring(0, 8)}...!`);
        if (!connectedPeers.includes(peerId)) {
          setConnectedPeers(prev => [...prev, peerId]);
        }
        setIsSearching(false);
        setIsConnected(true);
        
        // Start counter only once when the first peer is connected
        if (connectedPeers.length === 0) {
          startCounter();
        }
      }
    };
    
    pc.onconnectionstatechange = () => {
      addLog(`Connection state changed for peer ${peerId.substring(0, 8)}...: ${pc.connectionState}`);
      
      if (pc.connectionState === 'connected') {
        addLog(`Peer connection established successfully with ${peerId.substring(0, 8)}...!`);
        sonnerToast.success(t('connectionEstablished'));
      }
    };
    
    pc.onsignalingstatechange = () => {
      addLog(`Signaling state changed for peer ${peerId.substring(0, 8)}...: ${pc.signalingState}`);
    };
    
    pc.ontrack = (event) => {
      addLog(`Received remote track from peer ${peerId.substring(0, 8)}...: ${event.track.kind}`);
      
      // Get the video element for this peer
      const videoElement = document.getElementById(`remote-video-${peerId}`) as HTMLVideoElement;
      
      if (videoElement && event.streams && event.streams[0]) {
        addLog(`Setting remote video stream for peer ${peerId.substring(0, 8)}...`);
        videoElement.srcObject = event.streams[0];
        videoElement.play().catch(e => addLog(`Error playing remote video: ${e.message}`, "error"));
        
        setIsSearching(false);
        setIsConnected(true);
        
        // If this is our first connection, start the counter
        if (connectedPeers.length === 0) {
          startCounter();
        }
        
        if (!connectedPeers.includes(peerId)) {
          setConnectedPeers(prev => [...prev, peerId]);
          
          toast({
            title: t('connectionEstablished'),
            description: t('peerConnected'),
          });
        }
      } else {
        addLog(`Cannot set remote stream for peer ${peerId.substring(0, 8)}...: missing video element or stream`, "error");
      }
    };
    
    // Add local stream to the peer connection
    if (localStreamRef.current) {
      addLog(`Adding local stream tracks to peer connection for peer ${peerId.substring(0, 8)}...`);
      localStreamRef.current.getTracks().forEach(track => {
        if (localStreamRef.current) {
          addLog(`Adding ${track.kind} track to peer connection for peer ${peerId.substring(0, 8)}...`);
          pc.addTrack(track, localStreamRef.current);
        }
      });
    } else {
      addLog(`No local stream available for peer ${peerId.substring(0, 8)}...`, "warn");
      // Try to initialize media first and retry
      setupMediaDevices().then(() => {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            if (localStreamRef.current) {
              addLog(`Adding ${track.kind} track after init to peer connection for peer ${peerId.substring(0, 8)}...`);
              pc.addTrack(track, localStreamRef.current);
            }
          });
        }
      });
    }
    
    return pc;
  };

  // Setup user presence and signaling
  useEffect(() => {
    const checkSession = async () => {
      if (!user) {
        addLog("No authenticated user, redirecting to login", "warn");
        navigate('/');
        toast({
          title: t('authRequired'),
          description: t('authRequiredDesc'),
          variant: "destructive",
        });
        return;
      }
      
      setCurrentUserId(user.id);
      addLog(`Current user authenticated: ${user.id.substring(0, 8)}...`);
      
      // Setup presence
      setupPresence(user.id);
      
      // Enumerate devices
      enumerateDevices();
    };
    
    checkSession();
    
    return () => {
      cleanup();
    };
  }, [user, navigate, language]);
  
  // Enumerate available media devices
  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      addLog(`Found ${videoDevices.length} video devices and ${audioDevices.length} audio devices`);
      
      setAvailableDevices({
        videoDevices,
        audioDevices
      });
      
      // Set default devices if not set already
      if (!selectedDevices.videoDevice && videoDevices.length > 0) {
        setSelectedDevices(prev => ({
          ...prev,
          videoDevice: videoDevices[0].deviceId
        }));
      }
      
      if (!selectedDevices.audioDevice && audioDevices.length > 0) {
        setSelectedDevices(prev => ({
          ...prev,
          audioDevice: audioDevices[0].deviceId
        }));
      }
    } catch (error) {
      addLog(`Error enumerating devices: ${(error as Error).message}`, "error");
    }
  };
  
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
    
    // Close all peer connections
    peerConnections.forEach((pc, peerId) => {
      addLog(`Closing peer connection with ${peerId.substring(0, 8)}...`);
      pc.close();
    });
    
    setPeerConnections(new Map());
    
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
        
        // Connect to all online users except ourselves
        const otherUsers = userIds.filter(id => id !== userId);
        
        if (otherUsers.length > 0) {
          addLog(`Other users online: ${otherUsers.length}`);
          
          // Check for new users to connect to
          otherUsers.forEach(otherId => {
            if (!peerConnections.has(otherId)) {
              addLog(`New user detected: ${otherId.substring(0, 8)}..., initiating call`);
              const isInitiator = userId < otherId;
              initiateCallWithPeer(otherId, isInitiator);
            }
          });
          
          // Check for users we're connected to who went offline
          peerConnections.forEach((_, peerId) => {
            if (!userIds.includes(peerId)) {
              addLog(`User ${peerId.substring(0, 8)}... went offline, closing connection`);
              handlePeerDisconnect(peerId);
            }
          });
        }
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        addLog(`User joined: ${key.substring(0, 8)}...`);
        toast({
          title: t('userOnline'),
          description: `ID: ${key.substring(0, 8)}...`,
        });
        
        // If new user joined, initiate call if we're the initiator
        if (key !== userId) {
          const isInitiator = userId < key;
          if (isInitiator) {
            addLog(`We are the initiator for user ${key.substring(0, 8)}...`);
            initiateCallWithPeer(key, true);
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        addLog(`User left: ${key.substring(0, 8)}...`, "warn");
        handlePeerDisconnect(key);
      })
      .subscribe(async (status) => {
        addLog(`Presence channel status: ${status}`);
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
            .then(() => addLog("Presence tracked successfully"))
            .catch(error => addLog(`Error tracking presence: ${error.message}`, "error"));
          
          // Setup media devices after presence is established
          await setupMediaDevices();
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
          handleAnswer(payload.answer, payload.from);
        }
      }
    ).on(
      'broadcast',
      { event: 'ice-candidate' },
      async ({ payload }) => {
        addLog(`Received ICE candidate from: ${payload.from.substring(0, 8)}...`);
        if (payload.target === userId) {
          handleIceCandidate(payload.candidate, payload.from);
        }
      }
    ).subscribe((status) => {
      addLog(`Signal channel status: ${status}`);
    });
    
    setCurrentChannel(channel);
    setSignalChannel(signalChan);
  };
  
  const setupMediaDevices = async () => {
    try {
      addLog("Setting up media devices");
      
      // Request permissions with constraints that work across browsers
      const constraints = {
        audio: selectedDevices.audioDevice ? { deviceId: { exact: selectedDevices.audioDevice } } : true,
        video: selectedDevices.videoDevice ? {
          deviceId: { exact: selectedDevices.videoDevice },
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 }
        } : {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      addLog(`Got media stream with ${stream.getVideoTracks().length} video and ${stream.getAudioTracks().length} audio tracks`);
      
      // If we had a previous stream, stop all tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // Always mute local video to prevent echo
        addLog("Local video stream set up successfully");
      } else {
        addLog("No local video element reference available", "warn");
      }
      
      // Update peer connections with new tracks if already connected
      peerConnections.forEach((pc, peerId) => {
        addLog(`Updating tracks for peer ${peerId.substring(0, 8)}...`);
        
        // Remove old tracks
        const senders = pc.getSenders();
        senders.forEach(sender => {
          pc.removeTrack(sender);
        });
        
        // Add new tracks
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
        
        // Renegotiate if needed after track change
        if (currentUserId && currentUserId < peerId) {
          renegotiateConnection(pc, peerId);
        }
      });
      
      return stream;
    } catch (error: any) {
      addLog(`Error accessing media devices: ${error.message}`, "error");
      console.error('Error accessing media devices:', error);
      
      toast({
        title: t('cameraAccessError'),
        description: t('checkPermissions'),
        variant: "destructive",
      });
      
      // Try again with just audio if video fails
      try {
        addLog("Retrying with audio only");
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = audioStream;
        setIsVideoOff(true);
        
        toast({
          title: t('videoUnavailable'),
          description: t('audioOnlyMode'),
        });
        
        return audioStream;
      } catch (audioError) {
        addLog(`Failed to get even audio: ${(audioError as any).message}`, "error");
        throw audioError;
      }
    }
  };
  
  const renegotiateConnection = async (pc: RTCPeerConnection, peerId: string) => {
    try {
      addLog(`Renegotiating connection with peer ${peerId.substring(0, 8)}...`);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (signalChannel && currentUserId) {
        signalChannel.send({
          type: 'broadcast',
          event: 'offer',
          payload: {
            offer: offer,
            from: currentUserId,
            target: peerId
          }
        });
      }
    } catch (error) {
      addLog(`Error renegotiating connection: ${(error as Error).message}`, "error");
    }
  };
  
  const initiateCallWithPeer = async (peerId: string, isInitiator: boolean) => {
    addLog(`Initiating call with peer ${peerId.substring(0, 8)}... as ${isInitiator ? 'initiator' : 'receiver'}`);
    
    // Create new RTC connection for this peer
    const pc = createPeerConnection(peerId);
    
    // Store the connection
    setPeerConnections(prev => {
      const newConnections = new Map(prev);
      newConnections.set(peerId, pc);
      return newConnections;
    });
    
    // Set initial connection attempts
    setConnectionAttempts(prev => {
      const newAttempts = new Map(prev);
      newAttempts.set(peerId, 0);
      return newAttempts;
    });
    
    // If initiator, create and send offer
    if (isInitiator && currentUserId) {
      try {
        addLog(`Creating offer as initiator for peer ${peerId.substring(0, 8)}...`);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        
        addLog(`Created offer for peer ${peerId.substring(0, 8)}...: ${JSON.stringify(offer).substring(0, 100)}...`);
        
        await pc.setLocalDescription(offer);
        addLog(`Local description set for peer ${peerId.substring(0, 8)}...`);
        
        if (signalChannel) {
          addLog(`Sending offer to peer: ${peerId.substring(0, 8)}...`);
          signalChannel.send({
            type: 'broadcast',
            event: 'offer',
            payload: {
              offer: offer,
              from: currentUserId,
              target: peerId
            }
          });
        } else {
          addLog("Cannot send offer: missing signalChannel", "warn");
        }
      } catch (error) {
        addLog(`Error creating or sending offer to peer ${peerId.substring(0, 8)}...: ${(error as Error).message}`, "error");
        console.error('Error creating offer:', error);
      }
    }
  };
  
  const handleOffer = async (offer: RTCSessionDescriptionInit, fromUserId: string) => {
    addLog(`Handling offer from peer: ${fromUserId.substring(0, 8)}...`);
    
    // Ensure we have local media before answering
    if (!localStreamRef.current) {
      addLog("Local media not initialized, setting up before answering offer", "warn");
      try {
        await setupMediaDevices();
      } catch (error) {
        addLog(`Failed to set up media before answering: ${(error as Error).message}`, "error");
      }
    }
    
    // Create or get the peer connection
    let pc = peerConnections.get(fromUserId);
    
    if (!pc) {
      addLog(`Creating new peer connection for offer from ${fromUserId.substring(0, 8)}...`);
      pc = createPeerConnection(fromUserId);
      
      setPeerConnections(prev => {
        const newConnections = new Map(prev);
        newConnections.set(fromUserId, pc);
        return newConnections;
      });
    }
    
    // Set remote description (offer) with error handling
    try {
      addLog(`Setting remote description (offer) for peer ${fromUserId.substring(0, 8)}...`);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      addLog(`Remote description set for peer ${fromUserId.substring(0, 8)}...`);
      
      // Create answer
      addLog(`Creating answer for peer ${fromUserId.substring(0, 8)}...`);
      const answer = await pc.createAnswer();
      addLog(`Created answer for peer ${fromUserId.substring(0, 8)}...: ${JSON.stringify(answer).substring(0, 100)}...`);
      
      await pc.setLocalDescription(answer);
      addLog(`Local description set for peer ${fromUserId.substring(0, 8)}...`);
      
      if (signalChannel && currentUserId) {
        addLog(`Sending answer to peer: ${fromUserId.substring(0, 8)}...`);
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
        addLog("Cannot send answer: missing signalChannel or currentUserId", "warn");
      }
    } catch (error) {
      addLog(`Error handling offer or creating answer for peer ${fromUserId.substring(0, 8)}...: ${(error as Error).message}`, "error");
      console.error('Error handling offer or creating answer:', error);
    }
  };
  
  const handleAnswer = async (answer: RTCSessionDescriptionInit, fromUserId: string) => {
    addLog(`Handling answer from peer: ${fromUserId.substring(0, 8)}...`);
    
    const pc = peerConnections.get(fromUserId);
    
    if (pc) {
      try {
        addLog(`Setting remote description (answer) for peer ${fromUserId.substring(0, 8)}...`);
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        addLog(`Remote description (answer) set successfully for peer ${fromUserId.substring(0, 8)}...`);
      } catch (error) {
        addLog(`Error handling answer from peer ${fromUserId.substring(0, 8)}...: ${(error as Error).message}`, "error");
        console.error('Error handling answer:', error);
      }
    } else {
      addLog(`Cannot handle answer: no peer connection for peer ${fromUserId.substring(0, 8)}...`, "warn");
    }
  };
  
  const handleIceCandidate = async (candidate: RTCIceCandidateInit, fromUserId: string) => {
    addLog(`Handling ICE candidate from peer: ${fromUserId.substring(0, 8)}...`);
    
    const pc = peerConnections.get(fromUserId);
    
    if (pc) {
      try {
        addLog(`Adding ICE candidate from peer ${fromUserId.substring(0, 8)}...: ${JSON.stringify(candidate).substring(0, 100)}...`);
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        addLog(`ICE candidate added successfully for peer ${fromUserId.substring(0, 8)}...`);
      } catch (error) {
        addLog(`Error adding ICE candidate from peer ${fromUserId.substring(0, 8)}...: ${(error as Error).message}`, "error");
        console.error('Error adding ICE candidate:', error);
      }
    } else {
      addLog(`Cannot add ICE candidate: no peer connection for peer ${fromUserId.substring(0, 8)}...`, "warn");
    }
  };

  const handlePeerDisconnect = (peerId: string) => {
    addLog(`Disconnecting from peer: ${peerId.substring(0, 8)}...`);
    
    // Close the peer connection
    const pc = peerConnections.get(peerId);
    if (pc) {
      pc.close();
    }
    
    // Remove from connected peers
    setConnectedPeers(prev => prev.filter(id => id !== peerId));
    
    // Remove from peer connections
    setPeerConnections(prev => {
      const newConnections = new Map(prev);
      newConnections.delete(peerId);
      return newConnections;
    });
    
    // Remove from connection attempts
    setConnectionAttempts(prev => {
      const newAttempts = new Map(prev);
      newAttempts.delete(peerId);
      return newAttempts;
    });
    
    // Remove from connection states
    setConnectionStates(prev => {
      const newStates = new Map(prev);
      newStates.delete(peerId);
      return newStates;
    });
    
    // If no more peers connected, stop counter and set state
    if (connectedPeers.length <= 1) {
      stopCounter();
      setIsConnected(false);
      setIsSearching(true);
      
      toast({
        title: t('connectionClosed'),
        description: t('peerDisconnected'),
      });
    }
  };

  const handleFullDisconnect = (forceReset = false) => {
    addLog(`Full disconnection${forceReset ? ' (forced)' : ''}`);
    
    // Close all peer connections
    peerConnections.forEach((pc, peerId) => {
      pc.close();
    });
    
    // Reset all state
    setPeerConnections(new Map());
    setConnectionAttempts(new Map());
    setConnectionStates(new Map());
    setConnectedPeers([]);
    setIsConnected(false);
    setIsSearching(true);
    
    stopCounter();
    
    toast({
      title: t('connectionClosed'),
      description: forceReset ? t('connectionFailedDesc') : t('allPeersDisconnected'),
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

  const fullscreenVideo = (peerId?: string) => {
    // If no peer ID is provided, use the first connected peer
    const targetPeerId = peerId || connectedPeers[0];
    
    if (!targetPeerId) return;
    
    const videoElement = document.getElementById(`remote-video-${targetPeerId}`) as HTMLVideoElement;
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

  const switchDevice = async (type: 'audio' | 'video', deviceId: string) => {
    addLog(`Switching ${type} device to ${deviceId}`);
    
    setSelectedDevices(prev => ({
      ...prev,
      [type === 'audio' ? 'audioDevice' : 'videoDevice']: deviceId
    }));
    
    // Restart media stream with new device
    await setupMediaDevices();
  };

  const findNextPeer = () => {
    handleFullDisconnect();
    setIsSearching(true);
    
    toast({
      title: t('searchingNewPeer'),
      description: t('waitingForConnection'),
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
      {/* Remote Videos Grid */}
      <div className="video-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-2 h-full">
        {connectedPeers.length === 0 ? (
          <div className="col-span-full h-full">
            <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-white text-center">
                <p className="text-2xl font-bold">{t('noPeersConnected')}</p>
                <p className="text-gray-400">{t('waitingForPeers')}</p>
              </div>
            </div>
          </div>
        ) : (
          connectedPeers.map(peerId => (
            <div key={peerId} className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video
                id={`remote-video-${peerId}`}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded-md text-white text-xs">
                {peerId.substring(0, 8)}...
              </div>
              <button
                onClick={() => fullscreenVideo(peerId)}
                className="absolute top-2 right-2 bg-black bg-opacity-50 p-1 rounded-full"
                title={t('fullscreen')}
              >
                <Maximize2 size={16} className="text-white" />
              </button>
            </div>
          ))
        )}
      </div>
      
      {/* Local Video (small overlay) */}
      <div className="absolute bottom-24 right-4 w-[200px] h-[150px] rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg">
        <video 
          ref={localVideoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-1 right-1 bg-black bg-opacity-50 px-1 py-0.5 rounded text-white text-xs">
          {t('you')}
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
            <p className="text-2xl font-bold text-white">{t('searchingPeer')}</p>
            <p className="text-gray-400 mt-2">
              {onlineUsers.length > 1 
                ? t('foundPotentialPeer')
                : t('waitingForUsers')}
            </p>
            <p className="text-gray-500 mt-1">
              {t('onlineUsers', { count: onlineUsers.length })}
            </p>
            {connectionAttempts.size > 0 && Array.from(connectionAttempts.entries()).some(([_, attempts]) => attempts > 0) && (
              <div className="mt-2">
                {Array.from(connectionAttempts.entries())
                  .filter(([_, attempts]) => attempts > 0)
                  .map(([peerId, attempts]) => (
                    <p key={peerId} className="text-yellow-400">
                      {t('connectionAttempt', { peer: peerId.substring(0, 8), attempt: attempts, max: 5 })}
                    </p>
                  ))}
              </div>
            )}
            {connectionStates.size > 0 && (
              <div className="mt-2">
                {Array.from(connectionStates.entries()).map(([peerId, state]) => (
                  <p key={peerId} className="text-blue-400">
                    {t('connectionState', { peer: peerId.substring(0, 8), state })}
                  </p>
                ))}
              </div>
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
            onClick={() => fullscreenVideo()}
            disabled={connectedPeers.length === 0}
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
          <h3 className="font-bold mb-1">{t('debugInfo')}:</h3>
          <p>{t('userId')}: {currentUserId?.substring(0, 8)}...</p>
          <p>{t('onlineUsers')}: {onlineUsers.length}</p>
          <p>{t('connectedPeers')}: {connectedPeers.length}</p>
          <p>{t('language')}: {language}</p>
          <div className="mt-2">
            <h4 className="font-bold">{t('logs')}:</h4>
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
        ← {t('back')}
      </button>
    </div>
  );
};

export default VideoChat;
