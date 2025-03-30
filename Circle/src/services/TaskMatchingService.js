import { db } from '../config/database';
import TaskService from './TaskService';

class TaskMatchingService {
  constructor() {
    this.collection = db.collection('users');
  }

  async findMatchingMembers(task) {
    try {
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
    } catch (error) {
      console.error('Error finding matching members:', error);
      throw error;
    }
  }

  async findNearbyMembers(location) {
    try {
      const members = await this.collection.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [location.longitude, location.latitude]
            },
            $maxDistance: location.radius
          }
        },
        isAvailable: true
      }).toArray();
      
      return members;
    } catch (error) {
      console.error('Error finding nearby members:', error);
      throw error;
    }
  }

  matchesRequirements(member, requirements) {
    // Check if member has required skills or certifications
    return requirements.every(req => 
      member.skills?.includes(req) || 
      member.certifications?.includes(req)
    );
  }

  isAvailable(member) {
    // Check if member is available for tasks
    return member.isAvailable && 
           !member.currentTaskId && 
           member.rating >= 4.0;
  }

  sortByRelevance(members, task) {
    return members.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, task);
      const scoreB = this.calculateRelevanceScore(b, task);
      return scoreB - scoreA;
    });
  }

  calculateRelevanceScore(member, task) {
    let score = 0;
    
    // Rating weight (0-5)
    score += member.rating * 2;
    
    // Distance weight (closer is better)
    const distance = this.calculateDistance(member.location, task.location);
    score += (1 / (distance + 1)) * 3;
    
    // Task completion rate weight
    score += (member.completedTasks / (member.completedTasks + member.failedTasks)) * 2;
    
    // Response time weight
    score += (1 / (member.avgResponseTime + 1)) * 2;
    
    return score;
  }

  calculateDistance(loc1, loc2) {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(loc2.latitude - loc1.latitude);
    const dLon = this.toRad(loc2.longitude - loc1.longitude);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(loc1.latitude)) * Math.cos(this.toRad(loc2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }
}

export default new TaskMatchingService(); 