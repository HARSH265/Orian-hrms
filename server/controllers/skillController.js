const Skill = require('../model/skill.model');

// @desc    Get all active (non-archived) skills from the library
// @route   GET /api/skills
exports.getAllSkills = async (req, res, next) => {
    try {
        // Admins can see all skills, others only see active ones.
        const query = (req.user.role === 'hr' || req.user.role === 'super-admin') ? {} : { isArchived: false };
        const skills = await Skill.find(query).sort({ category: 1, name: 1 });
        res.status(200).json({ success: true, data: skills });
    } catch (error) { next(error); }
};

// @desc    Admin creates a new skill in the library
// @route   POST /api/skills
exports.createSkill = async (req, res, next) => {
    try {
        // Add the creator's ID to the request body
        req.body.createdBy = req.user.id;
        const skill = await Skill.create(req.body);
        res.status(201).json({ success: true, data: skill });
    } catch (error) { next(error); }
};

// @desc    Admin updates a skill's details
// @route   PUT /api/skills/:id
exports.updateSkill = async (req, res, next) => {
    try {
        let skill = await Skill.findById(req.params.id);
        if (!skill) {
            return res.status(404).json({ success: false, message: 'Skill not found' });
        }
        skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.status(200).json({ success: true, data: skill });
    } catch (error) { next(error); }
};

// @desc    Admin archives a skill (soft delete)
// @route   DELETE /api/skills/:id
exports.archiveSkill = async (req, res, next) => {
    try {
        let skill = await Skill.findById(req.params.id);
        if (!skill) {
            return res.status(404).json({ success: false, message: 'Skill not found' });
        }
        // Instead of deleting, we set the 'isArchived' flag to true
        skill.isArchived = true;
        await skill.save();
        res.status(200).json({ success: true, message: 'Skill archived successfully' });
    } catch (error) { next(error); }
};