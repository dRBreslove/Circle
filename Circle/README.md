# Circle

A secure group communication platform with real-time messaging, file sharing, and advanced security features.

## Features

- 🔒 Secure Authentication & Authorization
- 💬 Real-time Messaging
- 📁 File Sharing
- 👥 Group Management
- 🔐 End-to-end Encryption
- 📱 Mobile Responsive Design
- 🔄 Real-time Updates
- 🛡️ Advanced Security Features
- 📊 Analytics Dashboard
- 🔍 Search Functionality
- 🎨 Customizable Themes
- 🌐 WebSocket Integration
- 📱 Device Sync
- 🔐 2FA Support
- 🎮 WebGL Features
- ⛏️ Bitcoin Mining Integration

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm 11.2.0
- MongoDB >= 6.0
- Redis >= 7.0

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/Circle.git
   cd Circle
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/circle
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-secret-key
   SESSION_SECRET=your-session-secret
   ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
   NODE_ENV=production
   FORCE_SSL=true
   FORCE_SECURE_COOKIES=true
   FORCE_STRICT_CORS=true
   MAX_LOGIN_ATTEMPTS=5
   SESSION_TIMEOUT=3600
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
Circle/                    # Root directory
├── public/               # Static files
│   ├── css/             # Stylesheets
│   ├── js/              # Client-side JavaScript
│   │   ├── components/  # UI Components
│   │   ├── services/    # API Services
│   │   └── utils/       # Utility Functions
│   └── images/          # Image assets
├── server/              # Server-side code
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   └── utils/          # Server utilities
├── tests/              # Test files
├── docs/               # Documentation
├── scripts/            # Build and deployment scripts
├── .env                # Environment variables
├── .gitignore         # Git ignore rules
├── package.json       # Project dependencies
├── README.md          # Project documentation
└── server.js          # Application entry point
```

## Documentation

- [Security Audit Report](Circle/README_SecurityAudit.md)
- [Development Guide](Circle/README3.md)
- [Position System & VR Guide](Circle/README2.md)
- [TaskTaxi.Co Documentation](Circle/README4.md)
- [Continuum Documentation](Circle/README_Continuum.md)
- [Lightning Network Integration](Circle/docs/LIGHTNING.md)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](Circle/LICENSE) file for details.

## Acknowledgments

- Express.js team for the amazing framework
- Socket.IO team for real-time capabilities
- MongoDB team for the database
- Redis team for caching
- All contributors and maintainers

## Support

For support, email support@circle.com or join our Slack channel.
