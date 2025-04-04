import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonCard, IonCardContent, 
  IonItem, IonInput, IonRadioGroup, IonRadio, IonButton, ToastController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';

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
  connectionDetails = '';
  showLoading = false;
  oauthRedirectUris: { web: string, mobile: string } | null = null;
  showOAuthInfo = false;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private toastController: ToastController,
    private http: HttpClient,
    private platform: Platform
  ) {}
  
  ngOnInit() {
    console.log('Login component initialized');
    console.log('API URL:', environment.apiUrl);
    this.checkLocalStorage();
    
    // Subscribe to API connectivity status
    this.apiService.apiConnectivity.subscribe(status => {
      this.apiStatus = status;
      
      if (status === 'Connected') {
        this.showToast('Connected to backend server!', 'success');
      } else if (status === 'Failed') {
        this.showToast('Failed to connect to backend. Please check network settings.', 'danger');
      }
    });
  }

  // Test API connectivity
  testApiConnection() {
    this.apiStatus = 'Testing...';
    this.apiService.checkConnectivity();
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
    if (this.apiStatus !== 'Connected') {
      this.showToast('Not connected to server. Please wait or try reconnecting.', 'warning');
      this.testApiConnection();
      return;
    }
    
    this.isSubmitting = true;
    console.log('Handling auth with:', { 
      isLogin: this.isLogin, 
      email: this.email,
      username: this.username,
      fullName: this.fullName,
      userType: this.userType
    });
    
    // For quicker testing: hard-code a successful login
    if (this.email === 'test@test.com' && this.password === 'test') {
      const mockUser = {
        id: '123',
        username: this.username || 'testuser',
        email: this.email,
        userType: this.userType,
        token: 'mock-token-12345'
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      this.showToast('Login successful!', 'success');
      setTimeout(() => this.router.navigate(['/market']), 1000);
      this.isSubmitting = false;
      return;
    }
    
    if (this.isLogin) {
      this.authService.login(this.email, this.password).subscribe({
        next: (response) => {
          console.log('Login successful, navigating to market');
          this.showToast('Login successful!', 'success');
          this.router.navigate(['/market']);
        },
        error: (err: Error) => {
          console.error('Login error:', err);
          
          // Show user-friendly error messages
          if (err.message.includes('Invalid credentials') || 
              err.message.includes('401') ||
              err.message.toLowerCase().includes('password')) {
            this.showToast('Invalid email or password. Please try again.', 'danger');
          } else if (err.message.includes('404')) {
            this.showToast('User not found. Please check your email address.', 'danger');
          } else if (err.message.includes('Network Error') || err.message.includes('Failed')) {
            this.showToast('Connection error. Please check your internet connection.', 'warning');
          } else {
            this.showToast(`Login failed: ${err.message}`, 'danger');
          }
          
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

  async showToast(message: string, color: 'danger' | 'success' | 'warning' = 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: color
    });
    toast.present();
  }

  loginWith42() {
    console.log('Attempting 42 OAuth login');
    this.showLoading = true;
    
    this.authService.get42LoginUrl().subscribe({
      next: (url) => {
        if (url) {
          console.log('Navigating to 42 OAuth URL:', url);
          window.location.href = url;
        } else {
          this.showToast('Failed to connect to 42 OAuth', 'danger');
          this.showLoading = false;
        }
      },
      error: (err) => {
        console.error('Error getting 42 OAuth URL:', err);
        this.showToast('Error connecting to 42 OAuth', 'danger');
        this.showLoading = false;
      }
    });
  }
  
  showOAuthRedirectInfo() {
    this.showOAuthInfo = true;
    this.showLoading = true;
    
    this.apiService.getOAuthConfigInfo().subscribe({
      next: (info) => {
        this.oauthRedirectUris = {
          web: info.webRedirectUri,
          mobile: info.mobileRedirectUri
        };
        this.showLoading = false;
      },
      error: (err) => {
        console.error('Error getting OAuth config:', err);
        this.showToast('Could not retrieve OAuth configuration', 'danger');
        this.showLoading = false;
      }
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Copied to clipboard', 'success');
    }).catch(err => {
      console.error('Could not copy text: ', err);
      this.showToast('Failed to copy to clipboard', 'danger');
    });
  }
} 