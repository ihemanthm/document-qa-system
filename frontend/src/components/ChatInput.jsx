import { useState, useRef, useEffect } from 'react';
import { Paper, IconButton, InputBase, Box } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';

export default function ChatInput({ onSend, disabled }) {
  const [message, setMessage] = useState('');
  const { user, showSnackbar } = useAuth();
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!user) {
      showSnackbar('Please sign in to send messages', 'warning');
      return;
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    onSend(trimmedMessage);
    setMessage('');
    
    // Focus the input after sending
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit}
      sx={{ 
        p: 2, 
        borderTop: '1px solid', 
        borderColor: 'divider',
        backgroundColor: 'background.paper'
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          backgroundColor: 'background.default',
        }}
      >
        <InputBase
          inputRef={textareaRef}
          sx={{ ml: 1, flex: 1, py: 1 }}
          placeholder={user ? "Type your question..." : "Sign in to ask questions"}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!user || disabled}
          multiline
          maxRows={4}
          inputProps={{ 'aria-label': 'ask a question' }}
        />
        <IconButton 
          type="submit" 
          color="primary" 
          sx={{ p: '10px' }}
          disabled={!user || !message.trim() || disabled}
        >
          <SendIcon />
        </IconButton>
      </Paper>
    </Box>
  );
}
