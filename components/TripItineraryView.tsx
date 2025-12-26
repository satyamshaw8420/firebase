import React from 'react';
import { SavedTrip, DayPlan, Activity } from '../types';
import { MapPin, Wallet, Users, Calendar } from 'lucide-react';

interface TripItineraryViewProps {
  trip: SavedTrip;
}

const TripItineraryView: React.FC<TripItineraryViewProps> = ({ trip }) => {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-3xl shadow-lg border border-emerald-100 p-6 transition-all duration-300 hover:shadow-xl">
      <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm">
        <h3 className="text-2xl font-bold text-emerald-800 mb-2">{trip.tripName}</h3>
        <p className="text-gray-700 italic">{trip.destinationOverview}</p>
        
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center text-sm text-gray-700 bg-emerald-100/70 px-3 py-1.5 rounded-full">
            <Calendar className="w-4 h-4 mr-1 text-emerald-600" />
            <span>{trip.preferences?.startDate} to {trip.preferences?.endDate}</span>
          </div>
          <div className="flex items-center text-sm text-gray-700 bg-blue-100/70 px-3 py-1.5 rounded-full">
            <Wallet className="w-4 h-4 mr-1 text-blue-600" />
            <span>{trip.currency} {trip.totalEstimatedCost?.toLocaleString()}</span>
          </div>
          <div className="flex items-center text-sm text-gray-700 bg-purple-100/70 px-3 py-1.5 rounded-full">
            <Users className="w-4 h-4 mr-1 text-purple-600" />
            <span>{[...new Set([trip.userId, ...(trip.joiners || [])])].filter(id => id).length} members</span>
          </div>
        </div>
      </div>

      <div className="border-t border-emerald-200/50 pt-6">
        <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-emerald-500" />
          Daily Itinerary
        </h4>
        
        {trip.dailyItinerary && trip.dailyItinerary.length > 0 ? (
          <div className="space-y-6">
            {trip.dailyItinerary.map((day: DayPlan, dayIndex: number) => (
              <div key={day.day} className="border border-emerald-200 rounded-2xl p-5 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
                <h5 className="font-bold text-lg text-emerald-700 mb-4 pb-2 border-b border-emerald-100">
                  Day {day.day}: <span className="capitalize font-semibold">{day.theme}</span>
                </h5>
                
                <div className="space-y-4">
                  {day.activities?.map((activity: Activity, activityIndex: number) => (
                    <div key={activityIndex} className="flex items-start p-4 bg-gradient-to-r from-gray-50 to-emerald-50 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h6 className="font-bold text-gray-800 text-base">{activity.activity}</h6>
                          <span className="text-sm font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full">
                            ~{trip.currency} {activity.estimatedCost}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{activity.description}</p>
                        
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPin className="w-3 h-3 mr-1 text-emerald-400" />
                          <span className="font-medium">{activity.location}</span>
                          <span className="mx-2 text-gray-300">•</span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            {activity.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500 bg-white/70 rounded-2xl">
            <div className="text-emerald-400 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-12 h-12 mx-auto">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <p className="text-lg">No itinerary details available yet.</p>
            <p className="text-sm mt-1">The trip creator will add activities soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripItineraryView;