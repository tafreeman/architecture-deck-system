import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

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
    <Suspense fallback={<LoadingScreen />}>
      <App />
    </Suspense>
  </React.StrictMode>
);
