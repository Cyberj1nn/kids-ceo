import { NavLink } from 'react-router-dom';
import type { Tab } from '../api/auth';
import './Sidebar.css';

const TAB_ICONS: Record<string, string> = {
  'beseda': '💬',
  'lectures': '📚',
  'instructions': '📋',
  'podcasts': '🎧',
  'books': '📖',
  'films': '🎬',
  'program-360': '🎯',
  'marathons': '🏃',
  'personal-chat': '✉️',
  'dtp': '📊',
  'call-tracker': '📞',
};

interface SidebarProps {
  tabs: Tab[];
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

export default function Sidebar({ tabs, isOpen, onClose, userRole }: SidebarProps) {
  const showAdmin = ['superadmin', 'admin', 'mentor'].includes(userRole);

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Malafeeva School</h2>
          <button className="sidebar-close" onClick={onClose}>✕</button>
        </div>

        <nav className="sidebar-nav">
          {tabs.map((tab) => (
            <NavLink
              key={tab.slug}
              to={`/${tab.slug}`}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-icon">{TAB_ICONS[tab.slug] || '📄'}</span>
              <span className="sidebar-label">{tab.name}</span>
            </NavLink>
          ))}

          {showAdmin && (
            <>
              <div className="sidebar-divider" />
              <NavLink
                to="/admin"
                className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
                onClick={onClose}
              >
                <span className="sidebar-icon">⚙️</span>
                <span className="sidebar-label">Админка</span>
              </NavLink>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
