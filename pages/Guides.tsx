import React, { useState } from 'react';
import { Star, ShieldCheck, Languages, X, CheckCircle, Shield, GraduationCap, MapPin, UserCheck, MessageCircle, AlertTriangle, Briefcase, FileText, BadgeCheck } from 'lucide-react';
import { GuideProfile } from '../types';

const MOCK_GUIDES: GuideProfile[] = [
    {
        id: '1',
        name: 'Marco Rossi',
        location: 'Rome, Italy',
        expertise: ['History', 'Architecture', 'Food'],
        rating: 4.9,
        reviews: 128,
        imageUrl: 'https://i.pravatar.cc/150?u=1',
        languages: ['English', 'Italian', 'Spanish'],
        pricePerDay: 150
    },
    {
        id: '2',
        name: 'Yuki Tanaka',
        location: 'Tokyo, Japan',
        expertise: ['Culture', 'Photography', 'Nightlife'],
        rating: 5.0,
        reviews: 84,
        imageUrl: 'https://i.pravatar.cc/150?u=2',
        languages: ['English', 'Japanese'],
        pricePerDay: 200
    },
    {
        id: '3',
        name: 'Sophie Martin',
        location: 'Paris, France',
        expertise: ['Art', 'Fashion', 'Wine'],
        rating: 4.8,
        reviews: 210,
        imageUrl: 'https://i.pravatar.cc/150?u=3',
        languages: ['English', 'French', 'German'],
        pricePerDay: 180
    }
];

const Guides: React.FC = () => {
    const [showApplyModal, setShowApplyModal] = useState(false);

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Meet Local Experts</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">Book verified local guides for authentic experiences you won't find in guidebooks.</p>
                
                <div 
                    className="mt-8 inline-block bg-emerald-50 border border-emerald-100 rounded-lg p-4 cursor-pointer hover:bg-emerald-100 transition-colors group"
                    onClick={() => setShowApplyModal(true)}
                >
                    <p className="text-sm text-emerald-800 font-medium flex items-center gap-2">
                        <Briefcase className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Want to become a guide? <span className="underline font-bold">Click here to apply</span> and join our verified expert program.
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {MOCK_GUIDES.map(guide => (
                    <div key={guide.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group">
                        <div className="p-6 flex items-start gap-4">
                            <img src={guide.imageUrl} alt={guide.name} className="w-20 h-20 rounded-full border-2 border-emerald-100 object-cover" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-1">
                                    {guide.name} <ShieldCheck className="w-4 h-4 text-emerald-500" fill="currentColor" />
                                </h3>
                                <p className="text-gray-500 text-sm mb-1">{guide.location}</p>
                                <div className="flex items-center text-amber-400 text-sm font-bold">
                                    <Star className="w-4 h-4 mr-1" fill="currentColor" /> {guide.rating} 
                                    <span className="text-gray-400 font-normal ml-1">({guide.reviews} reviews)</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="px-6 pb-4">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {guide.expertise.map(exp => (
                                    <span key={exp} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">{exp}</span>
                                ))}
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                                <Languages className="w-4 h-4" />
                                {guide.languages.join(', ')}
                            </div>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <div>
                                    <span className="block text-xs text-gray-500">Starting from</span>
                                    <span className="text-lg font-bold text-emerald-600">${guide.pricePerDay}<span className="text-sm font-normal text-gray-500">/day</span></span>
                                </div>
                                <button className="bg-gray-900 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-medium transition-colors">
                                    Book Now
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Guide Application Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative flex flex-col">
                        
                        {/* Header */}
                        <div className="sticky top-0 bg-white z-10 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    Become a TravelEase Guide <BadgeCheck className="text-emerald-500" />
                                </h2>
                                <p className="text-gray-500">Join our elite community of local experts. Review the mandatory requirements below.</p>
                            </div>
                            <button 
                                onClick={() => setShowApplyModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-8">
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Rule 1: Age */}
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                            <UserCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-1">1. Age Requirement</h3>
                                            <p className="text-sm text-gray-600">Minimum age: <strong>18 years or above</strong>. Ensures legal responsibility.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Rule 2: Location Expertise */}
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-1">2. Location Expertise</h3>
                                            <p className="text-sm text-gray-600">Must be a <strong>Local Expert</strong>. Deep knowledge of history, culture, hidden gems, and transport.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Rule 3: KYC */}
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-1">3. ID Verification (KYC)</h3>
                                            <p className="text-sm text-gray-600">Mandatory Aadhaar/Passport/Voter ID & Address proof. No KYC = No Account.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Rule 4: Police Verification */}
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-red-100 p-2 rounded-lg text-red-600">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-1">4. Police Verification</h3>
                                            <p className="text-sm text-gray-600">Highly Recommended. Clean background badge earns higher ranking & trust.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Rule 5: Communication */}
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-teal-100 p-2 rounded-lg text-teal-600">
                                            <MessageCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-1">5. Communication Skills</h3>
                                            <p className="text-sm text-gray-600">Basic English, Hindi, and Regional language required for tourist safety.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Rule 6: Behavior */}
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600">
                                            <AlertTriangle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-1">6. Professional Behavior</h3>
                                            <p className="text-sm text-gray-600">Zero tolerance for scams, forced shopping, or overcharging. Violation = Termination.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Rule 7: Experience */}
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                                            <Star className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-1">7. Experience (Optional)</h3>
                                            <p className="text-sm text-gray-600">Experience is a plus, but beginners are welcome! We provide training to uplift you.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Rule 8: Training */}
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                                            <GraduationCap className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-1">8. Mandatory Training</h3>
                                            <p className="text-sm text-gray-600">Complete online training (Safety, Protocol) to get the "TravelEase Certified Guide" Badge.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-3xl">
                             <button 
                                onClick={() => setShowApplyModal(false)}
                                className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                className="px-8 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-colors flex items-center gap-2"
                                onClick={() => alert("Application process starting... (Demo)")}
                            >
                                I Agree & Start Application
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default Guides;