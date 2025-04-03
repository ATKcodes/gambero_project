import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Check if there's a token in the URL (coming from OAuth)
    const token = route.queryParams['token'];
    if (token) {
      console.log('AuthGuard: Token found in URL, allowing access');
      
      // Save token to localStorage if not already there
      let storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        user.token = token;
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        // Create a minimal user with the token
        const newUser = {
          id: '',
          username: '',
          email: '',
          userType: 'pending',
          token: token
        };
        localStorage.setItem('user', JSON.stringify(newUser));
      }
      
      // Force update AuthService
      this.authService.updateUserFromStorage();
      
      // Allow access to complete profile
      return true;
    }
    
    const isLoggedIn = this.authService.isLoggedIn();
    console.log('AuthGuard: isLoggedIn =', isLoggedIn);
    
    if (isLoggedIn) {
      return true;
    }
    
    console.log('AuthGuard: redirecting to login page');
    // Redirect to login page if not authenticated
    return this.router.createUrlTree(['/login']);
  }
} 