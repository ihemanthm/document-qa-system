import { useAuth } from "@/context/AuthContext";
import { FaUserCircle, FaUpload, FaPaperPlane, FaFilePdf } from "react-icons/fa";
import { PiSparkleFill } from "react-icons/pi";
import { useState, useRef, useEffect, useCallback } from 'react';
import { Box, IconButton, TextField, CircularProgress, Typography, Button, Tooltip, keyframes } from '@mui/material';
import { chatApi } from '@/services/api';

// Animation for typing indicator
const bounce = keyframes`
  0%, 80%, 100% { 
    transform: scale(0);
  } 40% { 
    transform: scale(1.0);
  }
`;

const TypingIndicator = () => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center',
    justifyContent: 'flex-start',
    mb: 2,
    pl: 1
  }}>
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      p: 2,
      borderRadius: 4,
      bgcolor: 'grey.100',
      maxWidth: '80%',
    }}>
      {[...Array(3)].map((_, i) => (
        <Box
          key={i}
          sx={{
            width: 8,
            height: 8,
            margin: '0 2px',
            backgroundColor: 'grey.500',
            borderRadius: '50%',
            display: 'inline-block',
            animation: `${bounce} 1.4s infinite ease-in-out ${i * 0.16}s`,
            animationFillMode: 'both',
          }}
        />
      ))}
    </Box>
  </Box>
);

export default function ChatWindow({ 
  onNewMessage,
  currentConversationId,
  onNewConversation
}) {
  console.log("current Conversation ID:",currentConversationId)
  const { user, showSnackbar, setCurrentActiveFile, currentFile, addSession } = useAuth();
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  // Load conversations when conversationId changes
  useEffect(() => {
    const loadConversation = async () => {
      if (!currentConversationId) {
        setMessages([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await chatApi.getConversation(currentConversationId);
        const formattedMessages = response.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.role === 'user' ? 'user' : 'assistant',
          timestamp: msg.timestamp
        }));
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Failed to load conversation:', error);
        showSnackbar('Failed to load conversation history', 'error');
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversation();
  }, [currentConversationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isTyping]);

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      const response = await chatApi.uploadFile(user.sub, file);
      
      // Update current file in context
      const fileInfo = {
        id: response.session_id,
        name: file.name,
        url: response.document.file_url,
        timestamp: new Date().toISOString(),
        sessionData: response
      };
      
      setUploadedFile(fileInfo);
      setCurrentActiveFile(fileInfo);
      
      // Clear messages for new session
      setMessages([]);
      
      // Add to sessions
      addSession({
        session_id: response.session_id,
        created_at: response.created_at,
        document: response.document,
        title: file.name
      });
      
      showSnackbar('File uploaded successfully!', 'success');
    } catch (error) {
      console.error('Upload failed:', error);
      showSnackbar('Failed to upload file', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentConversationId) return;
    
    const userMessage = {
      id: `user-${Date.now()}`,
      content: input,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    // Optimistically update UI with user message
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);
    setIsTyping(true);

    try {
      const response = await chatApi.askQuestion(currentConversationId, input);
      
      const botMessage = {
        id: `assistant-${Date.now()}`,
        content: response.answer,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      showSnackbar('Failed to send message', 'error');
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  };

  // Render message component
  const renderMessage = (message) => (
    <Box
      key={message.id}
      sx={{
        display: 'flex',
        mb: 2,
        justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
      }}
    >
      {message.sender === 'assistant' && (
        <Box sx={{ mr: 1, mt: 0.5 }}>
          <PiSparkleFill size={24} color="#6366f1" />
        </Box>
      )}
      <Box
        sx={{
          maxWidth: '80%',
          p: 2,
          borderRadius: 4,
          bgcolor: message.sender === 'user' ? 'primary.main' : 'grey.100',
          color: message.sender === 'user' ? 'white' : 'text.primary',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {message.content}
        </Typography>
        <Typography variant="caption" display="block" sx={{
          textAlign: message.sender === 'user' ? 'right' : 'left',
          mt: 0.5,
          opacity: 0.7,
          color: message.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'text.secondary'
        }}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Box>
      {message.sender === 'user' && (
        <Box sx={{ ml: 1, mt: 0.5 }}>
          <FaUserCircle size={24} color="#6366f1" />
        </Box>
      )}
    </Box>
  );

  // Render file upload area or chat messages
  const renderContent = () => {
    if (isUploading || isLoading) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            {isUploading ? 'Uploading your document...' : 'Loading conversation...'}
          </Typography>
        </Box>
      );
    }

    if (!uploadedFile && !currentFile) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          textAlign: 'center',
          p: 3
        }}>
          <PiSparkleFill size={48} style={{ marginBottom: 16, color: '#6366f1' }} />
          <Typography variant="h6" gutterBottom>
            Upload a document to get started
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: '400px' }}>
            Ask questions about your document and get instant answers powered by AI.
          </Typography>
          <Button
            variant="contained"
            component="label"
            startIcon={<FaUpload />}
            disabled={!user}
          >
            Upload Document
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files?.[0])}
              accept=".pdf,.txt,.doc,.docx"
              hidden
            />
          </Button>
        </Box>
      );
    }

    return (
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {messages.map(renderMessage)}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </Box>
    );
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
      pt: 8 // Add padding to account for the header (assuming header height is 64px)
    }}>
      {/* Main content */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        pb: 2 // Add some bottom padding to ensure last message is not hidden behind input
      }}>
        {renderContent()}
      </Box>

      {/* Input area - fixed at bottom */}
      <Box sx={{ 
        p: 2, 
        pt: 1,
        pb: 3, 
        borderTop: '1px solid', 
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        position: 'sticky',
        bottom: 0, 
        left: 0,
        right: 0,
        zIndex: 10,
      }}>
        <form onSubmit={handleSendMessage}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files?.[0])}
              accept=".pdf,.txt,.doc,.docx"
              style={{ display: 'none' }}
            />
            <TextField
              fullWidth
              variant="outlined"
              placeholder={user ? "Ask a question about the document..." : "Please sign in to chat"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!user || !(currentFile || uploadedFile) || isSending || isLoading}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 4,
                  bgcolor: 'background.paper',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                } 
              }}
              InputProps={{
                endAdornment: isSending ? (
                  <CircularProgress size={24} />
                ) : (
                  <IconButton 
                    type="submit" 
                    disabled={!input.trim() || isSending || !(currentFile || uploadedFile) || isLoading}
                    sx={{ mr: -1 }}
                  >
                    <FaPaperPlane />
                  </IconButton>
                ),
              }}
            />
          </Box>
        </form>
      </Box>
    </Box>
  );
}
