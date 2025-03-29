# Circle - WebRTC Group Chat App

![Circle App Logo](src/assets/images/circle-app-logo.png)

A WebRTC-based hybrid app for secure group communication with VR capabilities.

## Documentation

This project's documentation is split into multiple files for better organization:

1. [Main Features and Setup](README.md) (this file)
2. [Position System and VR Features](README2.md)
3. [Development and Testing Guide](README3.md)

## Features

- Face scanning for user verification
- Real-time location sharing
- VR space visualization
- Group communication
- Solar system visualization in VR

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- MongoDB
- iOS Simulator (for Mac users) or Android Studio (for Android development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/circle.git
cd circle
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

5. Start the mobile app:
```bash
npm run mobile
```

## Testing Guide

### Running Tests

The project includes several types of tests:

1. **ESLint Tests**
   ```bash
   npm run test:eslint
   ```
   These tests verify that our ESLint configuration is working correctly and catching issues like:
   - Inline styles
   - Color literals
   - Raw text outside Text components
   - Proper React Native component structure

2. **All Tests**
   ```bash
   npm run test
   ```
   This runs all test suites in the project.

3. **MongoDB Connection Tests**
   ```bash
   node server/testMongoDB.js
   ```
   This test verifies the MongoDB connection and basic operations:
   - Connection establishment
   - Database access
   - Collection operations
   - Error handling
   - Connection closure

   The test will output:
   - Connection status
   - Database operations results
   - Any errors encountered
   - Cleanup confirmation

   Example output:
   ```
   MongoDB Connection Test
   ----------------------
   Connecting to MongoDB...
   Successfully connected to MongoDB
   Testing database operations...
   Successfully created test document
   Successfully retrieved test document
   Successfully updated test document
   Successfully deleted test document
   Successfully closed connection
   Test completed successfully
   ```

   If you encounter connection issues:
   1. Verify your MongoDB URI in `.env`
   2. Check if MongoDB service is running
   3. Ensure network connectivity
   4. Verify database credentials
   5. Check MongoDB Atlas IP whitelist (if using Atlas)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Additional Documentation

- [Position System and VR Features](README2.md) - Detailed information about the position system and VR features
- [Development and Testing Guide](README3.md) - Comprehensive guide for developers
