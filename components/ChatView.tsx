import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, MessageCircle, Share2, MapPin, MoreHorizontal,
  Image as ImageIcon, Smile, Send, Search, Users,
  UserPlus, Settings, Edit3, Camera, Phone, Video,
  Compass, Grid, Bookmark, LogOut, PlusCircle, Plane, Trash2, Paperclip, Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeToCollection,
  getExistingChat,
  createDirectMessageChat,
  createCommunityGroupChat,
  addUserToGroupChat,
  removeUserFromGroupChat,
  addDirectMessage,
  deleteMessage,
  markMessageAsRead
} from '../firebase/dbService';
import { getUserTrips } from '../firebase/tripService';
import Picker from 'emoji-picker-react';

interface ChatUser {
  id: string;
  name: string;
  avatar: string;
}

interface ChatParticipant {
  uid: string;
  name: string;
  avatar: string;
  handle: string;
}

interface ChatData {
  id: string;
  participants: string[];
  participantData: Record<string, ChatParticipant>;
  isGroup: boolean;
  isCommunityGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: any;
  communityId?: string;
  maxMembers?: number;
  createdAt?: any;
  createdBy?: string;
  unread?: number;
}

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  tripData?: any;
}

const ChatView = () => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<ChatData[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatData[]>([]);
  const [hiddenChats, setHiddenChats] = useState<string[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatData | null>(null);
  const [msgInput, setMsgInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [showMessageMenu, setShowMessageMenu] = useState<{ id: string, x: number, y: number } | null>(null);
  const [hiddenMessages, setHiddenMessages] = useState<Record<string, string[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, any>>({});
  const [messageReactions, setMessageReactions] = useState<Record<string, Record<string, string[]>>>({});
  const [attachmentPreview, setAttachmentPreview] = useState<{ file: File, url: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<{messageId?: string, x: number, y: number} | false>(false);
    const [showGroupMembers, setShowGroupMembers] = useState(false);
    const [availableMembers, setAvailableMembers] = useState<any[]>([]);
    const [showTripSelector, setShowTripSelector] = useState(false);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [userTrips, setUserTrips] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [recentContacts, setRecentContacts] = useState<any[]>([]);
    const [communityMembers, setCommunityMembers] = useState<any[]>([]);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef<boolean>(true);

  // Fetch chats from Firebase
  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToCollection('chats', (chatData: ChatData[]) => {
        // Filter chats that include the current user
        const userChats = chatData.filter(chat => 
          chat.participants && chat.participants.includes(currentUser.uid)
        );
        setChats(userChats);
        setFilteredChats(userChats); // Initialize filtered chats
      }, [{ field: 'participants', operator: 'array-contains', value: currentUser.uid }]);
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [currentUser]);
  
  // Fetch all users from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToCollection('users', (usersData) => {
      setAllUsers(usersData);
    });

    return () => unsubscribe();
  }, []);

  // Get recent contacts based on recent chats
  useEffect(() => {
    if (currentUser && chats.length > 0) {
      // Get participant IDs from recent chats
      const recentParticipantIds = [];
      chats.forEach(chat => {
        if (!chat.isGroup) {
          // For direct messages, find the other participant
          const otherParticipant = Object.values(chat.participantData).find((p: any) => p.uid !== currentUser.uid);
          if (otherParticipant && !recentParticipantIds.includes(otherParticipant.uid)) {
            recentParticipantIds.push(otherParticipant.uid);
          }
        }
      });
      
      // Get user details for recent contacts
      const recentUsers = allUsers.filter(user => recentParticipantIds.includes(user.uid));
      setRecentContacts(recentUsers);
    }
  }, [chats, currentUser, allUsers]);

  // Get community members for the current user
  useEffect(() => {
    if (currentUser) {
      // Clear previous community members when user changes
      setCommunityMembers([]);
      
      // Find all communities the user is part of by looking at their membership
      // This should query the user's community memberships from a 'userCommunities' collection or similar
      const unsubscribe = subscribeToCollection(`userCommunities/${currentUser.uid}/communities`, (userCommunityData) => {
        const userCommunityIds = userCommunityData.map((community: any) => community.communityId);
        
        if (userCommunityIds.length === 0) {
          // If no communities, set to empty array
          setCommunityMembers([]);
          return;
        }
        
        // For each community, fetch its members
        const unsubs: any[] = [];
        let allMembers: any[] = [];
        
        userCommunityIds.forEach(communityId => {
          const unsubscribe = subscribeToCollection(`communities/${communityId}/members`, (membersData) => {
            // Add members from this community to the allMembers array
            // Filter out the current user and the community creator (admin)
            const newMembers = membersData.filter(newMember => 
              !allMembers.some(prevMember => prevMember.userId === newMember.userId) &&
              newMember.userId !== currentUser.uid // Don't include current user
            );
            
            allMembers = [...allMembers, ...newMembers];
            
            // Separate admins and regular members, excluding the current user
            const admins = allMembers.filter(member => 
              (member.role === 'admin' || member.isAdmin === true) &&
              member.userId !== currentUser.uid // Ensure current user is not included
            ).filter(member => member.userId !== currentUser.uid); // Double check to exclude current user
            
            const regularMembers = allMembers.filter(member => 
              member.role !== 'admin' && member.isAdmin !== true &&
              member.userId !== currentUser.uid // Ensure current user is not included
            );
            
            // Combine with admins first, then regular members
            setCommunityMembers([...admins, ...regularMembers]);
          });
          unsubs.push(unsubscribe);
        });
        
        // Cleanup function for community member subscriptions
        return () => {
          unsubs.forEach(unsub => {
            if (unsub) unsub();
          });
        };
      });
      
      // Cleanup function for user community subscription
      return () => {
        unsubscribe();
      };
    } else {
      // If no currentUser, clear community members
      setCommunityMembers([]);
    }
  }, [currentUser]);

  // Filter chats based on search query and hidden chats
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChats(chats.filter(chat => !hiddenChats.includes(chat.id)));
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = chats.filter(chat => {
        // Exclude hidden chats
        if (hiddenChats.includes(chat.id)) return false;
        
        if (chat.isGroup) {
          // For group chats, search by group name
          return chat.groupName?.toLowerCase().includes(query);
        } else {
          // For direct messages, search by participant name
          const participant = Object.values(chat.participantData).find((p: any) => p.uid !== currentUser?.uid);
          return participant?.name?.toLowerCase().includes(query) || 
                 participant?.handle?.toLowerCase().includes(query);
        }
      });
      setFilteredChats(filtered);
    }
  }, [searchQuery, chats, currentUser, hiddenChats]);

  // Subscribe to messages for all chats to track unread counts
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const unsubs: any[] = [];
    
    // Subscribe to messages for each chat
    chats.forEach(chat => {
      const unsubscribe = subscribeToCollection(`chats/${chat.id}/messages`, (messages) => {
        // Calculate unread messages for this chat
        const unreadCount = messages.filter((msg: any) => 
          msg.senderId !== currentUser.uid && 
          msg.status !== 'read'
        ).length;
        
        setUnreadCounts(prev => ({
          ...prev,
          [chat.id]: unreadCount
        }));
        
        // If this is the selected chat, also update chat history and mark messages as read
        if (selectedChat && selectedChat.id === chat.id) {
          // Transform messages to our format
          const formattedMessages: ChatMessage[] = messages.map((msg: any) => ({
            id: msg.id,
            text: msg.text || '',
            senderId: msg.senderId || msg.uid || '',
            senderName: msg.senderName || msg.userName || 'Unknown User',
            senderAvatar: msg.senderAvatar || msg.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((msg.senderName || msg.userName || 'U').substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff`,
            timestamp: msg.createdAt?.toDate() || new Date(),
            status: msg.status || 'sent'
          }));
          
          setChatHistory(formattedMessages);
          
          // Mark messages as read
          messages.forEach(msg => {
            if (msg.status !== 'read' && msg.senderId !== currentUser.uid) {
              markMessageAsRead(chat.id, msg.id);
            }
          });
        }
      }, [], 'createdAt');
      
      unsubs.push(unsubscribe);
    });
    
    // Cleanup function
    return () => {
      unsubs.forEach(unsub => {
        if (unsub) unsub();
      });
    };
  }, [chats, selectedChat, currentUser]);

  const handleSend = async () => {
    if ((!msgInput.trim() && !attachmentPreview) || !selectedChat || !currentUser) return;

    try {
      // Prepare message data
      const messageData = {
        text: msgInput,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Traveler',
        senderAvatar: currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent((currentUser.displayName || 'T').substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff`,
        createdAt: new Date(),
        status: 'sent'
      };
      
      // Send message to Firebase
      await addDirectMessage(selectedChat.id, messageData);
      
      // Clear input
      setMsgInput('');
      setAttachmentPreview(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string, forEveryone: boolean = false) => {
    if (!selectedChat || !currentUser) return;
  
    try {
      if (forEveryone) {
        // Delete message for everyone using Firebase
        await deleteMessage(selectedChat.id, messageId);
      } else {
        // Hide message locally for the current user only
        setHiddenMessages(prev => ({
          ...prev,
          [selectedChat.id]: [...(prev[selectedChat.id] || []), messageId]
        }));
      }
      setShowMessageMenu(null);
    } catch (error) {
      console.error('Error deleting/hiding message:', error);
    }
  };

  const handleSendTrip = async (trip: any) => {
    if (!selectedChat || !currentUser) return;

    try {
      // Create a special message format for trips
      const tripMessage = {
        text: `Check out my trip plan to ${trip.tripName || trip.destination || 'a destination'}!`,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Traveler',
        senderAvatar: currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent((currentUser.displayName || 'T').substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff`,
        createdAt: new Date(),
        status: 'sent',
        tripData: {
          id: trip.id,
          tripName: trip.tripName,
          destination: trip.destination,
          startDate: trip.preferences?.startDate,
          endDate: trip.preferences?.endDate,
          durationDays: trip.preferences?.durationDays,
          totalEstimatedCost: trip.totalEstimatedCost,
          currency: trip.currency
        }
      };

      // Send message to Firebase
      await addDirectMessage(selectedChat.id, tripMessage);
      
      // Close the trip selector
      setShowTripSelector(false);
    } catch (error) {
      console.error('Error sending trip message:', error);
    }
  };

  const handleRemoveGroupChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent chat selection
    
    if (window.confirm('Are you sure you want to remove this group chat from your view? You can rejoin it later.')) {
      setHiddenChats(prev => [...prev, chatId]);
      
      // If this was the selected chat, deselect it
      if (selectedChat && selectedChat.id === chatId) {
        setSelectedChat(null);
      }
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showMessageMenu) {
        setShowMessageMenu(null);
      }

      if (showEmojiPicker) {
        const emojiPicker = document.querySelector('.emoji-picker');
        if (emojiPicker && !emojiPicker.contains(e.target as Node)) {
          setShowEmojiPicker(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMessageMenu, showEmojiPicker]);

  // Fetch available members for group chat
  useEffect(() => {
    if (selectedChat?.isGroup && selectedChat?.communityId) {
      const unsubscribe = subscribeToCollection('communities/' + selectedChat.communityId + '/members', (members) => {
        // Filter out members already in the group
        const available = members.filter((member: any) => 
          !selectedChat.participants.includes(member.userId)
        );
        setAvailableMembers(available);
      });
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [selectedChat]);

  // Fetch user trips for sharing
  useEffect(() => {
    const fetchUserTrips = async () => {
      if (currentUser?.uid) {
        try {
          const trips = await getUserTrips(currentUser.uid);
          setUserTrips(trips);
        } catch (error) {
          console.error('Error fetching user trips:', error);
        }
      }
    };
    
    fetchUserTrips();
  }, [currentUser]);

  return (
    <div className="h-[calc(100vh-80px)] md:h-screen flex bg-gradient-to-br from-white to-emerald-50 md:border-l border-emerald-200">
      {/* Chat List */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 border-r border-emerald-200 bg-gradient-to-b from-white to-emerald-50`}>
        <div className="p-3 border-b border-gray-100 flex justify-between items-center">
          <div className="font-bold text-base">Messages</div>
          <button className="text-emerald-600"><Edit3 className="w-4 h-4" /></button>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="bg-gradient-to-r from-gray-100 to-emerald-100 rounded-lg flex items-center px-3 py-2 border border-emerald-200">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              className="bg-transparent outline-none text-sm w-full" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Group Chats Section */}
          <div className="mb-4">
            <h3 className="font-bold text-xs text-gray-500 px-3 py-2 uppercase tracking-wider">Group Chats</h3>
            <div className="space-y-1">
              {filteredChats
                .filter(chat => chat.isGroup)
                .map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`flex items-center gap-2.5 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${selectedChat?.id === chat.id ? 'bg-emerald-50' : ''}`}
                  >
                    <div className="relative">
                      <img 
                        src={chat.groupAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.groupName.substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff`} 
                        className="w-10 h-10 rounded-full object-cover" 
                        alt="group avatar" 
                        onError={(e) => {
                          // If the image fails to load, fall back to the Gmail-style avatar
                          const target = e.target as HTMLImageElement;
                          const groupName = chat.groupName || 'Group';
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName.substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff`;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className={`font-semibold text-sm truncate ${unreadCounts[chat.id] > 0 ? 'text-gray-900' : 'text-gray-700'}`}>{chat.groupName || 'Group Chat'}</h4>
                        <span className="text-[10px] text-gray-400">
                          {chat.lastMessageTime ? new Date(chat.lastMessageTime?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${unreadCounts[chat.id] > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                        {chat.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {unreadCounts[chat.id] > 0 && (
                        <div className="flex items-center justify-center bg-emerald-500 text-white text-xs rounded-full w-5 h-5">
                          {unreadCounts[chat.id] > 99 ? '99+' : unreadCounts[chat.id]}
                        </div>
                      )}
                      <button 
                        onClick={(e) => handleRemoveGroupChat(chat.id, e)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Remove from view"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
          
          {/* Hidden Group Chats Section */}
          {hiddenChats.length > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center px-3 py-2">
                <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wider">Hidden Group Chats</h3>
                <button 
                  className="text-xs text-emerald-600 hover:text-emerald-700"
                  onClick={() => setHiddenChats([])}
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-1">
                {chats
                  .filter(chat => chat.isGroup && hiddenChats.includes(chat.id))
                  .map(chat => (
                    <div
                      key={chat.id}
                      className="flex items-center gap-2.5 p-3 bg-gray-50"
                    >
                      <div className="relative">
                        <img 
                          src={chat.groupAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.groupName.substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff`} 
                          className="w-10 h-10 rounded-full object-cover" 
                          alt="group avatar" 
                          onError={(e) => {
                            // If the image fails to load, fall back to the Gmail-style avatar
                            const target = e.target as HTMLImageElement;
                            const groupName = chat.groupName || 'Group';
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName.substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff`;
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate text-gray-500">{chat.groupName || 'Group Chat'}</h4>
                        <p className="text-xs text-gray-400 truncate">Hidden from view</p>
                      </div>
                      <button 
                        onClick={() => {
                          setHiddenChats(prev => prev.filter(id => id !== chat.id));
                        }}
                        className="text-emerald-600 hover:text-emerald-800 text-xs font-medium"
                      >
                        Restore
                      </button>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
          
          {/* Direct Messages Section */}
          <div>
            <h3 className="font-bold text-xs text-gray-500 px-3 py-2 uppercase tracking-wider">Direct Messages</h3>
            <div className="space-y-1">
              {filteredChats
                .filter(chat => !chat.isGroup)
                .map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`flex items-center gap-2.5 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${selectedChat?.id === chat.id ? 'bg-emerald-50' : ''}`}
                  >
                    <div className="relative">
                      <img 
                        src={chat.participantData ? Object.values(chat.participantData).find((p: any) => p.uid !== currentUser?.uid)?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((Object.values(chat.participantData).find((p: any) => p.uid !== currentUser?.uid)?.name || 'U').substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff` : 'https://ui-avatars.com/api/?name=U&size=150&background=random&color=ffffff'} 
                        className="w-10 h-10 rounded-full object-cover" 
                        alt="avatar" 
                        onError={(e) => {
                          // If the image fails to load, fall back to the Gmail-style avatar
                          const target = e.target as HTMLImageElement;
                          const participantName = chat.participantData ? Object.values(chat.participantData).find((p: any) => p.uid !== currentUser?.uid)?.name || 'U' : 'U';
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(participantName.substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff`;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className={`font-semibold text-sm truncate ${unreadCounts[chat.id] > 0 ? 'text-gray-900' : 'text-gray-700'}`}>{chat.participantData ? Object.values(chat.participantData).find((p: any) => p.uid !== currentUser?.uid)?.name : 'Chat Partner'}</h4>
                        <span className="text-[10px] text-gray-400">
                          {chat.lastMessageTime ? new Date(chat.lastMessageTime?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${unreadCounts[chat.id] > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                        {chat.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    {unreadCounts[chat.id] > 0 && (
                      <div className="flex items-center justify-center bg-emerald-500 text-white text-xs rounded-full w-5 h-5">
                        {unreadCounts[chat.id] > 99 ? '99+' : unreadCounts[chat.id]}
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>

      {/* Chat Window */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col h-full">
          {/* Header */}
          <div className="p-3 border-b border-emerald-200 bg-gradient-to-r from-white to-emerald-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button className="md:hidden" onClick={() => setSelectedChat(null)}>
                <div className="text-xl mr-1.5">‹</div>
              </button>
              <button className="hidden md:block text-gray-400 hover:text-gray-600" onClick={() => setSelectedChat(null)}>
                <div className="text-xl">✕</div>
              </button>
              {selectedChat.isGroup ? (
                <>
                  <div className="relative">
                    <img 
                      src={selectedChat.groupAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedChat.groupName.substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff`} 
                      className="w-9 h-9 rounded-full object-cover" 
                      alt="group avatar" 
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{selectedChat.groupName}</h4>
                    <span className="text-xs text-green-500 flex items-center gap-1">● {selectedChat.participants.length} members</span>
                  </div>
                </>
              ) : (
                <>
                  <img 
                    src={selectedChat?.participantData ? Object.values(selectedChat.participantData).find((p: any) => p.uid !== currentUser?.uid)?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((Object.values(selectedChat.participantData).find((p: any) => p.uid !== currentUser?.uid)?.name || 'U').substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff` : 'https://ui-avatars.com/api/?name=U&size=150&background=random&color=ffffff'} 
                    className="w-9 h-9 rounded-full object-cover" 
                    alt="avatar" 
                    onError={(e) => {
                      // If the image fails to load, fall back to the Gmail-style avatar
                      const target = e.target as HTMLImageElement;
                      const participantName = selectedChat?.participantData ? Object.values(selectedChat.participantData).find((p: any) => p.uid !== currentUser?.uid)?.name || 'U' : 'U';
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(participantName.substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff`;
                    }}
                  />
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{selectedChat?.participantData ? Object.values(selectedChat.participantData).find((p: any) => p.uid !== currentUser?.uid)?.name : 'Chat Partner'}</h4>
                    <span className="text-xs text-green-500 flex items-center gap-1">● Active now</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-1 rounded-md text-[10px] font-bold hover:bg-emerald-700 transition-colors shadow-sm">
                <Plane className="w-3 h-3" />
                Plan
              </div>
              <div className="flex gap-3 text-gray-400 sm:border-l sm:border-gray-200 sm:pl-2.5">
                <Phone className="w-4 h-4 cursor-pointer hover:text-gray-600" />
                <Video className="w-4 h-4 cursor-pointer hover:text-gray-600" />
                {selectedChat.isGroup && (
                  <Users className="w-4 h-4 cursor-pointer hover:text-gray-600" onClick={() => setShowGroupMembers(true)} />
                )}
                <Users className="w-4 h-4 cursor-pointer hover:text-gray-600" />
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-emerald-50/50 via-cyan-50/30 to-teal-50/50" style={{ maxHeight: 'calc(100vh-200px)' }}>
            {/* Typing Indicator */}
            {/* Typing indicator would go here when we implement typing functionality */}

            {chatHistory
              .filter(msg => !(hiddenMessages[selectedChat?.id] && hiddenMessages[selectedChat.id].includes(msg.id)))
              .map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser?.uid ? 'items-end' : 'items-start'}`}>
                  {(selectedChat?.isGroup || msg.senderId !== currentUser?.uid) && (
                    <div className="text-[10px] text-gray-500 mb-1">
                      {msg.senderName || 'Unknown User'}
                    </div>
                  )}
                  <div className="flex items-end gap-2 max-w-[70%]">
                    {/* Message Actions Dropdown */}
                    <div className="relative">
                      <button
                        className="text-gray-400 hover:text-gray-600 p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setShowMessageMenu({ id: msg.id, x: rect.left, y: rect.bottom });
                        }}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`px-4 py-2 rounded-2xl text-sm ${msg.senderId === currentUser?.uid
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-none shadow-md'
                              : 'bg-gradient-to-r from-white to-emerald-50 border border-emerald-100 text-gray-800 rounded-bl-none shadow-sm'
                          }`}
                    >
                      {/* Check if this is a trip message */}
                      {msg.tripData ? (
                        // Trip message format
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-cyan-50 to-emerald-50 rounded-lg border border-cyan-200 shadow-sm">
                          <div className="bg-gradient-to-r from-cyan-400 to-teal-500 text-white w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Plane className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 truncate">{msg.tripData.tripName || 'Trip Plan'}</h4>
                            <p className="text-sm text-gray-700 truncate">
                              {msg.tripData.destination || 'Destination not specified'}
                            </p>
                            <div className="flex items-center text-xs text-gray-600 mt-1">
                              <span>
                                {msg.tripData.startDate ? new Date(msg.tripData.startDate).toLocaleDateString() : 'Date not set'}
                              </span>
                              {msg.tripData.totalEstimatedCost && (
                                <span className="ml-2 font-semibold">
                                  • {msg.tripData.currency} {msg.tripData.totalEstimatedCost.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <button 
                            className="text-teal-600 hover:text-teal-800 font-medium text-sm flex-shrink-0"
                            onClick={() => {
                              // In a real app, you would navigate to view the trip details
                              console.log('View trip details:', msg.tripData);
                              alert(`Trip: ${msg.tripData.tripName}\nDestination: ${msg.tripData.destination}\nDates: ${msg.tripData.startDate} to ${msg.tripData.endDate}\nEstimated Cost: ${msg.tripData.currency} ${msg.tripData.totalEstimatedCost?.toLocaleString()}`);
                            }}
                          >
                            View
                          </button>
                        </div>
                      ) : (
                        // Regular message format
                        <>
                          {msg.text && <div>{msg.text}</div>}
                          {attachmentPreview && (
                            <div className="mt-2 flex items-center gap-2 bg-gray-100 rounded-lg p-2">
                              <Paperclip className="w-4 h-4 text-gray-500" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-gray-700 truncate">{attachmentPreview.file.name}</div>
                                <div className="text-xs text-gray-500">{Math.round(attachmentPreview.file.size / 1024)} KB</div>
                              </div>
                              <button className="text-gray-500 hover:text-emerald-500">
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {/* Message Reactions */}
                  {messageReactions[msg.id] && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(messageReactions[msg.id]).map(([emoji, users]) => (
                        <div key={emoji} className="flex items-center bg-gradient-to-r from-emerald-100 to-cyan-100 border border-emerald-200 rounded-full px-2 py-1 text-xs shadow-sm">
                          <span>{emoji}</span>
                          <span className="ml-1 text-gray-600">{users.length}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.senderId === currentUser?.uid && (
                    <div className="text-[10px] text-gray-500 mt-1 flex justify-end items-center w-[70%]">
                      {msg.status === 'read' ? (
                        <>
                          <span className="mr-1">Read</span>
                          <span className="text-blue-300">✓✓</span>
                        </>
                      ) : msg.status === 'delivered' ? (
                        <>
                          <span className="mr-1">Delivered</span>
                          <span className="text-gray-300">✓✓</span>
                        </>
                      ) : (
                        <>
                          <span className="mr-1">Sent</span>
                          <span className="text-gray-300">✓</span>
                        </>
                      )}
                    </div>
                  )}
                  {showMessageMenu?.id === msg.id && (
                    <div
                      className="fixed inset-0 z-50"
                      onClick={() => setShowMessageMenu(null)}
                    >
                      <div
                        className="absolute bg-gradient-to-b from-white to-emerald-50 border border-emerald-200 rounded-lg shadow-xl z-50"
                        style={{ top: showMessageMenu.y, left: showMessageMenu.x }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button 
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          onClick={(e) => {
                            console.log('Add emoji reaction for message:', msg.id);
                            setShowMessageMenu(null);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setShowEmojiPicker({messageId: msg.id, x: rect.left, y: rect.bottom});
                          }}
                        >
                          <Smile className="w-4 h-4" />
                          Add Reaction
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => {
                            console.log('Add file attachment for message:', msg.id);
                            setShowMessageMenu(null);
                          }}
                        >
                          <Paperclip className="w-4 h-4" />
                          Attach File
                        </button>
                        {/* Show different delete options based on message ownership */}
                        {msg.senderId === currentUser?.uid ? (
                          // Message sent by current user - show both options
                          <>
                            <button
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              onClick={() => handleDeleteMessage(msg.id, false)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete for Me
                            </button>
                            <button
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              onClick={() => handleDeleteMessage(msg.id, true)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete for Everyone
                            </button>
                          </>
                        ) : (
                          // Message received from another user - show only delete for me
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            onClick={() => handleDeleteMessage(msg.id, false)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete for Me
                          </button>
                        )}
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
                          onClick={() => setShowMessageMenu(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachment Preview */}
          {attachmentPreview && (
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1">
                <Paperclip className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 truncate max-w-[150px]">{attachmentPreview.file.name}</span>
                <button
                  className="text-gray-400 hover:text-red-500"
                  onClick={() => setAttachmentPreview(null)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-gradient-to-r from-white to-emerald-50 border-t border-emerald-200 flex items-center gap-2.5">
            <button className="text-gray-400 hover:text-gray-600" onClick={() => {
              const fileInput = document.createElement('input');
              fileInput.type = 'file';
              fileInput.accept = '*/*';
              fileInput.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files[0]) {
                  const file = target.files[0];
                  const url = URL.createObjectURL(file);
                  setAttachmentPreview({ file, url });
                  console.log('File selected:', file.name);
                }
              };
              fileInput.click();
            }}>
              <Paperclip className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-gray-600" onClick={() => {
              const imageInput = document.createElement('input');
              imageInput.type = 'file';
              imageInput.accept = 'image/*';
              imageInput.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files[0]) {
                  const file = target.files[0];
                  const url = URL.createObjectURL(file);
                  setAttachmentPreview({ file, url });
                  console.log('Image selected:', file.name);
                }
              };
              imageInput.click();
            }}>
              <ImageIcon className="w-5 h-5" />
            </button>
            <div className="flex-1 bg-gradient-to-r from-gray-100 to-emerald-100 rounded-full px-3 py-1.5 flex items-center">
              <input
                type="text"
                className="bg-transparent flex-1 outline-none text-sm"
                placeholder="Message..."
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <div className="relative">
                <button className="text-gray-400 hover:text-emerald-500" onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker(showEmojiPicker ? false : {x: 0, y: 0});
                }}>
                  <Smile className="w-4 h-4" />
                </button>
                {showEmojiPicker && (
                  <div className="fixed inset-0 z-50" onClick={() => setShowEmojiPicker(false)}>
                    <div 
                      className="absolute bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
                      style={{ 
                        top: showEmojiPicker.y, 
                        left: showEmojiPicker.x,
                        transform: 'translateY(10px)'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-emerald-50 px-3 py-2 border-b border-emerald-200">
                        <span className="text-sm font-medium text-gray-700">Emoji Picker</span>
                        <button 
                          onClick={() => setShowEmojiPicker(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                      <Picker 
                        onEmojiClick={(emojiData) => {
                          if (showEmojiPicker.messageId && currentUser?.uid) {
                            console.log('Adding reaction to message:', showEmojiPicker.messageId, emojiData.emoji);
                            setMessageReactions(prev => {
                              const messageId = showEmojiPicker.messageId;
                              if (!messageId) return prev;
                              
                              const currentReactions = prev[messageId] || {};
                              const currentUsers = currentReactions[emojiData.emoji] || [];
                              
                              if (!currentUsers.includes(currentUser.uid)) {
                                return {
                                  ...prev,
                                  [messageId]: {
                                    ...currentReactions,
                                    [emojiData.emoji]: [...currentUsers, currentUser.uid]
                                  }
                                };
                              }
                              return prev;
                            });
                          } else {
                            setMsgInput(prev => prev + emojiData.emoji);
                          }
                          // Don't close the picker after emoji selection - let user close it manually
                        }}
                        skinTonesDisabled={false}
                        autoFocusSearch={false}
                        width={300}
                        height={400}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            {(msgInput.trim() || attachmentPreview) ? (
              <button onClick={handleSend} className="text-emerald-500 hover:text-emerald-600 font-bold text-sm">Send</button>
            ) : (
              <button className="text-gray-400" onClick={() => {
                console.log('Send heart reaction');
              }}>
                <Heart className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-gray-300">
          <div className="w-24 h-24 rounded-full border-4 border-gray-200 flex items-center justify-center mb-4">
            <Send className="w-10 h-10 ml-1" />
          </div>
          <h3 className="text-xl font-bold text-gray-400">Your Messages</h3>
          <p className="text-sm">Send private photos and messages to a friend or group.</p>

          <div className="mt-8 flex gap-4">
            <button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:from-emerald-600 hover:to-teal-600 transition-all duration-200" onClick={() => setShowNewChatModal(true)}>
              New Chat
            </button>
            <button className="bg-white border border-gray-300 text-gray-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors" onClick={() => setShowTripSelector(true)}>
              Plan a Trip
            </button>
          </div>
        </div>
      )}
      
      {/* Group Members Modal */}
      {showGroupMembers && selectedChat?.isGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="font-bold text-xl text-gray-900">Group Members</h3>
              <button
                onClick={() => setShowGroupMembers(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-3 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Current Members</h4>
                <div className="space-y-3">
                  {selectedChat.participants.map((participantId: string) => {
                    const participant = selectedChat.participantData[participantId];
                    if (!participant) return null;
                    
                    return (
                      <div key={participantId} className="flex items-center justify-between p-3 rounded-lg border border-emerald-200 bg-gradient-to-r from-white to-emerald-50 shadow-sm">
                        <div className="flex items-center gap-3">
                          <img 
                            src={participant.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.name.substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff`} 
                            className="w-10 h-10 rounded-full object-cover" 
                            alt={participant.name} 
                          />
                          <div>
                            <h4 className="font-bold text-gray-900">{participant.name}</h4>
                            <p className="text-sm text-gray-500">{participant.handle}</p>
                          </div>
                        </div>
                        {participantId === selectedChat.createdBy && (
                          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">Admin</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {availableMembers.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-3">Add Members</h4>
                  <div className="space-y-3">
                    {availableMembers.map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-emerald-200 bg-gradient-to-r from-white to-emerald-50 shadow-sm">
                        <div className="flex items-center gap-3">
                          <img 
                            src={member.avatar || member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent((member.name || 'U').substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff`} 
                            className="w-10 h-10 rounded-full object-cover" 
                            alt={member.name || member.userId} 
                          />
                          <div>
                            <h4 className="font-bold text-gray-900">{member.name || 'Traveler'}</h4>
                            <p className="text-sm text-gray-500">{member.handle || member.email}</p>
                          </div>
                        </div>
                        <button 
                          className="text-emerald-500 hover:text-emerald-700 font-medium text-sm"
                          onClick={async () => {
                            try {
                              await addUserToGroupChat(selectedChat.id, member);
                              // Refresh the chat data
                              setSelectedChat(prev => ({
                                ...prev,
                                participants: [...prev.participants, member.userId],
                                participantData: {
                                  ...prev.participantData,
                                  [member.userId]: {
                                    name: member.name || 'User',
                                    avatar: member.avatar || member.photoURL || 'https://i.pravatar.cc/150',
                                    handle: member.handle || member.email || member.userId || 'user',
                                    uid: member.userId
                                  }
                                }
                              }));
                            } catch (error) {
                              console.error('Error adding user to group:', error);
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowGroupMembers(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Trip Selector Modal */}
      {showTripSelector && (
        <div className="fixed inset-0 bg-gradient-to-br from-emerald-900/30 to-teal-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gradient-to-b from-white to-emerald-50 rounded-2xl w-full max-w-2xl my-8 shadow-2xl border border-emerald-100">
            <div className="flex justify-between items-center p-6 border-b border-emerald-200 bg-gradient-to-r from-white to-emerald-50">
              <h3 className="font-bold text-xl text-gray-900 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Share a Trip</h3>
              <button
                onClick={() => setShowTripSelector(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {userTrips.length === 0 ? (
                <div className="text-center py-8">
                  <Plane className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                  <h4 className="font-bold text-gray-900 mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">No trips yet</h4>
                  <p className="text-gray-500 mb-4">Create a trip to share with your friends.</p>
                  <button 
                    onClick={() => {
                      // In a real app, you might redirect to the create trip page
                      // For now, we'll just close the modal
                      setShowTripSelector(false);
                      // You could add navigation here if needed
                    }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-lg font-medium hover:from-emerald-600 hover:to-teal-600 shadow-md"
                  >
                    Create a Trip
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-gray-500 mb-2">Select a trip to share:</div>
                  {userTrips.map((trip: any) => (
                    <div 
                      key={trip.id} 
                      className="flex items-center justify-between p-3 rounded-lg border border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-cyan-50 cursor-pointer shadow-sm transition-all duration-200"
                      onClick={() => handleSendTrip(trip)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-cyan-400 to-teal-500 text-white w-10 h-10 rounded-lg flex items-center justify-center shadow-sm">
                          <Plane className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{trip.tripName || 'Unnamed Trip'}</h4>
                          <p className="text-sm text-gray-500">
                            {trip.destination || 'Unknown destination'} • 
                            {trip.preferences?.startDate ? new Date(trip.preferences.startDate).toLocaleDateString() : 'Date not set'}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-teal-600">Share</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-emerald-900/30 to-teal-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gradient-to-b from-white to-emerald-50 rounded-2xl w-full max-w-2xl my-8 shadow-2xl border border-emerald-100">
            <div className="flex justify-between items-center p-6 border-b border-emerald-200 bg-gradient-to-r from-white to-emerald-50">
              <h3 className="font-bold text-xl text-gray-900 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">New Message</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <div className="bg-gradient-to-r from-gray-100 to-emerald-100 rounded-lg flex items-center px-3 py-2 border border-emerald-200 mb-4">
                  <Search className="w-4 h-4 text-gray-400 mr-2" />
                  <input 
                    type="text" 
                    placeholder="Search contacts..." 
                    className="bg-transparent outline-none text-sm w-full" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Search Results */}
                {searchQuery && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-2">Search Results</div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {allUsers
                        .filter(user => 
                          user.uid !== currentUser?.uid && // Don't show current user
                          (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           user.handle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
                        )
                        .map((user) => (
                          <div 
                            key={user.uid} 
                            className="flex items-center justify-between p-3 rounded-lg border border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-cyan-50 cursor-pointer shadow-sm transition-all duration-200"
                            onClick={async () => {
                              // Check if chat already exists
                              let existingChat = await getExistingChat(currentUser.uid, user.uid);
                              let chatId;

                              if (existingChat) {
                                chatId = existingChat.id;
                              } else {
                                // Create new chat
                                chatId = await createDirectMessageChat(
                                  currentUser.uid,
                                  user.uid,
                                  currentUser,
                                  user
                                );
                              }

                              // Switch to chat tab and open this chat
                              setSelectedChat(chats.find(chat => chat.id === chatId));
                              setShowNewChatModal(false);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <img 
                                src={user.avatar || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent((user.name || user.displayName || 'U').substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff`} 
                                className="w-10 h-10 rounded-full object-cover" 
                                alt={user.name || user.displayName || 'User'} 
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((user.name || user.displayName || 'U').substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff`;
                                }}
                              />
                              <div>
                                <h4 className="font-bold text-gray-900">{user.name || user.displayName || 'User'}</h4>
                                <p className="text-sm text-gray-500">{user.handle || user.email || `@${user.uid.substring(0, 8)}`}</p>
                              </div>
                            </div>
                            <button className="text-emerald-600 hover:text-emerald-800 font-medium text-sm">Message</button>
                          </div>
                        ))
                      }
                      {allUsers.filter(user => 
                        user.uid !== currentUser?.uid &&
                        (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         user.handle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
                      ).length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No users found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-500 mb-2">Recent Contacts</div>
              <div className="space-y-2">
                {searchQuery ? (
                  // Don't show recent contacts when searching
                  <div className="text-center py-4 text-gray-500 text-sm text-transparent">
                    &nbsp;
                  </div>
                ) : (
                  <>
                    {recentContacts
                      .filter(user => user.uid !== currentUser?.uid) // Don't show current user
                      .map((user) => (
                        <div 
                          key={user.uid} 
                          className="flex items-center justify-between p-3 rounded-lg border border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-cyan-50 cursor-pointer shadow-sm transition-all duration-200"
                          onClick={async () => {
                            // Check if chat already exists
                            let existingChat = await getExistingChat(currentUser.uid, user.uid);
                            let chatId;

                            if (existingChat) {
                              chatId = existingChat.id;
                            } else {
                              // Create new chat
                              chatId = await createDirectMessageChat(
                                currentUser.uid,
                                user.uid,
                                currentUser,
                                user
                              );
                            }

                            // Switch to chat tab and open this chat
                            setSelectedChat(chats.find(chat => chat.id === chatId));
                            setShowNewChatModal(false);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <img 
                              src={user.avatar || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent((user.name || user.displayName || 'U').substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff`} 
                              className="w-10 h-10 rounded-full object-cover" 
                              alt={user.name || user.displayName || 'User'} 
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((user.name || user.displayName || 'U').substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff`;
                              }}
                            />
                            <div>
                              <h4 className="font-bold text-gray-900">{user.name || user.displayName || 'User'}</h4>
                              <p className="text-sm text-gray-500">{user.handle || user.email || `@${user.uid.substring(0, 8)}`}</p>
                            </div>
                          </div>
                          <button className="text-emerald-600 hover:text-emerald-800 font-medium text-sm">Message</button>
                        </div>
                      ))
                    }
                    {recentContacts.filter(user => user.uid !== currentUser?.uid).length === 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No recent contacts
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="mt-6 text-sm text-gray-500 mb-2">Community Members</div>
              <div className="space-y-2">
                {searchQuery ? (
                  // Don't show community members when searching
                  <div className="text-center py-4 text-gray-500 text-sm text-transparent">
                    &nbsp;
                  </div>
                ) : (
                  <>
                    {communityMembers
                      .filter(member => member.userId !== currentUser?.uid) // Don't show current user
                      .sort((a, b) => {
                        // Sort: admins first, then regular members, both alphabetically
                        const aIsAdmin = (a.role === 'admin' || a.isAdmin === true) ? 1 : 0;
                        const bIsAdmin = (b.role === 'admin' || b.isAdmin === true) ? 1 : 0;
                        if (bIsAdmin !== aIsAdmin) {
                          return bIsAdmin - aIsAdmin; // Admins first
                        }
                        // If both are the same type (admin or not), sort alphabetically by name
                        return (a.name || '').localeCompare(b.name || '');
                      })
                      .map((member) => (
                        <div 
                          key={member.id || member.userId} 
                          className="flex items-center justify-between p-3 rounded-lg border border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-cyan-50 cursor-pointer shadow-sm transition-all duration-200"
                          onClick={async () => {
                            // Check if chat already exists
                            let existingChat = await getExistingChat(currentUser.uid, member.userId);
                            let chatId;

                            if (existingChat) {
                              chatId = existingChat.id;
                            } else {
                              // Create new chat
                              chatId = await createDirectMessageChat(
                                currentUser.uid,
                                member.userId,
                                currentUser,
                                {
                                  name: member.name || 'User',
                                  avatar: member.avatar || member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent((member.name || 'U').substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff`,
                                  handle: member.handle || `@${member.userId.substring(0, 8)}`,
                                  uid: member.userId
                                }
                              );
                            }

                            // Switch to chat tab and open this chat
                            setSelectedChat(chats.find(chat => chat.id === chatId));
                            setShowNewChatModal(false);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <img 
                              src={member.avatar || member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent((member.name || 'U').substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff`} 
                              className="w-10 h-10 rounded-full object-cover" 
                              alt={member.name || 'User'} 
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((member.name || 'U').substring(0, 2).toUpperCase())}&size=150&background=random&color=ffffff`;
                              }}
                            />
                            <div>
                              <h4 className="font-bold text-gray-900">{member.name || 'User'}</h4>
                              {member.role === 'admin' || member.isAdmin === true ? (
                                <p className="text-xs text-emerald-600 font-medium">Admin</p>
                              ) : (
                                <p className="text-sm text-gray-500">{member.handle || `@${member.userId.substring(0, 8)}`}</p>
                              )}
                            </div>
                          </div>
                          <button className="text-emerald-600 hover:text-emerald-800 font-medium text-sm">Message</button>
                        </div>
                      ))
                    }
                    {communityMembers.filter(member => member.userId !== currentUser?.uid).length === 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No community members
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatView;