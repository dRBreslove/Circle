# Circle v3.0.0

Circle is a modern communication platform that combines group chat, video calls, and task management features.

## Documentation

- [Main Documentation](README.md)
- [TaskTaxi.Co Documentation](README4.md)
- [Lightning Network Integration](docs/LIGHTNING.md)
- [Continuum Documentation](README_Continuum.md)
- [Position System & VR Guide](README2.md)
- [Development Guide](README3.md)

## Features

- 🔒 Secure authentication and authorization
- 👥 Group creation and management
- 💬 Real-time chat with message history
- 📎 File attachments support
- 📹 Video calls using WebRTC
- 🎙️ Voice calls
- 🔔 Real-time notifications
- 📱 Responsive design for all devices

## TaskTaxi.Co Integration

TaskTaxi.Co is a task outsourcing platform integrated into Circle, enabling users to create, manage, and complete tasks within their network.

### Key Features
- Create and manage task lists
- Set task priorities and deadlines
- Real-time task tracking
- Secure payment processing
- Location-based task matching
- Rating and review system

### Use Cases
- Pregnancy support tasks
- Busy professional assistance
- Elderly care support
- Emergency task delegation
- Daily errand running

### How It Works
1. Create a task list with details and budget
2. Circle matches you with available members
3. Track task progress in real-time
4. Pay securely through the platform
5. Rate and review completed tasks

## Lightning Network Payments

Circle integrates Bitcoin Lightning Network for fast, secure, and low-cost payments.

### Features
- Real-time exchange rates
- Multi-currency support (BTC, ETH, SOL, USDC)
- Automatic currency conversion
- Transaction history tracking
- Invoice expiration handling
- Secure payment processing

### Supported Payment Methods
- Bitcoin (Lightning Network)
- Ethereum
- Solana
- USDC (Ethereum)

### Security Features
- End-to-end encryption
- Multi-signature support
- Automatic backup
- Transaction monitoring
- Fraud detection

### Getting Started with Payments
1. Set up a Lightning Network node
2. Configure your wallet
3. Enable payment methods
4. Start accepting payments

For detailed payment setup instructions, see [LIGHTNING.md](LIGHTNING.md)

## Continuum Integration

Continuum is Circle's advanced spatial computing system that enables seamless interaction between physical and virtual spaces.

### Features
- Real-time spatial mapping
- Cross-dimensional communication
- Quantum state synchronization
- Multi-dimensional data visualization
- Spatial memory persistence

### Applications
- Virtual meeting spaces
- Augmented reality overlays
- Spatial data analysis
- Multi-dimensional collaboration
- Quantum computing integration

## PosSys Coordinate System

PosSys is Circle's proprietary positioning system that provides precise spatial coordinates across multiple dimensions.

### Key Components
- Quantum coordinate mapping
- Multi-dimensional positioning
- Real-time spatial tracking
- Cross-dimensional navigation
- Position persistence

### Coordinate Types
- Physical coordinates (x, y, z)
- Temporal coordinates (t)
- Quantum coordinates (q)
- Virtual coordinates (v)
- Continuum coordinates (c)

### Applications
- Precise location tracking
- Multi-dimensional navigation
- Spatial data analysis
- Virtual reality positioning
- Augmented reality mapping

## VRView System

VRView is Circle's virtual reality interface that provides immersive experiences and interactions.

### Features
- 360-degree environment rendering
- Real-time spatial audio
- Haptic feedback integration
- Multi-user synchronization
- Cross-dimensional viewing

### Supported Devices
- VR headsets
- AR glasses
- Mobile devices
- Desktop systems
- Spatial computing devices

### Use Cases
- Virtual meetings
- Remote collaboration
- Training simulations
- Virtual events
- Spatial computing applications

## QubPix Technology

QubPix is Circle's quantum-enhanced pixel technology that enables advanced visual processing and rendering.

### Features
- Quantum color processing
- Multi-dimensional rendering
- Real-time pixel optimization
- Adaptive resolution scaling
- Quantum compression

### Applications
- High-resolution displays
- Virtual reality rendering
- Augmented reality overlays
- Medical imaging
- Scientific visualization

### Technical Specifications
- Quantum bit depth: 16-bit
- Color space: Quantum RGB
- Frame rate: Adaptive (up to 240fps)
- Resolution: Dynamic scaling
- Compression ratio: 1:1000

