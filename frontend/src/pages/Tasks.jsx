import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('mine');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'mine') params.set('mine', 'true');
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      const res = await api.get(`/tasks?${params.toString()}`);
      setTasks(res.data.tasks);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter, statusFilter, priorityFilter]);

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

  return (
    <div className="page">
      <div className="page-header">
        <h1>{filter === 'mine' ? 'My Tasks' : 'All Tasks'}</h1>
        <p className="muted">
          {filter === 'mine'
            ? 'Tasks assigned to you across all projects'
            : 'All tasks across your projects'}
        </p>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label>Show</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="mine">Assigned to me</option>
            <option value="all">All tasks</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Priority</label>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <div className="loading">Loading…</div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <h3>No tasks found</h3>
          <p>Try changing filters or create a task in a project.</p>
        </div>
      ) : (
        <div className="tasks-list">
          {tasks.map((t) => {
            const isGlobalAdmin = user.role === 'Admin';
            const canChangeStatus =
              isGlobalAdmin || (t.assignedTo && t.assignedTo._id === user._id);
            const canEdit = isGlobalAdmin;
            return (
              <TaskCard
                key={t._id}
                task={t}
                onStatusChange={updateStatus}
                onDelete={deleteTask}
                canEdit={canEdit}
                canChangeStatus={canChangeStatus}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
