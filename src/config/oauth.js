// OAuth2 Configuration for Drupal 11 Simple OAuth
// Replace these values with your actual Drupal OAuth2 configuration

const OAUTH_CONFIG = {
  // Your Drupal backend URL (empty for relative URLs that go through Vite proxy)
  DRUPAL_BASE_URL: '',

  // OAuth2 endpoints (Simple OAuth module)
  OAUTH_ENDPOINTS: {
    authorize: '/oauth/authorize',
    token: '/oauth/token',
    userInfo: '/oauth/userinfo',
    revoke: '/oauth/revoke'
  },

  // Your OAuth2 client credentials
  // These are created in Drupal: Configuration > Web services > Simple OAuth
  CLIENT_ID: 'test-frontend',
  CLIENT_SECRET: 'test-secret-key-12345',

  // OAuth2 configuration for ROPC (Resource Owner Password Credentials) flow
  OAUTH_CONFIG: {
    client_id: 'test-frontend',
    client_secret: 'test-secret-key-12345',
    redirect_uri: `${window.location.origin}/auth/callback`,
    scope: 'basic', // Adjust based on your OAuth scopes
    grant_type: 'password', // Changed from authorization_code to password
    response_type: 'code'
  },

  // Storage keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'maidenov_access_token',
    REFRESH_TOKEN: 'maidenov_refresh_token',
    EXPIRES_AT: 'maidenov_token_expires_at',
    USER_INFO: 'maidenov_user_info',
    STATE: 'maidenov_oauth_state',
    CODE_VERIFIER: 'maidenov_code_verifier'
  }
};

export default OAUTH_CONFIG;