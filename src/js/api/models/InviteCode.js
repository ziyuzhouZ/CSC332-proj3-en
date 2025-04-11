/**
 * Invitation Code Model
 */

const mongoose = require('mongoose');

const InviteCodeSchema = new mongoose.Schema({
  // Invitation code
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // Invitation code type (e.g., register, VIP, event, admin)
  type: {
    type: String,
    required: true,
    enum: ['register', 'vip', 'event', 'admin'],
    default: 'register'
  },
  
  // Creator
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Current usage count
  uses: {
    type: Number,
    default: 0
  },
  
  // Maximum usage count
  maxUses: {
    type: Number,
    default: 1
  },
  
  // Whether active
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Expiration time
  expiresAt: {
    type: Date,
    default: function() {
      // Default expires in 30 days
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  },
  
  // Users who used this invitation code
  usedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
}, {
  timestamps: true // Automatically add createdAt and updatedAt fields
});

// Add method to check if invitation code is valid
InviteCodeSchema.methods.isValid = function() {
  // Check if active
  if (!this.isActive) return false;
  
  // Check if expired
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  
  // Check usage count
  if (this.uses >= this.maxUses) return false;
  
  return true;
};

module.exports = mongoose.model('InviteCode', InviteCodeSchema); 