import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
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
        <NotificationBell />

        <div className="header-user">
          <span className="header-user-name">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="header-user-role">{user?.role}</span>
        </div>

        <button className="header-logout" onClick={logout} title="Выйти">
          Выйти
        </button>
      </div>
    </header>
  );
}
