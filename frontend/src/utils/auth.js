// src/utils/auth.js
export function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }
  
  export function storeSession(user) {
    const sessionId = `sess_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("user", JSON.stringify({ ...user, sessionId }));
  }
  
  export function getUser() {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }
  
  export function clearSession() {
    localStorage.removeItem("user");
  }
  