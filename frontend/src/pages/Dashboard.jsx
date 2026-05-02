import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { SkeletonStatGrid } from '../components/Skeleton';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/tasks/dashboard');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Dashboard</h1>
          <p className="muted">Loading your overview…</p>
        </div>
        <SkeletonStatGrid />
      </div>
    );
  }
  if (error) return <div className="alert alert-error">{error}</div>;

  const { stats, isGlobalAdmin, projects, tasksPerUser = [], myTasks, overdueTasks, recentTasks } = data;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isGlobalAdmin ? 'Workspace Dashboard' : 'Dashboard'}</h1>
        <p className="muted">
          {isGlobalAdmin
            ? 'Aggregate stats across every project and user in the system.'
            : 'A snapshot of your projects and tasks.'}
        </p>
      </div>

      <div className="stats-grid">
        <StatCard label={isGlobalAdmin ? 'All Projects' : 'My Projects'} value={stats.totalProjects} icon="📁" tone="blue" />
        <StatCard label="Total Tasks" value={stats.totalTasks} icon="📝" tone="purple" />
        <StatCard label="In Progress" value={stats.inProgress} icon="⚡" tone="amber" />
        <StatCard label="Completed" value={stats.done} icon="✅" tone="green" />
        <StatCard label="Overdue" value={stats.overdue} icon="⚠️" tone="red" />
        <StatCard label="My Open Tasks" value={stats.myOpenTasks} icon="👤" tone="teal" />
        {isGlobalAdmin && (
          <StatCard label="Total Users" value={stats.totalUsers} icon="👥" tone="purple" />
        )}
      </div>

      <div className="dash-grid">
        <section className="dash-card">
          <div className="dash-card-header">
            <h3>My Tasks</h3>
            <Link to="/tasks">View all →</Link>
          </div>
          {myTasks.length === 0 ? (
            <p className="muted">No tasks assigned to you yet.</p>
          ) : (
            <ul className="dash-list">
              {myTasks.map((t) => (
                <li key={t._id}>
                  <Link to={`/projects/${t.project._id}`}>
                    <span className={`status-pill ${t.status === 'Done' ? 'done' : t.status === 'In Progress' ? 'progress' : 'todo'}`}>
                      {t.status}
                    </span>
                    <span className="list-title">{t.title}</span>
                    <span className="list-meta">{t.project.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dash-card">
          <div className="dash-card-header">
            <h3>Overdue</h3>
            <span className="muted small">{overdueTasks.length} task{overdueTasks.length === 1 ? '' : 's'}</span>
          </div>
          {overdueTasks.length === 0 ? (
            <p className="muted">All caught up. </p>
          ) : (
            <ul className="dash-list">
              {overdueTasks.map((t) => (
                <li key={t._id}>
                  <Link to={`/projects/${t.project._id}`}>
                    <span className="status-pill overdue-pill">Overdue</span>
                    <span className="list-title">{t.title}</span>
                    <span className="list-meta">due {new Date(t.dueDate).toLocaleDateString()}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dash-card">
          <div className="dash-card-header">
            <h3>Your Projects</h3>
            <Link to="/projects">Manage →</Link>
          </div>
          {projects.length === 0 ? (
            <p className="muted">No projects yet. <Link to="/projects">Create one</Link>.</p>
          ) : (
            <ul className="dash-list">
              {projects.slice(0, 6).map((p) => (
                <li key={p._id}>
                  <Link to={`/projects/${p._id}`}>
                    <span className="list-title">📁 {p.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dash-card">
          <div className="dash-card-header">
            <h3>Tasks per User</h3>
            <span className="muted small">{tasksPerUser.length} {tasksPerUser.length === 1 ? 'person' : 'people'}</span>
          </div>
          {tasksPerUser.length === 0 ? (
            <p className="muted">No tasks yet.</p>
          ) : (
            <table className="per-user-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Total</th>
                  <th>Todo</th>
                  <th>In Prog.</th>
                  <th>Done</th>
                  <th>Overdue</th>
                </tr>
              </thead>
              <tbody>
                {tasksPerUser.map((u) => (
                  <tr key={u.userId}>
                    <td>
                      <div className="per-user-cell">
                        <div className="avatar avatar-sm">{u.name.charAt(0).toUpperCase()}</div>
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td><strong>{u.total}</strong></td>
                    <td>{u.todo}</td>
                    <td>{u.inProgress}</td>
                    <td>{u.done}</td>
                    <td className={u.overdue > 0 ? 'overdue-num' : ''}>{u.overdue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="dash-card">
          <div className="dash-card-header">
            <h3>Recent Activity</h3>
          </div>
          {recentTasks.length === 0 ? (
            <p className="muted">No recent tasks.</p>
          ) : (
            <ul className="dash-list">
              {recentTasks.map((t) => (
                <li key={t._id}>
                  <Link to={`/projects/${t.project._id}`}>
                    <span className={`status-pill ${t.status === 'Done' ? 'done' : t.status === 'In Progress' ? 'progress' : 'todo'}`}>
                      {t.status}
                    </span>
                    <span className="list-title">{t.title}</span>
                    <span className="list-meta">{t.project.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, tone }) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <AnimatedNumber value={value} />
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (typeof value !== 'number') { setDisplay(value || 0); return; }
    const start = display;
    const diff = value - start;
    if (diff === 0) return;
    const duration = 600;
    const startTime = performance.now();
    let raf;
    const step = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + diff * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <div className="stat-value">{display}</div>;
}
