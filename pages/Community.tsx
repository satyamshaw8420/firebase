import React, { useState, useEffect, useRef } from 'react';
import {
    Heart, MessageCircle, Share2, MapPin, MoreHorizontal,
    Image as ImageIcon, Smile, Send, Search, Users,
    UserPlus, Settings, Edit3, Camera, Phone, Video,
    Compass, Grid, Bookmark, LogOut, PlusCircle, Plane, Trash2, Paperclip, Download
} from 'lucide-react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllDocuments, getDocument, subscribeToCollection, joinCommunity, leaveCommunity, getCommunityMembers, subscribeToCommunityMembers, getCommunityById, isCommunityMember, addCommunityMessage, createDirectMessageChat, createCommunityGroupChat, addUserToGroupChat, removeUserFromGroupChat, getExistingChat, addDirectMessage, deleteMessage, markMessageAsDelivered, markMessageAsRead, setUserTyping, getTypingUsers, updateDocument, uploadFile } from '../firebase/dbService';
import { createCommunity as createCommunityService, deleteCommunity } from '../firebase/communityService';
import { getDiscoverableTrips, joinTrip } from '../firebase/tripService';
import Picker from 'emoji-picker-react';
import ChatView from '../components/ChatView';
import { toast, Toaster } from 'sonner';

const { Link } = ReactRouterDOM;
// --- COMPONENTS ---

