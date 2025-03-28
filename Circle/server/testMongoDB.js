const mongoose = require('mongoose');

// MongoDB connection URI - replace with your actual URI
const MONGODB_URI = 'mongodb://localhost:27017/circle';

// Define Circle Schema
const circleSchema = new mongoose.Schema({
  circleId: { type: String, required: true, unique: true },
  members: [{
    memberId: String,
    faceKey: String,
    joinedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

const Circle = mongoose.model('Circle', circleSchema);

const testMongoDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Successfully connected to MongoDB!');

    // Test Circle Collection
    console.log('\nTesting Circle Collection:');
    
    // Create a test circle
    const testCircle = new Circle({
      circleId: 'test-circle-' + Date.now(),
      members: [
        {
          memberId: 'test-member-1',
          faceKey: 'test-face-key-1'
        }
      ]
    });

    // Save the circle
    await testCircle.save();
    console.log('Successfully created test circle');

    // Find the circle
    const foundCircle = await Circle.findOne({ circleId: testCircle.circleId });
    console.log('Successfully retrieved circle:', foundCircle);

    // Add a member
    foundCircle.members.push({
      memberId: 'test-member-2',
      faceKey: 'test-face-key-2'
    });
    await foundCircle.save();
    console.log('Successfully added new member');

    // Update lastActive
    foundCircle.lastActive = new Date();
    await foundCircle.save();
    console.log('Successfully updated lastActive');

    // Delete the test circle
    await Circle.deleteOne({ circleId: testCircle.circleId });
    console.log('Successfully deleted test circle');

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable collections:', collections.map(c => c.name));

    // Close the connection
    await mongoose.connection.close();
    console.log('\nConnection closed successfully.');
  } catch (error) {
    console.error('MongoDB test error:', error);
  }
};

testMongoDB(); 