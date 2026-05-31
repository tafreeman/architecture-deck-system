import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.v14.tsx';

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
root.render(
  <React.StrictMode>
    <Suspense fallback={<LoadingScreen />}>
      <App />
    </Suspense>
  </React.StrictMode>
);
// Signal to the pre-mount shell that React has taken over.
// Uses a React-driven class rather than a MutationObserver so browser
// extensions injecting nodes into #root cannot trigger a false positive.
document.body.classList.add('app-ready');
