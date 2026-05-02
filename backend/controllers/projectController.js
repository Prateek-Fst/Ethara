const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

exports.createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, description } = req.body;
    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'Admin' }]
    });
    const populated = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email role');
    res.status(201).json({ project: populated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email role')
      .sort({ createdAt: -1 });

    const withCounts = await Promise.all(
      projects.map(async (p) => {
        const total = await Task.countDocuments({ project: p._id });
        const done = await Task.countDocuments({ project: p._id, status: 'Done' });
        return { ...p.toObject(), taskCount: total, completedCount: done };
      })
    );
    res.json({ projects: withCounts });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email role');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not a project member' });
    }
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = req.project;
    const { name, description, status } = req.body;
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;
    await project.save();
    const populated = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email role');
    res.json({ project: populated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = req.project;
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only owner can delete project' });
    }
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { email, role = 'Member' } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found. Ask them to sign up first.' });

    const project = req.project;
    if (project.isMember(user._id)) {
      return res.status(400).json({ message: 'User already a member' });
    }
    project.members.push({ user: user._id, role });
    await project.save();
    const populated = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email role');
    res.json({ project: populated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const project = req.project;
    const { userId } = req.params;
    if (project.owner.toString() === userId) {
      return res.status(400).json({ message: 'Cannot remove project owner' });
    }
    project.members = project.members.filter((m) => m.user.toString() !== userId);
    await project.save();
    const populated = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email role');
    res.json({ project: populated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const project = req.project;
    const { userId } = req.params;
    const { role } = req.body;
    if (!['Admin', 'Member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const member = project.members.find((m) => m.user.toString() === userId);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    member.role = role;
    await project.save();
    const populated = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email role');
    res.json({ project: populated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
