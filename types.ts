
export enum BudgetType {
  CHEAP = 'Cheap',
  MODERATE = 'Moderate',
  LUXURY = 'Luxury'
}

export enum TransportMode {
  FLIGHT = 'Flight',
  TRAIN = 'Train',
  BUS = 'Bus',
  CRUISE = 'Cruise',
  CAR = 'Car'
}

export enum TravelerType {
  SOLO = 'Solo',
  COUPLE = 'Couple',
  FAMILY = 'Family',
  FRIENDS = 'Friends'
}

export interface TravelerCount {
  adults: number;
  children: number;
  seniors: number;
  infants: number;
}

export interface GroupPreferences {
  genderPreference: 'any' | 'female' | 'male';
}

export interface TripPreferences {
  origin: string;
  destination: string;
  additionalDestinations: string[];
  startDate: string;
  endDate: string;
  durationDays: number;
  budgetType: BudgetType;
  budgetAmount: number; // Numeric value
  travelers: TravelerCount;
  travelerType: TravelerType; // New field
  joinStrangerGroup: boolean; // New field
  groupPreferences?: GroupPreferences; // Optional for backward compatibility
  transportModes: TransportMode[];
  hireGuide: boolean;
  interests: string[];
}

export interface Activity {
  time: string;
  activity: string;
  description: string;
  location: string;
  estimatedCost: number;
}

export interface DayPlan {
  day: number;
  theme: string;
  activities: Activity[];
}

export interface Itinerary {
  tripName: string;
  destinationOverview: string;
  totalEstimatedCost: number;
  currency: string;
  dailyItinerary: DayPlan[];
  packingList: string[];
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  paidBy: string; // userId of the person who paid
  splitBetween: string[]; // userIds of people who should pay
  date: number; // timestamp
  category?: string;
  customCategory?: string; // For when category is "Other"
}

export interface SavedTrip extends Itinerary {
  id: string;
  userId: string; // ID of the user who created the trip
  createdAt: number;
  preferences: TripPreferences;
  isBooked?: boolean; // New field
  joiners?: string[]; // Users who have joined this trip
  expenses?: Expense[]; // Trip expenses
}

export interface GuideProfile {
  id: string;
  name: string;
  location: string;
  expertise: string[];
  rating: number;
  reviews: number;
  imageUrl: string;
  languages: string[];
  pricePerDay: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface UserData extends User {
  onboardingCompleted?: boolean;
}