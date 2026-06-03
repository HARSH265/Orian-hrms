const express = require('express');
const { createKudos, getAllKudos, getUserKudos, deleteKudos, exportKudos } = require('../controllers/kudos.controller');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { featureEnabled } = require('../middleware/featureToggle');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect);
router.use(featureEnabled('kudos'));

router.get('/export', checkPermissions(PERMISSIONS.MANAGE_KUDOS), exportKudos);

router.route('/')
    .post(createKudos)
    .get(getAllKudos);

router.route('/user/:userId')
    .get(getUserKudos);

router.route('/:id')
    .delete(deleteKudos);

module.exports = router;
