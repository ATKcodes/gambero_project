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

  async showToast(message: string, color: 'danger' | 'success' | 'warning' = 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: color
    });
    toast.present();
  }

  login42() {
    console.log('Initiating 42 OAuth login flow');
    this.showLoading = true;
    console.log('Platform info:', {
      isCapacitor: this.platform.is('capacitor'),
      isAndroid: this.platform.is('android'),
      isMobile: this.platform.is('mobile'),
      platforms: this.platform.platforms()
    });
    
    this.authService.get42LoginUrl().subscribe({
      next: (url) => {
        this.showLoading = false;
        if (url) {
          console.log('42 login URL received:', url);
          
          // IMPORTANT: For browser testing on localhost, we need to use direct href
          const isLocalhost = window.location.hostname === 'localhost' || 
                              window.location.hostname === '127.0.0.1';
                              
          if (isLocalhost && !url.includes('com.jobconsultation.app://')) {
            console.log('Browser detected, redirecting directly to:', url);
            window.location.href = url;
            return;
          }
          
          // For mobile app
          if (this.platform.is('capacitor') || this.platform.is('android')) {
            console.log('Mobile app detected, opening in system browser');
            window.open(url, '_system');
          } else {
            console.log('Redirecting to browser OAuth URL:', url);
            window.location.href = url;
          }
        } else {
          console.error('Failed to get 42 login URL');
          this.showToast('Failed to connect to 42 authentication service', 'danger');
        }
      },
      error: (err) => {
        console.error('Error getting 42 login URL:', err);
        this.showLoading = false;
        this.showToast('Error connecting to authentication service', 'danger');
      }
    });
  }
} 