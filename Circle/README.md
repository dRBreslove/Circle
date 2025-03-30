# Circle - Secure Group Communication

Circle is a modern web application for secure group communication, featuring real-time chat, video calls, and voice calls. Built with HTML5, CSS3, JavaScript (ES6), and Node.js.

## Features

- 🔒 Secure authentication and authorization
- 👥 Group creation and management
- 💬 Real-time chat with message history
- 📎 File attachments support
- 📹 Video calls using WebRTC
- 🎙️ Voice calls
- 🔔 Real-time notifications
- 📱 Responsive design for all devices

## Prerequisites

- Node.js (v18.0.0 or higher)
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

## Deployment to DigitalOcean

### 1. Prepare Your Application

1. Create a `Dockerfile` in the root directory:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
```

2. Create a `.dockerignore` file:
```
node_modules
npm-debug.log
.env
.git
.gitignore
```

### 2. Set Up DigitalOcean

1. Install the DigitalOcean CLI (doctl):
```bash
# macOS
brew install doctl

# Linux
snap install doctl
```

2. Authenticate with DigitalOcean:
```bash
doctl auth init
```

3. Create a new Droplet:
```bash
doctl compute droplet create circle-app \
  --region nyc1 \
  --size s-1vcpu-1gb \
  --image ubuntu-20-04-x64 \
  --ssh-keys your_ssh_key_id
```

4. Get your Droplet's IP address:
```bash
doctl compute droplet get circle-app --format PublicIPv4
```

### 3. Deploy the Application

1. SSH into your Droplet:
```bash
ssh root@your_droplet_ip
```

2. Install Docker and Docker Compose:
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.5.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

3. Clone your repository:
```bash
git clone https://github.com/yourusername/circle.git
cd circle
```

4. Create a production `.env` file:
```bash
nano .env
```
Add your production environment variables:
```env
PORT=8080
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret
MONGODB_URI=your_production_mongodb_uri
```

5. Build and start the application:
```bash
docker-compose up -d --build
```

### 4. Set Up Nginx (Optional)

1. Install Nginx:
```bash
apt install nginx -y
```

2. Create an Nginx configuration file:
```bash
nano /etc/nginx/sites-available/circle
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Enable the site:
```bash
ln -s /etc/nginx/sites-available/circle /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

### 5. Set Up SSL with Let's Encrypt (Optional)

1. Install Certbot:
```bash
apt install certbot python3-certbot-nginx -y
```

2. Get SSL certificate:
```bash
certbot --nginx -d your_domain.com
```

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
