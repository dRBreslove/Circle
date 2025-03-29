import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Button, Text, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute } from '@react-navigation/native';
import { calculateCircleSync } from '../utils/continuom/sync';
import Logo from '../src/components/Logo';

const { width, height } = Dimensions.get('window');

const VRViewScreen = ({ route, navigation }) => {
  const { cameraPoints, circleMembers } = route.params;
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncReady, setIsSyncReady] = useState(false);
  const [syncPoint, setSyncPoint] = useState(null);
  const webViewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (circleMembers && circleMembers.length > 0) {
      const status = calculateCircleSync(circleMembers);
      setSyncStatus(status);
    }
  }, [circleMembers]);

  const handleSyncScene = () => {
    if (syncStatus && syncStatus.isComplete) {
      setIsSyncReady(true);
      // Initialize sync point at (0,0,0,0,0,0,0,0)
      setSyncPoint({
        x: 0, y: 0, z: 0,
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1
      });
    }
  };

  const generateVRScene = () => {
    const sceneHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Circle VR View</title>
          <script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>
          <script>
            AFRAME.registerComponent('sync-scene', {
              init: function() {
                this.socket = new WebSocket('ws://your-websocket-server');
                this.syncPoint = null;
                this.socket.onmessage = (event) => {
                  const data = JSON.parse(event.data);
                  this.updateScene(data);
                };
              },
              updateScene: function(data) {
                if (data.type === 'sync_init') {
                  this.initializeSyncPoint(data.syncPoint);
                } else if (data.type === 'sync') {
                  this.updatePositions(data.positions);
                  this.updateConnections(data.connections);
                  this.updateCircleStrength(data.circleStrength);
                }
              },
              initializeSyncPoint: function(syncPoint) {
                this.syncPoint = syncPoint;
                const scene = document.querySelector('a-scene');
                scene.setAttribute('position', '0 0 0');
                scene.setAttribute('rotation', '0 0 0');
                scene.setAttribute('scale', '1 1 1');
                
                // Reset all entities to sync point
                const entities = scene.querySelectorAll('a-entity');
                entities.forEach(entity => {
                  if (entity.id !== 'camera') {
                    entity.setAttribute('position', '0 0 0');
                    entity.setAttribute('rotation', '0 0 0');
                    entity.setAttribute('scale', '1 1 1');
                  }
                });
              },
              updatePositions: function(positions) {
                if (!this.syncPoint) return;
                
                positions.forEach(pos => {
                  const entity = document.getElementById(\`member-\${pos.id}\`);
                  if (entity) {
                    // Calculate position relative to sync point
                    const x = this.syncPoint.x + pos.x;
                    const y = this.syncPoint.y + pos.y;
                    const z = this.syncPoint.z + pos.z;
                    
                    entity.setAttribute('position', \`\${x} \${y} \${z}\`);
                    entity.setAttribute('color', pos.color);
                    entity.setAttribute('scale', \`\${pos.scale} \${pos.scale} \${pos.scale}\`);
                  }
                });
              },
              updateConnections: function(connections) {
                if (!this.syncPoint) return;
                
                connections.forEach(conn => {
                  const entity = document.getElementById(\`connection-\${conn.from}-\${conn.to}\`);
                  if (entity) {
                    // Calculate connection position relative to sync point
                    const x = this.syncPoint.x + conn.x;
                    const y = this.syncPoint.y + conn.y;
                    const z = this.syncPoint.z + conn.z;
                    
                    entity.setAttribute('position', \`\${x} \${y} \${z}\`);
                    entity.setAttribute('color', '#ffffff');
                    entity.setAttribute('opacity', conn.syncStrength);
                  }
                });
              },
              updateCircleStrength: function(strength) {
                const scene = document.querySelector('a-scene');
                scene.setAttribute('environment', {
                  preset: strength > 0.8 ? 'starry' : 'default',
                  fog: strength > 0.5 ? 'type: exponential; color: #000; density: 0.1;' : 'type: none;'
                });
              }
            });
          </script>
        </head>
        <body>
          <a-scene sync-scene>
            <a-sky color="#000000"></a-sky>
            <a-plane position="0 0 0" rotation="-90 0 0" width="30" height="30" color="#CCCCCC"></a-plane>
            
            ${syncStatus?.members.map(member => `
              <a-entity
                id="member-${member.id}"
                position="${member.position.cor.x} ${member.position.cor.y} ${member.position.cor.z}"
                color="#ffffff"
                scale="1 1 1"
                geometry="primitive: box; width: 1; height: 1; depth: 1"
                material="opacity: ${member.syncStrength}"
              ></a-entity>
            `).join('') || ''}

            ${syncStatus?.connections.map(conn => `
              <a-entity
                id="connection-${conn.from}-${conn.to}"
                position="${conn.x} ${conn.y} ${conn.z}"
                color="#ffffff"
                geometry="primitive: sphere; radius: 0.2"
                material="opacity: ${conn.syncStrength}"
              ></a-entity>
            `).join('') || ''}

            <a-entity camera></a-entity>
          </a-scene>
        </body>
      </html>
    `;

    return sceneHtml;
  };

  const handleWebViewLoad = () => {
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <Logo size={50} style={styles.logo} />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>VR View</Text>
      </View>

      {!isSyncReady && (
        <View style={styles.syncButtonContainer}>
          <Button 
            title="Sync Scene" 
            onPress={handleSyncScene}
            disabled={!syncStatus?.isComplete}
          />
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading VR Scene...</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ html: generateVRScene() }}
        style={styles.webview}
        onLoad={handleWebViewLoad}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        scrollEnabled={false}
      />
    </View>
  );
};

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
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  webview: {
    flex: 1,
    width: width,
    height: height - 100,
  },
  syncButtonContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
});

export default VRViewScreen;