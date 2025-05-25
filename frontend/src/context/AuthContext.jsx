import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });
  const [currentFile, setCurrentFile] = useState(null);

  const showSnackbar = useCallback((message, severity = "info") => {
    setSnack({ open: true, message, severity });
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnack(prev => ({ ...prev, open: false }));
  }, []);

  const login = useCallback((userData) => {
    const userSessions = userData.sessions || [];
    const userInfo = {
      sub: userData.user_id,
      email: userData.email,
      name: userData.name
    };
    console.log(userData.sessions)
    setUser(userInfo);
    setSessions(userSessions);
    
    // Store user data in cookies
    Cookies.set('user', JSON.stringify({
      ...userInfo,
      sessions: userSessions
    }), { expires: 7 });
    
    showSnackbar("Successfully logged in", "success");
  }, [showSnackbar]);

  const updateSessions = useCallback((newSessions) => {
    setSessions(newSessions);
    // Update sessions in cookies if user is logged in
    if (user) {
      const storedUser = Cookies.get('user') ? JSON.parse(Cookies.get('user')) : {};
      Cookies.set('user', JSON.stringify({
        ...storedUser,
        sessions: newSessions
      }), { expires: 7 });
    }
  }, [user]);

  const addSession = useCallback((newSession) => {
    setSessions(prevSessions => {
      // Check if session already exists to avoid duplicates
      const sessionExists = prevSessions.some(s => s.session_id === newSession.session_id);
      if (sessionExists) return prevSessions;
      
      const updatedSessions = [newSession, ...prevSessions];
      
      // Update sessions in cookies if user is logged in
      if (user) {
        const storedUser = Cookies.get('user') ? JSON.parse(Cookies.get('user')) : {};
        Cookies.set('user', JSON.stringify({
          ...storedUser,
          sessions: updatedSessions
        }), { expires: 7 });
      }
      
      return updatedSessions;
    });
  }, [user]);

  const logout = useCallback(() => {
    // Remove all auth-related cookies
    Cookies.remove('user');
    Cookies.remove('currentFile');
    setUser(null);
    setSessions([]);
    showSnackbar("Successfully logged out", "info");
  }, [showSnackbar]);

  const setCurrentActiveFile = useCallback((fileInfo) => {
    setCurrentFile(fileInfo);
    // Store in cookies for persistence
    if (fileInfo) {
      Cookies.set('currentFile', JSON.stringify(fileInfo), { expires: 7 });
    } else {
      Cookies.remove('currentFile');
    }
  }, []);

  // Load user from cookies on initial load
  useEffect(() => {
    const userCookie = Cookies.get('user');
    if (userCookie) {
      try {
        const userData = JSON.parse(userCookie);
        setUser({
          sub: userData.sub,
          email: userData.email,
          name: userData.name
        });
        if (userData.sessions) {
          setSessions(userData.sessions);
        }
      } catch (error) {
        console.error('Error parsing user data from cookies:', error);
        Cookies.remove('user');
      }
    }
    
    // Load current file from cookies
    const fileCookie = Cookies.get('currentFile');
    if (fileCookie) {
      try {
        setCurrentFile(JSON.parse(fileCookie));
      } catch (error) {
        console.error('Error parsing current file from cookies:', error);
        Cookies.remove('currentFile');
      }
    }
    
    setLoading(false);
  }, []);

  const value = {
    user,
    sessions,
    currentFile,
    login,
    logout,
    updateSessions,
    addSession,
    setCurrentActiveFile,
    showSnackbar
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <Snackbar
        open={snack.open}
        autoHideDuration={6000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={hideSnackbar} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
