const express = require('express');
const { 
    getAllSkills, 
    createSkill,
    updateSkill,
    archiveSkill
} = require('../controllers/skillController');

const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const router = express.Router();

// All routes require login
router.use(protect);

// Get all skills is accessible to everyone
router.route('/')
    .get(getAllSkills)
    .post(checkPermissions(PERMISSIONS.MANAGE_SKILLS), createSkill);

// Update and Delete (Archive) are for admins only
router.route('/:id')
    .put(checkPermissions(PERMISSIONS.MANAGE_SKILLS), updateSkill)
    .delete(checkPermissions(PERMISSIONS.MANAGE_SKILLS), archiveSkill);


module.exports = router;