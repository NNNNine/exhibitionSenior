/**
 * User role enumeration
 */
export enum UserRole {
    VISITOR = 'visitor',
    ARTIST = 'artist',
    CURATOR = 'curator',
    ADMIN = 'admin'
  }
  
  /**
   * User interface - represents a user in the system
   */
  export interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    profileUrl?: string;
    preferences?: any;
    createdAt: string;
    updatedAt: string;
  }
  
  /**
   * Registration data interface
   */
  export interface RegistrationData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
  }
  
  /**
   * Login data interface
   */
  export interface LoginData {
    email: string;
    password: string;
  }
  
  /**
   * Profile update data interface
   */
  export interface ProfileUpdateData {
    username?: string;
    email?: string;
    profileUrl?: string;
    preferences?: any;
  }
  
  /**
   * Password change data interface
   */
  export interface PasswordChangeData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }
  
  /**
   * Auth response interface
   */
  export interface AuthResponse {
    user: User;
    token: string;
    refreshToken: string;
  }