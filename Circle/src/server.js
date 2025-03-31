require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const { WebSocketService } = require('./services/WebSocketService');
const { ReportExportService } = require('./services/ReportExportService');
const { AlertService } = require('./services/AlertService');
const { CryptoMonitoringService } = require('./services/CryptoMonitoringService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Services
const webSocketService = new WebSocketService(io);
const reportExportService = new ReportExportService();
const alertService = new AlertService();
const monitoringService = new CryptoMonitoringService();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/mining', require('./routes/mining'));

// API Routes
app.get('/api/dashboard/initial-data', async (req, res) => {
    try {
        const metrics = await monitoringService.getCurrentMetrics();
        const alerts = await alertService.getRecentAlerts();
        res.json({ metrics, alerts });
    } catch (error) {
        console.error('Error fetching initial data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/dashboard/metrics', async (req, res) => {
    try {
        const { range } = req.query;
        const metrics = await monitoringService.getMetricsForRange(range);
        res.json(metrics);
    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/dashboard/export', async (req, res) => {
    try {
        const { format } = req.query;
        const data = await monitoringService.getExportData();
        const file = await reportExportService.generateReport(data, format);
        
        res.setHeader('Content-Type', `application/${format}`);
        res.setHeader('Content-Disposition', `attachment; filename=dashboard-report.${format}`);
        res.send(file);
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/dashboard/thresholds', async (req, res) => {
    try {
        const thresholds = req.body;
        await alertService.updateThresholds(thresholds);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating thresholds:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New client connected');

    // Join a group
    socket.on('join-group', (groupId) => {
        socket.join(groupId);
    });

    // Leave a group
    socket.on('leave-group', (groupId) => {
        socket.leave(groupId);
    });

    // Handle chat messages
    socket.on('chat-message', (data) => {
        io.to(data.groupId).emit('new-message', data);
    });

    // Handle video call signals
    socket.on('call-signal', (data) => {
        io.to(data.targetUserId).emit('incoming-call', data);
    });

    // Handle mining updates
    socket.on('mining-update', (data) => {
        io.emit('mining-stats', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start monitoring services
monitoringService.startMonitoring();

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 