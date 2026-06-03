const Asset = require('../model/asset.model');
const AssetLog = require('../model/assetLog.model');
const { createNotification } = require('../services/notificationService');
const logger = require('../utils/logger');

const processAssetMaintenance = async () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const dueAssets = await Asset.find({
        maintenanceNextDate: { $lte: thirtyDaysFromNow, $gte: now },
    }).populate('assignedTo', '_id').populate('custodian', '_id');

    let notified = 0;
    for (const asset of dueAssets) {
        try {
            const recipients = new Set();
            if (asset.assignedTo) recipients.add(asset.assignedTo._id.toString());
            if (asset.custodian) recipients.add(asset.custodian._id.toString());

            const daysUntilDue = Math.ceil((asset.maintenanceNextDate - now) / (1000 * 60 * 60 * 24));
            const label = daysUntilDue <= 0 ? 'is due today' : `is due in ${daysUntilDue} day(s)`;

            for (const recipientId of recipients) {
                await createNotification({
                    recipient: recipientId,
                    message: `Maintenance for "${asset.name}" ${label} (${asset.maintenanceNextDate.toISOString().split('T')[0]}).`,
                    link: '/assets',
                    type: 'Asset',
                }, {});
            }

            await AssetLog.create({
                asset: asset._id,
                action: 'maintenance_due',
                performedBy: asset.assignedTo?._id || asset.custodian?._id,
                notes: `Maintenance due on ${asset.maintenanceNextDate.toISOString().split('T')[0]}`,
            });

            notified++;
        } catch (err) {
            logger.error(`Maintenance notification failed for asset ${asset._id}: ${err.message}`);
        }
    }

    if (notified > 0) logger.info(`Asset maintenance job: notified for ${notified} asset(s)`);
    return notified;
};

const startAssetMaintenanceJob = (intervalMs = 24 * 60 * 60 * 1000) => {
    logger.info('Asset maintenance job started (interval: 24h)');
    processAssetMaintenance().catch(err => logger.error('Asset maintenance job initial run failed:', err.message));
    setInterval(() => {
        processAssetMaintenance().catch(err => logger.error('Asset maintenance job run failed:', err.message));
    }, intervalMs);
};

module.exports = { startAssetMaintenanceJob, processAssetMaintenance };
