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
        error: (err: Error) => {
          console.error('Login error:', err);
          this.showError('Invalid email or password. Please try again.');
        }
      });
    } else {
      this.authService.register(this.username, this.email, this.password, this.userType, this.fullName).subscribe({
        next: () => {
          this.isLogin = true;
          this.router.navigate(['/market']);
        },
        error: (err: Error) => {
          console.error('Registration error:', err);
          this.showError('Registration failed. Please try again.');
        }
      });
    }
  }

  showError(message: string): void {
    // Create and append error message
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    errorElement.style.color = 'red';
    errorElement.style.marginTop = '10px';
    errorElement.style.textAlign = 'center';
    
    // Remove any existing error messages
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(el => el.remove());
    
    // Find the form container and append the error
    const formContainer = document.querySelector('.form-section');
    if (formContainer) {
      formContainer.appendChild(errorElement);
      
      // Auto-remove the error after 5 seconds
      setTimeout(() => {
        errorElement.remove();
      }, 5000);
    }
  }

  login42(): void {
    console.log('Attempting login with 42');
    
    // Get the 42 OAuth URL and redirect the user
    this.authService.get42LoginUrl().subscribe({
      next: (url) => {
        if (url) {
          // Redirect to 42 OAuth page
          window.location.href = url;
        } else {
          console.error('Failed to get 42 OAuth URL');
        }
      },
      error: (err: Error) => console.error('42 login error:', err)
    });
  }
} 