const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { signup, login, getMe, listUsers } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post(
  '/signup',
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 chars'),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars')
  ],
  signup
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password required')
  ],
  login
);

router.get('/me', protect, getMe);
router.get('/users', protect, listUsers);

module.exports = router;
