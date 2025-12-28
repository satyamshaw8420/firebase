import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Shield, Zap, Heart, Users, Globe, Wallet, Wifi, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Taglines for the carousel
const taglines = [
  "Discover Wonders",
  "Make Moments",
  "Find Joy",
  "Grow Closer",
  "Explore Forever",
  "Share Adventures",
  "Build Connection"
];

// Background images from Unsplash corresponding to taglines
const backgroundImages = [
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop", // Discover wonders - Mountain landscape
  "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=2070&auto=format&fit=crop", // Makes Moments - European cityscape at sunset
  "https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=1974&auto=format&fit=crop", // Find joy - Person on cliff
  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=1974&auto=format&fit=crop", // Grow Closer - Couple hiking
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop", // Explore Forever - Mountain peak
  "https://images.unsplash.com/photo-1504870712357-65ea720d6078?q=80&w=2070&auto=format&fit=crop", // Share Adventures - Colorful birds in flight
  "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?q=80&w=2070&auto=format&fit=crop"  // Build Connection - Friends around fire
];

const Home: React.FC = () => {
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);
  const [backgroundImage, setBackgroundImage] = useState(backgroundImages[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      
      setTimeout(() => {
        setCurrentTaglineIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % taglines.length;
          setBackgroundImage(backgroundImages[nextIndex]);
          return nextIndex;
        });
        setIsAnimating(false);
      }, 500); // Wait for exit animation
      
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={backgroundImage}
            alt="Travel Background" 
            className={`w-full h-full object-cover transition-all duration-700 ${isAnimating ? 'scale-110 brightness-110' : 'scale-100 brightness-100'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="overflow-hidden flex flex-col items-center justify-center"
          >
            <motion.h1 variants={fadeInUp} className="text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg mb-4 flex flex-col md:block items-center">
              Travel Together, 
              <span className="inline-block ml-2 min-w-[200px] text-left">
                <AnimatePresence mode="wait">
                  <motion.span 
                    key={currentTaglineIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-emerald-400 inline-block"
                  >
                    {taglines[currentTaglineIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-gray-100 mb-8 font-light drop-shadow-md">
              AI-powered itineraries, expert guides, and unforgettable experiences planned in seconds.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/create-trip"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
              >
                Start Planning Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/destination"
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/30 px-8 py-4 rounded-full text-lg font-semibold transition-all flex items-center justify-center gap-2"
              >
                Explore Destinations <MapPin className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose TravelEase?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">We combine cutting-edge AI with local human expertise to give you the perfect trip every time.</p>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            <motion.div variants={fadeInUp} className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Planning</h3>
              <p className="text-gray-600">Get a fully personalized day-by-day itinerary in seconds based on your budget, interests, and style.</p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 text-emerald-600">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Verified Guides</h3>
              <p className="text-gray-600">Connect with local experts for food walks, photography tours, and cultural immersions. Safe and vetted.</p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-rose-100 rounded-xl flex items-center justify-center mb-6 text-rose-600">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Community First</h3>
              <p className="text-gray-600">Join a global community of travelers. Share stories, compare trips, and find hidden gems.</p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Data</h3>
              <p className="text-gray-600">Your personal information and travel data are securely stored with Firebase, ensuring privacy and peace of mind.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* New Section: Group Preparation with Strangers */}
      <section className="py-16 bg-gray-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-block px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-semibold mb-4">
                New Feature
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">
                Don't Travel Alone. <br/>
                <span className="text-emerald-400">Find Your Squad.</span>
              </h2>
              <p className="text-gray-300 text-base sm:text-lg mb-6 leading-relaxed">
                Planning a trip but your friends are busy? No problem. Our new Group Prep feature connects you with verified travelers heading to the same destination. 
                Build itineraries together, split costs, and make lifelong friends before you even pack your bags.
              </p>
              
              <ul className="space-y-3 mb-6">
                {[
                  "Match with travelers based on interests & budget",
                  "Collaborative itinerary building tools",
                  "Secure group chat & expense splitting",
                  "Verified profiles for safe connections"
                ].map((item, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + (index * 0.1) }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <Users className="w-3 h-3" />
                    </div>
                    <span className="text-gray-200 text-sm sm:text-base">{item}</span>
                  </motion.li>
                ))}
              </ul>

              <Link 
                to="/community"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full text-base font-semibold transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/30"
              >
                Find Travel Buddies <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full -z-10 transform rotate-12"></div>
              <img 
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2532&auto=format&fit=crop" 
                alt="Group of friends traveling" 
                loading="lazy"
                className="rounded-2xl shadow-2xl border border-white/10 w-full object-cover h-64 sm:h-80 md:h-[500px]"
              />
              
              {/* Floating Cards for Visual Interest */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute -bottom-4 -left-4 bg-white text-gray-900 p-3 rounded-lg shadow-xl max-w-xs hidden md:block"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-emerald-600">+4 others</span>
                </div>
                <p className="text-xs text-gray-600">"Bali Trip" group!</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How TravelEase Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Create your perfect trip in just a few simple steps with our AI-powered platform.</p>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            <motion.div variants={fadeInUp} className="p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-xl transition-shadow duration-300 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600 mx-auto">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Tell Us Your Preferences</h3>
              <p className="text-gray-600">Share your destination, travel dates, budget, interests, and travel style. Our AI uses this information to craft your perfect itinerary.</p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-xl transition-shadow duration-300 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600 mx-auto">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI Generates Your Itinerary</h3>
              <p className="text-gray-600">Our advanced AI creates a personalized day-by-day plan with activities, dining options, and transportation suggestions.</p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-xl transition-shadow duration-300 text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-6 text-rose-600 mx-auto">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Enjoy Your Trip</h3>
              <p className="text-gray-600">Save, customize, or share your itinerary. Connect with local guides and fellow travelers for an unforgettable experience.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 to-sky-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Everything you need to know about TravelEase.</p>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="space-y-6"
          >
            {[
              {
                id: 1,
                question: "How does the AI create personalized itineraries?",
                answer: "Our advanced AI analyzes your preferences, travel dates, budget, and interests to craft a unique day-by-day plan with activities, dining options, and transportation suggestions tailored specifically to you."
              },
              {
                id: 2,
                question: "Can I modify my itinerary after it's generated?",
                answer: "Absolutely! Your itinerary is completely customizable. You can add or remove activities, adjust timings, swap restaurants, or completely redesign any day."
              },
              {
                id: 3,
                question: "How do you ensure the quality of local guides?",
                answer: "All our guides go through a rigorous verification process including background checks, skill assessments, and customer reviews. We only maintain partnerships with guides who consistently receive high ratings."
              },
              {
                id: 4,
                question: "What happens if I need to cancel my trip?",
                answer: "Our flexible cancellation policy allows you to cancel up to 48 hours before your trip for a full refund. For last-minute cancellations, we offer partial refunds or the option to reschedule. Premium members enjoy even more flexible cancellation terms."
              },
              {
                id: 5,
                question: "How does the group travel feature work?",
                answer: "Our Group Prep feature connects you with verified travelers heading to the same destination. You can collaborate on itineraries, split costs, and communicate through our secure group chat. We match people based on interests, budget, and travel style to ensure compatible groups."
              },
              {
                id: 6,
                question: "Is my personal and payment information secure?",
                answer: "Yes, we use industry-standard encryption for all personal and payment information. We comply with GDPR and other privacy regulations. Your data is stored securely with Firebase and is never shared with third parties without your explicit consent."
              }
            ].map((faq) => (
              <motion.div 
                key={faq.id}
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100"
              >
                <div className="p-6 flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <span className="font-bold text-sm">{faq.id}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-12"
          >
            <Link 
              to="/faq"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/30"
            >
              View All FAQs <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Coming Soon - Premium Features */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-black text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSI+PC9yZWN0PjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSI+PC9yZWN0Pjwvc3ZnPg==')] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <div className="inline-block px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-semibold mb-6">
              COMING SOON
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Premium Features on the Horizon</h2>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg">We're constantly innovating to make your travel experience even more exceptional.</p>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {/* Feature 1 */}
            <motion.div 
              variants={fadeInUp} 
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-emerald-500/50 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Budget Tracker</h3>
              <p className="text-gray-400 text-sm mb-4">Real-time expense tracking with AI-powered spending insights and savings recommendations.</p>
              <div className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <span>Learn More</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
            
            {/* Feature 2 */}
            <motion.div 
              variants={fadeInUp} 
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-emerald-500/50 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                <Wifi className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Offline Mode</h3>
              <p className="text-gray-400 text-sm mb-4">Download itineraries for offline access when traveling without internet connectivity.</p>
              <div className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <span>Learn More</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
            
            {/* Feature 3 */}
            <motion.div 
              variants={fadeInUp} 
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-emerald-500/50 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                <Cloud className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Weather Integration</h3>
              <p className="text-gray-400 text-sm mb-4">Dynamic weather forecasts integrated into daily plans with smart activity adjustments.</p>
              <div className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <span>Learn More</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
            
            {/* Feature 4 */}
            <motion.div 
              variants={fadeInUp} 
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-emerald-500/50 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Local Event Discovery</h3>
              <p className="text-gray-400 text-sm mb-4">AI-curated local events, festivals, and activities based on your interests and location.</p>
              <div className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <span>Learn More</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-16"
          >
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">Join our newsletter to be the first to know when these features launch.</p>
            <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-full font-semibold transition-all whitespace-nowrap">
                Notify Me
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Trips Showcase
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Trip Ideas</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Get inspired by these amazing journeys crafted by our AI travel planners.</p>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {[1, 2, 3].map((item) => (
              <motion.div 
                key={item}
                variants={fadeInUp} 
                className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="h-48 bg-gradient-to-r from-blue-400 to-emerald-500 relative">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold">Mountain Adventure</h3>
                    <p className="text-sm">7 days • Moderate</p>
                  </div>
                </div>
                <div className="p-6 bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 text-sm">Swiss Alps, Switzerland</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Experience breathtaking mountain views, cozy alpine lodges, and thrilling outdoor activities.</p>
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-600 font-bold">From ₹85,000</span>
                    <button className="text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section> */}
    </div>
  );
};

export default Home;