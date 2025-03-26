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

// WebRTC signaling
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join-circle', async (data) => {
    const { faceKey } = data;
    try {
      let circle = await Circle.findOne({ faceKey });
      if (!circle) {
        circle = await Circle.create({
          faceKey,
          members: [socket.id]
        });
      } else {
        circle.members.push(socket.id);
        await circle.save();
      }
      socket.join(faceKey);
      io.to(faceKey).emit('member-joined', { memberId: socket.id });
    } catch (error) {
      console.error('Error joining circle:', error);
    }
  });

  socket.on('offer', (data) => {
    io.to(data.target).emit('offer', {
      offer: data.offer,
      from: socket.id
    });
  });

  socket.on('answer', (data) => {
    io.to(data.target).emit('answer', {
      answer: data.answer,
      from: socket.id
    });
  });

  socket.on('ice-candidate', (data) => {
    io.to(data.target).emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id
    });
  });

  socket.on('disconnect', async () => {
    try {
      const circles = await Circle.find({ members: socket.id });
      for (const circle of circles) {
        circle.members = circle.members.filter(id => id !== socket.id);
        await circle.save();
        io.to(circle.faceKey).emit('member-left', { memberId: socket.id });
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 