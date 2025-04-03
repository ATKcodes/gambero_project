import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonContent, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonSelect, 
  IonSelectOption, 
  IonButton,
  ToastController
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-profile-completion',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton
  ],
  template: `
    <ion-content class="ion-padding">
      <div class="container">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Complete Your Profile</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <p class="welcome-text">
              Welcome! Your account has been created using 42 authentication.
              Please provide the following information to complete your profile.
            </p>
            
            <div class="form-field">
              <ion-item>
                <ion-label position="floating">Username</ion-label>
                <ion-input [(ngModel)]="username" type="text"></ion-input>
              </ion-item>
            </div>
            
            <div class="form-field">
              <ion-item>
                <ion-label position="floating">Account Type</ion-label>
                <ion-select [(ngModel)]="userType">
                  <ion-select-option value="client">Client (I want to hire consultants)</ion-select-option>
                  <ion-select-option value="seller">Seller (I want to offer consultations)</ion-select-option>
                </ion-select>
              </ion-item>
            </div>
            
            <div class="button-container">
              <ion-button expand="block" (click)="completeProfile()">
                Complete Profile
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      background-color: var(--ion-color-tertiary);
    }
    
    ion-card {
      max-width: 500px;
      width: 100%;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    ion-card-header {
      background-color: var(--ion-color-primary);
    }
    
    ion-card-title {
      color: white;
      text-align: center;
      font-size: 1.8rem;
    }
    
    .welcome-text {
      text-align: center;
      margin-bottom: 24px;
      color: var(--ion-color-dark);
    }
    
    .form-field {
      margin-bottom: 16px;
    }
    
    .button-container {
      margin-top: 32px;
    }
    
    ion-button {
      --background: var(--ion-color-primary);
    }
  `]
})
export class ProfileCompletionComponent implements OnInit {
  username: string = '';
  userType: 'client' | 'seller' = 'client';
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private apiService: ApiService,
    private toastCtrl: ToastController
  ) {}
  
  ngOnInit() {
    console.log('ProfileCompletionComponent initialized');
    
    // Check if token is in URL params and update local storage if needed
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        console.log('Token found in URL for profile completion');
        
        // Get stored user
        let storedUser = localStorage.getItem('user');
        let user;
        
        if (storedUser) {
          user = JSON.parse(storedUser);
          user.token = token;
          console.log('Updated existing user with token');
        } else {
          // Create a minimal user object with the token
          user = {
            id: '',
            username: this.username,
            email: '',
            userType: 'pending',
            token: token
          };
          console.log('Created new user with token');
        }
        
        localStorage.setItem('user', JSON.stringify(user));
        
        // Force BehaviorSubject update in AuthService
        this.authService.updateUserFromStorage();
        
        // If we don't have a valid auth service user yet, set it
        if (!this.authService.getUser() || !this.authService.getUser()?.id) {
          console.log('Refreshing user data from API');
          // Try to refresh user data if we have a token
          this.authService.refreshUserData().subscribe({
            next: (userData) => {
              if (userData && userData.username) {
                console.log('User data refreshed, username:', userData.username);
                this.username = userData.username;
              }
            },
            error: (err) => {
              console.error('Error refreshing user data:', err);
            }
          });
        }
      } else {
        console.log('No token in URL for profile completion');
      }
    });
    
    // If user is already logged in, prefill username
    const currentUser = this.authService.getUser();
    if (currentUser) {
      console.log('Current user found, username:', currentUser.username);
      this.username = currentUser.username || '';
    } else {
      console.log('No current user found');
    }
  }
  
  completeProfile() {
    if (!this.username) {
      this.showToast('Please enter a username');
      return;
    }
    
    this.apiService.post('/auth/complete-profile', {
      username: this.username,
      userType: this.userType
    }).subscribe({
      next: (response: any) => {
        // Update stored user
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          user.username = this.username;
          user.userType = this.userType;
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        this.showToast('Profile completed successfully');
        this.router.navigate(['/market']);
      },
      error: (error) => {
        console.error('Error completing profile:', error);
        this.showToast('Failed to complete profile. Please try again.');
      }
    });
  }
  
  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }
} 