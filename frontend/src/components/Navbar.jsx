import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;
  const isActive = (p) => loc.pathname === p || loc.pathname.startsWith(p + '/');

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-icon">✓</span> TaskFlow
        </Link>
        <div className="nav-links">
          <Link to="/" className={isActive('/') && loc.pathname === '/' ? 'active' : ''}>Dashboard</Link>
          <Link to="/projects" className={isActive('/projects') ? 'active' : ''}>Projects</Link>
          <Link to="/tasks" className={isActive('/tasks') ? 'active' : ''}>My Tasks</Link>
        </div>
        <div className="nav-user">
          <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role}</div>
          </div>
          <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}
