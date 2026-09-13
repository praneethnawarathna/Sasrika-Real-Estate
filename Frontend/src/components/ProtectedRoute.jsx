import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — Wraps any component/page that requires authentication.
 *
 * Behaviour:
 *  - While auth is still loading (token being verified), renders a full-screen
 *    spinner so there is no flash-of-content before we know the auth state.
 *  - If the user is NOT authenticated, saves the intended path in sessionStorage
 *    and opens the AuthModal (via a custom event) instead of redirecting to a
 *    separate login page, since the app uses a modal-based auth flow.
 *  - If the user IS authenticated, renders children normally.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;

      // Save the intended destination so after login we can redirect back
      sessionStorage.setItem('sasrika_return_to', location.pathname);

      // Fire a global event that Navbar listens to — opens the AuthModal
      window.dispatchEvent(new CustomEvent('sasrika:open-auth-modal'));

      // Navigate home so the user isn't stuck on a blank protected page
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]);

  // While we are still checking the token, show a minimal spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Checking session…</p>
        </div>
      </div>
    );
  }

  // Not authenticated — we are navigating away, render nothing to avoid flash
  if (!isAuthenticated) return null;

  return children;
}
