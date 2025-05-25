import { useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/services/api';
import { Button, Box, Typography, CircularProgress, Tooltip, IconButton } from '@mui/material';
import { FcGoogle } from 'react-icons/fc';
import { FaSignOutAlt } from 'react-icons/fa';

export default function GoogleAuth() {
  const { user, login, logout, showSnackbar, sessions } = useAuth();

  const handleGoogleAuth = useCallback(async (response) => {
    try {
      const userData = parseJwt(response.credential);
      
      // Send user data to our backend for authentication
      const authResponse = await authApi.googleAuth({
        sub: userData.sub,
        name: userData.name,
        email: userData.email,
        email_verified: userData.email_verified,
      });
      
      // Update user context with the response from our backend
      login(authResponse);
      
      showSnackbar('Successfully signed in!', 'success');
    } catch (error) {
      console.error('Authentication error:', error);
      showSnackbar(error.response?.data?.detail || 'Failed to sign in. Please try again.', 'error');
    }
  }, [login, showSnackbar]);

  const handleSignOut = useCallback(async () => {
    try {
      // await authApi.logout();
      logout();
      showSnackbar('Successfully signed out', 'info');
    } catch (error) {
      console.error('Logout error:', error);
      showSnackbar('Failed to sign out. Please try again.', 'error');
    }
  }, [logout, showSnackbar]);

  // Helper function to parse JWT
  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  // Initialize Google Sign-In
  useEffect(() => {
    if (window.google && !user) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleGoogleAuth,
        auto_select: false,
      });

      // Render the Google Sign-In button
      try {
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInButton'),
          {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'pill',
            logo_alignment: 'left',
          }
        );
      } catch (error) {
        console.error('Error rendering Google button:', error);
      }
    }
  }, [user, handleGoogleAuth]);

  if (user) {
    return (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="button" color="white">
              {user.name?.charAt(0).toUpperCase()}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>{user.name}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user.email}
            </Typography>
          </Box>
          <Tooltip title="Sign out">
            <IconButton onClick={handleSignOut} size="small">
              <FaSignOutAlt />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
        Sign in to continue
      </Typography>
      <div id="googleSignInButton" style={{ display: 'flex', justifyContent: 'center' }} />
    </Box>
  );
}
