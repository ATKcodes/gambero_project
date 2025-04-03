import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Platform } from '@ionic/angular';

export interface User {
  id: string;
  username: string;
  email: string;
  userType: string;
  token?: string;
  createdAt?: Date; // Added for compatibility with view-profile component
  profileImage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private platform: Platform
  ) {
    // Try to get user from localStorage
    const storedUser = localStorage.getItem('user');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
    console.log('AuthService initialized, stored user:', storedUser ? 'found' : 'not found');
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  register(username: string, email: string, password: string, userType: string, fullName: string): Observable<User> {
    console.log('Register attempt:', { username, email, userType, fullName });
    
    return this.apiService.register(username, email, password, userType, fullName).pipe(
      tap(response => console.log('Register response:', response)),
      map(response => {
        // Create user object with the token
        const user: User = {
          id: response.user?.id || '',
          username,
          email,
          userType,
          token: response.token
        };
        
        // Store user in localStorage
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
        console.log('User registered successfully:', user);
        return user;
      }),
      catchError(error => {
        console.error('Registration error details:', error);
        throw error;
      })
    );
  }

  login(email: string, password: string): Observable<User> {
    console.log('Login attempt for:', email);
    
    return this.apiService.login(email, password).pipe(
      tap(response => console.log('Login response:', response)),
      map(response => {
        if (response && response.token) {
          // Create a minimal user object with the token
          const user: User = {
            id: response.user?._id || '',
            username: response.user?.username || '',
            email: email,
            userType: response.user?.userType || '',
            token: response.token
          };
          
          // Store user in localStorage
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next(user);
          console.log('User logged in successfully:', user);
          
          // Return the user
          return user;
        }
        console.error('Invalid login response structure:', response);
        throw new Error('Invalid login response');
      }),
      catchError(error => {
        console.error('Login error details:', error);
        throw error;
      })
    );
  }

  loginWith42(code: string): Observable<User | null> {
    return this.apiService.loginWith42Code(code).pipe(
      map(response => {
        if (response && response.token) {
          const user: User = {
            id: response.userData?._id || '',
            username: response.userData?.username || '',
            email: response.userData?.email || '',
            userType: response.userData?.userType || 'client',
            token: response.token,
            profileImage: response.userData?.profileImage
          };
          
          // Store user in localStorage
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next(user);
          
          // If new user, navigate to profile completion
          if (response.isNewUser) {
            this.router.navigate(['/complete-profile']);
          }
          
          return user;
        }
        // Handle case when response doesn't contain a token
        console.error('Invalid 42 login response - no token found');
        return null;
      }),
      catchError(error => {
        console.error('Error during 42 login:', error);
        return of(null);
      })
    );
  }

  get42LoginUrl(): Observable<string | null> {
    console.log('Getting 42 OAuth URL');
    
    // Check if we're running on a mobile device
    const isMobile = this.isPlatformMobile();
    
    return this.apiService.get42LoginUrl(isMobile).pipe(
      map(response => {
        if (response && response.url) {
          console.log('Received 42 OAuth URL:', response.url);
          return response.url;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error getting 42 OAuth URL:', error);
        return of(null);
      })
    );
  }

  // Check if we're running on a mobile platform
  private isPlatformMobile(): boolean {
    // Simple check - if we're in a Capacitor container, we're on mobile
    return typeof (window as any).Capacitor !== 'undefined';
  }

  logout(): void {
    // Remove user from localStorage
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    // First check if we have a user in the BehaviorSubject
    if (!!this.currentUserSubject.value) {
      return true;
    }
    
    // If not, check localStorage directly for a user with a token
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user && user.token) {
          console.log('Found user with token in localStorage but not in AuthService, updating...');
          // Update the BehaviorSubject
          this.currentUserSubject.next(user);
          return true;
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    
    return false;
  }

  getUser(): User | null {
    return this.currentUserSubject.value;
  }

  getUserType(): string {
    return this.currentUserSubject.value?.userType || '';
  }

  getToken(): string | undefined {
    return this.currentUserSubject.value?.token;
  }

  refreshUserData(): Observable<User | null> {
    // Only try to refresh if we have a token
    if (this.getToken()) {
      return this.apiService.getCurrentUser().pipe(
        map(userResponse => {
          if (userResponse) {
            const currentUser = this.getUser();
            const user: User = {
              id: userResponse._id,
              username: userResponse.username,
              email: userResponse.email,
              userType: userResponse.userType,
              token: currentUser?.token || '',
              createdAt: new Date(userResponse.createdAt || Date.now()),
              profileImage: userResponse.profileImage
            };
            
            // Store user in localStorage
            localStorage.setItem('user', JSON.stringify(user));
            this.currentUserSubject.next(user);
            return user;
          }
          return null;
        }),
        catchError(error => {
          console.error('Error refreshing user data:', error);
          return of(null);
        })
      );
    }
    return of(null);
  }
  
  // Directly update the BehaviorSubject from localStorage
  updateUserFromStorage(): void {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
        console.log('Updated auth service user from storage, userType:', user.userType);
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
  }
} 