class WebGLService {
    constructor() {
        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.shaders = {
            vertex: null,
            fragment: null
        };
        this.buffers = {};
        this.textures = {};
        this.models = new Map();
        this.camera = {
            position: [0, 0, 5],
            target: [0, 0, 0],
            up: [0, 1, 0],
            fov: 45,
            aspect: 1,
            near: 0.1,
            far: 1000
        };
        this.lights = [];
    }

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }

        this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }

        this.setupShaders();
        this.setupBuffers();
        this.setupTextures();
        this.setupEventListeners();
    }

    setupShaders() {
        // Vertex shader
        const vertexShaderSource = `
            attribute vec3 position;
            attribute vec3 normal;
            attribute vec2 texCoord;
            
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            uniform mat3 normalMatrix;
            
            varying vec2 vTexCoord;
            varying vec3 vNormal;
            
            void main() {
                vTexCoord = texCoord;
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        // Fragment shader
        const fragmentShaderSource = `
            precision mediump float;
            
            uniform sampler2D uTexture;
            uniform vec3 uLightPosition;
            uniform vec3 uLightColor;
            uniform float uAmbientIntensity;
            uniform float uDiffuseIntensity;
            
            varying vec2 vTexCoord;
            varying vec3 vNormal;
            
            void main() {
                vec3 lightDir = normalize(uLightPosition);
                float diffuse = max(dot(vNormal, lightDir), 0.0);
                vec3 color = texture2D(uTexture, vTexCoord).rgb;
                vec3 ambient = color * uAmbientIntensity;
                vec3 diffuseColor = color * uDiffuseIntensity * diffuse;
                gl_FragColor = vec4(ambient + diffuseColor, 1.0);
            }
        `;

        this.shaders.vertex = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        this.shaders.fragment = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        // Create program
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, this.shaders.vertex);
        this.gl.attachShader(this.program, this.shaders.fragment);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            throw new Error('Failed to link shader program');
        }
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error('Shader compilation error: ' + info);
        }

        return shader;
    }

    setupBuffers() {
        // Create buffers for positions, normals, and texture coordinates
        this.buffers.position = this.gl.createBuffer();
        this.buffers.normal = this.gl.createBuffer();
        this.buffers.texCoord = this.gl.createBuffer();
        this.buffers.index = this.gl.createBuffer();
    }

    setupTextures() {
        // Create default texture
        this.textures.default = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures.default);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            1,
            1,
            0,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            new Uint8Array([255, 255, 255, 255])
        );
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize());
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
    }

    handleResize() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
        }

        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.camera.aspect = this.gl.canvas.width / this.gl.canvas.height;
    }

    handleMouseDown(event) {
        // Implement mouse interaction for camera control
    }

    handleMouseMove(event) {
        // Implement mouse movement for camera control
    }

    handleMouseUp() {
        // Implement mouse release for camera control
    }

    loadModel(name, vertices, indices, normals, texCoords) {
        const model = {
            vertexCount: indices.length,
            position: this.createBuffer(this.gl.ARRAY_BUFFER, new Float32Array(vertices)),
            normal: this.createBuffer(this.gl.ARRAY_BUFFER, new Float32Array(normals)),
            texCoord: this.createBuffer(this.gl.ARRAY_BUFFER, new Float32Array(texCoords)),
            index: this.createBuffer(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices))
        };

        this.models.set(name, model);
        return model;
    }

    createBuffer(target, data) {
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(target, buffer);
        this.gl.bufferData(target, data, this.gl.STATIC_DRAW);
        return buffer;
    }

    loadTexture(name, url) {
        const texture = this.gl.createTexture();
        const image = new Image();
        
        image.onload = () => {
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
        };

        image.src = url;
        this.textures[name] = texture;
        return texture;
    }

    render() {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.useProgram(this.program);

        // Set camera uniforms
        const projectionMatrix = this.createProjectionMatrix();
        const modelViewMatrix = this.createModelViewMatrix();

        this.gl.uniformMatrix4fv(
            this.gl.getUniformLocation(this.program, 'projectionMatrix'),
            false,
            projectionMatrix
        );

        this.gl.uniformMatrix4fv(
            this.gl.getUniformLocation(this.program, 'modelViewMatrix'),
            false,
            modelViewMatrix
        );

        // Render all models
        this.models.forEach((model, name) => {
            this.renderModel(model);
        });
    }

    renderModel(model) {
        // Set attributes
        this.setAttribute('position', model.position, 3);
        this.setAttribute('normal', model.normal, 3);
        this.setAttribute('texCoord', model.texCoord, 2);

        // Draw
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, model.index);
        this.gl.drawElements(this.gl.TRIANGLES, model.vertexCount, this.gl.UNSIGNED_SHORT, 0);
    }

    setAttribute(name, buffer, size) {
        const location = this.gl.getAttribLocation(this.program, name);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.enableVertexAttribArray(location);
        this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, false, 0, 0);
    }

    createProjectionMatrix() {
        const fov = this.camera.fov * Math.PI / 180;
        const aspect = this.camera.aspect;
        const near = this.camera.near;
        const far = this.camera.far;

        const f = 1.0 / Math.tan(fov / 2);
        const nf = 1 / (near - far);

        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, 2 * far * near * nf, 0
        ];
    }

    createModelViewMatrix() {
        // Implement camera transformation matrix
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }

    addLight(position, color, intensity) {
        this.lights.push({ position, color, intensity });
    }

    updateCamera(position, target, up) {
        this.camera.position = position;
        this.camera.target = target;
        this.camera.up = up;
    }

    cleanup() {
        // Clean up WebGL resources
        this.gl.deleteProgram(this.program);
        this.gl.deleteShader(this.shaders.vertex);
        this.gl.deleteShader(this.shaders.fragment);
        
        Object.values(this.buffers).forEach(buffer => {
            this.gl.deleteBuffer(buffer);
        });
        
        Object.values(this.textures).forEach(texture => {
            this.gl.deleteTexture(texture);
        });
    }
} 