import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { chatApi } from '@/services/api';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  IconButton, 
  Tooltip,
  CircularProgress,
  Avatar,
  styled
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Logout as LogoutIcon,
  Article as DocumentIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import GoogleAuth from './GoogleAuth';

// Custom styled ListItem for active state
const StyledListItem = styled(ListItem)(({ theme, selected }) => ({
  '&.Mui-selected': {
    backgroundColor: theme.palette.action.selected,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

const Sidebar = ({ 
  onNewConversation, 
  onSelectConversation,
  currentConversationId,
  onDeleteConversation
}) => {
  const { user, sessions, logout, showSnackbar } = useAuth();
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleNewChat = useCallback(() => {
    if (!user) return;
    onNewConversation?.();
  }, [onNewConversation, user]);

  const handleSelect = useCallback((sessionId) => {
    console.log('Sidebar handleSelect called with:', sessionId);
    onSelectConversation?.(sessionId);
  }, [onSelectConversation]);

  const handleDelete = useCallback(async (e, sessionId) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      setDeletingId(sessionId);
      await onDeleteConversation(sessionId);
    } finally {
      setDeletingId(null);
    }
  }, [onDeleteConversation]);

  const handleDownloadPDF = useCallback(async (e, sessionId, filename) => {
    e.stopPropagation();
    
    try {
      setDownloadingId(sessionId);
      showSnackbar('Generating PDF...', 'info');
      
      // Download PDF from backend
      const pdfBlob = await chatApi.downloadConversationPDF(sessionId);
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `conversation_${sessionId}_${filename || 'document'}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSnackbar('PDF downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showSnackbar('Failed to download PDF', 'error');
    } finally {
      setDownloadingId(null);
    }
  }, [showSnackbar]);

  // Format conversation title from session data
  const formatTitle = (session) => {
    if (session.document?.filename) {
      return session.document.filename.split('.').slice(0, -1).join('.');
    }
    return `Conversation ${new Date(session.created_at).toLocaleDateString()}`;
  };

  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100vh',
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        width: 280,
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold' }}>
          Doc QA System
        </Typography>
      </Box>


      {/* New Chat Button */}
      <Box sx={{ p: 2 }}>
        <Tooltip title={!user ? 'Sign in to start a new chat' : 'New chat'}>
          <span>
            <IconButton
              onClick={handleNewChat}
              disabled={!user}
              variant="outlined"
              size="large"
              sx={{
                width: '100%',
                justifyContent: 'flex-start',
                py: 1.5,
                borderRadius: 2,
                border: '1px dashed',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <AddIcon sx={{ mr: 1 }} />
              <Typography variant="body1">New Chat</Typography>
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Conversations List */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {user ? (
          <List disablePadding>
            {sessions?.map((session) => (
              <StyledListItem
                key={session.session_id}
                disablePadding
                secondaryAction={
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 0.5,
                    visibility: currentConversationId === session.session_id ? 'visible' : 'hidden'
                  }}>
                    <Tooltip title="Download conversation PDF">
                      <IconButton
                        onClick={(e) => handleDownloadPDF(e, session.session_id, session.document?.filename)}
                        disabled={downloadingId === session.session_id}
                        size="small"
                        sx={{
                          '&:hover': { color: 'primary.main' },
                        }}
                      >
                        {downloadingId === session.session_id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <DownloadIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete conversation">
                      <IconButton
                        onClick={(e) => handleDelete(e, session.session_id)}
                        disabled={deletingId === session.session_id}
                        size="small"
                        sx={{
                          '&:hover': { color: 'error.main' },
                        }}
                      >
                        {deletingId === session.session_id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <DeleteIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
                selected={currentConversationId === session.session_id}
                onClick={() => handleSelect(session.session_id)}
              >
                <ListItemButton>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <DocumentIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={formatTitle(session)}
                    primaryTypographyProps={{
                      noWrap: true,
                      variant: 'body2',
                      sx: { 
                        fontWeight: currentConversationId === session.session_id ? 'medium' : 'normal',
                        color: 'text.primary',
                      },
                    }}
                    secondary={
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                        noWrap
                      >
                        {formatTime(session.created_at)}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </StyledListItem>
            ))}
            {sessions?.length === 0 && (
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  No conversations yet. Start a new chat to begin.
                </Typography>
              </Box>
            )}
          </List>
        ) : (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Sign in to view your conversations
            </Typography>
          </Box>
        )}
      </Box>

      {/* User Section */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        {user ? (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Avatar 
                alt={user.name} 
                src={user.picture} 
                sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
              >
                {user.name?.[0]?.toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography noWrap variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                  {user.name}
                </Typography>
              </Box>
              <Tooltip title="Sign out">
                <IconButton 
                  size="small" 
                  onClick={logout}
                  sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                >
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ) : (
          <GoogleAuth />
        )}
      </Box>
    </Box>
  );
};

export default Sidebar;
