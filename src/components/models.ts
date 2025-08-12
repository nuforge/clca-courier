export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  date: string;
  category: 'announcement' | 'event' | 'news';
  featured: boolean;
}

export interface Classified {
  id: string;
  title: string;
  description: string;
  price?: string;
  // Updated to include 'free' category
  category: 'for-sale' | 'services' | 'wanted' | 'free';
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  datePosted: string;
  featured: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
}
