import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SkeletonCardGrid } from '../components/Skeleton';

export default function Projects() {
  const { user } = useAuth();
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.projects);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/projects', { name, description });
      toast.success(`Project "${name}" created`);
      setName('');
      setDescription('');
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id, projectName) => {
    if (!confirm(`Delete "${projectName}" and all its tasks? This cannot be undone.`)) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="page">
      <div className="page-header row-between">
        <div>
          <h1>Projects</h1>
          <p className="muted">Create projects, invite teammates, track progress.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {showForm && (
        <form className="card form-card" onSubmit={create}>
          {error && <div className="alert alert-error">{error}</div>}
          <label>Project name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} placeholder="e.g. Q3 Launch" autoFocus />
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="What's this project about?"
          />
          <button className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Project'}
          </button>
        </form>
      )}

      {loading ? (
        <SkeletonCardGrid count={4} />
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <span className="empty-emoji">📂</span>
          <h3>No projects yet</h3>
          <p>Create your first project to start tracking tasks with your team.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((p) => {
            const isOwner = p.owner._id === user._id;
            const isGlobalAdmin = user.role === 'Admin';
            const canDelete = isOwner || isGlobalAdmin;
            const completion = p.taskCount ? Math.round((p.completedCount / p.taskCount) * 100) : 0;
            return (
              <div key={p._id} className="project-card">
                <div className="project-card-header">
                  <h3><Link to={`/projects/${p._id}`}>{p.name}</Link></h3>
                  <span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span>
                </div>
                {p.description && <p className="muted">{p.description}</p>}
                <div className="project-meta">
                  <span>👤 {p.members.length} member{p.members.length === 1 ? '' : 's'}</span>
                  <span>📝 {p.taskCount} task{p.taskCount === 1 ? '' : 's'}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${completion}%` }} />
                </div>
                <div className="progress-label">
                  {p.completedCount} / {p.taskCount} done · {completion}%
                </div>
                <div className="project-actions">
                  <Link to={`/projects/${p._id}`} className="btn btn-secondary btn-sm">Open</Link>
                  {canDelete && (
                    <button className="btn btn-danger btn-sm" onClick={() => remove(p._id, p.name)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
