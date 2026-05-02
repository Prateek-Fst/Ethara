import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TaskCard from '../components/TaskCard';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('board');

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Medium',
    dueDate: ''
  });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('Member');

  const load = async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`)
      ]);
      setProject(pRes.data.project);
      setTasks(tRes.data.tasks);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <div className="loading">Loading project…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!project) return null;

  const isGlobalAdmin = user.role === 'Admin';
  const isOwner = project.owner._id === user._id;
  const memberRecord = project.members.find((m) => m.user._id === user._id);
  const isProjectAdmin = isGlobalAdmin || isOwner || (memberRecord && memberRecord.role === 'Admin');
  const canDeleteProject = isOwner || isGlobalAdmin;
  const canDeleteTask = isOwner || isGlobalAdmin;

  const createTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', {
        ...taskForm,
        project: id,
        assignedTo: taskForm.assignedTo || null,
        dueDate: taskForm.dueDate || null
      });
      setTaskForm({ title: '', description: '', assignedTo: '', priority: 'Medium', dueDate: '' });
      setShowTaskForm(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    }
  };

  const updateStatus = async (taskId, status) => {
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status } : t)));
    try {
      await api.put(`/tasks/${taskId}`, { status });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
      await load();
    }
  };

  const handleDragStart = (taskId) => (e) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverCol(null);
  };

  const handleColumnDragOver = (col) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== col) setDragOverCol(col);
  };

  const handleColumnDragLeave = (col) => () => {
    if (dragOverCol === col) setDragOverCol(null);
  };

  const handleColumnDrop = (col) => async (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDraggingTaskId(null);
    setDragOverCol(null);
    if (!taskId) return;
    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === col) return;
    if (!canChangeStatus(task)) {
      toast.error('You cannot change the status of this task.');
      return;
    }
    await updateStatus(taskId, col);
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail, role: memberRole });
      setMemberEmail('');
      setMemberRole('Member');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm(`Delete the project "${project.name}" and all its tasks? This cannot be undone.`)) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member from the project?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const changeMemberRole = async (userId, role) => {
    try {
      await api.put(`/projects/${id}/members/${userId}`, { role });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change role');
    }
  };

  const grouped = {
    Todo: tasks.filter((t) => t.status === 'Todo'),
    'In Progress': tasks.filter((t) => t.status === 'In Progress'),
    Done: tasks.filter((t) => t.status === 'Done')
  };

  const canChangeStatus = (task) =>
    isProjectAdmin ||
    (task.assignedTo && task.assignedTo._id === user._id);

  const canEditTask = () => canDeleteTask;

  return (
    <div className="page">
      <div className="page-header row-between">
        <div>
          <Link to="/projects" className="back-link">← All Projects</Link>
          <h1>{project.name}</h1>
          {project.description && <p className="muted">{project.description}</p>}
          <div className="project-info-row">
            <span className={`badge badge-${project.status.toLowerCase()}`}>{project.status}</span>
            <span className="muted">Owner: {project.owner.name}</span>
            {isGlobalAdmin && !memberRecord && (
              <span className="badge badge-owner">Global Admin view</span>
            )}
          </div>
        </div>
        {canDeleteProject && (
          <button className="btn btn-danger" onClick={handleDeleteProject}>
            Delete Project
          </button>
        )}
      </div>

      <div className="tabs">
        <button className={tab === 'board' ? 'tab active' : 'tab'} onClick={() => setTab('board')}>
          Board
        </button>
        <button className={tab === 'members' ? 'tab active' : 'tab'} onClick={() => setTab('members')}>
          Members ({project.members.length})
        </button>
      </div>

      {tab === 'board' && (
        <>
          {isProjectAdmin && (
            <div className="row-between" style={{ marginBottom: 16 }}>
              <div />
              <button className="btn btn-primary" onClick={() => setShowTaskForm(!showTaskForm)}>
                {showTaskForm ? 'Cancel' : '+ New Task'}
              </button>
            </div>
          )}
          {showTaskForm && (
            <form className="card form-card" onSubmit={createTask}>
              <label>Title</label>
              <input
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                required
                maxLength={200}
              />
              <label>Description</label>
              <textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                rows={3}
                maxLength={2000}
              />
              <div className="form-row">
                <div>
                  <label>Assignee</label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {project.members.map((m) => (
                      <option key={m.user._id} value={m.user._id}>
                        {m.user.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div>
                  <label>Due date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <button className="btn btn-primary">Create Task</button>
            </form>
          )}

          <p className="muted small" style={{ marginBottom: 8 }}>
            Tip: drag a task card between columns to change its status.
          </p>
          <div className="board">
            {['Todo', 'In Progress', 'Done'].map((col) => (
              <div
                key={col}
                className={`board-col ${dragOverCol === col ? 'drag-over' : ''}`}
                onDragOver={handleColumnDragOver(col)}
                onDragLeave={handleColumnDragLeave(col)}
                onDrop={handleColumnDrop(col)}
              >
                <div className="board-col-header">
                  <h3>{col}</h3>
                  <span className="count">{grouped[col].length}</span>
                </div>
                <div className="board-col-body">
                  {grouped[col].length === 0 ? (
                    <p className="muted small empty-col">Drop tasks here</p>
                  ) : (
                    grouped[col].map((t) => (
                      <TaskCard
                        key={t._id}
                        task={t}
                        onStatusChange={updateStatus}
                        onDelete={deleteTask}
                        canEdit={canEditTask()}
                        canChangeStatus={canChangeStatus(t)}
                        draggable={canChangeStatus(t)}
                        onDragStart={handleDragStart(t._id)}
                        onDragEnd={handleDragEnd}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'members' && (
        <div className="members-section">
          {isProjectAdmin && (
            <form className="card form-card" onSubmit={addMember}>
              <h3>Add member</h3>
              <p className="muted small">User must already have an account.</p>
              <div className="form-row">
                <div style={{ flex: 2 }}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    required
                    placeholder="teammate@example.com"
                  />
                </div>
                <div>
                  <label>Role</label>
                  <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
                    <option>Member</option>
                    <option>Admin</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-primary">Add</button>
            </form>
          )}

          <div className="card">
            <h3>Team ({project.members.length})</h3>
            <ul className="members-list">
              {project.members.map((m) => (
                <li key={m.user._id}>
                  <div className="avatar">{m.user.name.charAt(0).toUpperCase()}</div>
                  <div className="member-info">
                    <div className="member-name">{m.user.name}</div>
                    <div className="member-email">{m.user.email}</div>
                  </div>
                  <div className="member-controls">
                    {project.owner._id === m.user._id ? (
                      <span className="badge badge-owner">Owner</span>
                    ) : isProjectAdmin ? (
                      <>
                        <select
                          value={m.role}
                          onChange={(e) => changeMemberRole(m.user._id, e.target.value)}
                        >
                          <option>Member</option>
                          <option>Admin</option>
                        </select>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => removeMember(m.user._id)}
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <span className="badge">{m.role}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
