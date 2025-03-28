const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// MongoDB connection with environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/circle';
const MONGODB_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

mongoose.connect(MONGODB_URI, MONGODB_OPTIONS)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Circle Schema
const circleSchema = new mongoose.Schema({
  faceKey: String,
  members: [String],
  createdAt: { type: Date, default: Date.now }
});

const Circle = mongoose.model('Circle', circleSchema);

const circles = new Map(); // Store circle members and their WebSocket connections
const sharingMembers = new Map(); // Store members who are sharing their PosSys

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('join_circle', (data) => {
    const { circleId } = data;
    
    // Add member to circle
    if (!circles.has(circleId)) {
      circles.set(circleId, new Set());
    }
    circles.get(circleId).add(socket.id);
    
    // Notify other members
    socket.to(circleId).emit('member_joined', { memberId: socket.id });
    
    // Join socket room
    socket.join(circleId);
  });

  socket.on('share_possys', (data) => {
    const { circleId, position, pixelData } = data;
    
    // Store sharing state
    if (!sharingMembers.has(circleId)) {
      sharingMembers.set(circleId, new Map());
    }
    sharingMembers.get(circleId).set(socket.id, {
      position,
      pixelData,
      timestamp: Date.now()
    });
    
    // Broadcast to all other members in the circle
    socket.to(circleId).emit('possys_shared', {
      memberId: socket.id,
      position,
      pixelData
    });
  });

  socket.on('stop_sharing', (data) => {
    const { circleId } = data;
    
    // Remove sharing state
    if (sharingMembers.has(circleId)) {
      sharingMembers.get(circleId).delete(socket.id);
      
      // Clean up empty circle
      if (sharingMembers.get(circleId).size === 0) {
        sharingMembers.delete(circleId);
      }
    }
    
    // Notify other members
    socket.to(circleId).emit('possys_stopped', { memberId: socket.id });
  });

  socket.on('disconnect', () => {
    // Remove member from all circles and sharing states
    circles.forEach((members, circleId) => {
      if (members.has(socket.id)) {
        members.delete(socket.id);
        io.to(circleId).emit('member_left', { memberId: socket.id });
        
        // Clean up empty circles
        if (members.size === 0) {
          circles.delete(circleId);
        }
      }
    });

    // Clean up sharing states
    sharingMembers.forEach((members, circleId) => {
      if (members.has(socket.id)) {
        members.delete(socket.id);
        io.to(circleId).emit('possys_stopped', { memberId: socket.id });
        
        // Clean up empty circles
        if (members.size === 0) {
          sharingMembers.delete(circleId);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 