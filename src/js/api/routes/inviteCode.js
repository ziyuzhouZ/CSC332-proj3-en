/**
 * Invitation Code Routes
 */

const express = require('express');
const router = express.Router();
const inviteCodeController = require('../controllers/inviteCode');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Admin routes - require admin permissions
router.post('/', authMiddleware, adminMiddleware, inviteCodeController.createInviteCode);
router.get('/all', authMiddleware, adminMiddleware, inviteCodeController.getAllInviteCodes);

// Public routes
router.post('/verify', inviteCodeController.verifyInviteCode);
router.post('/use', authMiddleware, inviteCodeController.useInviteCode);

module.exports = router; 