### Integration
- WebGL compatibility
- DirectX support
- Vulkan integration
- Metal framework support
- OpenGL ES compatibility

## Prerequisites

- Node.js (v20.0.0 or higher)
- npm (v8.0.0 or higher)
- A DigitalOcean account
- A domain name (optional)

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/circle.git
cd circle
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=8080
NODE_ENV=development
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_uri
```

4. Start the development server:
```bash
npm start
```

5. Open your browser and navigate to:
```
http://localhost:8080
```

## Local Test Setup

### Using Docker Compose (Recommended)

1. Build and start the containers:
```bash
docker-compose up -d --build
```

2. Check if all services are running:
```bash
docker-compose ps
```

3. View logs if needed:
```bash
docker-compose logs -f
```

4. Stop the containers:
```bash
docker-compose down
```

### Manual Test Setup

1. Install MongoDB locally:
```bash
# macOS
brew tap mongodb/brew
brew install mongodb-community

# Linux
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
```

2. Install Redis locally:
```bash
# macOS
brew install redis

# Linux
sudo apt install redis-server
```

3. Start the services:
```bash
# Start MongoDB
sudo service mongodb start  # Linux
brew services start mongodb-community  # macOS

# Start Redis
sudo service redis-server start  # Linux
brew services start redis  # macOS
```

4. Run the tests:
```bash
# Install test dependencies
npm install --save-dev jest @types/jest

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### Test Environment Variables

Create a `.env.test` file for test-specific configuration:
```env
PORT=8081
NODE_ENV=test
JWT_SECRET=test_jwt_secret
MONGODB_URI=mongodb://localhost:27017/circle_test
REDIS_URL=redis://localhost:6379
```

### Running Specific Tests

```bash
# Run a specific test file
npm test -- src/services/AuthService.test.js

# Run tests matching a pattern
npm test -- -t "auth"

# Run tests with verbose output
npm test -- --verbose
```

### Database Testing

1. Create test databases:
```bash
# MongoDB
mongosh
use circle_test
db.createCollection('users')
db.createCollection('groups')
db.createCollection('messages')

# Redis
redis-cli
SELECT 1
```

2. Clean up test data:
```bash
# MongoDB
mongosh
use circle_test
db.dropDatabase()

# Redis
redis-cli
SELECT 1
FLUSHDB
```

### API Testing

1. Install API testing tools:
```bash
npm install --save-dev supertest
```

2. Run API tests:
```bash
npm test -- src/tests/api/
```

### WebSocket Testing

1. Install WebSocket testing tools:
```bash
npm install --save-dev socket.io-client
```

2. Run WebSocket tests:
```bash
npm test -- src/tests/websocket/
```

### Common Test Issues

1. Port conflicts:
```bash
# Find process using port
lsof -i :8080
# Kill process
kill -9 <PID>
```

2. Database connection issues:
```bash
# Check MongoDB status
sudo service mongodb status
# Check Redis status
sudo service redis-server status
```

3. Permission issues:
```bash
# Fix MongoDB permissions
sudo chown -R `id -u` /data/db
# Fix Redis permissions
sudo chown -R redis:redis /var/lib/redis
```

## Deployment

1. Set up your server with:
   - Node.js v20.0.0 or higher
   - MongoDB v6.0 or higher
   - Redis v7.0 or higher
   - Nginx (for reverse proxy)

2. Clone the repository:
```bash
git clone https://github.com/yourusername/circle.git
cd circle
```

3. Install dependencies:
```bash
npm install
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your production settings
```

5. Configure Nginx as a reverse proxy:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

6. Set up SSL with Let's Encrypt:
```bash
sudo certbot --nginx -d your-domain.com
```

7. Start the production server:
```bash
npm start
```

8. Set up process management with PM2:
```bash
npm install -g pm2
pm2 start src/server.js --name circle
pm2 save
pm2 startup
```

The application will now be running securely on your server with SSL encryption and proper process management.

## Monitoring and Maintenance

1. View application logs:
```bash
docker-compose logs -f
```

2. Restart the application:
```bash
docker-compose restart
```

3. Update the application:
```bash
git pull
docker-compose up -d --build
```

## Security Considerations

- Keep your system and dependencies updated
- Use strong passwords and JWT secrets
- Enable firewall rules on your Droplet
- Regularly backup your data
- Monitor application logs for suspicious activity

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
