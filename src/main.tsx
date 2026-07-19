import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { AppErrorBoundary } from './AppErrorBoundary.tsx';

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100dvh', background: '#0B1426', color: '#22D3EE',
      fontFamily: 'system-ui', fontSize: 18,
    }}>
      Loading...
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);

function ShellHider() {
  React.useEffect(() => {
    document.body.classList.add('app-ready');
  }, []);
  return null;
}

root.render(
  <React.StrictMode>
    <ShellHider />
    <AppErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <App />
      </Suspense>
    </AppErrorBoundary>
  </React.StrictMode>
);
