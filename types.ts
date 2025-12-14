
export interface WeightEntry {
  id: string;
  date: string; // ISO string
  weight: number; // kg
}

export interface BodyMeasurements {
  bust: number;
  waist: number;
  tummy: number;
  hips: number;
  thighRight: number;
  thighLeft: number;
  armRight: number;
  armLeft: number;
  calfRight: number;
  calfLeft: number;
}

export interface MeasurementEntry {
  id: string;
  date: string; // ISO string
  measurements: BodyMeasurements;
  syncedWeight?: number; // Weight at time of measurement
}

export interface FoodEntry {
  id: string;
  date: string; // ISO string
  name: string;
  calories: number;
  imageUrl?: string;
  type?: string; // Optional user description
}

export interface ExerciseEntry {
  id: string;
  date: string; // ISO string
  name: string;
  durationMinutes: number;
  caloriesBurned: number;
  steps?: number; // Added steps tracking
}

export interface FixDepositEntry {
  id: string;
  bankName: string;
  slipNumber: string;
  principal: number;
  interestRate: number;
  startDate: string; // ISO string
  maturityDate: string; // ISO string
  dividend: number;
}

export interface UserProfile {
  id: string; // Unique ID for profile
  name: string;
  gender: 'male' | 'female';
  age: number;
  heightCm: number;
  targetWeight?: number;
}

export type AppView = 'dashboard' | 'food' | 'exercise' | 'body' | 'stats' | 'settings';

export interface DailyStats {
  date: string;
  intake: number;
  burned: number; // Exercise
  bmr: number;
  net: number;
  exerciseMinutes: number;
}
