const express = require('express');
const { 
    getAllAssets,
    createAsset,
    updateAsset,
    deleteAsset,
    getMyAssets
} = require('../controllers/assetController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// This route is for employees to see their own assets
router.route('/my-assets').get(protect, getMyAssets);

// All routes below are for admins only
router.use(protect, authorize('hr', 'super-admin'));

router.route('/')
    .get(getAllAssets)
    .post(createAsset);

router.route('/:id')
    .put(updateAsset)
    .delete(deleteAsset);

module.exports = router;