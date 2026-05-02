import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;
  const isActive = (p) => (p === '/' ? loc.pathname === '/' : loc.pathname.startsWith(p));

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-icon">✓</span>
          <span>TaskFlow</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className={isActive('/') ? 'active' : ''}>Dashboard</Link>
          <Link to="/projects" className={isActive('/projects') ? 'active' : ''}>Projects</Link>
          <Link to="/tasks" className={isActive('/tasks') ? 'active' : ''}>My Tasks</Link>
        </div>
        <div className="nav-user">
          <ThemeToggle />
          <div className="avatar" title={user.name}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">
              {user.role === 'Admin' ? (
                <span className="role-badge role-admin">Global Admin</span>
              ) : (
                'Member'
              )}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}
