import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
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

  const isOwner = project.owner._id === user._id;
  const memberRecord = project.members.find((m) => m.user._id === user._id);
  const isProjectAdmin = isOwner || (memberRecord && memberRecord.role === 'Admin');

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
      alert(err.response?.data?.message || 'Failed to create task');
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
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
      alert(err.response?.data?.message || 'Failed to add member');
    }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member from the project?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const changeMemberRole = async (userId, role) => {
    try {
      await api.put(`/projects/${id}/members/${userId}`, { role });
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change role');
    }
  };

  const grouped = {
    Todo: tasks.filter((t) => t.status === 'Todo'),
    'In Progress': tasks.filter((t) => t.status === 'In Progress'),
    Done: tasks.filter((t) => t.status === 'Done')
  };

  const canChangeStatus = (task) =>
    isProjectAdmin ||
    task.createdBy._id === user._id ||
    (task.assignedTo && task.assignedTo._id === user._id);

  const canEditTask = (task) =>
    isProjectAdmin || task.createdBy._id === user._id;

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
          </div>
        </div>
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

          <div className="board">
            {['Todo', 'In Progress', 'Done'].map((col) => (
              <div key={col} className="board-col">
                <div className="board-col-header">
                  <h3>{col}</h3>
                  <span className="count">{grouped[col].length}</span>
                </div>
                <div className="board-col-body">
                  {grouped[col].length === 0 ? (
                    <p className="muted small">No tasks</p>
                  ) : (
                    grouped[col].map((t) => (
                      <TaskCard
                        key={t._id}
                        task={t}
                        onStatusChange={updateStatus}
                        onDelete={deleteTask}
                        canEdit={canEditTask(t)}
                        canChangeStatus={canChangeStatus(t)}
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
