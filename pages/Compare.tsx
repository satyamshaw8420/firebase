import React, { useState, useEffect } from 'react';
import { SavedTrip } from '../types';
import { getUserTrips } from '../firebase/tripService';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { AlertCircle } from 'lucide-react';

const Compare: React.FC = () => {
  const { currentUser } = useAuth();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);



  useEffect(() => {
    const loadTrips = async () => {
      if (currentUser) {
        try {
          const userTrips = await getUserTrips(currentUser.uid);
          setTrips(userTrips);
        } catch (error) {
          console.error('Error loading trips:', error);
        }
      }
    };

    loadTrips();
  }, [currentUser]);

  const toggleTrip = (id: string) => {
    if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
        if (selectedIds.length < 3) {
            setSelectedIds([...selectedIds, id]);
        } else {
            alert("You can compare up to 3 trips at a time.");
        }
    }
  };

  // Prepare data for cost comparison bar chart
  const comparisonData = selectedIds.map(id => {
      const trip = trips.find(t => t.id === id);
      return {
          name: trip?.tripName || 'Unknown Trip',
          cost: trip?.totalEstimatedCost || 0,
          days: trip?.dailyItinerary.length || 0,
          activities: trip?.dailyItinerary.reduce((acc, day) => acc + day.activities.length, 0) || 0
      };
  }).filter(item => item.name && item.cost > 0); // Filter out invalid data

  // Prepare data for daily cost line chart
  const dailyCostData = () => {
    const data: any[] = [];
    
    selectedIds.forEach(id => {
      const trip = trips.find(t => t.id === id);
      if (trip) {
        trip.dailyItinerary.forEach((day, index) => {
          const totalDayCost = day.activities.reduce((sum, activity) => sum + (activity.estimatedCost || 0), 0);
          
          // Find existing day entry or create new one
          let dayEntry = data.find(d => d.day === `Day ${index + 1}`);
          if (!dayEntry) {
            dayEntry = { day: `Day ${index + 1}` };
            data.push(dayEntry);
          }
          
          // Add trip cost for this day
          dayEntry[trip.tripName] = totalDayCost;
        });
      }
    });
    
    return data;
  };

  // Prepare data for activity distribution pie chart
  const activityDistributionData = () => {
    const data: any[] = [];
    
    selectedIds.forEach(id => {
      const trip = trips.find(t => t.id === id);
      if (trip) {
        const totalActivities = trip.dailyItinerary.reduce((acc, day) => acc + day.activities.length, 0);
        data.push({
          name: trip.tripName,
          value: totalActivities
        });
      }
    });
    
    return data;
  };

  // Prepare data for budget utilization
  const budgetUtilizationData = () => {
    const data: any[] = [];
    
    selectedIds.forEach(id => {
      const trip = trips.find(t => t.id === id);
      if (trip) {
        // Calculate actual costs from activities
        const actualCost = trip.dailyItinerary.reduce((total, day) => {
          return total + day.activities.reduce((dayTotal, activity) => dayTotal + (activity.estimatedCost || 0), 0);
        }, 0);
        
        data.push({
          name: trip.tripName,
          planned: trip.totalEstimatedCost,
          actual: actualCost,
          saved: trip.totalEstimatedCost - actualCost
        });
      }
    });
    
    return data;
  };

  // Prepare data for trip duration comparison
  const durationComparisonData = selectedIds.map(id => {
    const trip = trips.find(t => t.id === id);
    return {
      name: trip?.tripName,
      duration: trip?.dailyItinerary.length || 0,
      costPerDay: trip && trip.dailyItinerary.length > 0 ? 
        (trip.totalEstimatedCost || 0) / trip.dailyItinerary.length : 0
    };
  });

  // Colors for charts
  const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Compare Trips</h1>
        
        {trips.length === 0 ? (
            <div className="bg-amber-50 text-amber-800 p-4 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <p>You need to create some trips first to compare them!</p>
            </div>
        ) : (
            <div className="grid lg:grid-cols-4 gap-8">
                {/* Selection Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="font-semibold text-gray-700">Select Trips to Compare (Max 3)</h3>
                    {trips.map(trip => (
                        <div 
                            key={trip.id} 
                            onClick={() => toggleTrip(trip.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                selectedIds.includes(trip.id) 
                                ? 'border-emerald-500 bg-emerald-50 shadow-md ring-1 ring-emerald-500' 
                                : 'border-gray-200 bg-white hover:border-emerald-300'
                            }`}
                        >
                            <h4 className="font-bold text-gray-900">{trip.tripName}</h4>
                            <div className="text-sm text-gray-500 mt-1 flex justify-between">
                                <span>{trip.dailyItinerary.length} Days</span>
                                <span>{trip.currency}{trip.totalEstimatedCost}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Area */}
                <div className="lg:col-span-3 space-y-8">
                    {selectedIds.length > 0 ? (
                        <>
                            {/* Dashboard Header */}
                            <div className="mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Trip Comparison Dashboard</h2>
                                <p className="text-gray-600">Comprehensive analysis of your selected trips</p>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                                    <h3 className="text-lg font-semibold mb-2">Total Trips</h3>
                                    <p className="text-3xl font-bold">{selectedIds.length}</p>
                                </div>
                                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                                    <h3 className="text-lg font-semibold mb-2">Avg. Duration</h3>
                                    <p className="text-3xl font-bold">
                                        {Math.round(durationComparisonData.reduce((acc, trip) => acc + (trip.duration || 0), 0) / selectedIds.length)} days
                                    </p>
                                </div>
                                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                                    <h3 className="text-lg font-semibold mb-2">Total Est. Cost</h3>
                                    <p className="text-3xl font-bold">
                                        ₹{comparisonData.reduce((acc, trip) => acc + (trip.cost || 0), 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Cost Comparison Bar Chart - Enhanced Design */}
                            <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-xl border border-gray-200 mb-8 transform transition-all duration-300 hover:shadow-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">Cost Comparison</h3>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-xs font-semibold">
                                            LIVE
                                        </span>
                                    </div>
                                </div>
                                <div className="h-[380px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart 
                                            data={comparisonData}
                                            margin={{ top: 25, right: 35, left: 50, bottom: 80 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.9}/>
                                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                                                </linearGradient>
                                                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                                                    <feOffset dx="2" dy="2" result="offsetblur"/>
                                                    <feFlood floodColor="rgba(0,0,0,0.1)"/>
                                                    <feComposite in2="offsetblur" operator="in" />
                                                    <feMerge>
                                                        <feMergeNode />
                                                        <feMergeNode in="SourceGraphic" />
                                                    </feMerge>
                                                </filter>
                                            </defs>
                                            <CartesianGrid strokeDasharray="0" stroke="#e2e8f0" vertical={false} />
                                            <XAxis 
                                                dataKey="name" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }}
                                                angle={-45} 
                                                textAnchor="end"
                                                height={70}
                                                interval={0}
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#475569', fontSize: 12 }}
                                                tickFormatter={(value) => `₹${value.toLocaleString()}`}
                                                domain={[0, 'dataMax + 10000']}
                                                width={90}
                                            />
                                            <Tooltip 
                                                formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Estimated Cost']}
                                                labelFormatter={(label) => `Trip: ${label}`}
                                                contentStyle={{ 
                                                    backgroundColor: 'rgba(255, 255, 255, 1)', 
                                                    borderRadius: '12px', 
                                                    border: '1px solid #e2e8f0', 
                                                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                                                    backdropFilter: 'blur(10px)',
                                                    padding: '12px'
                                                }}
                                                cursor={{ fill: 'rgba(14, 165, 233, 0.05)' }}
                                                itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                                                labelStyle={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}
                                            />
                                            <Legend 
                                                wrapperStyle={{ paddingTop: '15px' }}
                                                formatter={(value) => <span className="text-gray-700 font-semibold text-sm">{value}</span>}
                                            />
                                            <Bar 
                                                dataKey="cost" 
                                                fill="url(#colorCost)" 
                                                name="Est. Cost" 
                                                radius={[6, 6, 0, 0]}
                                                barSize={45}
                                                filter="url(#shadow)"
                                            >
                                                {comparisonData.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={COLORS[index % COLORS.length]}
                                                        stroke={COLORS[index % COLORS.length]}
                                                        strokeWidth={1}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Budget Utilization */}
                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mb-8">
                                <h3 className="text-xl font-bold text-gray-800 mb-6">Budget Utilization</h3>
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart 
                                            data={budgetUtilizationData()}
                                            margin={{ top: 20, right: 30, left: 40, bottom: 70 }}
                                        >
                                            <CartesianGrid strokeDasharray="0" stroke="#e2e8f0" vertical={false} />
                                            <XAxis 
                                                dataKey="name" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                                angle={-45} 
                                                textAnchor="end"
                                                height={60}
                                                interval={0}
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                                tickFormatter={(value) => `₹${value.toLocaleString()}`}
                                                domain={[0, 'dataMax + 10000']}
                                                width={80}
                                            />
                                            <Tooltip 
                                                formatter={(value, name) => [
                                                    `₹${Number(value).toLocaleString()}`, 
                                                    String(name).charAt(0).toUpperCase() + String(name).slice(1)
                                                ]}
                                                labelFormatter={(label) => `Trip: ${label}`}
                                                contentStyle={{ 
                                                    backgroundColor: 'rgba(255, 255, 255, 1)', 
                                                    borderRadius: '12px', 
                                                    border: '1px solid #e2e8f0', 
                                                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                                                    padding: '12px'
                                                }}
                                                itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                                                labelStyle={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}
                                            />
                                            <Legend />
                                            <Bar dataKey="planned" fill="#8b5cf6" name="Planned" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="actual" fill="#0ea5e9" name="Actual" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Daily Cost Trend */}
                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mb-8">
                                <h3 className="text-xl font-bold text-gray-800 mb-6">Daily Cost Trend</h3>
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart 
                                            data={dailyCostData()}
                                            margin={{ top: 20, right: 30, left: 40, bottom: 50 }}
                                        >
                                            <CartesianGrid strokeDasharray="0" stroke="#e2e8f0" vertical={false} />
                                            <XAxis 
                                                dataKey="day" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                                tickFormatter={(value) => `₹${value.toLocaleString()}`}
                                                domain={[0, 'dataMax + 1000']}
                                                width={80}
                                            />
                                            <Tooltip 
                                                formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Daily Cost']}
                                                contentStyle={{ 
                                                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                                    borderRadius: '8px', 
                                                    border: '1px solid #e2e8f0', 
                                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                                }}
                                            />
                                            <Legend />
                                            {selectedIds.map((id, index) => {
                                                const trip = trips.find(t => t.id === id);
                                                return trip ? (
                                                    <Line 
                                                        key={id}
                                                        type="monotone" 
                                                        dataKey={trip.tripName} 
                                                        stroke={COLORS[index % COLORS.length]} 
                                                        strokeWidth={3} 
                                                        dot={{ r: 4, fill: COLORS[index % COLORS.length] }}
                                                        activeDot={{ r: 6, stroke: COLORS[index % COLORS.length], strokeWidth: 2 }}
                                                    />
                                                ) : null;
                                            })}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Activity Distribution */}
                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mb-8">
                                <h3 className="text-xl font-bold text-gray-800 mb-6">Activity Distribution</h3>
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={activityDistributionData()}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={true}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {activityDistributionData().map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                formatter={(value, name, props) => [
                                                    `${value} activities`, 
                                                    'Total Activities'
                                                ]}
                                                labelFormatter={(label) => `Trip: ${label}`}
                                                contentStyle={{ 
                                                    backgroundColor: 'rgba(255, 255, 255, 1)', 
                                                    borderRadius: '12px', 
                                                    border: '1px solid #e2e8f0', 
                                                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                                                    padding: '12px'
                                                }}
                                                itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                                                labelStyle={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Duration vs Cost Analysis */}
                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mb-8">
                                <h3 className="text-xl font-bold text-gray-800 mb-6">Duration vs Cost Analysis</h3>
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart 
                                            data={durationComparisonData}
                                            margin={{ top: 20, right: 30, left: 60, bottom: 70 }}
                                        >
                                            <CartesianGrid strokeDasharray="0" stroke="#e2e8f0" vertical={false} />
                                            <XAxis 
                                                dataKey="name" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                                angle={-45} 
                                                textAnchor="end"
                                                height={60}
                                                interval={0}
                                            />
                                            <YAxis 
                                                yAxisId="left"
                                                orientation="left"
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                                tickFormatter={(value) => `${value} days`}
                                                domain={[0, 'dataMax + 2']}
                                                width={60}
                                            />
                                            <YAxis 
                                                yAxisId="right"
                                                orientation="right"
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                                tickFormatter={(value) => `₹${value.toLocaleString()}`}
                                                domain={[0, 'dataMax + 10000']}
                                                width={80}
                                            />
                                            <Tooltip 
                                                formatter={(value, name) => [
                                                    name === 'duration' ? `${value} days` : `₹${Number(value).toLocaleString()}`,
                                                    name === 'duration' ? 'Duration' : 'Cost Per Day'
                                                ]}
                                                labelFormatter={(label) => `Trip: ${label}`}
                                                contentStyle={{ 
                                                    backgroundColor: 'rgba(255, 255, 255, 1)', 
                                                    borderRadius: '12px', 
                                                    border: '1px solid #e2e8f0', 
                                                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                                                    padding: '12px'
                                                }}
                                                itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                                                labelStyle={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}
                                            />
                                            <Legend />
                                            <Area 
                                                yAxisId="left"
                                                type="monotone" 
                                                dataKey="duration" 
                                                fill="#8b5cf6" 
                                                stroke="#8b5cf6" 
                                                name="Duration" 
                                                fillOpacity={0.2}
                                            />
                                            <Area 
                                                yAxisId="right"
                                                type="monotone" 
                                                dataKey="costPerDay" 
                                                fill="#0ea5e9" 
                                                stroke="#0ea5e9" 
                                                name="Cost Per Day" 
                                                fillOpacity={0.2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 min-h-[400px]">
                            Select trips from the sidebar to visualize comparison.
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default Compare;
