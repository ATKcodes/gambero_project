import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
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