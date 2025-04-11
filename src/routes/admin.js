/**
 * Admin Routes
 */

const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../js/api/middleware/auth.js');
const { 
    createInviteCode, 
    getAllInviteCodes, 
    verifyInviteCode,
    useInviteCode 
} = require('../js/api/admin/sqlite-invites.js');

// Note: Admin login, registration, and verification related APIs are already defined in server.js
// to avoid route conflicts

// Invite code management routes
router.post('/invites/create', requireAdminAuth, createInviteCode);
router.get('/invites', requireAdminAuth, getAllInviteCodes);
router.post('/invites/verify', verifyInviteCode);
router.post('/invites/use', useInviteCode);

module.exports = router; 