# Circle - WebRTC Group Chat App

Circle is a hybrid mobile application that enables secure group communication through face recognition and WebRTC technology. Users can create or join circles (groups) by scanning their faces, and then communicate through video, audio, and text chat.

## Features

- Face recognition-based circle creation and joining
- Real-time video and audio communication
- Text chat functionality
- Secure peer-to-peer connections
- MongoDB for circle management
- Modern and intuitive UI

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- React Native development environment
- Expo CLI

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/circle.git
cd circle
```

2. Install dependencies:
```bash
npm install
```

3. Start MongoDB:
```bash
mongod
```

4. Start the server:
```bash
npm run dev
```

5. Start the mobile app:
```bash
npm run mobile
```

## Project Structure

- `/server` - Node.js server with WebRTC signaling and MongoDB integration
- `/screens` - React Native screens for the mobile app
  - `HomeScreen.js` - Main screen with options to create or join a circle
  - `FaceScanScreen.js` - Face recognition and circle joining screen
  - `CircleScreen.js` - Group chat interface with video, audio, and text

## Usage

1. Launch the app
2. Choose to create a new circle or join an existing one
3. Scan your face to generate a unique face key
4. Join the circle and start communicating with other members

## Security

- Face recognition data is used only for circle authentication
- All communication is peer-to-peer using WebRTC
- No data is stored except for circle membership information
- Face keys are generated locally and never transmitted in raw form

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 