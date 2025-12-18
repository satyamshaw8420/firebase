import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageCircle, Share2, MapPin, MoreHorizontal, 
  Image as ImageIcon, Smile, Send, Search, Users, 
  UserPlus, Settings, Edit3, Camera, Phone, Video, 
  Compass, Grid, Bookmark, LogOut, PlusCircle, Plane
} from 'lucide-react';
import * as ReactRouterDOM from 'react-router-dom';

const { Link } = ReactRouterDOM;

// --- MOCK DATA ---
const CURRENT_USER = {
    id: 'me',
    name: 'Alex Explorer',
    handle: '@alex_travels',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    bio: '🌍 Chasing sunsets & sushi | 📸 Travel Photographer | 📍 Currently in Mumbai',
    location: 'Mumbai, India',
    followers: 1205,
    following: 450,
    trips: 24,
    posts: [
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&q=80&w=400',
    ]
};

const STORIES = [
    { id: 1, user: 'sarah_j', img: 'https://i.pravatar.cc/150?u=1', active: true },
    { id: 2, user: 'mike_hikes', img: 'https://i.pravatar.cc/150?u=2', active: true },
    { id: 3, user: 'lisa_trips', img: 'https://i.pravatar.cc/150?u=3', active: false },
    { id: 4, user: 'backpack_ben', img: 'https://i.pravatar.cc/150?u=4', active: false },
    { id: 5, user: 'world_walker', img: 'https://i.pravatar.cc/150?u=5', active: false },
];

const FEED_POSTS = [
    {
        id: 1,
        user: { name: 'Sarah Jenkins', handle: '@sarah_j', avatar: 'https://i.pravatar.cc/150?u=1' },
        location: 'Kyoto, Japan',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800',
        caption: "Found this hidden bamboo path away from the crowds! 🎋 The silence here is magical. DM me if you want the exact coordinates! #HiddenGem #Kyoto",
        likes: 1240,
        comments: 45,
        time: '2 hours ago',
        isLiked: false
    },
    {
        id: 2,
        user: { name: 'Mike Chen', handle: '@mike_hikes', avatar: 'https://i.pravatar.cc/150?u=2' },
        location: 'Manali, India',
        image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=800',
        caption: "Group trip success! 🏔️ Met these strangers on TravelEase and now we're best friends trekking the Himalayas. This is your sign to join a group trip!",
        likes: 856,
        comments: 122,
        time: '5 hours ago',
        isLiked: true
    }
];

