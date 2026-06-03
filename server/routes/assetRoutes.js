const express = require('express');
const {
    getAllAssets, getAssetById, createAsset, updateAsset, deleteAsset, getMyAssets, getAssetHistory, getDepreciation, getLicenseSummary, getSummary, exportCSV,
    addAttachment, removeAttachment,
} = require('../controllers/assetController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const router = express.Router();

router.use(protect);

router.get('/my-assets', getMyAssets);
router.get('/summary', checkPermissions(PERMISSIONS.MANAGE_ASSETS), getSummary);
router.get('/licenses/summary', checkPermissions(PERMISSIONS.MANAGE_ASSETS), getLicenseSummary);
router.get('/export', checkPermissions(PERMISSIONS.MANAGE_ASSETS), exportCSV);

router.use(checkPermissions(PERMISSIONS.MANAGE_ASSETS));

router.route('/')
    .get(getAllAssets)
    .post(createAsset);

router.route('/:id')
    .get(getAssetById)
    .put(updateAsset)
    .delete(deleteAsset);

router.get('/:id/history', getAssetHistory);
router.get('/:id/depreciation', getDepreciation);
router.post('/:id/attachments', addAttachment);
router.delete('/:id/attachments/:documentId', removeAttachment);

module.exports = router;
