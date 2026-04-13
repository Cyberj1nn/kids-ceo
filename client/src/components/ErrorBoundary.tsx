import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: '24px',
          textAlign: 'center', background: '#f0f4f8',
        }}>
          <h1 style={{ fontSize: '24px', color: '#1a1a2e', marginBottom: '12px' }}>
            Что-то пошло не так
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '24px', maxWidth: '400px' }}>
            Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 28px', background: '#6c63ff', color: '#fff',
              border: 'none', borderRadius: '12px', fontSize: '15px',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Перезагрузить
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
