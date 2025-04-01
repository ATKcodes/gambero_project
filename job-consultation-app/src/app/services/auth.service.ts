import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface User {
  id: string;
  username: string;
  email: string;
  userType: string;
  token?: string;
  createdAt?: Date; // Added for compatibility with view-profile component
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    // Try to get user from localStorage
    const storedUser = localStorage.getItem('user');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  register(username: string, email: string, password: string, userType: string): Observable<User> {
    return this.apiService.register(username, email, password, userType).pipe(
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
        return user;
      })
    );
  }

  login(email: string, password: string): Observable<User> {
    return this.apiService.login(email, password).pipe(
      switchMap(response => {
        if (response && response.token) {
          // Get user info
          return this.apiService.getCurrentUser().pipe(
            map(userResponse => {
              const user: User = {
                id: userResponse._id,
                username: userResponse.username,
                email: userResponse.email,
                userType: userResponse.userType,
                token: response.token,
                createdAt: new Date(userResponse.createdAt || Date.now())
              };
              
              // Store user in localStorage
              localStorage.setItem('user', JSON.stringify(user));
              this.currentUserSubject.next(user);
              return user;
            })
          );
        }
        throw new Error('Invalid login response');
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  loginWith42(token: string): Observable<User> {
    return this.apiService.loginWith42(token).pipe(
      switchMap(response => {
        if (response && response.token) {
          // Get user info
          return this.apiService.getCurrentUser().pipe(
            map(userResponse => {
              const user: User = {
                id: userResponse._id,
                username: userResponse.username,
                email: userResponse.email,
                userType: userResponse.userType,
                token: response.token,
                createdAt: new Date(userResponse.createdAt || Date.now())
              };
              
              // Store user in localStorage
              localStorage.setItem('user', JSON.stringify(user));
              this.currentUserSubject.next(user);
              return user;
            })
          );
        }
        throw new Error('Invalid login response');
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  logout(): void {
    // Remove user from localStorage
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
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
} 