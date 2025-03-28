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
              AFRAME.registerComponent('pixel-stream', {
                init: function() {
                  this.cubes = [];
                  this.gridSize = 32; // 32x32 grid for performance
                  this.cubeSize = 0.1;
                  this.spacing = 0.15;
                  this.createGrid();
                  this.setupWebSocket();
                },
                createGrid: function() {
                  const scene = this.el;
                  const totalCubes = this.gridSize * this.gridSize;
                  
                  for (let i = 0; i < totalCubes; i++) {
                    const row = Math.floor(i / this.gridSize);
                    const col = i % this.gridSize;
                    
                    const x = (col - this.gridSize/2) * this.spacing;
                    const y = (row - this.gridSize/2) * this.spacing;
                    const z = -5;
                    
                    const cube = document.createElement('a-box');
                    cube.setAttribute('position', \`\${x} \${y} \${z}\`);
                    cube.setAttribute('width', this.cubeSize);
                    cube.setAttribute('height', this.cubeSize);
                    cube.setAttribute('depth', this.cubeSize);
                    cube.setAttribute('color', '#ffffff');
                    cube.setAttribute('material', 'opacity: 0.8');
                    
                    scene.appendChild(cube);
                    this.cubes.push(cube);
                  }
                },
                setupWebSocket: function() {
                  const ws = new WebSocket('ws://localhost:3000');
                  
                  ws.onmessage = (event) => {
                    const pixelData = JSON.parse(event.data);
                    this.updateCubes(pixelData);
                  };
                  
                  ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                  };
                },
                updateCubes: function(pixelData) {
                  pixelData.forEach((pixel, index) => {
                    if (index < this.cubes.length) {
                      this.cubes[index].setAttribute('color', pixel.color);
                    }
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
              
              <!-- Live Pixel Stream -->
              <a-entity pixel-stream></a-entity>

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