/**
 * Invitation Code Controller
 */

const crypto = require('crypto');
const InviteCode = require('../models/InviteCode');

/**
 * Create invitation code
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.createInviteCode = async (req, res) => {
  try {
    const { type, maxUses, expiration } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'Please provide invitation code type' });
    }
    
    // Generate unique invitation code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    const inviteCode = new InviteCode({
      code,
      type,
      createdBy: req.admin.id,
      maxUses: maxUses || 1,
      expiresAt: expiration ? new Date(expiration) : undefined
    });
    
    await inviteCode.save();
    
    res.status(201).json({
      success: true,
      data: inviteCode
    });
  } catch (error) {
    console.error('Error creating invitation code:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get all invitation codes
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getAllInviteCodes = async (req, res) => {
  try {
    const inviteCodes = await InviteCode.find()
      .sort({ createdAt: -1 }) // Sort by creation time in descending order
      .populate('createdBy', 'username'); // Get creator's username
      
    res.status(200).json({
      success: true,
      count: inviteCodes.length,
      data: inviteCodes
    });
  } catch (error) {
    console.error('Error getting invitation codes:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Verify invitation code
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.verifyInviteCode = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Please provide invitation code' });
    }
    
    const inviteCode = await InviteCode.findOne({ code });
    
    if (!inviteCode) {
      return res.status(404).json({ error: 'Invalid invitation code' });
    }
    
    // Check if invitation code is expired
    if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invitation code has expired' });
    }
    
    // Check if invitation code has reached maximum usage
    if (inviteCode.uses >= inviteCode.maxUses) {
      return res.status(400).json({ error: 'Invitation code has reached maximum usage' });
    }
    
    res.status(200).json({
      success: true,
      data: {
        valid: true,
        type: inviteCode.type,
        remainingUses: inviteCode.maxUses - inviteCode.uses
      }
    });
  } catch (error) {
    console.error('Error verifying invitation code:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Use invitation code
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.useInviteCode = async (req, res) => {
  try {
    const { code, userId } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Please provide invitation code' });
    }
    
    const inviteCode = await InviteCode.findOne({ code });
    
    if (!inviteCode) {
      return res.status(404).json({ error: 'Invalid invitation code' });
    }
    
    // Check if invitation code is expired
    if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invitation code has expired' });
    }
    
    // Check if invitation code has reached maximum usage
    if (inviteCode.uses >= inviteCode.maxUses) {
      return res.status(400).json({ error: 'Invitation code has reached maximum usage' });
    }
    
    // Update invitation code usage information
    inviteCode.uses += 1;
    
    if (userId) {
      inviteCode.usedBy.push(userId);
    }
    
    await inviteCode.save();
    
    res.status(200).json({
      success: true,
      data: inviteCode
    });
  } catch (error) {
    console.error('Error using invitation code:', error);
    res.status(500).json({ error: 'Server error' });
  }
}; 