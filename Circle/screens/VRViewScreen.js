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
                  this.pixels = [];
                  this.setupWebSocket();
                },
                setupWebSocket: function() {
                  const ws = new WebSocket('ws://localhost:3000');
                  
                  ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'stream_update') {
                      this.updatePixels(data.pixelData);
                    }
                  };
                },
                updatePixels: function(pixelData) {
                  // Remove existing pixels
                  this.pixels.forEach(pixel => {
                    if (pixel.el) {
                      pixel.el.parentNode.removeChild(pixel.el);
                    }
                  });
                  
                  this.pixels = [];
                  
                  // Create new pixels
                  pixelData.forEach(pixel => {
                    const box = document.createElement('a-box');
                    box.setAttribute('position', \`\${pixel.x} \${pixel.y} \${pixel.z}\`);
                    box.setAttribute('width', '0.1');
                    box.setAttribute('height', '0.1');
                    box.setAttribute('depth', '0.1');
                    box.setAttribute('color', pixel.color);
                    box.setAttribute('material', \`opacity: \${pixel.intensity}\`);
                    
                    this.el.appendChild(box);
                    this.pixels.push({ el: box, data: pixel });
                  });
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