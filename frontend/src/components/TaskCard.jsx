import { Link } from 'react-router-dom';

const statusColors = {
  Todo: 'badge-todo',
  'In Progress': 'badge-progress',
  Done: 'badge-done'
};

const priorityColors = {
  Low: 'priority-low',
  Medium: 'priority-medium',
  High: 'priority-high'
};

export default function TaskCard({ task, onStatusChange, onDelete, canEdit, canChangeStatus, draggable, onDragStart, onDragEnd }) {
  const isOverdue = task.dueDate && task.status !== 'Done' && new Date(task.dueDate) < new Date();
  const due = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null;

  return (
    <div
      className={`task-card ${isOverdue ? 'overdue' : ''} ${draggable ? 'draggable' : ''}`}
      draggable={!!draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="task-header">
        <span className={`priority-dot ${priorityColors[task.priority]}`} title={task.priority} />
        <h4 className="task-title">{task.title}</h4>
        <span className={`badge ${statusColors[task.status]}`}>{task.status}</span>
      </div>
      {task.description && <p className="task-desc">{task.description}</p>}
      <div className="task-meta">
        {task.project && (
          <Link to={`/projects/${task.project._id}`} className="meta-chip">📁 {task.project.name}</Link>
        )}
        {task.assignedTo && (
          <span className="meta-chip">👤 {task.assignedTo.name}</span>
        )}
        {due && (
          <span className={`meta-chip ${isOverdue ? 'meta-overdue' : ''}`}>📅 {due}</span>
        )}
      </div>
      {(canChangeStatus || canEdit) && (
        <div className="task-actions">
          {canChangeStatus && (
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task._id, e.target.value)}
              className="select-sm"
            >
              <option>Todo</option>
              <option>In Progress</option>
              <option>Done</option>
            </select>
          )}
          {canEdit && (
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(task._id)}>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
