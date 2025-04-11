const sqlite3 = require('sqlite3');
const crypto = require('crypto');

// Initialize database connection
const adminDb = new sqlite3.Database('./admin.db');

/**
 * Create a new invite code
 */
exports.createInviteCode = (req, res) => {
  const adminId = req.admin.id;
  
  // Generate a random invite code
  const inviteCode = crypto.randomBytes(6).toString('hex').toUpperCase();
  
  // Set expiration to 7 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  // Save invite code
  adminDb.run(
    'INSERT INTO admin_invites (invite_code, created_by, expires_at) VALUES (?, ?, ?)',
    [inviteCode, adminId, expiresAt.toISOString()],
    function(err) {
      if (err) {
        console.error('Error creating invite code:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      
      res.json({
        success: true,
        inviteCode,
        expiresAt: expiresAt.toISOString()
      });
    }
  );
};

/**
 * Get all invite codes
 */
exports.getAllInviteCodes = (req, res) => {
  adminDb.all(
    `SELECT ai.*, a.username as created_by_username, u.username as used_by_username 
     FROM admin_invites ai 
     LEFT JOIN admins a ON ai.created_by = a.id
     LEFT JOIN admins u ON ai.used_by = u.id
     ORDER BY ai.created_at DESC`,
    [],
    (err, invites) => {
      if (err) {
        console.error('Error fetching invite codes:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      
      res.json({ success: true, invites });
    }
  );
};

/**
 * Verify an invite code
 */
exports.verifyInviteCode = (req, res) => {
  const { inviteCode } = req.body;
  
  if (!inviteCode) {
    return res.status(400).json({ success: false, message: 'Please provide an invite code' });
  }
  
  adminDb.get(
    'SELECT * FROM admin_invites WHERE invite_code = ? AND is_used = 0 AND expires_at > ?',
    [inviteCode, new Date().toISOString()],
    (err, invite) => {
      if (err) {
        console.error('Error validating invite code:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      
      if (!invite) {
        return res.status(400).json({ success: false, message: 'Invite code is invalid or expired' });
      }
      
      res.json({
        success: true,
        message: 'Invite code is valid'
      });
    }
  );
};

/**
 * Use an invite code
 */
exports.useInviteCode = (req, res) => {
  const { inviteCode, userId } = req.body;
  
  if (!inviteCode || !userId) {
    return res.status(400).json({ success: false, message: 'Invite code and user ID are required' });
  }
  
  adminDb.run(
    'UPDATE admin_invites SET is_used = 1, used_by = ? WHERE invite_code = ? AND is_used = 0 AND expires_at > ?',
    [userId, inviteCode, new Date().toISOString()],
    function(err) {
      if (err) {
        console.error('Error using invite code:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      
      if (this.changes === 0) {
        return res.status(400).json({ success: false, message: 'Invalid or expired invite code' });
      }
      
      res.json({
        success: true,
        message: 'Invite code used successfully'
      });
    }
  );
};
