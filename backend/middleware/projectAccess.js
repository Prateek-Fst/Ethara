const Project = require('../models/Project');

const loadProject = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.project;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    req.project = project;
    next();
  } catch (err) {
    return res.status(400).json({ message: 'Invalid project id' });
  }
};

const requireProjectMember = (req, res, next) => {
  if (!req.project.canView(req.user)) {
    return res.status(403).json({ message: 'Not a project member' });
  }
  next();
};

const requireProjectAdmin = (req, res, next) => {
  if (!req.project.canActAsAdmin(req.user)) {
    return res.status(403).json({ message: 'Project admin access required' });
  }
  next();
};

module.exports = { loadProject, requireProjectMember, requireProjectAdmin };
