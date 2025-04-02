import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonCard, IonCardContent, 
  IonItem, IonInput, IonRadioGroup, IonRadio, IonButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// Color palette for the app
// Primary color: #FFEBC3
// Secondary color: #FF7532
// Tertiary color: ?

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonCard,
    IonCardContent,
    IonItem,
    IonInput,
    IonRadioGroup,
    IonRadio,
    IonButton
  ],
  template: `
   <div class="login-container">
    <div class="logo-section">
      <div class="logo">
        <h1>JC</h1>
        <p>Quick Question? Cheap answer</p>
      </div>
    </div>
    <div class="form-section">
      <ion-card>
        <ion-card-content>
          <div class="form-field" *ngIf="!isLogin">
            <ion-input 
              class="input-field"
              label="Username" 
              labelPlacement="floating"
              placeholder="Enter your username"
              type="text" 
              [ngModel]="username" 
              (ngModelChange)="username = $event">
            </ion-input>
          </div>
          
          <div class="form-field" *ngIf="!isLogin">
            <ion-input 
              class="input-field"
              label="Full Name" 
              labelPlacement="floating"
              placeholder="Enter your full name"
              type="text" 
              [ngModel]="fullName" 
              (ngModelChange)="fullName = $event">
            </ion-input>
          </div>
          
          <div class="form-field email-field">
            <ion-input 
              class="input-field email-input"
              label="Email" 
              labelPlacement="floating"
              placeholder="Enter your email"
              type="email" 
              [ngModel]="email" 
              (ngModelChange)="email = $event">
            </ion-input>
          </div>
            
            <div class="form-field password-field">
            <ion-input 
              class="input-field"
              label="Password" 
              labelPlacement="floating"
              placeholder="Enter your password"
              type="password" 
              [ngModel]="password" 
              (ngModelChange)="password = $event">
            </ion-input>
          </div>
            
            <ion-radio-group *ngIf="!isLogin" [ngModel]="userType" (ngModelChange)="userType = $event">
              <ion-item lines="none">
                <ion-radio value="client">I want to hire a consultant</ion-radio>
              </ion-item>
              <ion-item lines="none"> 
                <ion-radio value="seller">I want to offer consultations</ion-radio>
              </ion-item>
            </ion-radio-group>
            
            <div class="ion-padding button-container">
              <ion-button expand="block" (click)="handleAuth()" class="login-button">
                {{ isLogin ? 'Login' : 'Register' }}
              </ion-button>
              
              <ion-button *ngIf="isLogin" expand="block" class="secondary-button" (click)="login42()">
                Login with 42
              </ion-button>
              
              <ion-button expand="block" fill="clear" (click)="toggleMode()" class="toggle-button">
                {{ isLogin ? 'Need an account? Register' : 'Already have an account? Login' }}
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
      background-color: var(--ion-color-tertiary);
    }
    
    .login-container {
      height: 100vh;
      display: flex;
      background-color: var(--ion-color-tertiary);
      padding-left: 3rem;
    }
    
    .logo-section {
      margin-left: 10rem;
      width: 25%;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
    }
    
    .logo {
      text-align: center;
      color: #FF7532;
    }
    
    .logo h1 {
      font-size: 5rem;
      font-weight: bold;
      margin: 0;
    }
    
    .logo p {
      font-size: 1.5rem;
      margin-top: 0.5rem;
      max-width: 200px;
      line-height: 1.4;
    }
    
    .form-section {
      margin-left: 12rem;
      width: 80%;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
    }
    
    ion-card {
      max-width: 500px;
      width: 100%;
      background-color: #FF7532;
      color: white;
      border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }
    
    ion-card-content {
      padding: 2rem;
    }
    
    ion-card-title {
      color: white;
      font-size: 1.8rem;
      font-weight: bold;
      text-align: center;
    }

    .email-field, .password-field {
      margin-top: 2rem;
    }
    
    .input-field {
      --background: white;
      --color: black;
      --placeholder-color: #666;
      --border-radius: 8px;
      --padding-start: 12px;
      --padding-end: 12px;
      margin-bottom: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .email-input {
      --text-align: center;
    }
    
    .form-field {
      margin-bottom: 24px;
    }
    
    ion-item {
      --background: transparent;
      margin-bottom: 8px;
      --color: white;
    }
    
    ion-radio {
      --color-checked: white;
      --color: white;
    }
    
    .button-container {
      margin-top: 2.5rem;
    }
    
    .login-button {
      --background: var(--ion-color-primary);
      --color: white;
      margin-bottom: 1rem;
    }
    
    .secondary-button {
      --background: #FFEBC3;
      --color: #333;
      margin-bottom: 1rem;
    }
    
    .toggle-button {
      --color: white;
      margin-top: 0.5rem;
    }
    
    /* Responsive design for smaller screens */
    @media (max-width: 768px) {
      .login-container {
        flex-direction: column;
        padding-left: 1rem;
        padding-right: 1rem;
      }
      
      .logo-section, .form-section {
        width: 100%;
        padding: 1rem;
      }
      
      .logo-section {
        height: 25%;
      }
      
      .form-section {
        height: 75%;
      }
      
      .logo p {
        max-width: 100%;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  isLogin = true;
  username = '';
  email = '';
  password = '';
  fullName = '';
  userType: 'client' | 'seller' = 'client';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit() {
    console.log('Login component initialized');
  }

  toggleMode(): void {
    this.isLogin = !this.isLogin;
    console.log('Mode toggled:', this.isLogin ? 'Login' : 'Register');
  }

  handleAuth(): void {
    console.log('Handling auth with:', { 
      isLogin: this.isLogin, 
      email: this.email,
      username: this.username,
      fullName: this.fullName,
      userType: this.userType
    });
    
    if (this.isLogin) {
      this.authService.login(this.email, this.password).subscribe({
        next: () => this.router.navigate(['/market']),
        error: (err: Error) => console.error('Login error:', err)
      });
    } else {
      this.authService.register(this.username, this.email, this.password, this.userType, this.fullName).subscribe({
        next: () => {
          this.isLogin = true;
          this.router.navigate(['/market']);
        },
        error: (err: Error) => console.error('Registration error:', err)
      });
    }
  }

  login42(): void {
    console.log('Attempting login with 42');
    this.authService.loginWith42('mock-token').subscribe({
      next: () => this.router.navigate(['/market']),
      error: (err: Error) => console.error('42 login error:', err)
    });
  }
} 