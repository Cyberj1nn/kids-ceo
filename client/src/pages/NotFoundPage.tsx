import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '400px', textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '64px', color: '#d1d5db', margin: '0 0 8px', fontWeight: 700 }}>404</h1>
      <h2 style={{ fontSize: '20px', color: '#1a1a2e', margin: '0 0 12px' }}>Страница не найдена</h2>
      <p style={{ color: '#6b7280', margin: '0 0 24px' }}>
        Возможно, у вас нет доступа или страница была удалена
      </p>
      <Link
        to="/"
        style={{
          padding: '12px 28px', background: '#6c63ff', color: '#fff',
          borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: 600,
        }}
      >
        На главную
      </Link>
    </div>
  );
}
