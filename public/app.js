// Import Three.js for 3D visualization
import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';

// Constants for the Continuom structure
const CUBE_SIZE = 10;
const NODE_SIZE = 0.5;
const HEART_SIZE = 1;
const TETRA_SIZE = 2;

// Color palette
const COLORS = {
    diamond: 0x00ffff,
    gold: 0xffd700,
    carbon: 0x333333,
    ruby: 0xff3366,
    tetra: 0x4a90e2
};

// Main class for the Continuom visualization
class ContinuomVisualizer {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('continuomCanvas'), antialias: true });
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.nodes = [];
        this.connections = [];
        this.videoTexture = null;
        this.videoPlane = null;
        this.tetras = [];
        this.floatingFrame = null;
        
        this.init();
    }

    createTetrahedron(position, rotation) {
        const geometry = new THREE.TetrahedronGeometry(TETRA_SIZE);
        const material = new THREE.MeshPhongMaterial({
            color: COLORS.tetra,
            transparent: true,
            opacity: 0.7,
            wireframe: true
        });
        const tetra = new THREE.Mesh(geometry, material);
        tetra.position.copy(position);
        tetra.rotation.copy(rotation);
        return tetra;
    }

    createTetrahedrons() {
        // Define the 8 tetrahedron positions and rotations
        const tetraConfigs = [
            { pos: [2, 2, 2], rot: [0, 0, 0] },      // RightFrontUp
            { pos: [2, -2, 2], rot: [0, Math.PI, 0] }, // RightFrontDown
            { pos: [2, 2, -2], rot: [0, Math.PI/2, 0] }, // RightBackUp
            { pos: [2, -2, -2], rot: [0, -Math.PI/2, 0] }, // RightBackDown
            { pos: [-2, 2, 2], rot: [0, Math.PI, 0] }, // LeftFrontUp
            { pos: [-2, -2, 2], rot: [0, 0, 0] },     // LeftFrontDown
            { pos: [-2, 2, -2], rot: [0, -Math.PI/2, 0] }, // LeftBackUp
            { pos: [-2, -2, -2], rot: [0, Math.PI/2, 0] }  // LeftBackDown
        ];

        // Create and add each tetrahedron
        tetraConfigs.forEach(config => {
            const tetra = this.createTetrahedron(
                new THREE.Vector3(...config.pos),
                new THREE.Euler(...config.rot)
            );
            this.tetras.push(tetra);
            this.scene.add(tetra);
        });
    }

    init() {
        // Setup renderer with transparency
        this.renderer.setSize(window.innerWidth * 0.8, 500);
        this.renderer.setClearColor(0x000000, 0); // Transparent background

        // Setup camera to view the center
        this.camera.position.set(0, 0, 20);
        this.camera.lookAt(0, 0, 0);

        // Setup controls
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.target.set(0, 0, 0);
        this.controls.minDistance = 10;
        this.controls.maxDistance = 30;

        // Create the Continuom structure
        this.createCube();
        this.createNodes();
        this.createConnections();
        this.createHeart();
        this.createTetrahedrons();
        this.createVideoPlane();

        // Add event listeners
        this.setupEventListeners();

        // Start animation loop
        this.animate();
    }

    createCube() {
        const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
        const material = new THREE.MeshPhongMaterial({
            color: COLORS.diamond,
            transparent: true,
            opacity: 0.3,
            wireframe: true,
        });
        const cube = new THREE.Mesh(geometry, material);
        this.scene.add(cube);
    }

    createNodes() {
        // Create nodes for each face of the cube
        for (let face = 0; face < 6; face++) {
            for (let i = 0; i < 9; i++) {
                const geometry = new THREE.SphereGeometry(NODE_SIZE, 32, 32);
                const material = new THREE.MeshPhongMaterial({ color: COLORS.gold });
                const node = new THREE.Mesh(geometry, material);

                // Position nodes based on face and grid position
                const position = this.calculateNodePosition(face, i);
                node.position.set(position.x, position.y, position.z);
                
                this.nodes.push(node);
                this.scene.add(node);
            }
        }
    }

    calculateNodePosition(face, index) {
        const halfSize = CUBE_SIZE / 2;
        const positions = {
            x: 0,
            y: 0,
            z: 0,
        };

        // Calculate grid position
        const row = Math.floor(index / 3);
        const col = index % 3;
        const offset = (row - 1) * 0.5;
        const colOffset = (col - 1) * 0.5;

        // Position based on face
        switch (face) {
            case 0: // Front
                positions.x = offset * CUBE_SIZE;
                positions.y = colOffset * CUBE_SIZE;
                positions.z = halfSize;
                break;
            case 1: // Back
                positions.x = offset * CUBE_SIZE;
                positions.y = colOffset * CUBE_SIZE;
                positions.z = -halfSize;
                break;
            case 2: // Top
                positions.x = offset * CUBE_SIZE;
                positions.y = halfSize;
                positions.z = colOffset * CUBE_SIZE;
                break;
            case 3: // Bottom
                positions.x = offset * CUBE_SIZE;
                positions.y = -halfSize;
                positions.z = colOffset * CUBE_SIZE;
                break;
            case 4: // Right
                positions.x = halfSize;
                positions.y = offset * CUBE_SIZE;
                positions.z = colOffset * CUBE_SIZE;
                break;
            case 5: // Left
                positions.x = -halfSize;
                positions.y = offset * CUBE_SIZE;
                positions.z = colOffset * CUBE_SIZE;
                break;
        }

        return positions;
    }

    createConnections() {
        // Create connections from each node to the center
        this.nodes.forEach(node => {
            const geometry = new THREE.CylinderGeometry(0.05, 0.05, 10, 8);
            const material = new THREE.MeshPhongMaterial({ color: COLORS.carbon });
            const connection = new THREE.Mesh(geometry, material);
            
            // Position and rotate connection to point to center
            connection.position.copy(node.position).multiplyScalar(0.5);
            connection.lookAt(0, 0, 0);
            
            this.connections.push(connection);
            this.scene.add(connection);
        });
    }

    createHeart() {
        // Create a simple heart shape using basic geometries
        const heartGroup = new THREE.Group();
        
        // Main heart shape
        const heartGeometry = new THREE.SphereGeometry(HEART_SIZE, 32, 32);
        const heartMaterial = new THREE.MeshPhongMaterial({ color: COLORS.ruby });
        const heart = new THREE.Mesh(heartGeometry, heartMaterial);
        
        // Add some glow effect
        const glowGeometry = new THREE.SphereGeometry(HEART_SIZE * 1.2, 32, 32);
        const glowMaterial = new THREE.MeshPhongMaterial({
            color: COLORS.ruby,
            transparent: true,
            opacity: 0.3,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        
        heartGroup.add(heart);
        heartGroup.add(glow);
        this.scene.add(heartGroup);
    }

    createVideoPlane() {
        // Create a video texture
        const video = document.getElementById('cameraFeed');
        this.videoTexture = new THREE.VideoTexture(video);
        this.videoTexture.minFilter = THREE.LinearFilter;
        this.videoTexture.magFilter = THREE.LinearFilter;
        this.videoTexture.format = THREE.RGBFormat;

        // Create a large background plane for the main display
        const bgGeometry = new THREE.PlaneGeometry(40, 40);
        const bgMaterial = new THREE.MeshBasicMaterial({
            map: this.videoTexture,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        this.videoPlane = new THREE.Mesh(bgGeometry, bgMaterial);
        this.videoPlane.position.set(0, 0, -10); // Place it behind everything
        this.scene.add(this.videoPlane);

        // Create a floating frame for the camera feed
        const frameGeometry = new THREE.PlaneGeometry(8, 8);
        const frameMaterial = new THREE.MeshBasicMaterial({
            map: this.videoTexture,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        this.floatingFrame = new THREE.Mesh(frameGeometry, frameMaterial);
        this.floatingFrame.position.set(15, 10, -5); // Position it in the top-right
        this.scene.add(this.floatingFrame);
    }

    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            const width = window.innerWidth * 0.8;
            const height = 500;
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });

        // Handle control buttons
        document.getElementById('rotateBtn').addEventListener('click', () => {
            this.controls.autoRotate = !this.controls.autoRotate;
        });

        document.getElementById('zoomBtn').addEventListener('click', () => {
            this.camera.position.z *= 0.8;
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.camera.position.set(0, 0, 20);
            this.controls.reset();
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update video textures
        if (this.videoTexture) {
            this.videoTexture.needsUpdate = true;
        }

        // Animate tetrahedrons
        this.tetras.forEach(tetra => {
            tetra.rotation.y += 0.002;
        });

        // Animate floating frame
        if (this.floatingFrame) {
            this.floatingFrame.position.y = 10 + Math.sin(Date.now() * 0.001) * 0.2;
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the visualization when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const visualizer = new ContinuomVisualizer();
    let cameraStream = null;

    // Function to initialize camera
    async function initializeCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: false
            });
            const videoElement = document.getElementById('cameraFeed');
            videoElement.srcObject = stream;
            cameraStream = stream;
        } catch (err) {
            console.error('Error accessing camera:', err);
        }
    }

    // Function to stop camera
    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
    }

    // Add event listeners for the hero section buttons
    document.getElementById('enterFieldBtn').addEventListener('click', async () => {
        // Smooth scroll to the visualization section
        document.getElementById('visualization').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
        // Add a special effect to the visualization
        visualizer.scene.background = new THREE.Color(0x000000);
        visualizer.camera.position.set(0, 0, 15);
        visualizer.controls.autoRotate = true;
        visualizer.controls.autoRotateSpeed = 2.0;

        // Initialize camera
        await initializeCamera();
    });

    // Stop camera when leaving the page
    window.addEventListener('beforeunload', stopCamera);

    document.getElementById('exploreBtn').addEventListener('click', () => {
        document.getElementById('overview').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });

    document.getElementById('learnMoreBtn').addEventListener('click', () => {
        document.getElementById('structure').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });
}); 