
export enum Language {
  TAMIL = 'ta',
  ENGLISH = 'en'
}

export interface Message {
  id: string;
  title: string;
  subtitle?: string;
  date: string;
  duration: string;
  videoUrl: string; // YouTube Link
  videoId: string;  // Extracted YouTube ID
  thumbnail: string;
  partNumber?: number;
  createdAt: string;
  subMessages?: Message[];
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  messageIds: string[];
}

export interface DailyVerse {
  verse: string;
  reference: string;
}
