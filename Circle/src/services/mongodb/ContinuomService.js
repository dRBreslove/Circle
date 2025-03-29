import mongoose from 'mongoose';

const ContinuomSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  cor: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true }
  },
  perspective: {
    scale: { type: Number, required: true },
    depth: { type: Number, required: true }
  },
  circleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Circle', required: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Continuom = mongoose.model('Continuom', ContinuomSchema);

export const ContinuomService = {
  // Create a new Continuom position
  async createContinuom(continuomData) {
    try {
      const continuom = new Continuom(continuomData);
      await continuom.save();
      return continuom;
    } catch (error) {
      throw new Error(`Failed to create Continuom: ${error.message}`);
    }
  },

  // Get all Continuoms for a circle
  async getCircleContinuoms(circleId) {
    try {
      return await Continuom.find({ circleId })
        .populate('memberId', 'name')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to get circle Continuoms: ${error.message}`);
    }
  },

  // Get Continuom by ID
  async getContinuomById(id) {
    try {
      return await Continuom.findById(id);
    } catch (error) {
      throw new Error(`Failed to get Continuom: ${error.message}`);
    }
  },

  // Update Continuom position
  async updateContinuom(id, updateData) {
    try {
      updateData.updatedAt = new Date();
      return await Continuom.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
    } catch (error) {
      throw new Error(`Failed to update Continuom: ${error.message}`);
    }
  },

  // Delete Continuom
  async deleteContinuom(id) {
    try {
      return await Continuom.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Failed to delete Continuom: ${error.message}`);
    }
  },

  // Get Continuoms by member
  async getMemberContinuoms(memberId) {
    try {
      return await Continuom.find({ memberId })
        .populate('circleId', 'name')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to get member Continuoms: ${error.message}`);
    }
  }
}; 