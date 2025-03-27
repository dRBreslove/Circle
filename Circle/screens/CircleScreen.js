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

const socket = io('http://localhost:3000');
const { width } = Dimensions.get('window');

export default function CircleScreen({ route }) {
  const { faceKey } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState([]);
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

  useEffect(() => {
    setupWebRTC();
    setupSocketListeners();
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
    };
  }, []);

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
          setRemoteStreams(prev => [...prev, stream]);
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
          setRemoteStreams(prev => [...prev, stream]);
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.videoContainer}>
        {showMap ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: location?.latitude || 37.78825,
              longitude: location?.longitude || -122.4324,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            onMapReady={fitMapToMarkers}
          >
            {location && (
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title="You"
                pinColor="#007AFF"
              />
            )}
            {Object.entries(remoteLocations).map(([memberId, loc]) => (
              <Marker
                key={memberId}
                coordinate={{
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                }}
                title={`Member ${memberId.slice(0, 4)}`}
                pinColor="#FF3B30"
              />
            ))}
          </MapView>
        ) : (
          <View style={styles.mainVideoArea}>
            {remoteStreams.map((stream, index) => (
              <RTCView
                key={index}
                streamURL={stream.toURL()}
                style={styles.remoteVideo}
              />
            ))}
          </View>
        )}

        {/* Local video bubble overlay */}
        {localStreams.front && (
          <View style={styles.localVideoBubble}>
            <RTCView
              ref={ref => localVideoRefs.current.front = ref}
              streamURL={localStreams.front.toURL()}
              style={styles.localVideo}
            />
          </View>
        )}

        {/* Control buttons */}
        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={toggleCamera}
          >
            <Text style={styles.switchButtonText}>
              Switch Camera
            </Text>
          </TouchableOpacity>

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  mainVideoArea: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  remoteVideo: {
    width: width / 2,
    height: width / 2,
    backgroundColor: '#2c2c2c',
  },
  localVideoBubble: {
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
  localVideo: {
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
}); 