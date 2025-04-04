export interface User {
  id: string;
  username: string;
  email: string;
  userType: string;
  fullName?: string;
  token?: string;
  createdAt?: Date; // Added for compatibility with view-profile component
  profileImage?: string;
} 