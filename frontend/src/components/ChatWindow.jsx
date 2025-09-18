import { useAuth } from "@/context/AuthContext";
import { FaUserCircle, FaUpload, FaPaperPlane, FaFilePdf } from "react-icons/fa";
import { PiSparkleFill } from "react-icons/pi";
import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Box, 
  IconButton, 
  TextField, 
  CircularProgress, 
  Typography, 
  Button, 
  Tooltip, 
  keyframes 
} from '@mui/material';
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
  onNewConversation,
  onFileUploaded
}) {
  const { 
    user, 
    showSnackbar, 
    setCurrentActiveFile, 
    currentFile, 
    addSession 
  } = useAuth();
  
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  // Load conversations when conversationId changes
  useEffect(() => {
    const loadConversation = async () => {
      if (currentConversationId) {
        try {
          setIsLoading(true);
          const response = await chatApi.getConversation(currentConversationId);
          console.log('Loaded conversation:', response);
          
          // Format messages properly
          const formattedMessages = response.map(msg => ({
            id: msg.id,
            content: msg.content,
            sender: msg.role === 'user' ? 'user' : 'assistant',
            timestamp: msg.timestamp
          }));
          
          setMessages(formattedMessages);
        } catch (error) {
          console.error('Error loading conversation:', error);
          showSnackbar('Failed to load conversation', 'error');
          setMessages([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Clear messages and reset state for new conversation
        setMessages([]);
        setUploadedFile(null);
      }
    };

    loadConversation();
  }, [currentConversationId, showSnackbar]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isTyping]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;
    
    if (!user) {
      showSnackbar('Please sign in to upload files', 'warning');
      return;
    }
    
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
      
      // Notify parent component about file upload
      if (onFileUploaded) {
        onFileUploaded({
          session_id: response.session_id,
          created_at: response.created_at,
          document_id: response.document.id,
          filename: file.name,
          file_url: response.document.file_url
        });
      }
      
      showSnackbar('File uploaded successfully!', 'success');
      
      // Focus the input after successful upload
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to upload file';
      showSnackbar(errorMessage, 'error');
    } finally {
      setIsUploading(false);
    }
  }, [user, showSnackbar, setCurrentActiveFile, addSession]);

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    
    if (!user) {
      showSnackbar('Please sign in to send messages', 'warning');
      return;
    }
    
    if (!input.trim() || isSending || !(currentFile || uploadedFile)) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      content: input.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);
    setIsTyping(true);

    try {
      const sessionId = currentConversationId || uploadedFile?.id;
      const response = await chatApi.askQuestion(sessionId, input.trim());
      
      const assistantMessage = {
        id: Date.now() + 1,
        content: response.answer,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      onNewMessage(input.trim());
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to send message';
      showSnackbar(errorMessage, 'error');
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  }, [input, isSending, currentFile, uploadedFile, currentConversationId, user, showSnackbar, onNewMessage]);

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

    // Show upload UI only when starting a new conversation (no conversation ID and no file)
    if (!uploadedFile && !currentFile && !currentConversationId) {
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
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Main content */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {renderContent()}
      </Box>

      {/* Input area - fixed at bottom */}
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid', 
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        flexShrink: 0,
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
              inputRef={inputRef}
              fullWidth
              variant="outlined"
              placeholder={user ? "Ask a question about the document..." : "Please sign in to chat"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!user || !(currentFile || uploadedFile) || isSending || isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
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
