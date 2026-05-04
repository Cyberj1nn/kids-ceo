import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTabs, type Tab } from '../api/auth';
import Sidebar from './Sidebar';
import Header from './Header';
import usePushIntegration from '../hooks/usePushIntegration';
import './MainLayout.css';

export default function MainLayout() {
  const { user } = useAuth();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  usePushIntegration();

  useEffect(() => {
    getTabs().then(setTabs).catch(console.error);
  }, []);

  return (
    <div className="layout">
      <Sidebar
        tabs={tabs}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={user?.role || 'user'}
      />
      <div className="layout-main">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