const CHATS = [
    { id: 1, name: 'Sarah Jenkins', lastMsg: 'The flight tickets are cheaper now!', time: '10:30 AM', unread: 2, avatar: 'https://i.pravatar.cc/150?u=1', isGroup: false },
    { id: 2, name: 'Himalaya Trek Squad 🏔️', lastMsg: 'Mike: Did everyone pack thermals?', time: 'Yesterday', unread: 0, avatar: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=150', isGroup: true },
    { id: 3, name: 'Lisa Ray', lastMsg: 'Sent you the itinerary.', time: 'Yesterday', unread: 0, avatar: 'https://i.pravatar.cc/150?u=3', isGroup: false },
];

// --- COMPONENTS ---

export default function Community() {
    const [activeTab, setActiveTab] = useState<'feed' | 'profile' | 'chat'>('feed');
    const [user, setUser] = useState(CURRENT_USER);
    const [posts, setPosts] = useState(FEED_POSTS);

    const toggleLike = (id: number) => {
        setPosts(posts.map(p => p.id === id ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p));
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* LEFT SIDEBAR (Navigation) */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 sticky top-16 h-[calc(100vh-64px)] p-6">
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="bg-emerald-500 p-2 rounded-lg">
                            <Users className="text-white w-5 h-5" />
                        </div>
                        <span className="font-bold text-xl text-gray-800">Community</span>
                    </div>
                    
                    <nav className="space-y-2">
                        <button 
                            onClick={() => setActiveTab('feed')}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'feed' ? 'bg-emerald-50 text-emerald-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Compass className="w-6 h-6" /> Explore Feed
                        </button>
                        <button 
                            onClick={() => setActiveTab('chat')}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-emerald-50 text-emerald-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <MessageCircle className="w-6 h-6" /> Messages
                        </button>
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-emerald-50 text-emerald-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-300">
                                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                            My Profile
                        </button>
                    </nav>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-100">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white text-center">
                        <p className="font-bold text-sm mb-2">Plan with Strangers?</p>
                        <p className="text-xs opacity-90 mb-3">Join a group trip and make new friends!</p>
                        <Link to="/create-trip" className="inline-block bg-white text-indigo-600 text-xs font-bold px-4 py-2 rounded-full shadow-sm hover:scale-105 transition-transform">
                            Create Group
                        </Link>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 max-w-4xl mx-auto w-full">
                {activeTab === 'feed' && <FeedView posts={posts} toggleLike={toggleLike} />}
                {activeTab === 'profile' && <ProfileView user={user} setUser={setUser} />}
                {activeTab === 'chat' && <ChatView />}
            </main>

            {/* RIGHT SIDEBAR (Suggestions) - Hidden on Mobile */}
            <aside className="hidden xl:block w-80 p-6 sticky top-16 h-[calc(100vh-64px)]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-500 text-sm">SUGGESTED TRAVELERS</h3>
                    <button className="text-xs font-bold text-emerald-600">See All</button>
                </div>
                <div className="space-y-4">
                    {[
                        { name: 'Tokyo Drifter', loc: 'Tokyo, Japan', img: 'https://i.pravatar.cc/150?u=8' },
                        { name: 'Bali Babe', loc: 'Ubud, Bali', img: 'https://i.pravatar.cc/150?u=9' },
                        { name: 'Nomad Nick', loc: 'Lisbon, Portugal', img: 'https://i.pravatar.cc/150?u=10' },
                    ].map((u, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src={u.img} className="w-10 h-10 rounded-full bg-gray-200" alt={u.name} />
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{u.name}</p>
                                    <p className="text-xs text-gray-500">{u.loc}</p>
                                </div>
                            </div>
                            <button className="text-xs font-bold text-emerald-500 hover:text-emerald-700">Follow</button>
                        </div>
                    ))}
                </div>
                
                <div className="mt-8">
                     <h3 className="font-bold text-gray-500 text-sm mb-4">TRENDING DESTINATIONS</h3>
                     <div className="grid grid-cols-2 gap-2">
                         <div className="relative rounded-lg overflow-hidden h-24 group cursor-pointer">
                             <img src="https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=200&q=80" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                             <span className="absolute bottom-1 left-2 text-white text-xs font-bold">Thailand</span>
                         </div>
                         <div className="relative rounded-lg overflow-hidden h-24 group cursor-pointer">
                             <img src="https://images.unsplash.com/photo-1512453979798-5ea932a2351d?auto=format&fit=crop&w=200&q=80" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                             <span className="absolute bottom-1 left-2 text-white text-xs font-bold">Dubai</span>
                         </div>
                     </div>
                </div>
            </aside>

            {/* MOBILE BOTTOM NAV */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between z-50">
                <button onClick={() => setActiveTab('feed')} className={`${activeTab === 'feed' ? 'text-emerald-600' : 'text-gray-400'}`}><Compass /></button>
                <button onClick={() => setActiveTab('chat')} className={`${activeTab === 'chat' ? 'text-emerald-600' : 'text-gray-400'}`}><MessageCircle /></button>
                <button onClick={() => setActiveTab('profile')} className={`${activeTab === 'profile' ? 'text-emerald-600' : 'text-gray-400'}`}><Users /></button>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

const FeedView = ({ posts, toggleLike }: any) => {
    return (
        <div className="p-4 md:p-8 space-y-8 pb-20">
            {/* STORIES */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                <div className="flex flex-col items-center space-y-1 cursor-pointer">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                        <PlusCircle className="text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-500">Add Story</span>
                </div>
                {STORIES.map(story => (
                    <div key={story.id} className="flex flex-col items-center space-y-1 cursor-pointer">
                        <div className={`w-16 h-16 rounded-full p-[2px] ${story.active ? 'bg-gradient-to-tr from-yellow-400 to-fuchsia-600' : 'bg-gray-200'}`}>
                            <img src={story.img} className="w-full h-full rounded-full border-2 border-white object-cover" alt="story" />
                        </div>
                        <span className="text-xs text-gray-600">{story.user}</span>
                    </div>
                ))}
            </div>

            {/* FEED POSTS */}
            <div className="space-y-6 max-w-2xl mx-auto">
                {posts.map((post: any) => (
                    <div key={post.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src={post.user.avatar} className="w-10 h-10 rounded-full object-cover" alt="avatar" />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{post.user.name}</h4>
                                    <div className="flex items-center text-xs text-gray-500">
                                        <MapPin className="w-3 h-3 mr-1" /> {post.location}
                                    </div>
                                </div>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal /></button>
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
                            
                            <div className="font-bold text-sm mb-2">{post.likes.toLocaleString()} likes</div>
                            
                            <div className="mb-2">
                                <span className="font-bold text-sm mr-2">{post.user.handle}</span>
                                <span className="text-sm text-gray-700 leading-relaxed">{post.caption}</span>
                            </div>

                            <button className="text-gray-400 text-sm mb-2">View all {post.comments} comments</button>
                            <div className="text-[10px] text-gray-400 uppercase tracking-wide">{post.time}</div>
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

    const handleSave = () => {
        setUser(editForm);
        setIsEditing(false);
    };

    return (
        <div className="p-4 md:p-8 pb-20">
            {/* PROFILE HEADER */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
                <div className="relative group">
                    <img src={user.avatar} className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-lg object-cover" alt="profile" />
                    {isEditing && (
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer">
                            <Camera className="text-white w-8 h-8" />
                        </div>
                    )}
                </div>

                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                        {isEditing ? (
                            <input 
                                className="text-2xl font-bold bg-gray-100 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-500" 
                                value={editForm.name} 
                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            />
                        ) : (
                            <h2 className="text-2xl font-light text-gray-900">{user.name}</h2>
                        )}
                        
                        {!isEditing ? (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2"
                                >
                                    <Settings className="w-4 h-4" /> Edit Profile
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={handleSave} className="bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold">Save</button>
                                <button onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-semibold">Cancel</button>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center md:justify-start gap-8 mb-5">
                        <div className="text-center md:text-left"><span className="font-bold block text-lg">{user.posts.length}</span> <span className="text-gray-500 text-sm">posts</span></div>
                        <div className="text-center md:text-left"><span className="font-bold block text-lg">{user.followers}</span> <span className="text-gray-500 text-sm">followers</span></div>
                        <div className="text-center md:text-left"><span className="font-bold block text-lg">{user.following}</span> <span className="text-gray-500 text-sm">following</span></div>
                    </div>

                    <div className="space-y-1">
                        <div className="font-bold text-gray-900">{user.handle}</div>
                        {isEditing ? (
                            <textarea 
                                className="w-full bg-gray-100 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                                value={editForm.bio}
                                onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                                rows={2}
                            />
                        ) : (
                            <div className="text-gray-700 text-sm whitespace-pre-wrap">{user.bio}</div>
                        )}
                        {user.location && (
                             <div className="text-gray-500 text-xs font-medium flex items-center justify-center md:justify-start pt-1">
                                <MapPin className="w-3 h-3 mr-1" /> {user.location}
                             </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CONTENT TABS */}
            <div className="border-t border-gray-200 mb-6">
                <div className="flex justify-center gap-12">
                    <button className="flex items-center gap-2 border-t border-gray-900 py-4 text-xs font-bold tracking-widest text-gray-900">
                        <Grid className="w-4 h-4" /> POSTS
                    </button>
                    <button className="flex items-center gap-2 border-t border-transparent py-4 text-xs font-bold tracking-widest text-gray-400 hover:text-gray-600">
                        <Plane className="w-4 h-4" /> TRIPS
                    </button>
                    <button className="flex items-center gap-2 border-t border-transparent py-4 text-xs font-bold tracking-widest text-gray-400 hover:text-gray-600">
                        <Bookmark className="w-4 h-4" /> SAVED
                    </button>
                </div>
            </div>

            {/* PHOTO GRID */}
            <div className="grid grid-cols-3 gap-1 md:gap-4">
                {user.posts.map((img: string, i: number) => (
                    <div key={i} className="aspect-square relative group cursor-pointer overflow-hidden bg-gray-100">
                        <img src={img} className="w-full h-full object-cover" alt="post" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1 text-white font-bold">
                                <Heart className="w-5 h-5 fill-white" /> 124
                            </div>
                        </div>
                    </div>
                ))}
                {/* Add New Placeholder */}
                <div className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-colors">
                    <PlusCircle className="w-8 h-8 mb-2" />
                    <span className="text-xs font-bold">Add Post</span>
                </div>
            </div>
        </div>
    );
};

const ChatView = () => {
    const [selectedChat, setSelectedChat] = useState<number | null>(null);
    const [msgInput, setMsgInput] = useState('');
    const [chatHistory, setChatHistory] = useState<{id: number, text: string, sender: 'me' | 'them'}[]>([
        { id: 1, text: "Hey! Are you excited for the trip?", sender: 'them' },
        { id: 2, text: "Absolutely! I just finished packing.", sender: 'me' },
    ]);

    const handleSend = () => {
        if(!msgInput.trim()) return;
        setChatHistory([...chatHistory, { id: Date.now(), text: msgInput, sender: 'me' }]);
        setMsgInput('');
    };

    const activeChatData = CHATS.find(c => c.id === selectedChat);

    return (
        <div className="h-[calc(100vh-80px)] md:h-screen flex bg-white md:border-l border-gray-200">
            {/* Chat List */}
            <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-gray-200`}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="font-bold text-lg">Messages</div>
                    <button className="text-emerald-600"><Edit3 className="w-5 h-5" /></button>
                </div>
                
                {/* Search */}
                <div className="p-3">
                    <div className="bg-gray-100 rounded-lg flex items-center px-3 py-2">
                        <Search className="w-4 h-4 text-gray-400 mr-2" />
                        <input type="text" placeholder="Search chats..." className="bg-transparent outline-none text-sm w-full" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {CHATS.map(chat => (
                        <div 
                            key={chat.id} 
                            onClick={() => setSelectedChat(chat.id)}
                            className={`flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedChat === chat.id ? 'bg-emerald-50' : ''}`}
                        >
                            <div className="relative">
                                <img src={chat.avatar} className="w-12 h-12 rounded-full object-cover" alt="avatar" />
                                {chat.isGroup && (
                                    <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full">
                                        <div className="bg-indigo-500 rounded-full p-1">
                                            <Users className="w-2 h-2 text-white" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h4 className={`font-semibold text-sm truncate ${chat.unread > 0 ? 'text-gray-900' : 'text-gray-700'}`}>{chat.name}</h4>
                                    <span className="text-[10px] text-gray-400">{chat.time}</span>
                                </div>
                                <p className={`text-xs truncate ${chat.unread > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>{chat.lastMsg}</p>
                            </div>
                            {chat.unread > 0 && <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Window */}
            {selectedChat ? (
                <div className="flex-1 flex flex-col h-full">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button className="md:hidden" onClick={() => setSelectedChat(null)}>
                                <div className="text-2xl mr-2">‹</div>
                            </button>
                            <img src={activeChatData?.avatar} className="w-10 h-10 rounded-full object-cover" alt="avatar" />
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">{activeChatData?.name}</h4>
                                <span className="text-xs text-green-500 flex items-center gap-1">● Active now</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link 
                                to="/create-trip" 
                                className="hidden sm:flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                                <Plane className="w-3.5 h-3.5" />
                                Plan Trip
                            </Link>
                            <div className="flex gap-4 text-gray-400 sm:border-l sm:border-gray-200 sm:pl-3">
                                <Phone className="w-5 h-5 cursor-pointer hover:text-gray-600" />
                                <Video className="w-5 h-5 cursor-pointer hover:text-gray-600" />
                                <Users className="w-5 h-5 cursor-pointer hover:text-gray-600" />
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {/* Invitation Prompt Simulation */}
                        {activeChatData?.isGroup && (
                            <div className="flex justify-center my-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center max-w-xs">
                                    <Plane className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                    <h5 className="font-bold text-gray-800 mb-1">Trip to Himalayas</h5>
                                    <p className="text-xs text-gray-500 mb-3">5 members • Oct 24 - Oct 30</p>
                                    <button className="w-full bg-emerald-50 text-emerald-600 font-bold text-xs py-2 rounded-lg hover:bg-emerald-100">View Itinerary</button>
                                </div>
                            </div>
                        )}

                        {chatHistory.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                                    msg.sender === 'me' 
                                    ? 'bg-emerald-500 text-white rounded-br-none' 
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
                        <button className="text-gray-400 hover:text-gray-600"><PlusCircle /></button>
                        <button className="text-gray-400 hover:text-gray-600"><ImageIcon /></button>
                        <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center">
                            <input 
                                type="text" 
                                className="bg-transparent flex-1 outline-none text-sm" 
                                placeholder="Message..."
                                value={msgInput}
                                onChange={(e) => setMsgInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button className="text-gray-400 hover:text-emerald-500"><Smile className="w-5 h-5" /></button>
                        </div>
                        {msgInput.trim() ? (
                            <button onClick={handleSend} className="text-emerald-500 hover:text-emerald-600 font-bold text-sm">Send</button>
                        ) : (
                            <button className="text-gray-400"><Heart className="w-6 h-6" /></button>
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
                         <button className="bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-emerald-600 transition-colors">
                             Send Message
                         </button>
                         <Link to="/create-trip" className="bg-white border border-gray-300 text-gray-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors">
                             Plan a Trip
                         </Link>
                    </div>
                </div>
            )}
        </div>
    );
}