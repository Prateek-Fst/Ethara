const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const {
  loadProject,
  requireProjectMember,
  requireProjectAdmin
} = require('../middleware/projectAccess');

router.use(protect);

router.post(
  '/',
  [body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name 1-100 chars')],
  createProject
);
router.get('/', getProjects);
router.get('/:id', getProject);
router.put('/:id', loadProject, requireProjectAdmin, updateProject);
router.delete('/:id', loadProject, deleteProject);
router.post('/:id/members', loadProject, requireProjectAdmin, addMember);
router.put('/:id/members/:userId', loadProject, requireProjectAdmin, updateMemberRole);
router.delete('/:id/members/:userId', loadProject, requireProjectAdmin, removeMember);

module.exports = router;
