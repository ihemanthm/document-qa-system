import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
// Create axios instance with base URL and common headers
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add a request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API Methods
export const authApi = {
  // Google authentication
  googleAuth: async (userData) => {
    try {
      const response = await api.post('/users/auth/google', {
        sub: userData.sub,
        name: userData.name,
        email: userData.email,
        email_verified: userData.email_verified,
      });
      return response.data;
    } catch (error) {
      console.error('Google auth error:', error);
      throw error;
    }
  },

  // // Logout
  // logout: async () => {
  //   try {
  //     await api.post('/users/logout/');
  //   } catch (error) {
  //     console.error('Logout error:', error);
  //     throw error;
  //   }
  // },
};

export const chatApi = {
  // Get user conversations
  getConversations: async () => {
    try {
      const response = await api.get('/docs/');
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Get single document by user_id and filename
  getDocument: async (userId, filename) => {
    try {
      const response = await api.get('/docs/', {
        params: {
          user_id: userId,
          filename: filename
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  },

  // Upload file
  uploadFile: async (userId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);

    try {
      const response = await api.post('/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  },

  // Ask question
  askQuestion: async (sessionId, question) => {
    try {
      const response = await api.post('/ask/', {
        session_id: sessionId,
        question: question,
      });
      console.log("response data", response.data)
      return response.data; // { answer: string, ... }
    } catch (error) {
      console.error('Error asking question:', error);
      throw error;
    }
  },

  // Get conversation history by session ID
  getConversation: async (sessionId) => {
    try {
      const response = await api.get(`/ask/conversations/${sessionId}`);
      return response.data; // Array of message objects
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  },

  // Delete conversation
  deleteConversation: async (userId, id) => {
    try {
      await api.delete(`/docs/?user_id=${userId}&id=${id}`);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  },
};

export default api;
