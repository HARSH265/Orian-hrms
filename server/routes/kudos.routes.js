// server/routes/kudos.routes.js
const express = require('express');
const {
  createKudos,
  getAllKudos,
  getUserKudos,
} = require('../controllers/kudos.controller');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All kudos routes are protected, requiring a valid login
router.use(protect);

router.route('/')
    .post(createKudos)
    .get(getAllKudos);

router.route('/user/:userId')
    .get(getUserKudos);

module.exports = router;