import { AppShell } from './components/AppShell';
import { CookiePolicy } from './components/CookiePolicy';

export function App() {
  const isCookiePolicy =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/cookie-policy' ||
      window.location.pathname === '/cookie-policy.html' ||
      window.location.hash === '#cookie-policy');

  if (isCookiePolicy) {
    return <CookiePolicy />;
  }

  return <AppShell />;
}

export default App;