// Helper function to generate Gmail-style avatars with initials
const getGmailAvatar = (name: string, userId?: string, size: number = 150) => {
    // If we have a name, use it to generate an avatar with initials
    if (name && name.trim() !== '') {
        // Extract initials from the name
        const initials = name.split(' ').map(part => part.charAt(0)).join('').substring(0, 2).toUpperCase();
        // Generate a Gmail-style avatar URL
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=random&color=ffffff`;
    }
    
    // If no name, use userId
    const identifier = userId || 'U';
    const initials = identifier.substring(0, 2).toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=random&color=ffffff`;
};

export default function Community() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'feed' | 'profile' | 'chat'>('feed');
    const [user, setUser] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [communities, setCommunities] = useState<any[]>([]);
    const [communityMembers, setCommunityMembers] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [selectedCommunity, setSelectedCommunity] = useState<any>(null);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showCreateCommunity, setShowCreateCommunity] = useState(false);
    const [newCommunity, setNewCommunity] = useState({
        name: '',
        description: '',
        isPublic: true,
        imageUrl: ''
    });

    const [localGuides, setLocalGuides] = useState<any[]>([]);
    const [showAllMembers, setShowAllMembers] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroup, setNewGroup] = useState({
        name: '',
        members: [] as any[]
    });
    
    const [showRightSidebar, setShowRightSidebar] = useState(false);

    // Fetch communities from Firestore with real-time updates
    useEffect(() => {
        const unsubscribe = subscribeToCollection('communities', (communityData) => {
            setCommunities(communityData);
            
            // If we're currently viewing a community that was deleted, clear the selection
            if (selectedCommunity) {
                const communityStillExists = communityData.some((c: any) => c.id === selectedCommunity.id);
                if (!communityStillExists) {
                    setSelectedCommunity(null);
                    setCommunityMembers([]); // Clear members when community is deleted
                }
            }
        });

        return () => {
            if (unsubscribe && typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [selectedCommunity]);

    // Fetch community members when a community is selected
    useEffect(() => {
        if (selectedCommunity) {
            subscribeToCommunityMembers(selectedCommunity.id, (members) => {
                setCommunityMembers(members);
            }).then(unsubscribe => {
                // Store unsubscribe function for cleanup
                return () => {
                    if (unsubscribe && typeof unsubscribe === 'function') {
                        unsubscribe();
                    }
                };
            });
        }
    }, [selectedCommunity]);

    // Fetch user data from Firestore
    useEffect(() => {
        if (currentUser) {
            // Fetch only the current user's data
            getDocument('users', currentUser.uid).then(currentUserData => {
                if (currentUserData) {
                    setUser(currentUserData);
                } else {
                    // If user doesn't exist in Firestore, create a basic profile and save it
                    const basicProfile = {
                        id: currentUser.uid,
                        uid: currentUser.uid,
                        name: currentUser.displayName || 'Traveler',
                        handle: `@${currentUser.displayName?.toLowerCase().replace(/\s+/g, '') || 'traveler'}`,
                        avatar: currentUser.photoURL || getGmailAvatar(currentUser.displayName || 'Traveler', currentUser.uid, 150),
                        bio: 'Travel enthusiast',
                        location: 'Earth',
                        followers: 0,
                        following: 0,
                        trips: 0,
                        onboardingCompleted: false
                    };

                    // Save the basic profile to Firestore
                    updateDocument('users', currentUser.uid, basicProfile).catch(error => {
                        console.error('Error saving basic profile:', error);
                    });

                    setUser(basicProfile);
                }
            }).catch(error => {
                console.error('Error fetching user data:', error);
                // Fallback to basic profile
                const basicProfile = {
                    id: currentUser.uid,
                    uid: currentUser.uid,
                    name: currentUser.displayName || 'Traveler',
                    handle: `@${currentUser.displayName?.toLowerCase().replace(/\s+/g, '') || 'traveler'}`,
                    avatar: currentUser.photoURL || getGmailAvatar(currentUser.displayName || 'Traveler', currentUser.uid, 150),
                    bio: 'Travel enthusiast',
                    location: 'Earth',
                    followers: 0,
                    following: 0,
                    trips: 0,
                    onboardingCompleted: false
                };

                // Save the basic profile to Firestore
                updateDocument('users', currentUser.uid, basicProfile).catch(error => {
                    console.error('Error saving basic profile:', error);
                });

                setUser(basicProfile);
            });
        }
    }, [currentUser]);

    // Fetch posts from Firestore
    useEffect(() => {
        const unsubscribe = subscribeToCollection('posts', (postData) => {
            setPosts(postData);
        });

        return () => unsubscribe();
    }, []);

    // Fetch local guides from Firestore
    useEffect(() => {
        const unsubscribe = subscribeToCollection('localGuides', (guidesData) => {
            setLocalGuides(guidesData);
        });

        return () => unsubscribe();
    }, []);

    // Fetch all users for search functionality
    useEffect(() => {
        const unsubscribe = subscribeToCollection('users', (usersData) => {
            setAllUsers(usersData);
        });

        return () => unsubscribe();
    }, []);

    const toggleLike = (id: number) => {
        setPosts(posts.map(p => p.id === id ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p));
    };

    // Handle create community
    const handleCreateCommunity = async () => {
        console.log('handleCreateCommunity called');
        if (!currentUser || !newCommunity.name.trim()) return;

        try {
            console.log('Creating community with data:', {
                name: newCommunity.name,
                description: newCommunity.description,
                isPublic: newCommunity.isPublic,
                imageUrl: newCommunity.imageUrl,
                createdBy: currentUser.uid
            });

            const communityData = {
                name: newCommunity.name,
                description: newCommunity.description,
                isPublic: newCommunity.isPublic,
                imageUrl: newCommunity.imageUrl,
                createdBy: currentUser.uid
            };

            const communityId = await createCommunityService(communityData);
            console.log('Community created with ID:', communityId);

            // Reset form
            setNewCommunity({
                name: '',
                description: '',
                isPublic: true,
                imageUrl: ''
            });
            setShowCreateCommunity(false);
            
            // Show success message
            alert(`Community "${newCommunity.name}" created successfully!`);
        } catch (error) {
            console.error('Error creating community:', error);
            alert('Failed to create community. Please try again.');
        }
    };

    // Handle delete community
    const handleDeleteCommunity = async (communityId: string, communityName: string) => {
        if (!currentUser) return;

        // Confirm deletion
        const confirmed = window.confirm(`Are you sure you want to delete the community "${communityName}"? This action cannot be undone.`);
        if (!confirmed) return;

        try {
            await deleteCommunity(communityId);
            // Show success message
            toast.success(`Community "${communityName}" deleted successfully! All members have been removed.`);
            
            // If the deleted community was the selected one, clear selection and members
            if (selectedCommunity && selectedCommunity.id === communityId) {
                setSelectedCommunity(null);
                setCommunityMembers([]); // Instantly clear members
            }
            
            // Also remove the community from the communities list
            setCommunities(prevCommunities => 
                prevCommunities.filter(community => community.id !== communityId)
            );
        } catch (error) {
            console.error('Error deleting community:', error);
            toast.error('Failed to delete community. Please try again.');
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Toaster position="top-right" richColors />
            {/* LEFT SIDEBAR (Navigation) */}
            <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 sticky top-16 h-[calc(100vh-64px)] p-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <div className="bg-emerald-500 p-1.5 rounded-lg">
                            <Users className="text-white w-4 h-4" />
                        </div>
                        <span className="font-bold text-lg text-gray-800">Community</span>
                    </div>

                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab('feed')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'feed' ? 'bg-emerald-50 text-emerald-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Compass className="w-5 h-5" /> Explore Feed
                        </button>
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'chat' ? 'bg-emerald-50 text-emerald-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <MessageCircle className="w-5 h-5" /> Messages
                        </button>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'profile' ? 'bg-emerald-50 text-emerald-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-300">
                                <img 
                                    src={user?.avatar || getGmailAvatar(user?.name, user?.uid, 150)} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => {
                                        // If the image fails to load, fall back to the Gmail-style avatar
                                        const target = e.target as HTMLImageElement;
                                        target.src = getGmailAvatar(user?.name, user?.uid, 150);
                                    }}
                                />
                            </div>
                            My Profile
                        </button>
                    </nav>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-3 text-white text-center">
                        <p className="font-bold text-xs mb-1">Plan with Strangers?</p>
                        <p className="text-[10px] opacity-90 mb-2">Join a group trip and make new friends!</p>
                        <Link to="/create-trip" className="inline-block bg-white text-indigo-600 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm hover:scale-105 transition-transform">
                            Create Trip
                        </Link>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 max-w-3xl mx-auto w-full px-2">
                {activeTab === 'feed' && <FeedView posts={posts} toggleLike={toggleLike} setSelectedUser={setSelectedUser} allUsers={allUsers} currentUser={currentUser} setShowCreateCommunity={setShowCreateCommunity} />}
                {activeTab === 'profile' && <ProfileView user={user} setUser={setUser} />}
                {activeTab === 'chat' && <ChatView />}

                {/* Community Detail View */}
                {selectedCommunity && (
                    <CommunityDetailView
                        community={selectedCommunity}
                        members={communityMembers}
                        currentUser={currentUser}
                        onBack={() => setSelectedCommunity(null)}
                        onJoin={async () => {
                            if (currentUser) {
                                // Show loading toast
                                const toastId = toast.loading('Joining community...');
                                
                                try {
                                    await joinCommunity(selectedCommunity.id, currentUser.uid, currentUser);
                                    toast.success(`Welcome! You have successfully joined ${selectedCommunity.name}.`, {
                                        id: toastId
                                    });
                                    
                                    // Force refresh of community members to show the current user as a member
                                    // This will trigger the useEffect in CommunityDetailView to recheck membership status
                                    const updatedMembers = await getCommunityMembers(selectedCommunity.id);
                                    setCommunityMembers(updatedMembers);
                                } catch (error) {
                                    console.error('Error joining community:', error);
                                    toast.error('Failed to join community. Please try again.', {
                                        id: toastId
                                    });
                                }
                            }
                        }}
                        onLeave={async () => {
                            if (currentUser) {
                                // Show loading toast
                                const toastId = toast.loading('Leaving community...');
                                
                                try {
                                    await leaveCommunity(selectedCommunity.id, currentUser.uid);
                                    toast.success(`You have successfully left ${selectedCommunity.name}.`, {
                                        id: toastId
                                    });
                                    
                                    // Force refresh of community members after leaving
                                    const updatedMembers = await getCommunityMembers(selectedCommunity.id);
                                    setCommunityMembers(updatedMembers);
                                    
                                    // Navigate back to main view after successfully leaving
                                    setSelectedCommunity(null);
                                } catch (error) {
                                    console.error('Error leaving community:', error);
                                    toast.error('Failed to leave community. Please try again.', {
                                        id: toastId
                                    });
                                }
                            }
                        }}
                        handleDeleteCommunity={handleDeleteCommunity}
                        setActiveTab={setActiveTab}
                        showAllMembers={showAllMembers}
                        setShowAllMembers={setShowAllMembers}
                    />
                )}
                
                {/* Main Communities Grid - shown when no specific community is selected */}
                {!selectedCommunity && activeTab !== 'feed' && activeTab !== 'profile' && activeTab !== 'chat' && (
                    <div className="p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4  mb-6">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-1">Travel Communities</h2>
                                <p className="text-gray-600">Connect with fellow travelers and share experiences</p>
                            </div>
                            <button 
                                onClick={() => setShowCreateCommunity(true)}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                                <PlusCircle className="w-5 h-5" />
                                Create Community
                            </button>
                        </div>
                        
                        {/* Communities Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {communities.map((community: any) => (
                                <div 
                                    key={community.id}
                                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1"
                                    onClick={() => setSelectedCommunity(community)}
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="relative">
                                            <img 
                                                src={community.imageUrl || getGmailAvatar(community.name, community.id, 200)} 
                                                className="w-16 h-16 rounded-xl object-cover group-hover:scale-105 transition-transform duration-200" 
                                                alt={community.name} 
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = getGmailAvatar(community.name, community.id, 200);
                                                }}
                                            />
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg text-gray-900 truncate group-hover:text-emerald-600 transition-colors duration-200">{community.name}</h3>
                                            <p className="text-gray-500 text-sm line-clamp-2 mt-1">{community.description}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                                                <Users className="w-4 h-4" />
                                                <span className="font-medium">{community.memberCount?.toLocaleString() || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                                                <MapPin className="w-4 h-4" />
                                                <span>{community.location || 'Global'}</span>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${community.isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {community.isPublic ? 'Public' : 'Private'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {/* Create Community Modal */}
                {showCreateCommunity && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white rounded-3xl w-full max-w-2xl my-8 transform transition-all duration-300 ease-out scale-95 animate-in fade-in zoom-in-95">
                            <div className="flex justify-between items-center p-6 border-b border-gray-100">
                                <h3 className="font-bold text-2xl text-gray-900 tracking-tight">Create New Community</h3>
                                <button
                                    onClick={() => setShowCreateCommunity(false)}
                                    className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-8 max-h-[70vh] overflow-y-auto">
                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-3 tracking-wide">Community Name <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={newCommunity.name}
                                                onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                                                className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md group-focus-within:shadow-lg group-focus-within:-translate-y-0.5"
                                                placeholder="Enter community name"
                                            />
                                            <div className="absolute inset-0 rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_2px_8px_rgba(0,0,0,0.08)] pointer-events-none transition-all duration-300 group-focus-within:shadow-[0_0_0_2px_rgba(52,211,153,0.5),0_4px_16px_rgba(0,0,0,0.12)]"></div>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-3 tracking-wide">Description</label>
                                        <div className="relative">
                                            <textarea
                                                className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md group-focus-within:shadow-lg group-focus-within:-translate-y-0.5 resize-none"
                                                placeholder="Describe your community"
                                                rows={4}
                                                value={newCommunity.description}
                                                onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                                            />
                                            <div className="absolute inset-0 rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_2px_8px_rgba(0,0,0,0.08)] pointer-events-none transition-all duration-300 group-focus-within:shadow-[0_0_0_2px_rgba(52,211,153,0.5),0_4px_16px_rgba(0,0,0,0.12)]"></div>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-3 tracking-wide">Image URL (optional)</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md group-focus-within:shadow-lg group-focus-within:-translate-y-0.5"
                                                placeholder="https://example.com/image.jpg"
                                                value={newCommunity.imageUrl}
                                                onChange={(e) => setNewCommunity({ ...newCommunity, imageUrl: e.target.value })}
                                            />
                                            <div className="absolute inset-0 rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_2px_8px_rgba(0,0,0,0.08)] pointer-events-none transition-all duration-300 group-focus-within:shadow-[0_0_0_2px_rgba(52,211,153,0.5),0_4px_16px_rgba(0,0,0,0.12)]"></div>
                                        </div>
                                    </div>

                                    <div className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all duration-300 hover:bg-gray-100">
                                        <div className="relative inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                id="isPublic"
                                                className="w-5 h-5 text-emerald-600 rounded-lg focus:ring-emerald-500 focus:ring-offset-0 focus:ring-2 border-gray-300 transition-all duration-300 cursor-pointer"
                                                checked={newCommunity.isPublic}
                                                onChange={(e) => setNewCommunity({ ...newCommunity, isPublic: e.target.checked })}
                                            />
                                            <label htmlFor="isPublic" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer select-none">Make this community public</label>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-8">
                                    <button
                                        onClick={() => setShowCreateCommunity(false)}
                                        className="flex-1 px-6 py-4 border border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-all duration-300 active:scale-95 shadow-sm hover:shadow-md"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            console.log('Create button clicked');
                                            handleCreateCommunity();
                                        }}
                                        disabled={!newCommunity.name.trim()}
                                        className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-95 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:hover:transform-none disabled:hover:shadow-lg"
                                    >
                                        Create Community
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* All Community Members Modal */}
                {showAllMembers && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white rounded-2xl w-full max-w-2xl my-8">
                            <div className="flex justify-between items-center p-6 border-b border-gray-100">
                                <h3 className="font-bold text-xl text-gray-900">All Community Members</h3>
                                <button
                                    onClick={() => setShowAllMembers(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {communityMembers.map((member: any) => (
                                        <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                                            <img 
                                                src={member.avatar || member.photoURL || getGmailAvatar(member.name, member.userId, 150)} 
                                                className="w-12 h-12 rounded-full object-cover" 
                                                alt={member.name || member.userId} 
                                            />
                                            <div>
                                                <h4 className="font-bold text-gray-900">{member.name || 'Traveler'}</h4>
                                                <p className="text-sm text-gray-500">{member.role || 'member'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                

                {/* User Details Modal */}
                {selectedUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-xl text-gray-900">User Profile</h3>
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex flex-col items-center mb-6">
                                <img
                                    src={selectedUser.avatar || selectedUser.photoURL || selectedUser.profilePicture || getGmailAvatar(selectedUser.name, selectedUser.uid, 150)}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-4"
                                    alt={selectedUser.name}
                                />
                                <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                                <p className="text-gray-500">{selectedUser.handle || selectedUser.email}</p>
                                <p className="text-gray-500 mt-1">{selectedUser.location || 'Traveler'}</p>
                            </div>

                            <div className="mb-6">
                                <h4 className="font-bold text-gray-900 mb-2">Bio</h4>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                                    {selectedUser.bio || 'No bio available'}
                                </p>
                            </div>

                            <div className="mb-6">
                                <h4 className="font-bold text-gray-900 mb-2">Travel Experience</h4>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                                    {selectedUser.travelExperience || 'Not specified'}
                                </p>
                            </div>

                            <div className="mb-6">
                                <h4 className="font-bold text-gray-900 mb-2">Interests</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedUser.interests && selectedUser.interests.length > 0 ? (
                                        selectedUser.interests.map((interest: string, index: number) => (
                                            <span key={`interest-${index}`} className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                                {interest}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-gray-500">No interests specified</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={async () => {
                                        if (currentUser && selectedUser) {
                                            try {
                                                // Check if chat already exists
                                                let existingChat = await getExistingChat(currentUser.uid, selectedUser.uid);
                                                let chatId;

                                                if (existingChat) {
                                                    chatId = existingChat.id;
                                                } else {
                                                    // Create new chat
                                                    chatId = await createDirectMessageChat(
                                                        currentUser.uid,
                                                        selectedUser.uid,
                                                        currentUser,
                                                        selectedUser
                                                    );
                                                }

                                                // Switch to chat tab and open this chat
                                                setActiveTab('chat');
                                                setSelectedUser(null);
                                            } catch (error) {
                                                console.error('Error initiating chat:', error);
                                            }
                                        }
                                    }}
                                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600"
                                >
                                    Message
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* RIGHT SIDEBAR (Suggestions) - Hidden on Mobile */}
            <aside className={`${showRightSidebar ? 'block fixed inset-0 z-40 w-full bg-white shadow-xl' : 'hidden'} xl:block xl:relative xl:top-auto xl:bottom-auto xl:right-auto xl:z-auto xl:w-80 xl:shadow-none w-72 p-4 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 xl:hidden p-4 pt-6">
                    <div>
                        <h3 className="font-bold text-gray-900 text-base mb-1">Suggestions</h3>
                    </div>
                    <button 
                        onClick={() => setShowRightSidebar(false)}
                        className="text-gray-500 hover:text-gray-700 xl:hidden text-2xl"
                    >
                        ✕
                    </button>
                </div>
                <div className="xl:flex xl:flex-col xl:space-y-8">
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 xl:block xl:mb-6">
                            <div>
                                <h3 className="font-bold text-gray-900 text-base mb-1">Suggested Travelers</h3>
                                <p className="text-gray-600 text-xs">Connect with fellow travelers</p>
                            </div>
                            <button className="text-emerald-600 font-semibold hover:text-emerald-700 px-3 py-1 rounded-lg hover:bg-emerald-50 transition-colors text-sm xl:hidden">See All</button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                            {allUsers.filter(u => u.uid !== currentUser?.uid).slice(0, 6).map((traveler: any) => (
                                <div 
                                    key={`traveler-${traveler.uid}`}
                                    className="text-center cursor-pointer group hover:scale-105 transition-transform duration-200"
                                    onClick={() => setSelectedUser(traveler)}
                                >
                                    <div className="relative mb-3">
                                        <div className="relative inline-block">
                                            <img 
                                                src={traveler.avatar || traveler.photoURL || traveler.profilePicture || getGmailAvatar(traveler.name, traveler.uid, 150)} 
                                                className="w-16 h-16 rounded-full mx-auto object-cover border-4 border-white shadow-sm group-hover:shadow-lg transition-shadow duration-200" 
                                                alt={traveler.name} 
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = getGmailAvatar(traveler.name, traveler.uid, 150);
                                                }}
                                            />
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                                                <Plane className="w-2.5 h-2.5" />
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                                    </div>
                                    <h4 className="font-semibold text-sm text-gray-900 truncate group-hover:text-emerald-600 transition-colors duration-200">{traveler.name}</h4>
                                    <p className="text-xs text-gray-500 truncate mt-1">{traveler.location || 'Traveler'}</p>
                                    <button className="mt-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors duration-200">
                                        Connect
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-500 text-sm">COMMUNITIES</h3>
                            <button
                                className="text-xs font-bold text-emerald-600"
                                onClick={() => setShowCreateCommunity(true)}
                            >
                                Create Community
                            </button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {communities.map(community => (
                                <div
                                    key={community.id}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setSelectedCommunity(community)}
                                >
                                    <img src={community.imageUrl || getGmailAvatar(community.name, community.id, 150)} className="w-10 h-10 rounded-lg object-cover" alt={community.name} />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-gray-900 truncate">{community.name}</h4>
                                        <p className="text-xs text-gray-500 truncate">{community.description}</p>
                                        <div className="flex items-center text-xs text-gray-400 mt-1">
                                            <Users className="w-3 h-3 mr-1" />
                                            {community.memberCount?.toLocaleString() || 0} members
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {/* Show Join button only for non-creators who are not members */}
                                        {community.createdBy !== currentUser?.uid && (
                                            <button
                                                className="text-emerald-500 hover:text-emerald-600 text-xs font-bold"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (currentUser) {
                                                        // Show loading toast
                                                        const toastId = toast.loading(`Joining ${community.name}...`);
                                                        
                                                        try {
                                                            await joinCommunity(community.id, currentUser.uid, currentUser);
                                                            toast.success(`Welcome! You have successfully joined ${community.name}.`, {
                                                                id: toastId
                                                            });
                                                        } catch (error) {
                                                            console.error('Error joining community:', error);
                                                            toast.error('Failed to join community. Please try again.', {
                                                                id: toastId
                                                            });
                                                        }
                                                    }
                                                }}
                                            >
                                                Join
                                            </button>
                                        )}                                    <button
                                            className="text-gray-400 hover:text-gray-600"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Copy community link to clipboard
                                                const communityUrl = `${window.location.origin}/community/${community.id}`;
                                                navigator.clipboard.writeText(communityUrl);
                                                // In a real app, you might show a toast notification here
                                                alert('Community link copied to clipboard!');
                                            }}
                                        >
                                            <Share2 className="w-3 h-3" />
                                        </button>
                                        {community.createdBy === currentUser?.uid && (
                                            <button
                                                className="text-red-500 hover:text-red-600"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCommunity(community.id, community.name);
                                                }}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8">
                        {/* Search Bar */}
                        <div className="mb-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                />
                                <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-500 text-sm">LOCAL GUIDES</h3>
                            <button className="text-xs font-bold text-emerald-600">See All</button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {localGuides.map(guide => (
                                <div key={guide.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <img src={guide.image || getGmailAvatar(guide.name, guide.id, 150)} className="w-10 h-10 rounded-full object-cover" alt={guide.name} />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-gray-900 truncate">{guide.name}</h4>
                                        <p className="text-xs text-gray-500 truncate">{guide.location}</p>
                                        <div className="flex items-center text-xs text-gray-400 mt-1">
                                            <span className="text-amber-500 mr-1">★</span>
                                            <span className="font-bold text-gray-700 mr-1">{guide.rating}</span>
                                            <span>({guide.reviews})</span>
                                        </div>
                                    </div>
                                    <button className="text-emerald-500 hover:text-emerald-600 text-xs font-bold">
                                        Contact
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-500 text-sm">COMMUNITY MEMBERS</h3>
                            <button className="text-xs font-bold text-emerald-600" onClick={() => setShowAllMembers(true)}>
                                See All
                            </button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {communityMembers.slice(0, 3).map(member => (
                                <div key={member.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <img src={member.avatar || member.photoURL || getGmailAvatar(member.name, member.userId, 150)} className="w-8 h-8 rounded-full object-cover" alt={member.name || member.userId} />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-gray-900 truncate">{member.name || 'Traveler'}</h4>
                                        <p className="text-xs text-gray-500 truncate">{member.role || 'member'}</p>
                                    </div>
                                    <button 
                                        className="text-emerald-500 hover:text-emerald-600 text-xs font-bold"
                                        onClick={async () => {
                                            if (!currentUser) return;
                                            try {
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
                                                        {
                                                            name: currentUser.displayName || 'User',
                                                            avatar: currentUser.photoURL || getGmailAvatar(currentUser.displayName || 'User', currentUser.uid, 150),
                                                            handle: `@${currentUser.displayName?.toLowerCase().replace(/\s+/g, '') || 'user'}`,
                                                            uid: currentUser.uid
                                                        },
                                                        {
                                                            name: member.name || 'User',
                                                            avatar: member.avatar || member.photoURL || getGmailAvatar(member.name || 'User', member.userId, 150),
                                                            handle: member.handle || `@${member.name?.toLowerCase().replace(/\s+/g, '') || 'user'}`,
                                                            uid: member.userId
                                                        }
                                                    );
                                                }
                                                
                                                // Switch to chat tab and open this chat
                                                setActiveTab('chat');
                                            } catch (error) {
                                                console.error('Error initiating chat:', error);
                                                alert('Failed to start chat. Please try again.');
                                            }
                                        }}
                                    >
                                        Message
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>

            {/* MOBILE BOTTOM NAV */}
            <div className={`${showRightSidebar ? 'hidden' : 'md:hidden'} fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2.5 flex justify-between z-50`}>
                <button onClick={() => setActiveTab('feed')} className={`${activeTab === 'feed' ? 'text-emerald-600' : 'text-gray-400'}`}><Compass className="w-5 h-5" /></button>
                <button onClick={() => setActiveTab('chat')} className={`${activeTab === 'chat' ? 'text-emerald-600' : 'text-gray-400'}`}><MessageCircle className="w-5 h-5" /></button>
                <button onClick={() => setActiveTab('profile')} className={`${activeTab === 'profile' ? 'text-emerald-600' : 'text-gray-400'}`}><Users className="w-5 h-5" /></button>
                <button 
                    onClick={() => setShowRightSidebar(true)} 
                    className="text-gray-400 hover:text-emerald-600 relative"
                >
                    <div className="relative">
                        <Grid className="w-5 h-5" />
                        {/* Small indicator dot to show there are additional features in the sidebar */}
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></div>
                    </div>
                </button>
            </div>
            
            {/* Sidebar backdrop - needed for both mobile and desktop, but different behavior */}
            {showRightSidebar && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={() => setShowRightSidebar(false)}
                ></div>
            )}
        </div>
    );
}


// --- SUB-COMPONENTS ---

const FeedView = ({ posts, toggleLike, setSelectedUser, allUsers, currentUser, setShowCreateCommunity }: any) => {
    const [stories, setStories] = useState<any[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [travelTips, setTravelTips] = useState<any[]>([]);

    // Fetch stories from Firestore
    useEffect(() => {
        const unsubscribe = subscribeToCollection('stories', (storiesData) => {
            setStories(storiesData);
        });

        return () => unsubscribe();
    }, []);

    // Fetch upcoming events from Firestore
    useEffect(() => {
        const unsubscribe = subscribeToCollection('events', (eventsData) => {
            setUpcomingEvents(eventsData);
        });

        return () => unsubscribe();
    }, []);

    // Fetch travel tips from Firestore
    useEffect(() => {
        const unsubscribe = subscribeToCollection('travelTips', (tipsData) => {
            setTravelTips(tipsData);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="p-4 md:p-6 space-y-6 pb-20">
            {/* STORIES */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                <div className="flex flex-col items-center space-y-2 cursor-pointer flex-shrink-0">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-300 flex items-center justify-center bg-emerald-50">
                        <PlusCircle className="text-emerald-500 w-6 h-6" />
                    </div>
                    <span className="text-sm text-gray-600 font-medium">Add Story</span>
                </div>
                {stories.map(story => (
                    <div key={story.id} className="flex flex-col items-center space-y-2 cursor-pointer flex-shrink-0">
                        <div className={`w-16 h-16 rounded-full p-0.5 ${story.active ? 'bg-gradient-to-tr from-yellow-400 to-fuchsia-600' : 'bg-gradient-to-tr from-gray-300 to-gray-400'}`}>
                            <img src={story.img} className="w-full h-full rounded-full border-2 border-white object-cover" alt="story" />
                        </div>
                        <span className="text-sm text-gray-700 font-medium truncate w-16 text-center">{story.user}</span>
                    </div>
                ))}
            </div>

            {/* Suggested Travelers section */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h3 className="font-bold text-gray-900 text-base mb-1">Suggested Travelers</h3>
                        <p className="text-gray-600 text-xs">Connect with fellow travelers</p>
                    </div>
                    <button className="text-emerald-600 font-semibold hover:text-emerald-700 px-3 py-1 rounded-lg hover:bg-emerald-50 transition-colors text-sm">See All</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {allUsers.filter(u => u.uid !== currentUser?.uid).slice(0, 6).map((traveler: any) => (
                        <div 
                            key={`feed-traveler-${traveler.uid}`}
                            className="text-center cursor-pointer group hover:scale-105 transition-transform duration-200"
                            onClick={() => {
                                setSelectedUser(traveler);
                            }}
                        >
                            <div className="relative mb-2">
                                <div className="relative inline-block">
                                    <img 
                                        src={traveler.avatar || traveler.photoURL || traveler.profilePicture || getGmailAvatar(traveler.name, traveler.uid, 150)} 
                                        className="w-14 h-14 rounded-full mx-auto object-cover border-2 border-white shadow-sm group-hover:shadow-md transition-shadow duration-200" 
                                        alt={traveler.name} 
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = getGmailAvatar(traveler.name, traveler.uid, 150);
                                        }}
                                    />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border border-white flex items-center justify-center text-white text-xs font-bold">
                                        <Plane className="w-2 h-2" />
                                    </div>
                                </div>
                                <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                            </div>
                            <h4 className="font-semibold text-xs text-gray-900 truncate group-hover:text-emerald-600 transition-colors duration-200">{traveler.name}</h4>
                            <p className="text-[10px] text-gray-500 truncate mt-1">{traveler.location || 'Traveler'}</p>
                            <button className="mt-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-medium hover:bg-emerald-100 transition-colors duration-200">
                                Connect
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Create Community Button */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="font-bold text-gray-900 text-base mb-1">Communities</h3>
                        <p className="text-gray-600 text-xs">Create or join travel communities</p>
                    </div>
                    <button 
                        onClick={() => setShowCreateCommunity(true)}
                        className="text-emerald-600 font-semibold hover:text-emerald-700 px-3 py-1 rounded-lg hover:bg-emerald-50 transition-colors text-sm flex items-center gap-1"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Create
                    </button>
                </div>
                
                {/* Optional: Show a preview of user's communities or suggested communities */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                    <p className="text-emerald-800 text-sm font-medium mb-2">Start your own travel community!</p>
                    <p className="text-emerald-700 text-xs mb-3">Connect with travelers who share your interests and destinations.</p>
                    <button 
                        onClick={() => setShowCreateCommunity(true)}
                        className="w-full py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors text-sm"
                    >
                        Create New Community
                    </button>
                </div>
            </div>
            
            {/* Upcoming Events Banner */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-6 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-xl mb-1">Upcoming Events</h3>
                        <p className="text-indigo-100 text-sm">Connect with fellow travelers</p>
                    </div>
                    <button className="text-white text-sm font-bold bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 transition-colors">
                        See All
                    </button>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
                    {upcomingEvents.map(event => (
                        <div key={event.id} className="flex-shrink-0 w-64 bg-white/20 rounded-xl p-4">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-xs font-bold bg-white/30 px-3 py-1 rounded-full capitalize">
                                    {event.type}
                                </span>
                                <div className="flex items-center text-white/90 text-xs">
                                    <Users className="w-3.5 h-3.5 mr-1.5" />
                                    {event.attendees}
                                </div>
                            </div>
                            <h4 className="font-bold text-sm mb-2">{event.title || event.name}</h4>
                            <div className="text-xs text-indigo-100 space-y-1 mb-3">
                                <div className="flex items-center">
                                    <MapPin className="w-3.5 h-3.5 mr-1" />
                                    {event.location || 'Location TBA'}
                                </div>
                                <div>{event.date}</div>
                                <div>{event.time}</div>
                            </div>
                            <button className="w-full bg-white text-indigo-600 text-sm font-bold py-2.5 rounded-lg hover:bg-indigo-50 transition-colors">
                                Join Event
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Travel Tips Section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 mb-1">Travel Tips & Advice</h3>
                        <p className="text-gray-500 text-sm">Learn from experienced travelers</p>
                    </div>
                    <button className="text-emerald-600 text-sm font-bold hover:text-emerald-700">See All</button>
                </div>

                <div className="space-y-4">
                    {travelTips.map(tip => (
                        <div key={tip.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                            <h4 className="font-bold text-base text-gray-900 mb-2">{tip.title}</h4>
                            <div className="flex items-center text-sm text-gray-500 mb-2">
                                <span>by {tip.author}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                        <Heart className="w-4 h-4" />
                                        <span>{tip.likes}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MessageCircle className="w-4 h-4" />
                                        <span>{tip.comments}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FEED POSTS */}
            <div className="space-y-6 max-w-2xl mx-auto">
                {posts.map((post: any) => (
                    <div key={post.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                        {/* Header */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src={post.user?.avatar || post.user?.photoURL || getGmailAvatar(post.user?.name, post.user?.uid, 150)} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" alt="avatar" />
                                <div>
                                    <h4 className="font-bold text-gray-900">{post.user.name}</h4>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <MapPin className="w-4 h-4 mr-1.5" /> {post.location}
                                    </div>
                                </div>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"><MoreHorizontal className="w-5 h-5" /></button>
                        </div>

                        {/* Image */}
                        <div className="relative aspect-[4/3] bg-gray-100">
                            <img src={post.image} className="w-full h-full object-cover" alt="post" />
                        </div>

                        {/* Action Bar */}
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => toggleLike(post.id)}
                                        className={`transition-transform active:scale-110 ${post.isLiked ? 'text-rose-500 fill-rose-500' : 'text-gray-600 hover:text-rose-500'}`}
                                    >
                                        <Heart className="w-7 h-7" />
                                    </button>
                                    <button className="text-gray-600 hover:text-blue-500">
                                        <MessageCircle className="w-7 h-7" />
                                    </button>
                                    <button className="text-gray-600 hover:text-emerald-500">
                                        <Share2 className="w-7 h-7" />
                                    </button>
                                </div>
                                <button className="text-gray-600 hover:text-gray-900">
                                    <Bookmark className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="font-bold text-base mb-2">{post.likes.toLocaleString()} likes</div>

                            <div className="mb-2">
                                <span className="font-bold text-base mr-2">{post.user.handle}</span>
                                <span className="text-base text-gray-700 leading-relaxed">{post.caption}</span>
                            </div>

                            <button className="text-gray-500 text-sm mb-2 hover:text-gray-700">View all {post.comments} comments</button>
                            <div className="text-sm text-gray-400 uppercase tracking-wide">{post.time}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProfileView = ({ user, setUser }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(user);
    const { currentUser } = useAuth();

    const handleSave = async () => {
        // Update user profile in Firestore (excluding avatar for now)
        try {
            await updateDocument('users', currentUser.uid, { ...editForm });
        } catch (error) {
            console.error('Error updating user profile:', error);
        }
        setUser(editForm);
        setIsEditing(false);
    };

    return (
        <div className="p-4 md:p-6 pb-20">
            {/* PROFILE HEADER */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
                <div className="relative group">
                    <img 
                        src={editForm?.avatar || user?.avatar || getGmailAvatar(user?.name, user?.uid, 150)} 
                        className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-4 border-white shadow-xl group-hover:shadow-2xl transition-shadow duration-300" 
                        alt="profile" 
                        onError={(e) => {
                            // If the image fails to load, fall back to the Gmail-style avatar
                            const target = e.target as HTMLImageElement;
                            target.src = getGmailAvatar(user?.name, user?.uid, 150);
                        }}
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <div className="flex-1 text-center md:text-left mt-4 md:mt-0">
                    <div className="flex flex-col md:flex-row items-center gap-4 mb-5">
                        {isEditing ? (
                            <input
                                className="text-3xl font-bold bg-gray-100 rounded-lg px-4 py-2 w-full max-w-xs outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-200"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                        ) : (
                            <h2 className="text-3xl font-bold text-gray-900">{user.name}</h2>
                        )}

                        {!isEditing ? (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    <Settings className="w-4 h-4" /> Edit Profile
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <button onClick={handleSave} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:from-emerald-600 hover:to-teal-600">Save</button>
                                <button onClick={() => setIsEditing(false)} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors duration-200">Cancel</button>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-8 mb-5">
                        <div className="text-center md:text-left">
                            <span className="font-bold text-xl block text-gray-900">{(user?.posts || []).length}</span> 
                            <span className="text-gray-500 text-sm">posts</span>
                        </div>
                        <div className="text-center md:text-left">
                            <span className="font-bold text-xl block text-gray-900">{user?.followers || 0}</span> 
                            <span className="text-gray-500 text-sm">followers</span>
                        </div>
                        <div className="text-center md:text-left">
                            <span className="font-bold text-xl block text-gray-900">{user?.following || 0}</span> 
                            <span className="text-gray-500 text-sm">following</span>
                        </div>
                    </div>

                    <div className="space-y-2 max-w-md mx-auto md:mx-0">
                        <div className="font-bold text-lg text-gray-900">{user?.handle || ''}</div>
                        {isEditing ? (
                            <textarea
                                className="w-full bg-gray-50 rounded-xl p-4 text-base outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-200 min-h-[100px]"
                                value={editForm.bio}
                                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                rows={3}
                            />
                        ) : (
                            <div className="text-gray-700 text-base whitespace-pre-wrap text-center md:text-left">{user?.bio || ''}</div>
                        )}
                        {user?.location && (
                            <div className="text-gray-600 text-base font-medium flex items-center justify-center md:justify-start pt-2">
                                <MapPin className="w-5 h-5 mr-2 text-emerald-500" /> {user.location}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CONTENT TABS */}
            <div className="border-t border-gray-200 mb-8">
                <div className="flex justify-center gap-16">
                    <button className="flex items-center gap-3 border-t-2 border-emerald-500 py-4 text-sm font-bold text-emerald-600">
                        <Grid className="w-5 h-5" /> POSTS
                    </button>
                    <button className="flex items-center gap-3 border-t-2 border-transparent py-4 text-sm font-bold text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors duration-200">
                        <Plane className="w-5 h-5" /> TRIPS
                    </button>
                    <button className="flex items-center gap-3 border-t-2 border-transparent py-4 text-sm font-bold text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors duration-200">
                        <Bookmark className="w-5 h-5" /> SAVED
                    </button>
                </div>
            </div>

            {/* Travel Resources Hub */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-xl text-gray-900 mb-1">Travel Resources Hub</h3>
                        <p className="text-gray-600">Essential tools for your journey</p>
                    </div>
                    <button className="text-emerald-600 text-base font-bold hover:text-emerald-700">See All</button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-200 group hover:-translate-y-1">
                        <div className="text-emerald-600 text-2xl mb-3 group-hover:scale-110 transition-transform duration-200">📋</div>
                        <div className="font-bold text-base text-gray-900 mb-2">Packing Lists</div>
                        <div className="text-sm text-gray-600">Customizable templates</div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-200 group hover:-translate-y-1">
                        <div className="text-amber-600 text-2xl mb-3 group-hover:scale-110 transition-transform duration-200">🛂</div>
                        <div className="font-bold text-base text-gray-900 mb-2">Visa Guides</div>
                        <div className="text-sm text-gray-600">Country requirements</div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-200 group hover:-translate-y-1">
                        <div className="text-blue-600 text-2xl mb-3 group-hover:scale-110 transition-transform duration-200">💱</div>
                        <div className="font-bold text-base text-gray-900 mb-2">Currency Tips</div>
                        <div className="text-sm text-gray-600">Exchange rates & tips</div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-200 group hover:-translate-y-1">
                        <div className="text-purple-600 text-2xl mb-3 group-hover:scale-110 transition-transform duration-200">🚑</div>
                        <div className="font-bold text-base text-gray-900 mb-2">Emergency Info</div>
                        <div className="text-sm text-gray-600">Contacts & procedures</div>
                    </div>
                </div>
            </div>

            {/* Travel Challenges */}
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white mb-8">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-xl mb-1">Travel Challenges</h3>
                        <p className="text-amber-100">Complete challenges to earn badges</p>
                    </div>
                    <button className="text-white text-sm font-bold bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 transition-colors">
                        View All
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-2xl p-4 text-center">
                        <div className="text-3xl mb-2">🏆</div>
                        <div className="text-sm font-bold mb-1">October Challenge</div>
                        <div className="text-xs text-amber-100 mb-3">Post 5 photos</div>
                        <div className="w-full bg-white/20 rounded-full h-2.5 mb-2">
                            <div className="bg-white h-2.5 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                        <div className="text-xs">3/5 completed</div>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-4 text-center">
                        <div className="text-3xl mb-2">📸</div>
                        <div className="text-sm font-bold mb-1">Photo Pro</div>
                        <div className="text-xs text-amber-100 mb-3">100 likes</div>
                        <div className="w-full bg-white/20 rounded-full h-2.5 mb-2">
                            <div className="bg-white h-2.5 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                        <div className="text-xs">25/100</div>
                    </div>
                </div>
            </div>

            {/* PHOTO GRID */}
            <div className="grid grid-cols-3 gap-2 md:gap-4">
                {(user?.posts || []).map((img: string, i: number) => (
                    <div key={i} className="aspect-square relative group cursor-pointer overflow-hidden bg-gray-100 rounded-xl">
                        <img src={img} className="w-full h-full object-cover" alt="post" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="flex items-center gap-2 text-white font-bold">
                                <Heart className="w-5 h-5 fill-white" /> 124
                            </div>
                        </div>
                    </div>
                ))}
                {/* Add New Placeholder */}
                <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-colors rounded-xl">
                    <PlusCircle className="w-8 h-8 mb-2" />
                    <span className="text-sm font-bold">Add</span>
                </div>
            </div>
        </div>
    );
};

const CommunityDetailView = ({ community, members, currentUser, onBack, onJoin, onLeave, setActiveTab, handleDeleteCommunity, showAllMembers, setShowAllMembers }: any) => {
    const [isMember, setIsMember] = useState(false);
    const [onlineMembers, setOnlineMembers] = useState(0);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroup, setNewGroup] = useState({
        name: '',
        members: [] as any[]
    });
    const [discoverableTrips, setDiscoverableTrips] = useState<any[]>([]);
    const [loadingTrips, setLoadingTrips] = useState(true);
    const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
    
    // Check if community still exists
    useEffect(() => {
        // In a real implementation, this would subscribe to community changes
        // For now, we'll rely on the parent component to handle this
    }, [community]);
    useEffect(() => {
        if (currentUser && community) {
            isCommunityMember(community.id, currentUser.uid).then(memberStatus => {
                setIsMember(memberStatus);
            });
        }
    }, [currentUser, community]);
    
    // Also update membership status when members list changes
    useEffect(() => {
        if (currentUser && community) {
            // Check if current user is in the members list
            const isCurrentlyMember = members.some((member: any) => member.userId === currentUser.uid);
            setIsMember(isCurrentlyMember);
        }
    }, [members, currentUser, community]);

    // Fetch discoverable trips
    useEffect(() => {
        const fetchDiscoverableTrips = async () => {
            if (!isMember) {
                setLoadingTrips(false);
                return;
            }
            
            try {
                setLoadingTrips(true);
                const communityMemberIds = members.map((m: any) => m.userId);
                const discoverable = await getDiscoverableTrips(communityMemberIds, currentUser?.uid);
                
                setDiscoverableTrips(discoverable);
            } catch (error) {
                console.error('Error fetching discoverable trips:', error);
                // Show user-friendly error message
                toast.error('Failed to load community trips. Please try again later.');
                setDiscoverableTrips([]); // Set to empty array on error
            } finally {
                setLoadingTrips(false);
            }
        };
        
        fetchDiscoverableTrips();
    }, [isMember, members.length, currentUser]);
    // Simulate real-time online member count updates
    useEffect(() => {
        // In a real app, this would come from real-time Firestore updates
        // For now, we'll simulate by marking some members as online
        const simulateOnlineStatus = () => {
            const newOnlineStatus: Record<string, boolean> = {};
            members.forEach((member: any) => {
                // Mark ~70% of members as online for simulation
                newOnlineStatus[member.userId] = Math.random() > 0.3;
            });
            setOnlineStatus(newOnlineStatus);
            
            // Count online members
            const onlineCount = Object.values(newOnlineStatus).filter(status => status).length;
            setOnlineMembers(onlineCount);
        };

        // Initial simulation
        simulateOnlineStatus();
        
        // Update periodically
        const interval = setInterval(simulateOnlineStatus, 10000);

        return () => clearInterval(interval);
    }, [members.length, members]);

    // Handle create group chat
    const handleCreateGroup = async () => {
        if (!currentUser || !community || !newGroup.name.trim() || newGroup.members.length === 0) return;

        try {
            // Add current user to the group if not already selected
            const membersWithCreator = newGroup.members.some((m: any) => m.uid === currentUser.uid) 
                ? newGroup.members 
                : [...newGroup.members, { 
                    uid: currentUser.uid, 
                    name: currentUser.displayName || 'User', 
                    avatar: currentUser.photoURL || getGmailAvatar(currentUser.displayName || 'User', currentUser.uid, 150),
                    handle: `@${currentUser.displayName?.toLowerCase().replace(/\s+/g, '') || 'user'}`
                }];

            const groupId = await createCommunityGroupChat(
                community.id,
                newGroup.name,
                currentUser.uid,
                {
                    name: currentUser.displayName || 'User',
                    avatar: currentUser.photoURL || getGmailAvatar(currentUser.displayName || 'User', currentUser.uid, 150),
                    handle: `@${currentUser.displayName?.toLowerCase().replace(/\s+/g, '') || 'user'}`,
                    uid: currentUser.uid
                },
                membersWithCreator
            );

            // Reset form and close modal
            setNewGroup({
                name: '',
                members: []
            });
            setShowCreateGroup(false);
            
            // Show success message
            alert(`Group "${newGroup.name}" created successfully!`);
        } catch (error) {
            console.error('Error creating group chat:', error);
            alert('Failed to create group. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pt-4">
                    <button
                        onClick={onBack}
                        className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <span className="text-xl mr-2">‹</span> Back
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">{community.name}</h1>
                    <div></div> {/* Spacer */}
                </div>

                {/* Community Header */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white mb-8 shadow-lg">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:gap-8">
                        <div className="flex-shrink-0 mb-6 lg:mb-0">
                            <div className="relative inline-block">
                                <img
                                    src={community.imageUrl || getGmailAvatar(community.name, community.id, 200)}
                                    className="w-32 h-32 rounded-2xl object-cover border-4 border-white/30 shadow-xl"
                                    alt={community.name}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = getGmailAvatar(community.name, community.id, 200);
                                    }}
                                />
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 to-transparent"></div>
                            </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h2 className="text-3xl font-bold mb-3">{community.name}</h2>
                            <p className="text-emerald-100 text-lg mb-6 leading-relaxed">{community.description}</p>
                            
                            <div className="flex flex-wrap items-center gap-6 mb-6">
                                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                                    <Users className="w-5 h-5" />
                                    <span className="font-medium">{community.memberCount?.toLocaleString() || 0} members</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                    <span className="font-medium">{onlineMembers} online now</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                                    <MapPin className="w-5 h-5" />
                                    <span className="font-medium">{community.location || 'Global'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                            {/* Show join button only for non-members who are not the creator */}
                            {community.createdBy !== currentUser?.uid && !isMember && (
                                <button
                                    onClick={onJoin}
                                    className="px-6 py-3 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    Join Community
                                </button>
                            )}
                            
                            {/* Show 'Joined' status for members who are not the creator */}
                            {community.createdBy !== currentUser?.uid && isMember && (
                                <button
                                    onClick={onLeave}
                                    className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    Leave Community
                                </button>
                            )}
                            
                            {/* Show creator-specific actions */}
                            {community.createdBy === currentUser?.uid && (
                                <>
                                    <button
                                        onClick={() => setShowCreateGroup(true)}
                                        className="px-5 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 flex items-center gap-2 transition-all duration-200"
                                    >
                                        <Users className="w-5 h-5" /> Create Group
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCommunity(community.id, community.name)}
                                        className="px-5 py-3 bg-red-500/80 text-white rounded-xl font-semibold hover:bg-red-600 flex items-center gap-2 transition-all duration-200"
                                    >
                                        <Trash2 className="w-5 h-5" /> Delete
                                    </button>
                                </>
                            )}
                            
                            {/* Share button for everyone */}
                            <button
                                onClick={() => {
                                    // Copy community link to clipboard
                                    const communityUrl = `${window.location.origin}/community/${community.id}`;
                                    navigator.clipboard.writeText(communityUrl);
                                    // In a real app, you might show a toast notification here
                                    toast.success('Community link copied to clipboard!');
                                }}
                                className="px-5 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 flex items-center gap-2 transition-all duration-200"
                            >
                                <Share2 className="w-5 h-5" /> Share
                            </button>
                        </div>
                    </div>
                </div>

                {/* Members Section */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">Community Members</h3>
                            <p className="text-gray-600 text-sm">Connect with your community</p>
                        </div>
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">{members.length} members</span>
                    </div>

                    {members.length > 0 ? (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                {(showAllMembers ? members : members.slice(0, 12)).map((member: any) => (
                                    <div key={member.id} className="flex flex-col items-center group">
                                        <div className="relative mb-3">
                                            <div className="relative inline-block">
                                                <img
                                                    src={member.avatar || member.photoURL || getGmailAvatar(member.name, member.userId, 150)}
                                                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm group-hover:shadow-lg transition-shadow duration-200"
                                                    alt={member.name || member.userId}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = getGmailAvatar(member.name, member.userId, 150);
                                                    }}
                                                />
                                                {/* Online status indicator */}
                                                {onlineStatus[member.userId] && (
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                                    </div>
                                                )}
                                                {/* Admin badge */}
                                                {member.role === 'admin' && (
                                                    <div className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-sm">
                                                        A
                                                    </div>
                                                )}
                                                {/* Creator badge */}
                                                {community.createdBy === member.userId && (
                                                    <div className="absolute -top-1 left-0 bg-amber-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-sm">
                                                        C
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-sm text-gray-900 truncate group-hover:text-emerald-600 transition-colors duration-200">{member.name || 'Traveler'}</div>
                                            <div className="text-xs text-gray-500 font-medium">
                                                {community.createdBy === member.userId ? 'Creator' : member.role || 'member'}
                                                {onlineStatus[member.userId] && (
                                                    <span className="ml-1 text-green-500">● online</span>
                                                )}
                                            </div>
                                            {currentUser?.uid !== member.userId && (
                                                <button 
                                                    className="mt-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors duration-200"
                                                    onClick={async () => {
                                                        if (!currentUser) return;
                                                        try {
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
                                                                    {
                                                                        name: currentUser.displayName || 'User',
                                                                        avatar: currentUser.photoURL || getGmailAvatar(currentUser.displayName || 'User', currentUser.uid, 150),
                                                                        handle: `@${currentUser.displayName?.toLowerCase().replace(/\s+/g, '') || 'user'}`,
                                                                        uid: currentUser.uid
                                                                    },
                                                                    {
                                                                        name: member.name || 'User',
                                                                        avatar: member.avatar || member.photoURL || getGmailAvatar(member.name || 'User', member.userId, 150),
                                                                        handle: member.handle || `@${member.name?.toLowerCase().replace(/\s+/g, '') || 'user'}`,
                                                                        uid: member.userId
                                                                    }
                                                                );
                                                            }
                                                            
                                                            // Switch to chat tab and open this chat
                                                            if (setActiveTab) {
                                                                setActiveTab('chat');
                                                            }
                                                            // The ChatView component will automatically show the most recent chat
                                                        } catch (error) {
                                                            console.error('Error initiating chat:', error);
                                                            alert('Failed to start chat. Please try again.');
                                                        }
                                                    }}
                                                >
                                                    Message
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Show All / Show Less button */}
                            {members.length > 12 && (
                                <div className="mt-6 text-center">
                                    <button 
                                        onClick={() => setShowAllMembers(!showAllMembers)}
                                        className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-medium hover:bg-emerald-200 transition-colors duration-200"
                                    >
                                        {showAllMembers ? 'Show Less' : `See All ${members.length} Members`}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No members yet. Be the first to join!</p>
                        </div>
                    )}
                </div>

                {/* Discoverable Trips Section */}
                {isMember && (
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">Discover Trips</h3>
                                <p className="text-gray-600 text-sm">Find and join trips from your community</p>
                            </div>
                            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">{discoverableTrips.length} trips</span>
                        </div>
                        
                        {loadingTrips ? (
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 flex items-center justify-center border border-gray-200">
                                <div className="text-center text-gray-500">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-3"></div>
                                    <p className="font-medium">Loading trips...</p>
                                </div>
                            </div>
                        ) : discoverableTrips.length === 0 ? (
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-10 flex items-center justify-center border border-gray-200 text-center">
                                <div className="text-gray-400">
                                    <Plane className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <h4 className="font-bold text-lg text-gray-700 mb-1">No trips available</h4>
                                    <p className="text-gray-500 mb-4">Community members haven't shared any trips yet</p>
                                    <button className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-all duration-200">
                                        Share Your Trip
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {discoverableTrips.map((trip: any) => {
                                    // Find the trip creator's info
                                    const creator = members.find((m: any) => m.userId === trip.userId);
                                    const hasJoined = trip.joiners && trip.joiners.includes(currentUser?.uid);
                                    
                                    return (
                                        <div key={trip.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 group hover:-translate-y-0.5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-lg text-gray-900 truncate group-hover:text-emerald-600 transition-colors duration-200">{trip.tripName || 'Unnamed Trip'}</h4>
                                                    <div className="flex items-center text-sm text-gray-500 mt-1">
                                                        <span>by {creator?.name || 'Unknown User'}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right ml-3">
                                                    <div className="text-lg font-bold text-emerald-600">{trip.currency} {trip.totalEstimatedCost?.toLocaleString() || 'N/A'}</div>
                                                    <div className="text-sm text-gray-500">{trip.dailyItinerary?.length || 0} days</div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center text-gray-700 mb-4">
                                                <MapPin className="w-5 h-5 mr-2 text-emerald-500 flex-shrink-0" />
                                                <span className="truncate font-medium">{trip.destination || 'Destination not set'}</span>
                                            </div>
                                            
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mr-1">
                                                            <Users className="w-3 h-3 text-emerald-600" />
                                                        </div>
                                                        <span>{trip.joiners?.length || 0}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center mr-1">
                                                            <Plane className="w-3 h-3 text-amber-600" />
                                                        </div>
                                                        <span>{trip.dailyItinerary?.length || 0}d</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={async () => {
                                                        if (hasJoined) return;
                                                        try {
                                                            await joinTrip(trip.id, currentUser.uid);
                                                            // Update the trip in state
                                                            setDiscoverableTrips(prev => 
                                                                prev.map(t => 
                                                                    t.id === trip.id 
                                                                        ? { ...t, joiners: [...(t.joiners || []), currentUser.uid] }
                                                                        : t
                                                                )
                                                            );
                                                            // Show success message
                                                            toast.success('Successfully joined the trip!');
                                                        } catch (error: any) {
                                                            console.error('Error joining trip:', error);
                                                            toast.error(error.message || 'Failed to join trip. Please try again.');
                                                        }
                                                    }}
                                                    disabled={hasJoined}
                                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${hasJoined ? 'bg-emerald-100 text-emerald-700 cursor-default' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-sm hover:shadow-md'}`}
                                                >
                                                    {hasJoined ? 'Joined' : 'Join Trip'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Discussion Section */}
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Discussion</h3>
                    <div className="bg-gray-50 rounded-2xl p-6 min-h-[300px] flex items-center justify-center">
                        <div className="text-center text-gray-400">
                            <MessageCircle className="w-12 h-12 mx-auto mb-3" />
                            <p className="font-medium mb-1">No discussions yet</p>
                            <p className="text-sm mb-4">Be the first to start a conversation!</p>
                            {isMember ? (
                                <button className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-600">
                                    Start Discussion
                                </button>
                            ) : (
                                <p className="text-sm">Join the community to participate in discussions</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Create Group Chat Modal */}
                {showCreateGroup && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white rounded-2xl w-full max-w-2xl my-8">
                            <div className="flex justify-between items-center p-6 border-b border-gray-100">
                                <h3 className="font-bold text-xl text-gray-900">Create Group Chat</h3>
                                <button
                                    onClick={() => setShowCreateGroup(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                                    <input
                                        type="text"
                                        value={newGroup.name}
                                        onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Enter group name"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Members (Max 20)</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                                        {members
                                            .filter((member: any) => member.userId !== currentUser?.uid)
                                            .map((member: any) => (
                                                <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                                                    <input
                                                        type="checkbox"
                                                        checked={newGroup.members.some((m: any) => m.userId === member.userId)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                // Add member to group
                                                                setNewGroup({
                                                                    ...newGroup,
                                                                    members: [...newGroup.members, member]
                                                                });
                                                            } else {
                                                                // Remove member from group
                                                                setNewGroup({
                                                                    ...newGroup,
                                                                    members: newGroup.members.filter((m: any) => m.userId !== member.userId)
                                                                });
                                                            }
                                                        }}
                                                        className="h-4 w-4 text-emerald-600 rounded"
                                                    />
                                                    <img 
                                                        src={member.avatar || member.photoURL || getGmailAvatar(member.name, member.userId, 150)} 
                                                        className="w-8 h-8 rounded-full object-cover" 
                                                        alt={member.name || member.userId} 
                                                    />
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 text-sm">{member.name || 'Traveler'}</h4>
                                                        <p className="text-xs text-gray-500">{member.role || 'member'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                <div className="text-sm text-gray-500 mb-4">
                                    Selected: {newGroup.members.length} members (Max 20)
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowCreateGroup(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateGroup}
                                        disabled={!newGroup.name.trim() || newGroup.members.length === 0}
                                        className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Create Group
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};