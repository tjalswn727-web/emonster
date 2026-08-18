import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';

// GitHub Pages는 정적 호스팅이라 새로고침/딥링크 시 서버 쪽 라우팅 처리가 없다.
// HashRouter(주소가 /#/dashboard 형태)를 쓰면 별도 서버 설정 없이도 항상 안정적으로 동작한다.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
