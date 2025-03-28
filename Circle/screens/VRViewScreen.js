import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const VRViewScreen = ({ route }) => {
  const { deviceLocation, orientation, zoomLevel } = route.params;
  const [vrScene, setVrScene] = useState('');
  const webViewRef = useRef(null);

  useEffect(() => {
    const generateVRScene = () => {
      const scene = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Circle VR View</title>
            <script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>
            <script>
              AFRAME.registerComponent('continuom-pixels', {
                init: function() {
                  this.pixels = new Map(); // Store pixels by memberId
                  this.setupWebSocket();
                },
                setupWebSocket: function() {
                  const ws = new WebSocket('ws://localhost:3000');
                  
                  ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'possys_shared') {
                      this.updateMemberPixels(data.memberId, data.pixelData);
                    } else if (data.type === 'possys_stopped') {
                      this.removeMemberPixels(data.memberId);
                    }
                  };
                },
                updateMemberPixels: function(memberId, pixelData) {
                  // Remove existing pixels for this member
                  this.removeMemberPixels(memberId);
                  
                  // Create new pixels
                  const memberPixels = [];
                  pixelData.forEach(pixel => {
                    const box = document.createElement('a-box');
                    box.setAttribute('position', \`\${pixel.x} \${pixel.y} \${pixel.z}\`);
                    box.setAttribute('width', '0.1');
                    box.setAttribute('height', '0.1');
                    box.setAttribute('depth', '0.1');
                    box.setAttribute('color', pixel.color);
                    box.setAttribute('material', \`opacity: \${pixel.intensity}\`);
                    
                    // Add hover effect
                    box.addEventListener('mouseenter', function() {
                      this.setAttribute('scale', '1.2 1.2 1.2');
                    });
                    box.addEventListener('mouseleave', function() {
                      this.setAttribute('scale', '1 1 1');
                    });
                    
                    this.el.appendChild(box);
                    memberPixels.push(box);
                  });
                  
                  this.pixels.set(memberId, memberPixels);
                },
                removeMemberPixels: function(memberId) {
                  const memberPixels = this.pixels.get(memberId);
                  if (memberPixels) {
                    memberPixels.forEach(pixel => {
                      pixel.parentNode.removeChild(pixel);
                    });
                    this.pixels.delete(memberId);
                  }
                }
              });
            </script>
          </head>
          <body>
            <a-scene>
              <!-- Environment -->
              <a-sky color="#ECECEC"></a-sky>
              <a-plane position="0 0 0" rotation="-90 0 0" width="30" height="30" color="#CCCCCC"></a-plane>
              
              <!-- Continuom Pixels -->
              <a-entity continuom-pixels></a-entity>

              <!-- Camera -->
              <a-entity position="0 1.6 3">
                <a-camera></a-camera>
              </a-entity>
            </a-scene>
          </body>
        </html>
      `;
      setVrScene(scene);
    };

    generateVRScene();
  }, []);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: vrScene }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});

export default VRViewScreen; 