const express = require('express');
const {
    getAllSkills, getSkillById, createSkill, updateSkill, archiveSkill, exportSkills,
} = require('../controllers/skillController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect);

router.get('/export', checkPermissions(PERMISSIONS.MANAGE_SKILLS), exportSkills);

router.route('/')
    .get(getAllSkills)
    .post(checkPermissions(PERMISSIONS.MANAGE_SKILLS), createSkill);

router.route('/:id')
    .get(getSkillById)
    .put(checkPermissions(PERMISSIONS.MANAGE_SKILLS), updateSkill)
    .delete(checkPermissions(PERMISSIONS.MANAGE_SKILLS), archiveSkill);

module.exports = router;
