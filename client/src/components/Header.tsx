import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import PwaInstallButton from './PwaInstallButton';
import PushToggle from './PushToggle';
import './Header.css';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <button className="header-menu-btn" onClick={onMenuClick}>
        ☰
      </button>

      <div className="header-spacer" />

      <div className="header-right">
        <PwaInstallButton />
        <PushToggle />
        <NotificationBell />

        <div className="header-user">
          <span className="header-user-name">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="header-user-role">{user?.role}</span>
        </div>

        <button className="header-logout" onClick={logout} title="Выйти" aria-label="Выйти">
          <svg
            className="header-logout-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="header-logout-label">Выйти</span>
        </button>
      </div>
    </header>
  );
}
