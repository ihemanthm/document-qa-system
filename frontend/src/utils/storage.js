// Storage keys
const CONVERSATIONS_KEY = 'docqa_conversations';

/**
 * Get all conversations for a specific user from localStorage
 * @param {string} userId - The ID of the current user
 * @returns {Array} Array of conversations
 */
export const getStoredConversations = (userId) => {
  try {
    const stored = localStorage.getItem(`${CONVERSATIONS_KEY}_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Error reading conversations from localStorage:', error);
    return [];
  }
};

/**
 * Store or update a conversation in localStorage
 * @param {Object} conversation - The conversation object to store
 * @param {string} userId - The ID of the current user
 */
export const storeConversation = (conversation, userId) => {
  try {
    const conversations = getStoredConversations(userId);
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);
    
    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation;
    } else {
      conversations.unshift(conversation);
    }
    
    localStorage.setItem(
      `${CONVERSATIONS_KEY}_${userId}`, 
      JSON.stringify(conversations)
    );
  } catch (error) {
    console.error('Error storing conversation:', error);
  }
};

/**
 * Delete a conversation from localStorage
 * @param {string} conversationId - The ID of the conversation to delete
 * @param {string} userId - The ID of the current user
 */
export const deleteStoredConversation = (conversationId, userId) => {
  try {
    const conversations = getStoredConversations(userId);
    const updated = conversations.filter(c => c.id !== conversationId);
    
    localStorage.setItem(
      `${CONVERSATIONS_KEY}_${userId}`,
      JSON.stringify(updated)
    );
  } catch (error) {
    console.error('Error deleting conversation:', error);
  }
};

/**
 * Clear all conversations for a user
 * @param {string} userId - The ID of the current user
 */
export const clearUserConversations = (userId) => {
  try {
    localStorage.removeItem(`${CONVERSATIONS_KEY}_${userId}`);
  } catch (error) {
    console.error('Error clearing conversations:', error);
  }
};
