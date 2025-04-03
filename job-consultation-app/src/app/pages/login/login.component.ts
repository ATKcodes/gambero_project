import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonCard, IonCardContent, 
  IonItem, IonInput, IonRadioGroup, IonRadio, IonButton, ToastController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

// Color palette for the app
// Primary color: #FFEBC3
// Secondary color: #FF7532
// Tertiary color: ?

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
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
})
export class LoginComponent implements OnInit {
  isLogin = true;
  username = '';
  email = '';
  password = '';
  fullName = '';
  userType: 'client' | 'seller' = 'client';
  isSubmitting = false;
  apiStatus = 'Not tested';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private http: HttpClient
  ) {}
  
  ngOnInit() {
    console.log('Login component initialized');
    console.log('API URL:', environment.apiUrl);
    this.checkLocalStorage();
    
    // Test API connection on startup
    this.testApiConnection();
  }

  // Test API connectivity
  testApiConnection() {
    this.apiStatus = 'Testing...';
    console.log('Testing API connection to:', `${environment.apiUrl}/test`);
    
    this.http.get(`${environment.apiUrl}/test`).subscribe({
      next: (response) => {
        console.log('API connection successful:', response);
        this.apiStatus = 'Connected ✅';
        this.showToast('API connection successful!', 'success');
      },
      error: (error) => {
        console.error('API connection failed:', error);
        this.apiStatus = 'Failed ❌';
        this.showToast(`API connection failed: ${error.message}`, 'danger');
      }
    });
  }

  // Check if localStorage is working properly on this device
  checkLocalStorage() {
    try {
      localStorage.setItem('test', 'test');
      const test = localStorage.getItem('test');
      if (test === 'test') {
        console.log('✅ localStorage is working properly');
      } else {
        console.warn('⚠️ localStorage set/get mismatch');
      }
      localStorage.removeItem('test');
    } catch (e) {
      console.error('❌ localStorage is not available:', e);
      this.showToast('Storage access issue. App may not work properly.');
    }
  }

  toggleMode(): void {
    this.isLogin = !this.isLogin;
    console.log('Mode toggled:', this.isLogin ? 'Login' : 'Register');
  }

  handleAuth(): void {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    console.log('Handling auth with:', { 
      isLogin: this.isLogin, 
      email: this.email,
      username: this.username,
      fullName: this.fullName,
      userType: this.userType
    });
    
    if (this.isLogin) {
      this.authService.login(this.email, this.password).subscribe({
        next: () => {
          console.log('Login successful, navigating to market');
          this.router.navigate(['/market']);
        },
        error: (err: Error) => {
          console.error('Login error:', err);
          this.showToast(`Login failed: ${err.message}`);
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      this.authService.register(this.username, this.email, this.password, this.userType, this.fullName).subscribe({
        next: () => {
          console.log('Registration successful, navigating to market');
          this.router.navigate(['/market']);
        },
        error: (err: Error) => {
          console.error('Registration error:', err);
          this.showToast(`Registration failed: ${err.message}`);
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    }
  }

  async showToast(message: string, color: 'danger' | 'success' = 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: color
    });
    toast.present();
  }

  login42(): void {
    console.log('Attempting login with 42');
    
    // Get the 42 OAuth URL and redirect the user
    this.authService.get42LoginUrl().subscribe({
      next: (url) => {
        if (url) {
          // Redirect to 42 OAuth page
          console.log('Redirecting to 42 OAuth:', url);
          window.location.href = url;
        } else {
          console.error('Failed to get 42 OAuth URL');
          this.showToast('Failed to get 42 OAuth URL');
        }
      },
      error: (err: Error) => {
        console.error('42 login error:', err);
        this.showToast(`42 login error: ${err.message}`);
      }
    });
  }
} 