import React, { useState, useEffect } from 'react';
import { Itinerary, TripPreferences } from '../types';
import { Wallet, MapPin, CheckCircle, Download, Users, Edit2, Save, X, Trash2, CreditCard, Check, Eye, Share2, Smartphone, Lock, AlertCircle, Phone, Mail, QrCode, Globe, ShieldCheck, Gift, ChevronRight, Copy } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface ItineraryViewProps {
  itinerary: Itinerary;
  preferences?: TripPreferences; // Needed for traveler count
  onClose: () => void;
  onSave?: (updatedItinerary: Itinerary) => void;
  onBook?: (updatedItinerary: Itinerary) => void;
  closeLabel?: string;
  isBooked?: boolean;
  readOnly?: boolean;
}

const COLORS = {
    primary: '#015F63', // Deep Teal
    secondary: '#4FC3F7', // Sky Blue
    primaryLight: '#E0F2F1',
    secondaryLight: '#E1F5FE'
};

type PaymentMethod = 'FULL' | 'EMI' | 'SPLIT' | 'WALLET';
type SubPaymentMethod = 'UPI' | 'CARD' | 'NETBANKING';

export const ItineraryView: React.FC<ItineraryViewProps> = ({ 
    itinerary, 
    preferences, 
    onClose, 
    onSave,
    onBook,
    closeLabel = "Back",
    isBooked = false,
    readOnly = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Itinerary>(itinerary);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(isBooked);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('FULL');
  const [subPaymentMethod, setSubPaymentMethod] = useState<SubPaymentMethod>('UPI');
  const [selectedEmiMonth, setSelectedEmiMonth] = useState<number>(3);
  
  // Billing & Forms
  const [billingDetails, setBillingDetails] = useState({
      name: '',
      email: '',
      phone: '',
      address: ''
  });

  const [cardDetails, setCardDetails] = useState({
      number: '',
      expiry: '',
      cvv: '',
      holder: ''
  });

  const [upiId, setUpiId] = useState('');
  const [upiVerified, setUpiVerified] = useState(false);

  // Financials
  const [walletBalance] = useState<number>(185000); 
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');

  // Calculate travelers count
  const totalTravelers = preferences 
    ? (preferences.travelers.adults + preferences.travelers.children + preferences.travelers.seniors) 
    : 1;

  // Split Payment State
  const [friendDetails, setFriendDetails] = useState(
      Array(Math.max(0, totalTravelers - 1)).fill({ name: '', number: '', email: '', upi: '' })
  );

  // Calculated Costs
  const baseCost = editedData.totalEstimatedCost;
  const guideCharges = preferences?.hireGuide ? (totalTravelers * 2500) : 0; // Mock guide calculation
  const serviceFee = Math.round(baseCost * 0.02); // 2% platform fee
  const taxes = Math.round(baseCost * 0.05); // 5% Tax
  const finalTotal = baseCost + guideCharges + serviceFee + taxes - discount;

  const perPersonCost = Math.round(finalTotal / (totalTravelers || 1));

  const handleSave = () => {
      if (onSave) {
          onSave(editedData);
      }
      setIsEditing(false);
  };

  const handleApplyPromo = () => {
      if (promoCode.toUpperCase() === 'TRAVEL2024') {
          setDiscount(Math.round(baseCost * 0.1)); // 10% off
          setPromoMessage('Promo Applied! 10% Discount.');
      } else {
          setDiscount(0);
          setPromoMessage('Invalid Promo Code');
      }
  };

  const handleActivityChange = (dayIndex: number, actIndex: number, field: string, value: string | number) => {
      const newItinerary = { ...editedData };
      const newDays = [...newItinerary.dailyItinerary];
      const newActivities = [...newDays[dayIndex].activities];
      
      // @ts-ignore
      newActivities[actIndex] = { ...newActivities[actIndex], [field]: value };
      newDays[dayIndex].activities = newActivities;
      newItinerary.dailyItinerary = newDays;
      
      // Recalculate total cost if cost changes
      if (field === 'estimatedCost') {
         const newTotal = newDays.reduce((acc, day) => {
             return acc + day.activities.reduce((sum, act) => sum + Number(act.estimatedCost), 0);
         }, 0);
         newItinerary.totalEstimatedCost = newTotal;
      }

      setEditedData(newItinerary);
  };

  const handleDeleteActivity = (dayIndex: number, actIndex: number) => {
      const newItinerary = { ...editedData };
      const newDays = [...newItinerary.dailyItinerary];
      
      // Remove activity
      newDays[dayIndex].activities = newDays[dayIndex].activities.filter((_, i) => i !== actIndex);
      
      // Recalculate cost
      const newTotal = newDays.reduce((acc, day) => {
        return acc + day.activities.reduce((sum, act) => sum + Number(act.estimatedCost), 0);
      }, 0);
      
      newItinerary.dailyItinerary = newDays;
      newItinerary.totalEstimatedCost = newTotal;
      
      setEditedData(newItinerary);
  };

  const handleFriendDetailChange = (index: number, field: string, value: string) => {
      const updated = [...friendDetails];
      updated[index] = { ...updated[index], [field]: value };
      setFriendDetails(updated);
  };

  const handleProcessPayment = () => {
      setPaymentProcessing(true);
      
      // Simulation logic
      setTimeout(() => {
          setPaymentProcessing(false);
          setPaymentSuccess(true);
          if (onBook) onBook(editedData);
      }, 2500);
  };

  const downloadAsPDF = () => {
    try {
      // Show loading state
      setIsDownloading(true);
      
      // Get the itinerary content element
      const element = document.getElementById('itinerary-content');
      
      if (element) {
        // Configure html2pdf options
        const options = {
          margin: [10, 5, 10, 5],
          filename: `TravelEase_Itinerary_${editedData.tripName || 'Trip'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            logging: false,
            scrollY: -window.scrollY
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] }
        };
        
        // Generate and download PDF
        html2pdf()
          .set(options)
          .from(element)
          .save()
          .then(() => {
            // Hide loading state
            setIsDownloading(false);
          })
          .catch((error: any) => {
            console.error('Error generating PDF:', error);
            setIsDownloading(false);
            alert('Failed to generate PDF. Please try again.');
          });
      } else {
        setIsDownloading(false);
        alert('Failed to generate PDF. Content not found.');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsDownloading(false);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Logic for EMI eligibility
  const isEmiEligible = finalTotal > 100000;
  
  // Logic for Wallet eligibility
  const isWalletEligible = walletBalance >= finalTotal;

  // Derived check for pay button state
  const isPayButtonDisabled = paymentProcessing || 
                              (paymentMethod === 'EMI' && !isEmiEligible) || 
                              (paymentMethod === 'WALLET' && !isWalletEligible);

  return (
      <div id="itinerary-content" className="max-w-5xl mx-auto px-4 py-8 relative">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            
            {/* Header Section */}
            <div className="p-8 text-white relative overflow-hidden" style={{ backgroundColor: COLORS.primary }}>
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                {readOnly && (
                                    <span className="bg-white/20 backdrop-blur px-2 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                        <Eye className="w-3 h-3" /> Read Only View
                                    </span>
                                )}
                            </div>
                            
                            {isEditing ? (
                                <input 
                                    type="text" 
                                    value={editedData.tripName}
                                    onChange={(e) => setEditedData({...editedData, tripName: e.target.value})}
                                    className="text-3xl font-bold mb-2 bg-white/20 border border-white/30 rounded px-2 w-full text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                                />
                            ) : (
                                <h1 className="text-3xl font-bold mb-2">{editedData.tripName}</h1>
                            )}
                            
                            {isEditing ? (
                                <textarea 
                                    value={editedData.destinationOverview}
                                    onChange={(e) => setEditedData({...editedData, destinationOverview: e.target.value})}
                                    className="w-full bg-white/20 border border-white/30 rounded p-2 text-white placeholder-white/70 focus:outline-none text-sm"
                                    rows={2}
                                />
                            ) : (
                                <p className="opacity-90 max-w-2xl">{editedData.destinationOverview}</p>
                            )}
                        </div>
                        
                        {/* Edit Toggle (Hidden in ReadOnly) */}
                        {!readOnly && !isBooked && !paymentSuccess && (
                            <button 
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                className={`ml-4 flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${isEditing ? 'bg-white text-emerald-700' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                            >
                                {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                                {isEditing ? 'Save Changes' : 'Edit Itinerary'}
                            </button>
                        )}
                        
                        {/* Booked Badge */}
                        {(isBooked || paymentSuccess) && (
                            <div className="ml-4 bg-emerald-400 text-emerald-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg">
                                <CheckCircle className="w-5 h-5" /> Trip Booked
                            </div>
                        )}
                    </div>

                    {/* Cost Cards */}
                    <div className="mt-6 flex flex-wrap gap-4">
                        <div className="inline-flex items-center bg-white/20 backdrop-blur px-4 py-2 rounded-lg border border-white/10">
                            <Wallet className="w-5 h-5 mr-2" />
                            <div>
                                <span className="text-xs opacity-80 uppercase tracking-wide">Total Estimated</span>
                                <div className="font-bold text-lg leading-none">{editedData.currency} {editedData.totalEstimatedCost.toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="inline-flex items-center bg-white/20 backdrop-blur px-4 py-2 rounded-lg border border-white/10">
                            <Users className="w-5 h-5 mr-2" />
                            <div>
                                <span className="text-xs opacity-80 uppercase tracking-wide">Per Person ({totalTravelers})</span>
                                <div className="font-bold text-lg leading-none">{editedData.currency} {perPersonCost.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            </div>

            {/* Content Body */}
            <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Daily Itinerary</h2>
                <div className="space-y-8">
                    {editedData.dailyItinerary.map((day, dayIndex) => (
                        <div key={day.day} className="border-l-4 pl-6 relative" style={{ borderColor: COLORS.primary }}>
                            <div className="absolute -left-[11px] top-0 rounded-full w-5 h-5 border-4 border-white" style={{ backgroundColor: COLORS.primary }}></div>
                            <h3 className="text-xl font-bold text-gray-800 mb-1">Day {day.day}: {day.theme}</h3>
                            
                            <div className="space-y-4 mt-4">
                                {day.activities.map((act, actIndex) => (
                                    <div key={actIndex} className={`bg-gray-50 p-4 rounded-xl border border-gray-100 transition-all ${isEditing ? 'hover:border-blue-300' : 'hover:bg-slate-50'}`}>
                                        
                                        {/* Activity Header: Time & Cost */}
                                        <div className="flex justify-between items-start mb-2">
                                            {isEditing ? (
                                                <input 
                                                    type="text"
                                                    value={act.time}
                                                    onChange={(e) => handleActivityChange(dayIndex, actIndex, 'time', e.target.value)}
                                                    className="text-sm font-semibold bg-white border border-gray-300 px-2 py-0.5 rounded w-24"
                                                    style={{ color: COLORS.primary }}
                                                />
                                            ) : (
                                                <span className="text-sm font-semibold px-2 py-0.5 rounded" style={{ color: COLORS.primary, backgroundColor: COLORS.primaryLight }}>{act.time}</span>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-500 font-medium flex items-center">
                                                    ~{editedData.currency} 
                                                    {isEditing ? (
                                                        <input 
                                                            type="number"
                                                            value={act.estimatedCost}
                                                            onChange={(e) => handleActivityChange(dayIndex, actIndex, 'estimatedCost', parseInt(e.target.value))}
                                                            className="w-20 ml-1 border border-gray-300 rounded px-1 text-right"
                                                        />
                                                    ) : act.estimatedCost}
                                                </span>
                                                {isEditing && (
                                                    <button 
                                                        onClick={() => handleDeleteActivity(dayIndex, actIndex)}
                                                        className="text-red-400 hover:text-red-600 p-1 bg-white rounded-full shadow-sm"
                                                        title="Remove Activity"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Activity Name */}
                                        {isEditing ? (
                                            <input 
                                                type="text"
                                                value={act.activity}
                                                onChange={(e) => handleActivityChange(dayIndex, actIndex, 'activity', e.target.value)}
                                                className="w-full font-bold text-gray-900 border border-gray-300 rounded p-1 mb-1 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                            />
                                        ) : (
                                            <h4 className="font-bold text-gray-900">{act.activity}</h4>
                                        )}

                                        {/* Description */}
                                        {isEditing ? (
                                            <textarea 
                                                value={act.description}
                                                onChange={(e) => handleActivityChange(dayIndex, actIndex, 'description', e.target.value)}
                                                className="w-full text-sm text-gray-600 mt-1 border border-gray-300 rounded p-1 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                                rows={2}
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-600 mt-1">{act.description}</p>
                                        )}

                                        {/* Location */}
                                        <div className="mt-2 flex items-center text-xs text-gray-500">
                                            <MapPin className="w-3 h-3 mr-1" /> 
                                            {isEditing ? (
                                                <input 
                                                    type="text"
                                                    value={act.location}
                                                    onChange={(e) => handleActivityChange(dayIndex, actIndex, 'location', e.target.value)}
                                                    className="border border-gray-300 rounded px-1 w-full max-w-xs"
                                                />
                                            ) : act.location}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Footer Actions */}
            <div className="p-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50">
                <button onClick={onClose} className="text-gray-600 font-medium hover:text-gray-900 px-6 py-2">{closeLabel}</button>
                
                <div className="flex gap-4">
                    {!readOnly && (
                        <button 
                            onClick={downloadAsPDF}
                            disabled={isDownloading}
                            className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2"
                        >
                            {isDownloading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    Generating PDF...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" /> Download PDF
                                </>
                            )}
                        </button>
                    )}
                    
                    {!readOnly && !isBooked && !paymentSuccess && (
                        <button 
                            onClick={() => setShowPaymentModal(true)}
                            className="text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 shadow-lg shadow-teal-900/20 transition-all flex items-center gap-2 transform hover:-translate-y-1"
                            style={{ backgroundColor: COLORS.primary }}
                        >
                           <CreditCard className="w-4 h-4" /> Book & Pay ({editedData.currency} {finalTotal.toLocaleString()})
                        </button>
                    )}
                    
                    {readOnly && (
                        <button 
                             onClick={onClose}
                             className="text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 shadow-lg shadow-teal-900/20 transition-all flex items-center gap-2 transform hover:-translate-y-1"
                             style={{ backgroundColor: COLORS.primary }}
                        >
                            <Share2 className="w-4 h-4" /> Create Similar Trip
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in">
                <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                    
                    {/* Header */}
                    <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.primaryLight }}>
                                <Lock className="w-5 h-5" style={{ color: COLORS.primary }} />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-gray-900">Secure Checkout</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> TravelEase SafePay
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors"><X className="w-6 h-6"/></button>
                    </div>
                    
                    {paymentSuccess ? (
                         <div className="p-12 flex flex-col items-center text-center animate-in zoom-in h-full justify-center">
                             <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-emerald-200 shadow-lg">
                                 <Check className="w-12 h-12 text-emerald-600" />
                             </div>
                             <h4 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h4>
                             <p className="text-gray-500 mb-8 text-lg">Your trip to <span className="font-bold text-gray-800">{editedData.tripName}</span> is confirmed. 🎉</p>
                             
                             <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 w-full max-w-md mb-8">
                                 <div className="flex justify-between mb-2">
                                     <span className="text-gray-500">Transaction ID</span>
                                     <span className="font-mono font-bold text-gray-800">TXN_{Date.now().toString().slice(-8)}</span>
                                 </div>
                                 <div className="flex justify-between mb-2">
                                     <span className="text-gray-500">Amount Paid</span>
                                     <span className="font-bold text-emerald-600">{editedData.currency} {finalTotal.toLocaleString()}</span>
                                 </div>
                                 <div className="flex justify-between">
                                     <span className="text-gray-500">Date</span>
                                     <span className="font-medium text-gray-800">{new Date().toLocaleDateString()}</span>
                                 </div>
                             </div>

                             <div className="flex gap-4">
                                 <button onClick={() => setShowPaymentModal(false)} className="px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                                     View Trip Details
                                 </button>
                                 <button 
                                     className="px-8 py-3 text-white font-bold rounded-xl hover:opacity-90 transition-colors flex items-center gap-2 shadow-lg"
                                     style={{ backgroundColor: COLORS.primary }}
                                 >
                                     <Download className="w-4 h-4" /> Download Invoice
                                 </button>
                             </div>
                         </div>
                    ) : (
                        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                            
                            {/* LEFT COLUMN - Payment Methods */}
                            <div className="w-full md:w-2/3 flex flex-col border-r border-gray-100">
                                {/* Top Tabs */}
                                <div className="flex p-2 bg-gray-50 gap-2 overflow-x-auto">
                                    {[
                                        { id: 'FULL', label: 'Pay Now', icon: CreditCard },
                                        { id: 'EMI', label: 'EMI Plans', icon: Smartphone },
                                        { id: 'SPLIT', label: 'Split Bill', icon: Users },
                                        { id: 'WALLET', label: 'Wallet', icon: Wallet },
                                    ].map((method) => (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all whitespace-nowrap ${
                                                paymentMethod === method.id
                                                ? 'bg-white font-bold shadow-sm'
                                                : 'border-transparent text-gray-500 hover:bg-gray-100'
                                            }`}
                                            style={paymentMethod === method.id ? { borderColor: COLORS.primary, color: COLORS.primary } : {}}
                                        >
                                            <method.icon className="w-4 h-4" />
                                            <span className="text-sm">{method.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Main Content Area */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    
                                    {/* 1. PAY NOW (Standard Checkout) */}
                                    {paymentMethod === 'FULL' && (
                                        <div className="space-y-8 animate-in fade-in">
                                            
                                            {/* Billing Details */}
                                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                    <Users className="w-4 h-4" /> Billing Details
                                                </h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Full Name" 
                                                        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-[#4FC3F7] text-gray-900 placeholder-gray-400" 
                                                        value={billingDetails.name} 
                                                        onChange={e => setBillingDetails({...billingDetails, name: e.target.value})} 
                                                    />
                                                    <input 
                                                        type="email" 
                                                        placeholder="Email Address" 
                                                        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-[#4FC3F7] text-gray-900 placeholder-gray-400" 
                                                        value={billingDetails.email} 
                                                        onChange={e => setBillingDetails({...billingDetails, email: e.target.value})} 
                                                    />
                                                    <input 
                                                        type="tel" 
                                                        placeholder="Phone Number" 
                                                        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-[#4FC3F7] text-gray-900 placeholder-gray-400" 
                                                        value={billingDetails.phone} 
                                                        onChange={e => setBillingDetails({...billingDetails, phone: e.target.value})} 
                                                    />
                                                    <input 
                                                        type="text" 
                                                        placeholder="Billing Address" 
                                                        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-[#4FC3F7] text-gray-900 placeholder-gray-400" 
                                                        value={billingDetails.address} 
                                                        onChange={e => setBillingDetails({...billingDetails, address: e.target.value})} 
                                                    />
                                                </div>
                                            </div>

                                            {/* Sub-Payment Methods (UPI/Card/NetBanking) */}
                                            <div>
                                                <h4 className="font-bold text-gray-800 mb-4">Select Payment Mode</h4>
                                                
                                                {/* Tabs */}
                                                <div className="flex gap-4 mb-6 border-b border-gray-200">
                                                    {[
                                                        { id: 'UPI', label: 'UPI' },
                                                        { id: 'CARD', label: 'Card' },
                                                        { id: 'NETBANKING', label: 'Net Banking' }
                                                    ].map(sub => (
                                                        <button 
                                                            key={sub.id}
                                                            onClick={() => setSubPaymentMethod(sub.id as SubPaymentMethod)}
                                                            className={`pb-2 px-1 text-sm font-medium transition-all ${
                                                                subPaymentMethod === sub.id 
                                                                ? 'border-b-2' 
                                                                : 'text-gray-400 hover:text-gray-600'
                                                            }`}
                                                            style={subPaymentMethod === sub.id ? { borderColor: COLORS.primary, color: COLORS.primary } : {}}
                                                        >
                                                            {sub.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* UPI UI */}
                                                {subPaymentMethod === 'UPI' && (
                                                    <div className="space-y-4 animate-in slide-in-from-left-4 fade-in">
                                                        <div className="flex gap-4 mb-4">
                                                            {['GPay', 'PhonePe', 'Paytm'].map(app => (
                                                                <button key={app} className="flex-1 py-3 border border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all font-bold text-gray-600 text-sm">
                                                                    {app}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="relative">
                                                            <div className="flex">
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Enter UPI ID (e.g. mobile@upi)" 
                                                                    className="flex-1 p-3 border border-gray-200 rounded-l-xl outline-none focus:border-[#4FC3F7] text-gray-900"
                                                                    value={upiId}
                                                                    onChange={e => setUpiId(e.target.value)}
                                                                />
                                                                <button 
                                                                    onClick={() => setUpiVerified(true)}
                                                                    className="bg-gray-100 border border-l-0 border-gray-200 px-4 rounded-r-xl font-bold text-sm text-gray-600 hover:bg-gray-200"
                                                                >
                                                                    {upiVerified ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Verified</span> : 'Verify'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-2">
                                                            <ShieldCheck className="w-3 h-3 text-emerald-500" /> UPI payments are instant & 100% secure.
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Card UI */}
                                                {subPaymentMethod === 'CARD' && (
                                                    <div className="space-y-6 animate-in slide-in-from-left-4 fade-in">
                                                        {/* Visual Card */}
                                                        <div className="h-40 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 text-white shadow-xl relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                                            <div className="flex justify-between items-start mb-6">
                                                                <div className="w-10 h-6 bg-yellow-400/80 rounded"></div>
                                                                <span className="font-bold italic opacity-80">VISA</span>
                                                            </div>
                                                            <div className="font-mono text-xl tracking-widest mb-4">
                                                                {cardDetails.number || '•••• •••• •••• ••••'}
                                                            </div>
                                                            <div className="flex justify-between items-end">
                                                                <div>
                                                                    <p className="text-[10px] uppercase opacity-60">Card Holder</p>
                                                                    <p className="font-medium">{cardDetails.holder || 'YOUR NAME'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] uppercase opacity-60">Expires</p>
                                                                    <p className="font-medium">{cardDetails.expiry || 'MM/YY'}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Inputs */}
                                                        <div className="space-y-4">
                                                            <input 
                                                                type="text" 
                                                                placeholder="Card Number" 
                                                                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#4FC3F7] text-gray-900"
                                                                maxLength={19}
                                                                value={cardDetails.number}
                                                                onChange={e => setCardDetails({...cardDetails, number: e.target.value})}
                                                            />
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="MM / YY" 
                                                                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#4FC3F7] text-gray-900"
                                                                    maxLength={5}
                                                                    value={cardDetails.expiry}
                                                                    onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})}
                                                                />
                                                                <input 
                                                                    type="password" 
                                                                    placeholder="CVV" 
                                                                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#4FC3F7] text-gray-900"
                                                                    maxLength={3}
                                                                    value={cardDetails.cvv}
                                                                    onChange={e => setCardDetails({...cardDetails, cvv: e.target.value})}
                                                                />
                                                            </div>
                                                            <input 
                                                                type="text" 
                                                                placeholder="Cardholder Name" 
                                                                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#4FC3F7] text-gray-900"
                                                                value={cardDetails.holder}
                                                                onChange={e => setCardDetails({...cardDetails, holder: e.target.value})}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Net Banking UI */}
                                                {subPaymentMethod === 'NETBANKING' && (
                                                    <div className="animate-in slide-in-from-left-4 fade-in">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {['HDFC Bank', 'SBI', 'ICICI Bank', 'Axis Bank', 'Kotak', 'Others'].map(bank => (
                                                                <button key={bank} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-3">
                                                                    <Globe className="w-5 h-5 text-gray-400" />
                                                                    <span className="font-medium text-gray-700">{bank}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. EMI PLANS */}
                                    {paymentMethod === 'EMI' && (
                                        <div className="space-y-4 animate-in fade-in">
                                            {!isEmiEligible ? (
                                                <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 text-center">
                                                    <Lock className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                                                    <h4 className="font-bold text-amber-900 mb-1">EMI Not Available</h4>
                                                    <p className="text-sm text-amber-700">
                                                        EMI plans are only available for bookings above {editedData.currency} 100,000.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {[3, 6, 9, 12].map((months) => {
                                                        const monthly = Math.ceil(finalTotal / months);
                                                        const isSelected = selectedEmiMonth === months;
                                                        return (
                                                            <div 
                                                                key={months}
                                                                onClick={() => setSelectedEmiMonth(months)}
                                                                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                                                    isSelected
                                                                    ? `text-white shadow-lg transform scale-105` 
                                                                    : 'bg-white border-gray-200 hover:border-gray-300 text-gray-900'
                                                                }`}
                                                                style={{
                                                                    backgroundColor: isSelected ? COLORS.primary : 'white',
                                                                    borderColor: isSelected ? COLORS.primary : ''
                                                                }}
                                                            >
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="font-bold text-lg">{months} Months</span>
                                                                    {isSelected && <CheckCircle className="w-5 h-5" />}
                                                                </div>
                                                                <div className={`text-sm ${isSelected ? 'opacity-90' : 'text-gray-500'}`}>Pay</div>
                                                                <div className="text-xl font-bold">{editedData.currency} {monthly.toLocaleString()}<span className={`text-xs font-normal ${isSelected ? 'opacity-70' : 'text-gray-400'}`}>/mo</span></div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 3. SPLIT WITH FRIENDS */}
                                    {paymentMethod === 'SPLIT' && (
                                        <div className="space-y-4 animate-in fade-in">
                                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                                                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-blue-900">Total Split: {totalTravelers} People</p>
                                                    <p className="text-xs text-blue-700">Cost per person: <strong>{editedData.currency} {perPersonCost.toLocaleString()}</strong></p>
                                                </div>
                                            </div>

                                            {totalTravelers <= 1 ? (
                                                <p className="text-center text-gray-500 py-4">Add more travelers to your trip settings to enable splitting.</p>
                                            ) : (
                                                <div className="space-y-4">
                                                    <h4 className="font-bold text-gray-800 text-sm">Enter Friend Details (They will receive payment links)</h4>
                                                    {friendDetails.map((friend, idx) => (
                                                        <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                                            <div className="text-xs font-bold text-gray-400 uppercase mb-3">Traveler {idx + 2}</div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                <input 
                                                                    type="text" placeholder="Full Name" 
                                                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4FC3F7]"
                                                                    value={friend.name} onChange={(e) => handleFriendDetailChange(idx, 'name', e.target.value)}
                                                                />
                                                                <input 
                                                                    type="text" placeholder="Phone Number" 
                                                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4FC3F7]"
                                                                    value={friend.number} onChange={(e) => handleFriendDetailChange(idx, 'number', e.target.value)}
                                                                />
                                                                <input 
                                                                    type="email" placeholder="Email" 
                                                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4FC3F7]"
                                                                    value={friend.email} onChange={(e) => handleFriendDetailChange(idx, 'email', e.target.value)}
                                                                />
                                                                <input 
                                                                    type="text" placeholder="UPI ID" 
                                                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4FC3F7]"
                                                                    value={friend.upi} onChange={(e) => handleFriendDetailChange(idx, 'upi', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 4. WALLET */}
                                    {paymentMethod === 'WALLET' && (
                                        <div className="space-y-4 animate-in fade-in">
                                            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">TravelEase Balance</p>
                                                        <h3 className="text-3xl font-bold">{editedData.currency} {walletBalance.toLocaleString()}</h3>
                                                    </div>
                                                    <div className="bg-white/10 p-2 rounded-lg">
                                                        <Wallet className="w-6 h-6 text-white" />
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-400 font-mono">**** **** **** 4291</div>
                                            </div>

                                            {!isWalletEligible && (
                                                 <div className="flex items-start gap-3 bg-red-50 p-4 rounded-xl border border-red-100">
                                                     <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                                     <div>
                                                         <p className="font-bold text-red-700 text-sm">Insufficient Balance</p>
                                                         <p className="text-xs text-red-600 mt-1">
                                                             You need {editedData.currency} {(finalTotal - walletBalance).toLocaleString()} more to book this trip.
                                                         </p>
                                                         <button className="mt-2 text-xs font-bold text-red-700 underline">Add Money to Wallet</button>
                                                     </div>
                                                 </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT COLUMN - Breakdown & Pay Button */}
                            <div className="w-full md:w-1/3 bg-gray-50 p-6 flex flex-col">
                                <h3 className="font-bold text-gray-900 mb-6">Payment Breakdown</h3>
                                
                                <div className="flex-1 space-y-4">
                                    {/* Table UI */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Base Trip Cost</span>
                                            <span className="font-medium">{editedData.currency} {baseCost.toLocaleString()}</span>
                                        </div>
                                        {preferences?.hireGuide && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Guide Charges</span>
                                                <span className="font-medium">{editedData.currency} {guideCharges.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Service Fee (2%)</span>
                                            <span className="font-medium">{editedData.currency} {serviceFee.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Taxes (5%)</span>
                                            <span className="font-medium">{editedData.currency} {taxes.toLocaleString()}</span>
                                        </div>
                                        
                                        {discount > 0 && (
                                            <div className="flex justify-between text-sm text-emerald-600 font-bold border-t border-dashed border-gray-200 pt-2">
                                                <span>Promo Discount</span>
                                                <span>- {editedData.currency} {discount.toLocaleString()}</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3 mt-2 text-gray-900">
                                            <span>Total Payable</span>
                                            <span>{editedData.currency} {finalTotal.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Promo Code */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-1">
                                        <div className="flex">
                                            <div className="pl-3 flex items-center text-gray-400">
                                                <Gift className="w-4 h-4" />
                                            </div>
                                            <input 
                                                type="text" 
                                                placeholder="Promo Code" 
                                                className="flex-1 p-2 text-sm outline-none font-medium uppercase"
                                                value={promoCode}
                                                onChange={e => setPromoCode(e.target.value)}
                                            />
                                            <button 
                                                onClick={handleApplyPromo}
                                                className="text-xs font-bold px-3 hover:bg-gray-50 rounded-r-lg"
                                                style={{ color: COLORS.primary }}
                                            >
                                                APPLY
                                            </button>
                                        </div>
                                    </div>
                                    {promoMessage && <p className={`text-xs ${discount > 0 ? 'text-emerald-600' : 'text-red-500'} px-2`}>{promoMessage}</p>}
                                </div>

                                {/* Pay Button */}
                                <div className="mt-6">
                                    <button 
                                        onClick={handleProcessPayment}
                                        disabled={isPayButtonDisabled}
                                        className={`w-full py-4 rounded-xl font-bold text-white shadow-xl transition-all flex flex-col items-center justify-center gap-1
                                            ${isPayButtonDisabled
                                                ? 'bg-gray-400 cursor-not-allowed' 
                                                : 'hover:opacity-90 transform active:scale-95'}`}
                                        style={{ backgroundColor: isPayButtonDisabled ? undefined : COLORS.primary }}
                                    >
                                        {paymentProcessing ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                                Processing...
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-lg">Pay {editedData.currency} {finalTotal.toLocaleString()}</span>
                                                <span className="text-[10px] opacity-80 font-normal flex items-center gap-1">
                                                    <Lock className="w-2.5 h-2.5" /> Securely via TravelEase
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

      </div>
  );
};