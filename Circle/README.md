# Circle - WebRTC Group Chat App

Circle is a hybrid mobile application that enables secure group communication through face recognition and WebRTC technology. Users can create or join circles (groups) by scanning their faces, and then communicate through video, audio, and text chat.

## Features

- Face recognition-based circle creation and joining
- Real-time video and audio communication
- Text chat functionality
- Secure peer-to-peer connections
- MongoDB for circle management
- Modern and intuitive UI
- Position System (PosSys) with Continuom coordinate system
- Live location sharing
- Device orientation-based positioning
- VR visualization with QubPix
- Screen recording and video capture

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- React Native development environment
- Expo CLI

## Installation

1. Clone the repository:
```bash
git clone https://github.com/dRBreslove/circle.git
cd circle
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   Create a `.env` file in the root directory with the following content:
   ```bash
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/circle?retryWrites=true&w=majority
   ```
   Replace the placeholders:
   - `<username>`: Your MongoDB username
   - `<password>`: Your MongoDB password
   - `<cluster>`: Your MongoDB cluster address

4. Start MongoDB:
```bash
mongod
```

5. Start the server:
```bash
npm run dev
```

6. Start the mobile app:
```bash
npm run mobile
```

### Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the root directory with the following variables:

#### MongoDB Configuration
- `MONGODB_URI`: MongoDB connection string
  - Format: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/circle?retryWrites=true&w=majority`
  - Required for database connection
  - Supports MongoDB Atlas and self-hosted MongoDB
  - Includes retry writes and write concern options

#### Security Notes
- Never commit the `.env` file to version control
- Keep your database credentials secure
- Use different credentials for development and production
- The `.env` file is included in `.gitignore` by default

## Project Structure

- `/server` - Node.js server with WebRTC signaling and MongoDB integration
- `/screens` - React Native screens for the mobile app
  - `HomeScreen.js` - Main screen with options to create or join a circle
  - `FaceScanScreen.js` - Face recognition and circle joining screen
  - `CircleScreen.js` - Group chat interface with video, audio, and text
  - `PosSysScreen.js` - Position System with Continuom coordinate system
  - `VRViewScreen.js` - VR visualization with QubPix

## Usage

### Basic Circle Features

1. Launch the app
2. Choose to create a new circle or join an existing one
3. Scan your face to generate a unique face key
4. Join the circle and start communicating with other members

### Live Location Sharing

1. In a circle, tap the "Show Map" button
2. Your location will be shared with circle members
3. See all members' locations on the map
4. Blue pin shows your location
5. Red pins show other members' locations

### Camera Switching and Display Modes

The Circle app supports two main display modes with different camera configurations:

#### Local Mode
- Main Display: Shows user's back camera
- Floating Frame: Shows user's front camera
- Position: Floating frame appears in top-right corner (120x160 pixels)

#### Remote Mode
- Main Display: Shows selected member's back camera
- Floating Frame: Shows selected member's front camera
- Position: Floating frame appears in top-right corner (120x160 pixels)

#### Switching Between Modes
1. Tap the "Switch View" button in the floating frame to toggle between local and remote modes
2. Select a member from the member list to view their cameras
3. The floating frame maintains its position and size while switching modes

#### Additional Features
- Real-time video streaming using WebRTC
- High-quality video (1280x720 resolution)
- Smooth transitions between modes
- Member selection through the member list
- Map toggle for location sharing

### Screen Recording

The app includes screen recording functionality with direct WhatsApp sharing:

1. Tap the "Start Recording" button to begin recording
2. Recording duration is displayed in MM:SS format
3. Visual indicator shows recording status
4. Recordings are automatically saved to the app's Movies directory
5. Maximum recording duration: 1 hour
6. Quality: 720p

#### Recording Storage

- All recordings are stored in the app's Movies directory
- Each recording has a unique filename with timestamp
- The Movies directory is created automatically if it doesn't exist
- Recordings persist between app sessions

#### Direct WhatsApp Sharing

1. After recording completes, you'll be prompted to share the video
2. Tap "Share" to open WhatsApp sharing options
3. Choose a WhatsApp contact or group
4. Add an optional message
5. Send the video directly to WhatsApp

Features:
- One-tap sharing to WhatsApp
- No need to manually locate the video file
- Direct integration with WhatsApp's sharing interface
- Maintains original video quality
- Works with both individual chats and group chats

Note: WhatsApp must be installed on the device to share videos. The app will prompt to install WhatsApp if it's not available.

## Security

- Face recognition data is used only for circle authentication
- All communication is peer-to-peer using WebRTC
- No data is stored except for circle membership information
- Face keys are generated locally and never transmitted in raw form
- Location sharing is only active within circles
- Device orientation data is processed locally

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

[Continue to Position System and VR Features](README2.md)

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

### Writing Tests

#### ESLint Tests

ESLint tests are located in `src/__tests__/eslint.test.js`. They verify that our linting rules are working as expected. Here's how to write a new ESLint test:

```javascript
test('should catch specific linting issue', async () => {
  const codeWithIssue = `
    // Your test code here
  `;

  const results = await eslint.lintText(codeWithIssue);
  expect(results[0].messages).toContainEqual(
    expect.objectContaining({
      ruleId: 'rule-name',
    })
  );
});
```

#### Component Tests

Component tests should be placed in `src/__tests__/components/`. Example structure:

```javascript
import React from 'react';
import { render } from '@testing-library/react-native';
import YourComponent from '../components/YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(<YourComponent />);
    expect(getByText('Expected Text')).toBeTruthy();
  });
});
```

#### Service Tests

Service tests should be placed in `src/__tests__/services/`. Example structure:

```javascript
import YourService from '../services/YourService';

describe('YourService', () => {
  it('performs expected operation', () => {
    const result = YourService.someMethod();
    expect(result).toBe(expectedValue);
  });
});
```

### Test Coverage

The project maintains minimum coverage requirements:
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

To check coverage, run:
```bash
npm run test -- --coverage
```

### Best Practices

1. **Test Organization**
   - Group related tests using `describe` blocks
   - Use clear, descriptive test names
   - Follow the pattern: "should [expected behavior] when [condition]"

2. **Mocking**
   - Use the provided mock implementations in `jest.setup.js`
   - Create additional mocks as needed in test files
   - Mock external dependencies consistently

3. **Assertions**
   - Use specific assertions (e.g., `toBeTruthy()` instead of `toBe(true)`)
   - Include meaningful error messages
   - Test both success and failure cases

4. **Performance**
   - Keep tests focused and isolated
   - Avoid unnecessary setup/teardown
   - Use appropriate test timeouts
