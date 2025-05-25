import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
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
  Article as DocumentIcon
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
  const { user, sessions, logout } = useAuth();
  const [deletingId, setDeletingId] = useState(null);

  const handleNewChat = useCallback(() => {
    if (!user) return;
    onNewConversation?.();
  }, [onNewConversation, user]);

  const handleSelect = useCallback((sessionId, document) => {
    onSelectConversation?.(sessionId, document);
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

  // Format conversation title from session data
  const formatTitle = (session) => {
    if (session.document?.filename) {
      return session.document.filename.split('.').slice(0, -1).join('.');
    }
    return `Conversation ${new Date(session.created_at).toLocaleDateString()}`;
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
                  <Tooltip title="Delete conversation">
                    <IconButton
                      edge="end"
                      onClick={(e) => handleDelete(e, session.session_id)}
                      disabled={deletingId === session.session_id}
                      size="small"
                      sx={{
                        visibility: currentConversationId === session.session_id ? 'visible' : 'hidden',
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
                }
                selected={currentConversationId === session.session_id}
                onClick={(e) => handleSelect(e, session.session_id)}
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
                        {new Date(session.created_at).toLocaleDateString()}
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
