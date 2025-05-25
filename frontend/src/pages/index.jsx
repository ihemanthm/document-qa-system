import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { chatApi } from '@/services/api';
import Head from 'next/head';
import { Box, CircularProgress } from '@mui/material';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';

export default function Home() {
  const { 
    user, 
    showSnackbar, 
    currentFile, 
    setCurrentActiveFile,
    sessions,
    addSession
  } = useAuth();
  
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  // Load conversations when user changes
  useEffect(() => {
    const loadConversations = async () => {
      if (user) {
        try {
          setIsLoading(true);
          // Use sessions from AuthContext as conversations
          setConversations(sessions);
          
          // Set the most recent conversation as active if available
          if (sessions.length > 0) {
            setCurrentConversationId(sessions[0].session_id);
            // Set current file if available
            if (sessions[0].document) {
              setCurrentActiveFile({
                fileName: sessions[0].document.filename,
                fileUrl: sessions[0].document.file_url,
                sessionId: sessions[0].session_id,
                documentId: sessions[0].document.id
              });
            }
          }
        } catch (error) {
          console.error('Error loading conversations:', error);
          showSnackbar('Failed to load conversations', 'error');
        } finally {
          setIsLoading(false);
        }
      } else {
        setConversations([]);
        setCurrentConversationId(null);
        setMessages([]);
      }
    };

    loadConversations();
  }, [user, sessions, showSnackbar, setCurrentActiveFile]);

  // Handle new conversation
  const handleNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([]);
    setCurrentActiveFile(null);
  }, [setCurrentActiveFile]);

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversationId) => {
    setCurrentConversationId(conversationId);
    // Find the selected conversation and set current file
    const selectedConversation = sessions.find(s => s.session_id === conversationId);
    if (selectedConversation?.document) {
      setCurrentActiveFile({
        fileName: selectedConversation.document.filename,
        fileUrl: selectedConversation.document.file_url,
        sessionId: selectedConversation.session_id,
        documentId: selectedConversation.document.id
      });
    }
    setMessages([]); // Clear messages when switching conversations
  }, [sessions, setCurrentActiveFile]);

  // Handle conversation deletion
  const handleDeleteConversation = useCallback(async (conversationId) => {
    try {
    const sessionToDelete = sessions.find(s => s.session_id === conversationId);
    if (!sessionToDelete?.document?.id) {
      console.error('Error deleting conversation:', 'No document ID found for conversation', conversationId);
      return;
    }
    

      await chatApi.deleteConversation(user.sub, sessionToDelete.document.id);
      
      // Update local state
      setConversations(prev => prev.filter(c => c.session_id !== conversationId));
      
      // If the deleted conversation is the current one, clear the current conversation
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
        setCurrentActiveFile(null);
      }
      sessions.filter(s => s.session_id === conversationId).delete();
      
      showSnackbar('Conversation deleted', 'success');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      showSnackbar('Failed to delete conversation', 'error');
    }
  }, [currentConversationId, showSnackbar, setCurrentActiveFile, user?.id]);

  // Handle new message
  const handleNewMessage = useCallback((message) => {
    const newMessage = {
      id: Date.now(),
      content: message,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Add a new session when a file is uploaded
  const handleFileUploaded = useCallback((sessionData) => {
    addSession({
      session_id: sessionData.session_id,
      created_at: sessionData.created_at,
      document: {
        id: sessionData.document_id,
        filename: sessionData.filename,
        file_url: sessionData.file_url,
        upload_time: new Date().toISOString()
      }
    });
  }, [addSession]);

  return (
    <>
      <Head>
        <title>Document QA System</title>
        <meta name="description" content="Ask questions about your documents" />
      </Head>
      
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        {/* Sidebar */}
        <div className="w-70 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
          <Sidebar 
            conversations={conversations}
            currentConversationId={currentConversationId}
            onNewConversation={handleNewConversation}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Header />
          
          {/* Chat Window */}
          <main className="flex-1 overflow-hidden">
            {isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            ) : (
              <ChatWindow 
                onNewMessage={handleNewMessage}
                currentConversationId={currentConversationId}
                onNewConversation={handleNewConversation}
                onFileUploaded={handleFileUploaded}
              />
            )}
          </main>
        </div>
      </div>
    </>
  );
}
