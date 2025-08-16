const Announcement = require('../model/announcement.model');

// @desc    Get all published announcements
// @route   GET /api/announcements
// @access  Private (All logged-in users)
exports.getPublishedAnnouncements = async (req, res, next) => {
    try {
        const announcements = await Announcement.find({ status: 'Published' })
            .populate('author', 'name') // Get the author's name
            .sort({ createdAt: -1 }); // Show the newest first
        res.status(200).json({ success: true, count: announcements.length, data: announcements });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new announcement
// @route   POST /api/announcements
// @access  Private/Admin
exports.createAnnouncement = async (req, res, next) => {
    try {
        const { title, content, status } = req.body;
        // The author is the currently logged-in admin
        const author = req.user.id;

        const announcement = await Announcement.create({ title, content, status, author });
        res.status(201).json({ success: true, data: announcement });
    } catch (error) {
        next(error);
    }
};

// @desc    Update an announcement
// @route   PUT /api/announcements/:id
// @access  Private/Admin
exports.updateAnnouncement = async (req, res, next) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        // --- NEW OWNERSHIP & PERMISSION CHECK ---
        const loggedInUser = req.user;
        const isAuthor = announcement.author.toString() === loggedInUser.id.toString();
        const isSuperAdmin = loggedInUser.role === 'super-admin';

        // A user can update an announcement IF they are the author OR they are a super-admin.
        if (!isAuthor && !isSuperAdmin) {
            return res.status(403).json({ success: false, message: 'You are not authorized to update this announcement.' });
        }
        // --- END OF NEW CHECK ---

        const updatedAnnouncement = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ success: true, data: updatedAnnouncement });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
exports.deleteAnnouncement = async (req, res, next) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        // --- NEW OWNERSHIP & PERMISSION CHECK ---
        const loggedInUser = req.user;
        const isAuthor = announcement.author.toString() === loggedInUser.id.toString();
        const isSuperAdmin = loggedInUser.role === 'super-admin';

        // A user can delete an announcement IF they are the author OR they are a super-admin.
        if (!isAuthor && !isSuperAdmin) {
            return res.status(403).json({ success: false, message: 'You are not authorized to delete this announcement.' });
        }
        // --- END OF NEW CHECK ---

        await Announcement.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: 'Announcement deleted' });
    } catch (error) {
        next(error);
    }
};