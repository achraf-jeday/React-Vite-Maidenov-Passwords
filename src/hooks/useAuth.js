import { useAuth as useAuthContext } from '../contexts/AuthContext';

/**
 * Custom hook for authentication
 * Provides all auth-related functionality
 */
export const useAuth = () => {
  const auth = useAuthContext();

  return {
    // Auth state
    user: auth.user,
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: auth.isAuthenticated,

    // Auth methods
    login: auth.login,
    logout: auth.logout,
    checkAuthStatus: auth.checkAuthStatus,
    isTokenExpired: auth.isTokenExpired,

    // User actions
    loginWithDrupal: auth.login,
    logoutFromDrupal: auth.logout,

    // User data
    userName: auth.user?.name || auth.user?.display_name || 'User',
    userEmail: auth.user?.mail || auth.user?.email || null,
    userRoles: auth.user?.roles || []
  };
};

/**
 * Hook for checking authentication status
 */
export const useAuthStatus = () => {
  const { loading, isAuthenticated, user } = useAuth();
  return { loading, isAuthenticated, user };
};

/**
 * Hook for OAuth2 flow management
 */
export const useOAuth2 = () => {
  const { login, logout, error } = useAuth();

  return {
    initiateLogin: login,
    logout,
    error,
    isOAuthError: !!error
  };
};

/**
 * Hook for user profile management
 */
export const useUserProfile = () => {
  const { user, loading, checkAuthStatus } = useAuth();

  return {
    user,
    loading,
    refreshProfile: checkAuthStatus,
    displayName: user?.name || user?.display_name || 'User',
    email: user?.mail || user?.email || null,
    roles: user?.roles || [],
    id: user?.id || user?.user_id || null
  };
};

/**
 * Hook for protected resources
 */
export const useProtectedResource = () => {
  const { isAuthenticated, loading, user } = useAuth();

  return {
    isAuthenticated,
    loading,
    user,
    canAccess: isAuthenticated && !loading,
    requiresAuth: !isAuthenticated && !loading
  };
};