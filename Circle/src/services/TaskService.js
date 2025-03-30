import { db } from '../config/database';

class TaskService {
  constructor() {
    this.collection = db.collection('tasks');
  }

  async createTask(taskData) {
    try {
      const task = {
        ...taskData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await this.collection.insertOne(task);
      return { ...task, id: result.insertedId };
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async getTask(taskId) {
    try {
      const task = await this.collection.findOne({ _id: taskId });
      return task;
    } catch (error) {
      console.error('Error getting task:', error);
      throw error;
    }
  }

  async updateTask(taskId, updates) {
    try {
      const result = await this.collection.updateOne(
        { _id: taskId },
        { 
          $set: { 
            ...updates,
            updatedAt: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(taskId) {
    try {
      const result = await this.collection.deleteOne({ _id: taskId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  async getTasksByCreator(creatorId) {
    try {
      const tasks = await this.collection.find({ creatorId }).toArray();
      return tasks;
    } catch (error) {
      console.error('Error getting creator tasks:', error);
      throw error;
    }
  }

  async getTasksByAssignee(assigneeId) {
    try {
      const tasks = await this.collection.find({ assigneeId }).toArray();
      return tasks;
    } catch (error) {
      console.error('Error getting assignee tasks:', error);
      throw error;
    }
  }

  async getAvailableTasks(location, radius) {
    try {
      const tasks = await this.collection.find({
        status: 'pending',
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [location.longitude, location.latitude]
            },
            $maxDistance: radius
          }
        }
      }).toArray();
      return tasks;
    } catch (error) {
      console.error('Error getting available tasks:', error);
      throw error;
    }
  }
}

export default new TaskService(); 