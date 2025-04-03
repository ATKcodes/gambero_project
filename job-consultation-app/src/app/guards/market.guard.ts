import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MarketGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    console.log('MarketGuard running');
    
    // Get token from query params if available
    const token = route.queryParams['token'];
    if (token) {
      console.log('Token found in URL, token:', token.substring(0, 10) + '...');
      
      // Try to get existing user from localStorage
      let storedUser = localStorage.getItem('user');
      let user;
      
      if (storedUser) {
        user = JSON.parse(storedUser);
        user.token = token;
        localStorage.setItem('user', JSON.stringify(user));
        console.log('Updated existing user with token, userType:', user.userType);
      } else {
        // Create a minimal user object with the token
        user = {
          id: '',
          username: '',
          email: '',
          userType: 'pending',
          token: token
        };
        localStorage.setItem('user', JSON.stringify(user));
        console.log('Created new user with token');
      }
      
      // For token in URL, always try to refresh user data first
      return this.authService.refreshUserData().pipe(
        switchMap(userData => {
          if (userData) {
            console.log('User data refreshed:', userData.userType);
            // If user needs profile completion, redirect now
            if (userData.userType === 'pending') {
              console.log('User pending, redirecting to profile completion');
              this.router.navigate(['/complete-profile'], { 
                queryParams: { token }
              });
              return of(false);
            }
          }
          
          return of(true);
        })
      );
    }
    
    // Check if user has a complete profile
    const user = this.authService.getUser();
    if (user) {
      console.log('User type check:', user.userType);
      // Check if profile is incomplete
      if (user.userType === 'pending') {
        console.log('Redirecting to profile completion');
        // Redirect to profile completion with token
        this.router.navigate(['/complete-profile'], { 
          queryParams: { token: user.token }
        });
        return of(false);
      }
      return of(true);
    }
    
    // Not logged in, redirect to login
    console.log('No user found, redirecting to login');
    this.router.navigate(['/login']);
    return of(false);
  }
} 