import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import {
  RTCPeerConnection,
  RTCView,
  mediaDevices,
} from 'react-native-webrtc';
import io from 'socket.io-client';
import Geolocation from '@react-native-community/geolocation';
import MapView, { Marker } from 'react-native-maps';
import { Camera } from 'expo-camera';
import { WebSocket } from 'react-native-websocket';
import Logo from '../src/components/Logo';

const socket = io('http://localhost:3000');
const { width } = Dimensions.get('window');

export default function CircleScreen({ route, navigation }) {
  const { faceKey } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [localStreams, setLocalStreams] = useState({ front: null, back: null });
  const [activeCamera, setActiveCamera] = useState('front');
  const [showMap, setShowMap] = useState(false);
  const [location, setLocation] = useState(null);
  const [remoteLocations, setRemoteLocations] = useState({});
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const locationWatchId = useRef(null);
  const peerConnections = useRef({});
  const localVideoRefs = useRef({ front: null, back: null });
  const mapRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [memberStreams, setMemberStreams] = useState({});
  const cameraRef = useRef(null);
  const wsRef = useRef(null);
  const streamInterval = useRef(null);
  const [frontCameraStream, setFrontCameraStream] = useState(null);
  const [backCameraStream, setBackCameraStream] = useState(null);
  const [peerFrontCameraStreams, setPeerFrontCameraStreams] = useState({});
  const [peerBackCameraStreams, setPeerBackCameraStreams] = useState({});
  const [displayMode, setDisplayMode] = useState('local'); // 'local', 'remote', 'continuom'
  const [selectedMember, setSelectedMember] = useState(null);
  const [cameraType, setCameraType] = useState('back'); // 'front' or 'back'
  const [localStream, setLocalStream] = useState(null);
  const [streams, setStreams] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [circleName, setCircleName] = useState('');
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    setupWebRTC();
    setupSocketListeners();
    setupCameras();
    setupWebSocket();
    return () => {
      // Cleanup
      Object.values(localStreams).forEach(stream => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      });
      Object.values(peerConnections.current).forEach(pc => pc.close());
      if (locationWatchId.current) {
        Geolocation.clearWatch(locationWatchId.current);
      }
      if (frontCameraStream) frontCameraStream.stopAsync();
      if (backCameraStream) backCameraStream.stopAsync();
      if (wsRef.current) wsRef.current.close();
      if (streamInterval.current) clearInterval(streamInterval.current);
    };
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const setupWebRTC = async () => {
    try {
      // Get front camera stream
      const frontStream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      // Get back camera stream
      const backStream = await mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setLocalStreams({ front: frontStream, back: backStream });
    } catch (err) {
      console.error('Error accessing media devices:', err);
    }
  };

  const setupSocketListeners = () => {
    socket.on('circle-created', ({ circleId, name }) => {
      setCircleName(name);
      setIsHost(true);
    });

    socket.on('circle-joined', ({ circleId, name, participants: existingParticipants }) => {
      setCircleName(name);
      setParticipants(existingParticipants);
    });

    socket.on('participant-joined', ({ participantId, stream }) => {
      setStreams(prev => [...prev, { id: participantId, stream }]);
    });

    socket.on('participant-left', ({ participantId }) => {
      setStreams(prev => prev.filter(s => s.id !== participantId));
      if (peerConnections.current[participantId]) {
        peerConnections.current[participantId].close();
        delete peerConnections.current[participantId];
      }
    });

    socket.on('member-joined', async ({ memberId }) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      peerConnections.current[memberId] = pc;

      // Add local streams
      Object.values(localStreams).forEach(stream => {
        if (stream) {
          stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
          });
        }
      });

      // Handle remote streams
      pc.ontrack = (event) => {
        const stream = event.streams[0];
        const isVideoTrack = event.track.kind === 'video';
        if (isVideoTrack) {
          setRemoteStreams(prev => ({
            ...prev,
            [memberId]: stream,
          }));
        }
      };

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', {
        target: memberId,
        offer: pc.localDescription,
      });
    });

    socket.on('offer', async ({ offer, from }) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      peerConnections.current[from] = pc;

      // Add local streams
      Object.values(localStreams).forEach(stream => {
        if (stream) {
          stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
          });
        }
      });

      // Handle remote streams
      pc.ontrack = (event) => {
        const stream = event.streams[0];
        const isVideoTrack = event.track.kind === 'video';
        if (isVideoTrack) {
          setRemoteStreams(prev => ({
            ...prev,
            [from]: stream,
          }));
        }
      };

      // Set remote description and create answer
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', {
        target: from,
        answer: pc.localDescription,
      });
    });

    socket.on('answer', async ({ answer, from }) => {
      const pc = peerConnections.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('ice-candidate', async ({ candidate, from }) => {
      const pc = peerConnections.current[from];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('location-update', ({ location, memberId }) => {
      setRemoteLocations(prev => ({
        ...prev,
        [memberId]: location,
      }));
    });

    socket.on('member-left', ({ memberId }) => {
      const pc = peerConnections.current[memberId];
      if (pc) {
        pc.close();
        delete peerConnections.current[memberId];
      }
      setRemoteLocations(prev => {
        const newLocations = { ...prev };
        delete newLocations[memberId];
        return newLocations;
      });
    });
  };

  const toggleCamera = () => {
    setActiveCamera(prev => prev === 'front' ? 'back' : 'front');
  };

  const toggleMap = () => {
    setShowMap(!showMap);
    if (!showMap && !isSharingLocation) {
      startLocationSharing();
    }
  };

  const fitMapToMarkers = () => {
    if (mapRef.current) {
      const markers = [
        ...Object.values(remoteLocations),
        ...(location ? [location] : []),
      ];
      if (markers.length > 0) {
        mapRef.current.fitToCoordinates(
          markers.map(m => [m.latitude, m.longitude]),
          {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          }
        );
      }
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: message,
        sender: 'me',
      };
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
    }
  };

  const setupCameras = async () => {
    try {
      // Setup front camera
      const frontCamera = await Camera.getAvailableCameraTypesAsync();
      const frontCameraType = frontCamera.find(type => type === Camera.Constants.Type.front);
      if (frontCameraType) {
        const frontStream = await Camera.createCameraAsync({
          type: Camera.Constants.Type.front,
          quality: Camera.Constants.VideoQuality['720p'],
        });
        setFrontCameraStream(frontStream);
      }

      // Setup back camera
      const backCameraType = frontCamera.find(type => type === Camera.Constants.Type.back);
      if (backCameraType) {
        const backStream = await Camera.createCameraAsync({
          type: Camera.Constants.Type.back,
          quality: Camera.Constants.VideoQuality['720p'],
        });
        setBackCameraStream(backStream);
      }
    } catch (error) {
      console.error('Error setting up cameras:', error);
    }
  };

  const setupWebSocket = () => {
    wsRef.current = new WebSocket('ws://localhost:3000');
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      wsRef.current.send(JSON.stringify({
        type: 'join_circle',
        circleId: faceKey
      }));
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'member_stream') {
        if (data.cameraType === 'front') {
          setPeerFrontCameraStreams(prev => ({
            ...prev,
            [data.memberId]: data.pixelData
          }));
        } else if (data.cameraType === 'back') {
          setPeerBackCameraStreams(prev => ({
            ...prev,
            [data.memberId]: data.pixelData
          }));
        }
      }
    };
  };

  const startLocationSharing = () => {
    setIsSharingLocation(true);
    locationWatchId.current = Geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
        };
        setLocation(newLocation);
        socket.emit('location-update', {
          location: newLocation,
          circleId: faceKey,
        });
      },
      (error) => Alert.alert('Error', error.message),
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: 5000, // Update every 5 seconds
        fastestInterval: 3000,
      }
    );
  };

  const stopLocationSharing = () => {
    setIsSharingLocation(false);
    if (locationWatchId.current) {
      Geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
    }
  };

  const startStreaming = async () => {
    if (!frontCameraStream || !backCameraStream || isStreaming) return;
    
    setIsStreaming(true);
    const gridSize = 32;
    
    streamInterval.current = setInterval(async () => {
      try {
        // Capture front camera
        const frontPhoto = await frontCameraStream.takePictureAsync({
          quality: 0.1,
          base64: true,
        });

        // Capture back camera
        const backPhoto = await backCameraStream.takePictureAsync({
          quality: 0.1,
          base64: true,
        });

        // Process and send both streams
        const processAndSendStream = async (photo, cameraType) => {
          const image = new Image();
          image.src = `data:image/jpeg;base64,${photo.base64}`;
          
          image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = gridSize;
            canvas.height = gridSize;
            
            ctx.drawImage(image, 0, 0, gridSize, gridSize);
            
            const pixelData = [];
            const imageData = ctx.getImageData(0, 0, gridSize, gridSize);
            
            for (let i = 0; i < imageData.data.length; i += 4) {
              pixelData.push({
                color: `#${[imageData.data[i], imageData.data[i+1], imageData.data[i+2]]
                  .map(x => x.toString(16).padStart(2, '0'))
                  .join('')}`
              });
            }
            
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'stream_update',
                circleId: faceKey,
                cameraType,
                pixelData
              }));
            }
          };
        };

        await Promise.all([
          processAndSendStream(frontPhoto, 'front'),
          processAndSendStream(backPhoto, 'back')
        ]);
      } catch (error) {
        console.error('Error capturing camera data:', error);
      }
    }, 100);
  };

  const stopStreaming = () => {
    if (streamInterval.current) {
      clearInterval(streamInterval.current);
      streamInterval.current = null;
    }
    setIsStreaming(false);
  };

  const switchDisplayMode = (mode) => {
    setDisplayMode(mode);
    if (mode === 'continuom') {
      navigation.navigate('VRView');
    }
  };

  const switchCamera = async () => {
    if (localStream) {
      const tracks = localStream.getTracks();
      tracks.forEach(track => track.stop());
    }

    const newCameraType = cameraType === 'front' ? 'back' : 'front';
    setCameraType(newCameraType);

    try {
      const constraints = {
        video: {
          facingMode: newCameraType,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      // Update stream in WebRTC connections
      Object.values(peerConnections.current).forEach(pc => {
        const senders = pc.getSenders();
        const videoSender = senders.find(sender => sender.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(stream.getVideoTracks()[0]);
        }
      });
    } catch (error) {
      console.error('Error switching camera:', error);
    }
  };

  const renderMainDisplay = () => {
    return (
      <View style={styles.mainVideoContainer}>
        <RTCView
          streamURL={displayMode === 'local' 
            ? localStreams.back?.toURL()  // Local mode: show user's back camera
            : remoteStreams[selectedMember]?.toURL()}  // Remote mode: show selected member's back camera
          style={styles.mainVideo}
          objectFit="cover"
        />
      </View>
    );
  };

  const renderFloatingFrame = () => {
    return (
      <View style={styles.floatingFrame}>
        <RTCView
          streamURL={displayMode === 'local'
            ? localStreams.front?.toURL()  // Local mode: show user's front camera
            : remoteStreams[selectedMember]?.toURL()}  // Remote mode: show selected member's front camera
          style={styles.floatingVideo}
          objectFit="cover"
        />
        <TouchableOpacity
          style={styles.switchCameraButton}
          onPress={() => setDisplayMode(prev => prev === 'local' ? 'remote' : 'local')}
        >
          <Text style={styles.buttonText}>Switch View</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMemberList = () => {
    return (
      <View style={styles.memberList}>
        {Object.keys(remoteStreams).map((memberId) => (
          <TouchableOpacity
            key={memberId}
            style={[
              styles.memberItem,
              selectedMember === memberId && styles.selectedMember
            ]}
            onPress={() => {
              setSelectedMember(memberId);
              setDisplayMode('remote');
            }}
          >
            <RTCView
              streamURL={remoteStreams[memberId]?.toURL()}
              style={styles.memberVideo}
              objectFit="cover"
            />
            <Text style={styles.memberName}>{memberId}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleLeaveCircle = () => {
    socket.emit('leave-circle');
    navigation.navigate('Home');
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Logo size={60} style={styles.logo} />
      <View style={styles.header}>
        <Text style={styles.circleName}>{circleName || 'Loading...'}</Text>
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveCircle}>
          <Text style={styles.leaveButtonText}>Leave Circle</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.videoContainer}>
        {renderMainDisplay()}
        {renderFloatingFrame()}
        
        {/* Control buttons */}
        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={[styles.switchButton, styles.mapButton]}
            onPress={toggleMap}
          >
            <Text style={styles.switchButtonText}>
              {showMap ? 'Show Video' : 'Show Map'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.chatContainer}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.messageContainer}>
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          )}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, isStreaming ? styles.stopButton : styles.startButton]} 
          onPress={isStreaming ? stopStreaming : startStreaming}
        >
          <Text style={styles.buttonText}>
            {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderMemberList()}

      <View style={styles.participantsList}>
        <Text style={styles.participantsTitle}>Participants ({participants.length})</Text>
        {participants.map(participant => (
          <Text key={participant.id} style={styles.participantName}>
            {participant.name}
          </Text>
        ))}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  logo: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  circleName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  leaveButton: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  leaveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  mainVideoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  mainVideo: {
    width: '100%',
    height: '100%',
  },
  floatingFrame: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingVideo: {
    width: '100%',
    height: '100%',
  },
  controlButtons: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
  },
  switchButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 25,
    marginLeft: 10,
  },
  mapButton: {
    backgroundColor: isSharingLocation ? 'rgba(0,122,255,0.5)' : 'rgba(0,0,0,0.5)',
  },
  switchButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    maxWidth: '80%',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pixelGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pixel: {
    width: '12.5%', // 8x8 grid (32/4 for performance)
    height: '12.5%',
  },
  memberList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    backgroundColor: '#1a1a1a',
  },
  memberItem: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#333',
  },
  selectedMember: {
    borderColor: '#007AFF',
  },
  memberVideo: {
    width: '100%',
    height: '100%',
  },
  memberName: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    color: '#fff',
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 2,
    borderRadius: 4,
  },
  switchCameraButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    padding: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 18,
  },
  participantsList: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  participantsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  participantName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
}); 