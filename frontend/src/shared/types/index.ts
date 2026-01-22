export interface User {
  id: string;
  email: string;
  name: string ; //không để name null được
  bio: string | null;
  avatarUrl: string | null;
//   isActive: boolean;
//   googleId: string | null;
//   createdAt: string; // ISO date string
//   updatedAt: string; // ISO date string
}

export interface Workspace {
  id: string;
  title: string;
  description: string | null;
  visibility: 'private' | 'public';
  updatedAt: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface UpdateUserRequest {
  name?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface OAuthResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Board {
  id: string
  name: string
  description?: string | null
  lists?: number
  members?: number
}

export interface Workspace {
  id: string
  title: string
  description: string | null
  visibility: "private" | "public"
  updatedAt: string
  createdAt: string
  boards?: Board[] 
}

