# TaskTaxi.Co Documentation

## Navigation
- [Main Documentation](../README.md)
- [Lightning Network Integration](../docs/LIGHTNING.md)
- [Continuum Documentation](../README_Continuum.md)
- [Position System & VR Guide](../README2.md)
- [Development Guide](../README3.md)

<img src="src/assets/images/circle-app-logo.png" alt="Circle App Logo" width="100">

This guide provides detailed information about the TaskTaxi.Co feature in Circle v3.0.0.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technical Implementation](#technical-implementation)
- [User Guide](#user-guide)
- [Related Documentation](#related-documentation)

## Overview

TaskTaxi.Co is a task outsourcing platform integrated into Circle that connects task creators with available members in the Circle network. It's designed to help busy individuals, pregnant women, and anyone who needs assistance with daily tasks.

## Features

### Task Management
- Create detailed task lists
- Set task priorities and deadlines
- Add task requirements and preferences
- Track task progress in real-time
- Manage multiple tasks simultaneously

### Location Services
- Location-based task matching
- Distance calculation for task assignment
- Real-time location tracking
- Geofencing for task boundaries

### Payment System
- Secure payment processing
- Multiple payment methods
- Escrow service for task completion
- Automatic payment release
- Dispute resolution system

### Rating System
- Task completion ratings
- User reviews and feedback
- Performance metrics
- Trust score calculation

## Technical Implementation

### Task Data Structure
```javascript
// Task object structure
const task = {
  id: '',              // Unique task identifier
  creatorId: '',       // User who created the task
  assigneeId: null,    // User assigned to the task
  title: '',           // Task title
  description: '',     // Detailed description
  priority: 'high',    // 'high', 'medium', or 'low'
  deadline: new Date(), // Task deadline
  budget: 0,           // Task budget
  status: 'pending',   // 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'
  location: {
    latitude: 0,
    longitude: 0,
    radius: 0          // Maximum distance for task completion
  },
  requirements: [],    // List of requirements
  createdAt: new Date(),
  updatedAt: new Date()
};
```

### Task Matching Service
```javascript
class TaskMatchingService {
  async findMatchingMembers(task) {
    const { location, requirements } = task;
    
    // Find available members within radius
    const nearbyMembers = await this.findNearbyMembers(location);
    
    // Filter by requirements and availability
    const matchingMembers = nearbyMembers.filter(member => 
      this.matchesRequirements(member, requirements) &&
      this.isAvailable(member)
    );
    
    // Sort by rating and distance
    return this.sortByRelevance(matchingMembers, task);
  }

  async findNearbyMembers(location) {
    // Implementation for finding members within radius
    return [];
  }

  matchesRequirements(member, requirements) {
    // Implementation for matching requirements
    return true;
  }

  isAvailable(member) {
    // Check if member is available for tasks
    return true;
  }

  sortByRelevance(members, task) {
    // Sort members by rating and distance
    return members.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, task);
      const scoreB = this.calculateRelevanceScore(b, task);
      return scoreB - scoreA;
    });
  }
}
```

### Payment Processing
```javascript
class PaymentService {
  async processPayment(task) {
    try {
      // Create payment intent
      const paymentIntent = await this.createPaymentIntent(task);
      
      // Hold funds in escrow
      await this.holdFunds(paymentIntent);
      
      // Process payment
      const result = await this.processPaymentIntent(paymentIntent);
      
      return {
        success: true,
        transactionId: result.id
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createPaymentIntent(task) {
    // Implementation for creating payment intent
    return {};
  }

  async holdFunds(paymentIntent) {
    // Implementation for holding funds in escrow
  }

  async processPaymentIntent(paymentIntent) {
    // Implementation for processing payment
    return { id: 'transaction_id' };
  }
}
```

## User Guide

### Creating a Task
1. Navigate to the TaskTaxi.Co section
2. Click "Create New Task"
3. Fill in task details:
   - Title and description
   - Priority and deadline
   - Budget
   - Location and requirements
4. Review and submit

### Accepting Tasks
1. Browse available tasks
2. Filter by location and requirements
3. Review task details
4. Accept task if interested
5. Begin task execution

### Task Completion
1. Update task progress
2. Submit completion proof
3. Wait for verification
4. Receive payment
5. Rate the experience

## Related Documentation

- [Main Documentation](README.md) - Overview and setup
- [Position System & VR Guide](README2.md) - Location features
- [Development Guide](README3.md) - Development and testing
- [Release Checklist](RELEASE.md) - Release process

---

[Back to Main Documentation](README.md) 