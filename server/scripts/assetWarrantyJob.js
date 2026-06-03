const Asset = require('../model/asset.model');
const AssetLog = require('../model/assetLog.model');
const { createNotification } = require('../services/notificationService');
const User = require('../model/user');
const logger = require('../utils/logger');

const processAssetWarranty = async () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringAssets = await Asset.find({
        warrantyEndDate: { $lte: thirtyDaysFromNow, $gte: now },
    }).populate('assignedTo', '_id').populate('custodian', '_id');

    const admins = await User.find({ systemRole: { $in: ['hr', 'super-admin'] } }).select('_id');

    let notified = 0;
    for (const asset of expiringAssets) {
        try {
            const recipients = new Set();
            if (asset.assignedTo) recipients.add(asset.assignedTo._id.toString());
            if (asset.custodian) recipients.add(asset.custodian._id.toString());
            admins.forEach(a => recipients.add(a._id.toString()));

            const daysLeft = Math.ceil((asset.warrantyEndDate - now) / (1000 * 60 * 60 * 24));

            for (const recipientId of recipients) {
                await createNotification({
                    recipient: recipientId,
                    message: `Warranty for "${asset.name}" expires in ${daysLeft} day(s) (${asset.warrantyEndDate.toISOString().split('T')[0]}).`,
                    link: '/assets',
                    type: 'Asset',
                }, {});
            }

            await AssetLog.create({
                asset: asset._id, action: 'status_changed',
                performedBy: asset.assignedTo?._id || admins[0]?._id,
                notes: `Warranty expires on ${asset.warrantyEndDate.toISOString().split('T')[0]}`,
            });
            notified++;
        } catch (err) {
            logger.error(`Warranty notification failed for asset ${asset._id}: ${err.message}`);
        }
    }
    if (notified > 0) logger.info(`Asset warranty job: notified for ${notified} asset(s)`);
    return notified;
};

const startAssetWarrantyJob = (intervalMs = 24 * 60 * 60 * 1000) => {
    logger.info('Asset warranty job started (interval: 24h)');
    processAssetWarranty().catch(err => logger.error('Asset warranty job initial run failed:', err.message));
    setInterval(() => {
        processAssetWarranty().catch(err => logger.error('Asset warranty job run failed:', err.message));
    }, intervalMs);
};

module.exports = { startAssetWarrantyJob, processAssetWarranty };
