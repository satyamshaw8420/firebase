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

const TRAVEL_GROUPS = [
    { id: 1, name: 'Adventure Seekers', members: 1240, image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&q=80&w=150', description: 'For thrill seekers and adrenaline junkies' },
    { id: 2, name: 'Budget Backpackers', members: 3560, image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&q=80&w=150', description: 'Tips and tricks for traveling on a shoestring' },
    { id: 3, name: 'Luxury Travelers', members: 890, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=150', description: 'Premium experiences and luxury destinations' },
    { id: 4, name: 'Solo Female Travelers', members: 2100, image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=150', description: 'Safe travels and female-friendly destinations' },
];

const UPCOMING_EVENTS = [
    { id: 1, title: 'Virtual Tokyo Walking Tour', date: 'Oct 25, 2023', time: '6:00 PM IST', attendees: 42, type: 'virtual' },
    { id: 2, name: 'Mumbai Foodie Meetup', date: 'Oct 28, 2023', time: '7:00 PM IST', attendees: 18, type: 'in-person' },
    { id: 3, title: 'Photography Workshop: Capturing Landscapes', date: 'Nov 2, 2023', time: '5:00 PM IST', attendees: 35, type: 'webinar' },
];

const TRAVEL_TIPS = [
    { id: 1, title: '10 Essential Items for Monsoon Travel', author: 'TravelPro', likes: 245, comments: 32 },
    { id: 2, title: 'How to Find Cheap Flights: Insider Secrets', author: 'BudgetExpert', likes: 512, comments: 67 },
    { id: 3, title: 'Staying Safe While Traveling Solo', author: 'SafetyFirst', likes: 387, comments: 41 },
];

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
                                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
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
                            Create Group
                        </Link>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 max-w-3xl mx-auto w-full px-2">
                {activeTab === 'feed' && <FeedView posts={posts} toggleLike={toggleLike} />}
                {activeTab === 'profile' && <ProfileView user={user} setUser={setUser} />}
                {activeTab === 'chat' && <ChatView />}
            </main>

            {/* RIGHT SIDEBAR (Suggestions) - Hidden on Mobile */}
            <aside className="hidden xl:block w-72 p-4 sticky top-16 h-[calc(100vh-64px)]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-500 text-sm">SUGGESTED TRAVELERS</h3>
                    <button className="text-xs font-bold text-emerald-600">See All</button>
                </div>
                <div className="space-y-3">
                    {[
                        { name: 'Tokyo Drifter', loc: 'Tokyo, Japan', img: 'https://i.pravatar.cc/150?u=8' },
                        { name: 'Bali Babe', loc: 'Ubud, Bali', img: 'https://i.pravatar.cc/150?u=9' },
                        { name: 'Nomad Nick', loc: 'Lisbon, Portugal', img: 'https://i.pravatar.cc/150?u=10' },
                    ].map((u, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <img src={u.img} className="w-8 h-8 rounded-full bg-gray-200" alt={u.name} />
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
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-500 text-sm">TRAVEL GROUPS</h3>
                        <button className="text-xs font-bold text-emerald-600">See All</button>
                    </div>
                    <div className="space-y-2">
                        {TRAVEL_GROUPS.map(group => (
                            <div key={group.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <img src={group.image} className="w-10 h-10 rounded-lg object-cover" alt={group.name} />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-gray-900 truncate">{group.name}</h4>
                                    <p className="text-xs text-gray-500 truncate">{group.description}</p>
                                    <div className="flex items-center text-xs text-gray-400 mt-1">
                                        <Users className="w-3 h-3 mr-1" />
                                        {group.members.toLocaleString()} members
                                    </div>
                                </div>
                                <button className="text-emerald-500 hover:text-emerald-600 text-xs font-bold">
                                    Join
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                                
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-500 text-sm">LOCAL GUIDES</h3>
                        <button className="text-xs font-bold text-emerald-600">See All</button>
                    </div>
                    <div className="space-y-2">
                        {[
                            { id: 1, name: 'Kenji Tanaka', location: 'Tokyo, Japan', rating: 4.9, reviews: 124, image: 'https://i.pravatar.cc/150?u=11' },
                            { id: 2, name: 'Maria Santos', location: 'Lisbon, Portugal', rating: 4.8, reviews: 89, image: 'https://i.pravatar.cc/150?u=12' },
                            { id: 3, name: 'Ahmed Hassan', location: 'Cairo, Egypt', rating: 4.9, reviews: 156, image: 'https://i.pravatar.cc/150?u=13' },
                        ].map(guide => (
                            <div key={guide.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <img src={guide.image} className="w-10 h-10 rounded-full object-cover" alt={guide.name} />
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
                                
                <div className="mt-6">
                     <h3 className="font-bold text-gray-500 text-sm mb-3">TRENDING DESTINATIONS</h3>
                     <div className="grid grid-cols-2 gap-2">
                         <div className="relative rounded-lg overflow-hidden h-20 group cursor-pointer">
                             <img src="https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=200&q=80" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                             <span className="absolute bottom-1 left-2 text-white text-xs font-bold">Thailand</span>
                         </div>
                         <div className="relative rounded-lg overflow-hidden h-20 group cursor-pointer">
                             <img src="https://images.unsplash.com/photo-1512453979798-5ea932a2351d?auto=format&fit=crop&w=200&q=80" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                             <span className="absolute bottom-1 left-2 text-white text-xs font-bold">Dubai</span>
                         </div>
                     </div>
                </div>
            </aside>

            {/* MOBILE BOTTOM NAV */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2.5 flex justify-between z-50">
                <button onClick={() => setActiveTab('feed')} className={`${activeTab === 'feed' ? 'text-emerald-600' : 'text-gray-400'}`}><Compass className="w-5 h-5" /></button>
                <button onClick={() => setActiveTab('chat')} className={`${activeTab === 'chat' ? 'text-emerald-600' : 'text-gray-400'}`}><MessageCircle className="w-5 h-5" /></button>
                <button onClick={() => setActiveTab('profile')} className={`${activeTab === 'profile' ? 'text-emerald-600' : 'text-gray-400'}`}><Users className="w-5 h-5" /></button>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

const FeedView = ({ posts, toggleLike }: any) => {
    return (
        <div className="p-3 md:p-6 space-y-6 pb-20">
            {/* STORIES */}
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
                <div className="flex flex-col items-center space-y-1 cursor-pointer">
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                        <PlusCircle className="text-gray-400 w-5 h-5" />
                    </div>
                    <span className="text-xs text-gray-500">Add</span>
                </div>
                {STORIES.map(story => (
                    <div key={story.id} className="flex flex-col items-center space-y-1 cursor-pointer">
                        <div className={`w-14 h-14 rounded-full p-[2px] ${story.active ? 'bg-gradient-to-tr from-yellow-400 to-fuchsia-600' : 'bg-gray-200'}`}>
                            <img src={story.img} className="w-full h-full rounded-full border-2 border-white object-cover" alt="story" />
                        </div>
                        <span className="text-xs text-gray-600 truncate w-14 text-center">{story.user}</span>
                    </div>
                ))}
            </div>

            {/* Upcoming Events Banner */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white mb-6">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-bold text-lg mb-1">Upcoming Events</h3>
                        <p className="text-indigo-100 text-sm">Connect with fellow travelers</p>
                    </div>
                    <button className="text-white text-xs font-bold bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors">
                        See All
                    </button>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {UPCOMING_EVENTS.map(event => (
                        <div key={event.id} className="flex-shrink-0 w-56 bg-white/10 rounded-lg p-2.5">
                            <div className="flex justify-between items-start mb-1.5">
                                <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full capitalize">
                                    {event.type}
                                </span>
                                <div className="flex items-center text-white/80 text-[10px]">
                                    <Users className="w-2.5 h-2.5 mr-1" />
                                    {event.attendees}
                                </div>
                            </div>
                            <h4 className="font-bold text-xs mb-1">{event.title || event.name}</h4>
                            <div className="text-[10px] text-indigo-100 space-y-1">
                                <div>{event.date}</div>
                                <div>{event.time}</div>
                            </div>
                            <button className="mt-1.5 w-full bg-white text-indigo-600 text-[10px] font-bold py-1 rounded-md hover:bg-indigo-50 transition-colors">
                                Join
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Travel Tips Section */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-900 text-sm">Travel Tips & Advice</h3>
                    <button className="text-emerald-500 text-xs font-bold">See All</button>
                </div>
                
                <div className="space-y-3">
                    {TRAVEL_TIPS.map(tip => (
                        <div key={tip.id} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                            <h4 className="font-bold text-gray-900 text-sm mb-1">{tip.title}</h4>
                            <div className="flex items-center text-[10px] text-gray-500 mb-1.5">
                                <span>by {tip.author}</span>
                            </div>
                            <div className="flex items-center text-[10px] text-gray-500">
                                <div className="flex items-center mr-3">
                                    <Heart className="w-2.5 h-2.5 mr-1" />
                                    {tip.likes}
                                </div>
                                <div className="flex items-center">
                                    <MessageCircle className="w-2.5 h-2.5 mr-1" />
                                    {tip.comments}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* FEED POSTS */}
            <div className="space-y-5 max-w-2xl mx-auto">
                {posts.map((post: any) => (
                    <div key={post.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <img src={post.user.avatar} className="w-9 h-9 rounded-full object-cover" alt="avatar" />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{post.user.name}</h4>
                                    <div className="flex items-center text-xs text-gray-500">
                                        <MapPin className="w-3 h-3 mr-1" /> {post.location}
                                    </div>
                                </div>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button>
                        </div>

                        {/* Image */}
                        <div className="relative aspect-[4/3] bg-gray-100">
                            <img src={post.image} className="w-full h-full object-cover" alt="post" />
                        </div>

                        {/* Action Bar */}
                        <div className="p-3">
                            <div className="flex items-center justify-between mb-2.5">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => toggleLike(post.id)}
                                        className={`transition-transform active:scale-110 ${post.isLiked ? 'text-rose-500 fill-rose-500' : 'text-gray-600 hover:text-rose-500'}`}
                                    >
                                        <Heart className="w-6 h-6" />
                                    </button>
                                    <button className="text-gray-600 hover:text-blue-500">
                                        <MessageCircle className="w-6 h-6" />
                                    </button>
                                    <button className="text-gray-600 hover:text-emerald-500">
                                        <Share2 className="w-6 h-6" />
                                    </button>
                                </div>
                                <button className="text-gray-600 hover:text-gray-900">
                                    <Bookmark className="w-5 h-5" />
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
        <div className="p-3 md:p-6 pb-20">
            {/* PROFILE HEADER */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                <div className="relative group">
                    <img src={user.avatar} className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white shadow-lg object-cover" alt="profile" />
                    {isEditing && (
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer">
                            <Camera className="text-white w-7 h-7" />
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

                    <div className="flex justify-center md:justify-start gap-6 mb-4">
                        <div className="text-center md:text-left"><span className="font-bold block text-base">{user.posts.length}</span> <span className="text-gray-500 text-xs">posts</span></div>
                        <div className="text-center md:text-left"><span className="font-bold block text-base">{user.followers}</span> <span className="text-gray-500 text-xs">followers</span></div>
                        <div className="text-center md:text-left"><span className="font-bold block text-base">{user.following}</span> <span className="text-gray-500 text-xs">following</span></div>
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

            {/* Travel Resources Hub */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900">Travel Resources Hub</h3>
                    <button className="text-emerald-500 text-sm font-bold">See All</button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-colors">
                        <div className="text-emerald-600 mb-2">📋</div>
                        <div className="font-bold text-sm text-gray-900 mb-1">Packing Lists</div>
                        <div className="text-xs text-gray-500">Customizable templates</div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors">
                        <div className="text-amber-600 mb-2">🛂</div>
                        <div className="font-bold text-sm text-gray-900 mb-1">Visa Guides</div>
                        <div className="text-xs text-gray-500">Country requirements</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors">
                        <div className="text-blue-600 mb-2">💱</div>
                        <div className="font-bold text-sm text-gray-900 mb-1">Currency Tips</div>
                        <div className="text-xs text-gray-500">Exchange rates & tips</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors">
                        <div className="text-purple-600 mb-2">🚑</div>
                        <div className="font-bold text-sm text-gray-900 mb-1">Emergency Info</div>
                        <div className="text-xs text-gray-500">Contacts & procedures</div>
                    </div>
                </div>
            </div>
            
            {/* Travel Challenges */}
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white mb-6">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-bold text-lg mb-1">Travel Challenges</h3>
                        <p className="text-amber-100 text-sm">Complete challenges to earn badges</p>
                    </div>
                    <button className="text-white text-xs font-bold bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors">
                        View All
                    </button>
                </div>
                
                <div className="flex gap-3">
                    <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
                        <div className="text-2xl mb-1">🏆</div>
                        <div className="text-xs font-bold mb-1">October Challenge</div>
                        <div className="text-[10px] text-amber-100 mb-2">Post 5 photos</div>
                        <div className="w-full bg-white/20 rounded-full h-1.5">
                            <div className="bg-white h-1.5 rounded-full" style={{width: '60%'}}></div>
                        </div>
                        <div className="text-[10px] mt-1">3/5 completed</div>
                    </div>
                    <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
                        <div className="text-2xl mb-1">📸</div>
                        <div className="text-xs font-bold mb-1">Photo Pro</div>
                        <div className="text-[10px] text-amber-100 mb-2">100 likes</div>
                        <div className="w-full bg-white/20 rounded-full h-1.5">
                            <div className="bg-white h-1.5 rounded-full" style={{width: '25%'}}></div>
                        </div>
                        <div className="text-[10px] mt-1">25/100</div>
                    </div>
                </div>
            </div>
            
            {/* PHOTO GRID */}
            <div className="grid grid-cols-3 gap-1 md:gap-3">
                {user.posts.map((img: string, i: number) => (
                    <div key={i} className="aspect-square relative group cursor-pointer overflow-hidden bg-gray-100">
                        <img src={img} className="w-full h-full object-cover" alt="post" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1 text-white font-bold">
                                <Heart className="w-4 h-4 fill-white" /> 124
                            </div>
                        </div>
                    </div>
                ))}
                {/* Add New Placeholder */}
                <div className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-colors">
                    <PlusCircle className="w-6 h-6 mb-1" />
                    <span className="text-xs font-bold">Add</span>
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
            <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 border-r border-gray-200`}>
                <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                    <div className="font-bold text-base">Messages</div>
                    <button className="text-emerald-600"><Edit3 className="w-4 h-4" /></button>
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
                            className={`flex items-center gap-2.5 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${selectedChat === chat.id ? 'bg-emerald-50' : ''}`}
                        >
                            <div className="relative">
                                <img src={chat.avatar} className="w-10 h-10 rounded-full object-cover" alt="avatar" />
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
                    <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <button className="md:hidden" onClick={() => setSelectedChat(null)}>
                                <div className="text-xl mr-1.5">‹</div>
                            </button>
                            <img src={activeChatData?.avatar} className="w-9 h-9 rounded-full object-cover" alt="avatar" />
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">{activeChatData?.name}</h4>
                                <span className="text-xs text-green-500 flex items-center gap-1">● Active now</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <Link 
                                to="/create-trip" 
                                className="hidden sm:flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-1 rounded-md text-[10px] font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                                <Plane className="w-3 h-3" />
                                Plan
                            </Link>
                            <div className="flex gap-3 text-gray-400 sm:border-l sm:border-gray-200 sm:pl-2.5">
                                <Phone className="w-4 h-4 cursor-pointer hover:text-gray-600" />
                                <Video className="w-4 h-4 cursor-pointer hover:text-gray-600" />
                                <Users className="w-4 h-4 cursor-pointer hover:text-gray-600" />
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {/* Travel Deals Banner */}
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-sm mb-1">Exclusive Deal for You!</h3>
                                    <p className="text-emerald-100 text-xs">Special offer for community members</p>
                                </div>
                                <button className="text-white text-[10px] font-bold bg-white/20 px-2 py-1 rounded-full hover:bg-white/30 transition-colors">
                                    X
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-white/20 rounded-lg p-2">
                                    <Plane className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="font-bold text-sm">20% Off Flights to Thailand</div>
                                    <div className="text-[10px] text-emerald-100">Valid until Oct 31, 2023</div>
                                </div>
                            </div>
                            
                            <button className="w-full bg-white text-emerald-600 text-xs font-bold py-1.5 rounded-lg hover:bg-emerald-50 transition-colors">
                                Claim Offer
                            </button>
                        </div>
                        
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
                    <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2.5">
                        <button className="text-gray-400 hover:text-gray-600"><PlusCircle className="w-5 h-5" /></button>
                        <button className="text-gray-400 hover:text-gray-600"><ImageIcon className="w-5 h-5" /></button>
                        <div className="flex-1 bg-gray-100 rounded-full px-3 py-1.5 flex items-center">
                            <input 
                                type="text" 
                                className="bg-transparent flex-1 outline-none text-sm" 
                                placeholder="Message..."
                                value={msgInput}
                                onChange={(e) => setMsgInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button className="text-gray-400 hover:text-emerald-500"><Smile className="w-4 h-4" /></button>
                        </div>
                        {msgInput.trim() ? (
                            <button onClick={handleSend} className="text-emerald-500 hover:text-emerald-600 font-bold text-sm">Send</button>
                        ) : (
                            <button className="text-gray-400"><Heart className="w-5 h-5" /></button>
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