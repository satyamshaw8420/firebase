import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { ChevronDown, Search, HelpCircle } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const { useLocation, useNavigate } = ReactRouterDOM;

const FAQ: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const controls = useAnimation();

  // Initialize animation on component mount
  useEffect(() => {
    controls.start({ x: 0, opacity: 1, transition: { duration: 0.5 } });
  }, [controls]);

  // Reset animation when search term, category, or location changes
  useEffect(() => {
    controls.set({ x: -50, opacity: 0 });
    // Clear refs when search term, category, or location changes
    faqRefs.current = [];
    
    // Also trigger initial animation for all items
    setTimeout(() => {
      controls.start({
        x: 0,
        opacity: 1,
        transition: { duration: 0.5 }
      });
    }, 50);
  }, [searchTerm, selectedCategory, location, controls]);
  const faqRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const faqData: FAQItem[] = [
    {
      id: 1,
      question: "How does the AI create personalized itineraries?",
      answer: "Our advanced AI analyzes your preferences, travel dates, budget, and interests to craft a unique day-by-day plan with activities, dining options, and transportation suggestions tailored specifically to you. We combine machine learning with expert travel knowledge to ensure your itinerary is both exciting and practical.",
      category: "Planning"
    },
    {

      id: 2,
      question: "Can I modify my itinerary after it's generated?",
      answer: "Absolutely! Your itinerary is completely customizable. You can add or remove activities, adjust timings, swap restaurants, or completely redesign any day. Our platform makes it easy to drag and drop elements to suit your changing preferences.",
      category: "Customization"
    },
    {
      id: 3,
      question: "How do you ensure the quality of local guides?",
      answer: "All our guides go through a rigorous verification process including background checks, skill assessments, and customer reviews. We continuously monitor their performance and only maintain partnerships with guides who consistently receive high ratings from our travelers.",
      category: "Guides"
    },
    {
      id: 4,
      question: "What happens if I need to cancel my trip?",
      answer: "Our flexible cancellation policy allows you to cancel up to 48 hours before your trip for a full refund. For last-minute cancellations, we offer partial refunds or the option to reschedule. Premium members enjoy even more flexible cancellation terms.",
      category: "Booking"
    },
    {
      id: 5,
      question: "How does the group travel feature work?",
      answer: "Our Group Prep feature connects you with verified travelers heading to the same destination. You can collaborate on itineraries, split costs, and communicate through our secure group chat. We match people based on interests, budget, and travel style to ensure compatible groups.",
      category: "Community"
    },
    {
      id: 6,
      question: "Is my personal and payment information secure?",
      answer: "Yes, we use industry-standard encryption for all personal and payment information. We comply with GDPR and other privacy regulations. Your data is stored securely with Firebase, Google's trusted cloud platform, and is never shared with third parties without your explicit consent. Firebase Authentication provides enterprise-grade security for your account.",
      category: "Security"
    },
    {
      id: 7,
      question: "Can I access my itinerary offline?",
      answer: "Yes, our upcoming Offline Mode feature allows you to download your itineraries for offline access. This is particularly useful when traveling in areas with limited connectivity. All your plans, maps, and notes will be available without an internet connection.",
      category: "Features"
    },
    {
      id: 8,
      question: "How accurate are the cost estimates?",
      answer: "Our cost estimates are based on real-time data from local providers and historical pricing trends. While we strive for accuracy, prices can fluctuate due to seasonality, availability, and currency exchange rates. We recommend treating our estimates as a reliable baseline and checking final prices before booking.",
      category: "Pricing"
    },  
    {
      id: 9,
      question: "Does my data is secure?",
      answer: "Since we use Firebase Authentication, your data is secure. Your data is stored securely with Firebase, Google's trusted cloud platform, and is never shared with third parties without your explicit consent. Firebase Authentication provides enterprise-grade security for your account.",
      category: "Security"
    }
  ];

  const toggleAccordion = (id: number) => {
    setActiveId(activeId === id ? null : id);
  };

  // Filter FAQs based on search term and selected category
  const filteredFaqs = faqData.filter(faq => {
    // Check search term
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check category
    const matchesCategory = selectedCategory === 'All' || 
      faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  


  // Animation on scroll
  useEffect(() => {
    // Clear existing refs
    faqRefs.current = [];
    
    // Also trigger initial animation for all items
    setTimeout(() => {
      controls.start({
        x: 0,
        opacity: 1,
        transition: { duration: 0.5 }
      });
    }, 50);
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            controls.start({
              x: 0,
              opacity: 1,
              transition: { duration: 0.5, delay: index * 0.1 }
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    // Use setTimeout to ensure DOM is updated before observing
    const timeoutId = setTimeout(() => {
      faqRefs.current.forEach((ref) => {
        if (ref) observer.observe(ref);
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observer) observer.disconnect();
    };
  }, [controls, location, filteredFaqs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-100 p-3 rounded-full">
              <HelpCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about TravelEase. Can't find the answer you're looking for? Contact our support team.
          </p>
        </motion.div>
      </div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10 max-w-2xl mx-auto"
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-2xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </motion.div>

        {/* FAQ Categories */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {['All', 'Planning', 'Customization', 'Guides', 'Booking', 'Community', 'Security', 'Features', 'Pricing'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 text-sm rounded-full border transition-colors ${selectedCategory === category ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white border-gray-200 text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'}`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFaqs.map((faq, index) => (
            <motion.div
              key={faq.id}
              ref={(el) => {
                if (el) {
                  faqRefs.current[index] = el;
                }
              }}
              initial={{ x: -50, opacity: 0 }}
              animate={controls}
              className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100"
            >
              <button
                className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
                onClick={() => toggleAccordion(faq.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <span className="font-bold text-sm">{faq.id}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                </div>
                <ChevronDown 
                  className={`transform transition-transform duration-300 flex-shrink-0 ${
                    activeId === faq.id ? 'rotate-180 text-emerald-600' : 'text-gray-400'
                  }`} 
                />
              </button>
              
              {activeId === faq.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-6 pb-6 pl-20 -mt-4"
                >
                  <div className="border-t border-gray-100 pt-6">
                    <p className="text-gray-600">{faq.answer}</p>
                    <div className="mt-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        {faq.category}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Still need help */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 text-center py-12 bg-white rounded-2xl shadow-md border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-2">Still have questions?</h3>
          <p className="text-gray-600 mb-6">Can't find the answer you're looking for? Please contact our support team.</p>
          <button 
            onClick={() => navigate('/contact')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-md hover:shadow-lg"
          >
            Contact Support
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;