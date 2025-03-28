const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/circle', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Circle Schema
const circleSchema = new mongoose.Schema({
  faceKey: String,
  members: [String],
  createdAt: { type: Date, default: Date.now }
});

const Circle = mongoose.model('Circle', circleSchema);

const circles = new Map(); // Store circle members and their WebSocket connections

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

  socket.on('stream_update', (data) => {
    const { circleId, cameraType, pixelData } = data;
    
    // Broadcast to all other members in the circle
    socket.to(circleId).emit('member_stream', {
      memberId: socket.id,
      cameraType,
      pixelData
    });
  });

  socket.on('disconnect', () => {
    // Remove member from all circles
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
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 