import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  IonContent,
  IonSpinner
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [
    CommonModule, 
    IonContent,
    IonSpinner
  ],
  template: `
    <ion-content class="ion-padding">
      <div class="callback-container">
        <ion-spinner name="circles"></ion-spinner>
        <h2>{{ message }}</h2>
      </div>
    </ion-content>
  `,
  styles: [`
    .callback-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      text-align: center;
    }
    
    ion-spinner {
      width: 48px;
      height: 48px;
      margin-bottom: 20px;
    }
    
    h2 {
      color: var(--ion-color-primary);
    }
  `]
})
export class OAuthCallbackComponent implements OnInit {
  message = 'Processing your login...';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    console.log('OAuth callback component initialized');
    
    // Handle OAuth callback
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const error = params['error'];
      
      if (error) {
        console.error('OAuth error:', error);
        this.message = 'Authentication failed. Please try again.';
        setTimeout(() => this.router.navigate(['/login']), 2000);
        return;
      }
      
      if (!code) {
        console.error('No authorization code received');
        this.message = 'No authorization code received.';
        setTimeout(() => this.router.navigate(['/login']), 2000);
        return;
      }
      
      console.log('Exchanging code for token...');
      
      // Exchange code for token
      this.authService.loginWith42(code).subscribe({
        next: (user) => {
          if (user) {
            console.log('Login successful, user type:', user.userType);
            this.message = 'Login successful!';
            
            if (user.userType === 'pending') {
              console.log('User needs to complete profile, redirecting...');
              setTimeout(() => this.router.navigate(['/complete-profile']), 1000);
            } else {
              console.log('User already has complete profile, redirecting to market...');
              setTimeout(() => this.router.navigate(['/market']), 1000);
            }
          } else {
            console.error('Failed to get user data after code exchange');
            this.message = 'Login failed. Please try again.';
            setTimeout(() => this.router.navigate(['/login']), 2000);
          }
        },
        error: (err) => {
          console.error('Error processing OAuth callback:', err);
          console.error('Full error details:', JSON.stringify(err, null, 2));
          this.message = `Error: ${err.message || 'Unknown error'}. Please try again.`;
          setTimeout(() => this.router.navigate(['/login']), 3000);
        }
      });
    });
  }
} 