import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const VRViewScreen = ({ route }) => {
  const { deviceLocation, orientation, zoomLevel, cameraPoints } = route.params;
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
              AFRAME.registerComponent('qubpix', {
                init: function() {
                  this.pixels = new Map(); // Store pixels by position
                  this.setupWebSocket();
                },
                setupWebSocket: function() {
                  const ws = new WebSocket('ws://localhost:3000');
                  
                  ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'stream_update') {
                      this.updatePositionPixels(data.pixelData);
                    } else if (data.type === 'stop_sharing') {
                      this.removePositionPixels(data.positionId);
                    }
                  };
                },
                updatePositionPixels: function(pixelData) {
                  // Group pixels by position
                  const positionPixels = new Map();
                  pixelData.forEach(pixel => {
                    const posId = pixel.position.id;
                    if (!positionPixels.has(posId)) {
                      positionPixels.set(posId, []);
                    }
                    positionPixels.get(posId).push(pixel);
                  });

                  // Update each position's pixels
                  positionPixels.forEach((pixels, posId) => {
                    this.updatePosition(posId, pixels);
                  });
                },
                updatePosition: function(positionId, pixels) {
                  // Remove existing pixels for this position
                  this.removePositionPixels(positionId);
                  
                  // Create new QubPix
                  const positionPixels = [];
                  pixels.forEach(pixel => {
                    const box = document.createElement('a-box');
                    box.setAttribute('position', \`\${pixel.x} \${pixel.y} \${pixel.z}\`);
                    box.setAttribute('width', '0.1');
                    box.setAttribute('height', '0.1');
                    box.setAttribute('depth', '0.1');
                    box.setAttribute('scale', \`\${pixel.scale} \${pixel.scale} \${pixel.scale}\`);
                    box.setAttribute('color', pixel.color);
                    box.setAttribute('material', \`opacity: \${pixel.intensity}\`);
                    
                    // Add hover effect
                    box.addEventListener('mouseenter', function() {
                      this.setAttribute('scale', \`\${pixel.scale * 1.2} \${pixel.scale * 1.2} \${pixel.scale * 1.2}\`);
                    });
                    box.addEventListener('mouseleave', function() {
                      this.setAttribute('scale', \`\${pixel.scale} \${pixel.scale} \${pixel.scale}\`);
                    });
                    
                    this.el.appendChild(box);
                    positionPixels.push(box);
                  });
                  
                  this.pixels.set(positionId, positionPixels);
                },
                removePositionPixels: function(positionId) {
                  const positionPixels = this.pixels.get(positionId);
                  if (positionPixels) {
                    positionPixels.forEach(pixel => {
                      pixel.parentNode.removeChild(pixel);
                    });
                    this.pixels.delete(positionId);
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
              
              <!-- QubPix -->
              <a-entity qubpix></a-entity>

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

  const getPositionColor = (position) => {
    // Return color based on position
    const colors = {
      'TopFrontRight': '#FF0000',
      'BottomFrontRight': '#FF3333',
      'TopBackRight': '#FF6666',
      'BottomBackRight': '#FF9999',
      'TopFrontLeft': '#0000FF',
      'BottomFrontLeft': '#3333FF',
      'TopBackLeft': '#6666FF',
      'BottomBackLeft': '#9999FF'
    };
    return colors[position.name] || '#FFFFFF';
  };

  const createGridEntity = (position, memberId) => {
    const gridSize = 32;
    const baseScale = position.perspective.scale;
    const depthFactor = position.perspective.depth;
    
    return {
      id: 'grid-' + memberId + '-' + position.id,
      primitive: 'box',
      width: gridSize,
      height: gridSize,
      depth: gridSize,
      position: {
        x: position.cor.x * gridSize * baseScale * (1 + depthFactor * 0.2),
        y: position.cor.y * gridSize * baseScale * (1 + depthFactor * 0.2),
        z: position.cor.z * gridSize * baseScale * (1 + depthFactor * 0.2)
      },
      scale: {
        x: baseScale * (1 - depthFactor * 0.1),
        y: baseScale * (1 - depthFactor * 0.1),
        z: baseScale * (1 - depthFactor * 0.1)
      },
      color: getPositionColor(position),
      opacity: 0.8,
      animation: {
        property: 'scale',
        from: baseScale * 0.8,
        to: baseScale * 1.2,
        dur: 2000,
        dir: 'alternate',
        loop: true
      }
    };
  };

  const createGridLines = (position, memberId) => {
    const gridSize = 32;
    const baseScale = position.perspective.scale;
    const depthFactor = position.perspective.depth;
    const lines = [];
    
    // Create perspective grid lines
    for (let i = 0; i < 3; i++) {
      const scale = baseScale * (1 - (i * 0.2)) * (1 - depthFactor * 0.1);
      const offset = i * 5;
      
      lines.push({
        id: 'grid-line-' + memberId + '-' + position.id + '-' + i,
        primitive: 'box',
        width: gridSize * scale,
        height: 0.5,
        depth: 0.5,
        position: {
          x: position.cor.x * gridSize * scale,
          y: position.cor.y * gridSize * scale + offset,
          z: position.cor.z * gridSize * scale
        },
        color: '#ffffff',
        opacity: 0.3 * (1 - i * 0.2)
      });
    }
    
    return lines;
  };

  const updateVRScene = (sharedPositions) => {
    const scene = document.querySelector('a-scene');
    if (!scene) return;

    // Clear existing entities
    const existingEntities = scene.querySelectorAll('[id^="grid-"]');
    existingEntities.forEach(entity => entity.remove());

    // Add new grid entities
    sharedPositions.forEach((position, memberId) => {
      const gridEntity = createGridEntity(position, memberId);
      const gridLines = createGridLines(position, memberId);
      
      // Add grid entity
      const entity = document.createElement('a-entity');
      Object.assign(entity, gridEntity);
      scene.appendChild(entity);
      
      // Add grid lines
      gridLines.forEach(line => {
        const lineEntity = document.createElement('a-entity');
        Object.assign(lineEntity, line);
        scene.appendChild(lineEntity);
      });
    });
  };

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