class WebGLView {
    constructor(app) {
        this.app = app;
        this.webGLService = new WebGLService();
        this.isInitialized = false;
        this.animationFrame = null;
        this.models = new Map();
        this.currentModel = null;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
    }

    init() {
        try {
            this.webGLService = new WebGLService();
            this.webGLService.init('webgl-canvas');
            this.loadDefaultModels();
            this.setupEventListeners();
            this.startAnimation();
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize WebGL view:', error);
            this.app.showMessage('Failed to initialize 3D view', 'error');
        }
    }

    loadDefaultModels() {
        // Load a cube model
        const cubeVertices = [
            // Front face
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,
            
            // Back face
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
            -1.0,  1.0, -1.0,
            
            // Top face
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,
            
            // Bottom face
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,
            
            // Right face
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  1.0,
             1.0, -1.0,  1.0,
            
            // Left face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
            -1.0, -1.0,  1.0
        ];

        const cubeIndices = [
            0,  1,  2,    0,  2,  3,  // front
            4,  5,  6,    4,  6,  7,  // back
            8,  9,  10,   8,  10, 11, // top
            12, 13, 14,   12, 14, 15, // bottom
            16, 17, 18,   16, 18, 19, // right
            20, 21, 22,   20, 22, 23  // left
        ];

        const cubeNormals = [
            // Front face
            0.0,  0.0,  1.0,
            0.0,  0.0,  1.0,
            0.0,  0.0,  1.0,
            0.0,  0.0,  1.0,
            
            // Back face
            0.0,  0.0, -1.0,
            0.0,  0.0, -1.0,
            0.0,  0.0, -1.0,
            0.0,  0.0, -1.0,
            
            // Top face
            0.0,  1.0,  0.0,
            0.0,  1.0,  0.0,
            0.0,  1.0,  0.0,
            0.0,  1.0,  0.0,
            
            // Bottom face
            0.0, -1.0,  0.0,
            0.0, -1.0,  0.0,
            0.0, -1.0,  0.0,
            0.0, -1.0,  0.0,
            
            // Right face
            1.0,  0.0,  0.0,
            1.0,  0.0,  0.0,
            1.0,  0.0,  0.0,
            1.0,  0.0,  0.0,
            
            // Left face
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0
        ];

        const cubeTexCoords = [
            // Front face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            
            // Back face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            
            // Top face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            
            // Bottom face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            
            // Right face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            
            // Left face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
        ];

        this.models.set('cube', this.webGLService.loadModel(
            'cube',
            cubeVertices,
            cubeIndices,
            cubeNormals,
            cubeTexCoords
        ));

        // Load default texture
        this.webGLService.loadTexture('default', 'images/default-texture.png');
    }

    setupEventListeners() {
        // Add keyboard controls for camera movement
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));

        // Add model selection dropdown
        const modelSelect = document.getElementById('model-select');
        if (modelSelect) {
            modelSelect.addEventListener('change', this.handleModelSelect.bind(this));
        }

        // Add drag event listeners for the canvas
        const canvas = document.getElementById('webgl-canvas');
        if (canvas) {
            canvas.addEventListener('mousedown', this.handleDragStart.bind(this));
            canvas.addEventListener('mousemove', this.handleDragMove.bind(this));
            canvas.addEventListener('mouseup', this.handleDragEnd.bind(this));
        }
    }

    handleKeyDown(event) {
        const speed = 0.1;
        const camera = this.webGLService.camera;
        
        switch(event.key) {
            case 'w':
                camera.position[2] -= speed;
                break;
            case 's':
                camera.position[2] += speed;
                break;
            case 'a':
                camera.position[0] -= speed;
                break;
            case 'd':
                camera.position[0] += speed;
                break;
            case 'q':
                camera.position[1] += speed;
                break;
            case 'e':
                camera.position[1] -= speed;
                break;
        }
    }

    handleKeyUp(event) {
        // Handle key release if needed
    }

    handleModelSelect(event) {
        const modelName = event.target.value;
        this.currentModel = this.models.get(modelName);
    }

    handleDragStart(event) {
        this.isDragging = true;
        this.startX = event.clientX;
        this.startY = event.clientY;
    }

    handleDragMove(event) {
        if (!this.isDragging) return;

        const deltaX = event.clientX - this.startX;
        const deltaY = event.clientY - this.startY;

        // Update camera position based on drag
        this.webGLService.camera.position.x += deltaX * 0.01;
        this.webGLService.camera.position.y += deltaY * 0.01;

        this.startX = event.clientX;
        this.startY = event.clientY;
    }

    handleDragEnd() {
        this.isDragging = false;
    }

    startAnimation() {
        const animate = () => {
            this.render();
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    render() {
        if (!this.isInitialized) return;

        // Update camera
        this.webGLService.updateCamera(
            this.webGLService.camera.position,
            this.webGLService.camera.target,
            this.webGLService.camera.up
        );

        // Render scene
        this.webGLService.render();
    }

    cleanup() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.webGLService.cleanup();
        this.isInitialized = false;
    }

    // Public methods for external use
    setModel(name, vertices, indices, normals, texCoords) {
        this.models.set(name, this.webGLService.loadModel(
            name,
            vertices,
            indices,
            normals,
            texCoords
        ));
    }

    setTexture(name, url) {
        this.webGLService.loadTexture(name, url);
    }

    setCamera(position, target, up) {
        this.webGLService.updateCamera(position, target, up);
    }

    addLight(position, color, intensity) {
        this.webGLService.addLight(position, color, intensity);
    }
} 