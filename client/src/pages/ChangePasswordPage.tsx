import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api/auth';
import './LoginPage.css';

export default function ChangePasswordPage() {
  const { mustChangePassword, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Новый пароль должен содержать минимум 6 символов');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (currentPassword === newPassword) {
      setError('Новый пароль должен отличаться от текущего');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      await refreshUser();
      setSuccess('Пароль успешно обновлён');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        const from = (location.state as { from?: string } | null)?.from;
        navigate(from && from !== '/change-password' ? from : '/', { replace: true });
      }, 800);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Не удалось сменить пароль');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <h1>Смена пароля</h1>
          <p>
            {mustChangePassword
              ? 'Пароль выдан администратором. Задайте свой постоянный пароль для продолжения.'
              : 'Введите текущий пароль и новый пароль'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}
          {success && (
            <div className="login-error" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
              {success}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="currentPassword">Текущий пароль</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">Новый пароль</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Повторите новый пароль</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : 'Сменить пароль'}
          </button>

          {!mustChangePassword && (
            <button
              type="button"
              className="login-btn"
              style={{ background: 'transparent', color: '#6c63ff', border: '1px solid #d1d5db' }}
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Отмена
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
