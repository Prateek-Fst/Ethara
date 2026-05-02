const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  getDashboard
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboard);
router.post(
  '/',
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title 1-200 chars'),
    body('project').notEmpty().withMessage('Project id required')
  ],
  createTask
);
router.get('/', getTasks);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
