const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');

exports.createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, description, project: projectId, assignedTo, status, priority, dueDate } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not a project member' });
    }
    if (assignedTo && !project.isMember(assignedTo)) {
      return res.status(400).json({ message: 'Assignee must be a project member' });
    }
    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      status: status || 'Todo',
      priority: priority || 'Medium',
      dueDate: dueDate || null
    });
    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');
    res.status(201).json({ task: populated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { project: projectId, status, assignedTo, priority, mine } = req.query;
    const filter = {};

    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ message: 'Project not found' });
      if (!project.isMember(req.user._id)) {
        return res.status(403).json({ message: 'Not a project member' });
      }
      filter.project = projectId;
    } else {
      const userProjects = await Project.find({
        $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
      }).select('_id');
      filter.project = { $in: userProjects.map((p) => p._id) };
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (mine === 'true') filter.assignedTo = req.user._id;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 });
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name owner members');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const project = await Project.findById(task.project._id);
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not a project member' });
    }
    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not a project member' });
    }

    const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
    const isAdmin = project.isAdmin(req.user._id);
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    const { title, description, assignedTo, status, priority, dueDate } = req.body;

    if ((title !== undefined || description !== undefined || dueDate !== undefined ||
         priority !== undefined || assignedTo !== undefined) && !isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Only project admins or task creator can edit task details' });
    }

    if (status !== undefined && !isAssignee && !isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Only assignee, creator, or admin can change status' });
    }

    if (assignedTo !== undefined) {
      if (assignedTo && !project.isMember(assignedTo)) {
        return res.status(400).json({ message: 'Assignee must be a project member' });
      }
      task.assignedTo = assignedTo || null;
    }
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (status !== undefined) {
      task.status = status;
      task.completedAt = status === 'Done' ? new Date() : null;
    }
    await task.save();
    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');
    res.json({ task: populated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const project = await Project.findById(task.project);
    const isAdmin = project.isAdmin(req.user._id);
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Only project admin or task creator can delete' });
    }
    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const userProjects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
    }).select('_id name');

    const projectIds = userProjects.map((p) => p._id);
    const allTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .sort({ dueDate: 1, createdAt: -1 });

    const myTasks = allTasks.filter(
      (t) => t.assignedTo && t.assignedTo._id.toString() === req.user._id.toString()
    );
    const now = new Date();
    const overdue = allTasks.filter(
      (t) => t.dueDate && t.status !== 'Done' && new Date(t.dueDate) < now
    );

    const stats = {
      totalProjects: userProjects.length,
      totalTasks: allTasks.length,
      todo: allTasks.filter((t) => t.status === 'Todo').length,
      inProgress: allTasks.filter((t) => t.status === 'In Progress').length,
      done: allTasks.filter((t) => t.status === 'Done').length,
      overdue: overdue.length,
      myTasks: myTasks.length,
      myOpenTasks: myTasks.filter((t) => t.status !== 'Done').length
    };

    const perUserMap = new Map();
    for (const t of allTasks) {
      const key = t.assignedTo ? t.assignedTo._id.toString() : 'unassigned';
      const name = t.assignedTo ? t.assignedTo.name : 'Unassigned';
      const email = t.assignedTo ? t.assignedTo.email : '';
      if (!perUserMap.has(key)) {
        perUserMap.set(key, { userId: key, name, email, total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 });
      }
      const row = perUserMap.get(key);
      row.total += 1;
      if (t.status === 'Todo') row.todo += 1;
      else if (t.status === 'In Progress') row.inProgress += 1;
      else if (t.status === 'Done') row.done += 1;
      if (t.dueDate && t.status !== 'Done' && new Date(t.dueDate) < now) row.overdue += 1;
    }
    const tasksPerUser = Array.from(perUserMap.values()).sort((a, b) => b.total - a.total);

    res.json({
      stats,
      projects: userProjects,
      tasksPerUser,
      myTasks: myTasks.slice(0, 10),
      overdueTasks: overdue.slice(0, 10),
      recentTasks: allTasks.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
