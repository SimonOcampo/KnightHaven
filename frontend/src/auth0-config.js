// Auth0 configuration for KnightHaven
// You'll need to replace these with your actual Auth0 credentials

export const auth0Config = {
  domain: 'dev-j128izgqa8zt8f42.us.auth0.com',
  clientId: 'JKgtM8QIzwcpMR0P8ow3HkmKgpDIzsQz',
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: 'https://knighthaven-api',
    scope: 'openid profile email read:current_user read:users offline_access'
  },
  useRefreshTokens: true,
  cacheLocation: 'localstorage'
};

// Helper function to check if user is UCF student
export const isUCFUser = (user) => {
  return user?.email?.endsWith('@ucf.edu') || false;
};

// Helper function to convert string to title case
const toTitleCase = (str) => {
  if (!str) return str;
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

// Helper function to get display name (username, name, or email)
export const getDisplayName = (user) => {
  // Check for custom username claim first (set by Auth0 post-login action)
  const customUsername = user?.['https://knighthaven/username'];
  
  // Debug logging
  console.log('getDisplayName debug:', {
    customUsername,
    username: user?.username,
    nickname: user?.nickname,
    name: user?.name,
    email: user?.email
  });
  
  // For all users, prioritize custom username claim, then actual username fields, then email prefix
  // Don't use user.name if it's the same as the email (common Auth0 behavior)
  const nameField = user?.name && user.name !== user.email ? user.name : null;
  
  const displayName = customUsername || user?.username || user?.preferred_username || nameField || user?.nickname || user.email.split('@')[0] || 'User';
  
  // Convert to title case
  return toTitleCase(displayName);
};

// Helper function to check if user's email is verified
export const isEmailVerified = (user) => {
  // For UCF users, we might want to be more strict about verification
  if (user?.email?.endsWith('@ucf.edu')) {
    // You can add additional checks here if needed
    return user?.email_verified === true;
  }
  return user?.email_verified === true;
};

// Helper function to check if user is verified UCF student
export const isVerifiedUCFUser = (user) => {
  return isUCFUser(user) && isEmailVerified(user);
};

// Instructions for setup:
// 1. Go to https://auth0.com and create a free account
// 2. Create a new Single Page Application
// 3. Copy your Domain and Client ID from the Auth0 dashboard
// 4. Replace the values above with your actual credentials
// 5. Add http://localhost:3000 to your Allowed Callback URLs
// 6. Add http://localhost:3000 to your Allowed Logout URLs
// 7. Add http://localhost:3000 to your Allowed Web Origins
// 8. IMPORTANT: Enable "Refresh Token Rotation" in your Auth0 dashboard
// 9. IMPORTANT: Enable "Refresh Token Expiration" and set it to 30 days
// 10. IMPORTANT: Make sure "Offline Access" is enabled in your Auth0 application settings
