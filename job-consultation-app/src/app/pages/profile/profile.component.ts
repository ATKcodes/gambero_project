import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { ApiService } from '../../services/api.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  isSeller = false;
  isClient = false;
  isEditMode = false;
  
  // User profile data
  username = '';
  fullName = '';
  email = '';
  profileImage = '';
  password = '';
  newPassword = '';
  confirmPassword = '';
  
  // Client specific data
  creditCards: any[] = [];
  newCardNumber = '';
  newCardHolder = '';
  newCardExpiry = '';
  
  // Seller specific data 
  credit = 0;
  minimumPrice = 2; // Default minimum price is 2€
  areasOfExpertise: string[] = [];
  availableExpertiseAreas = ['Pastry', 'Vegetarian', 'Italian', 'Meats and fishes', 'Wines'];
  
  // JSONPlaceholder API
  jsonPlaceholderUrl = 'https://jsonplaceholder.typicode.com';
  
  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private toastCtrl: ToastController,
    private http: HttpClient,
    private loadingCtrl: LoadingController
  ) {}
  
  ngOnInit(): void {
    this.loadUserData();
  }
  
  loadUserData(): void {
    this.user = this.authService.getUser();
    
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.username = this.user.username;
    this.email = this.user.email;
    this.profileImage = this.user.profileImage || 'assets/icons/tempura.png';
    this.fullName = this.user.fullName || '';
    
    // Determine user type
    this.isSeller = this.user.userType === 'seller';
    this.isClient = this.user.userType === 'client';
    
    // Check if we have a valid user ID
    if (!this.user.id) {
      console.error('Missing user ID. Cannot load profile data.');
      this.showToast('Error: Missing user ID. Please log in again.');
      this.authService.logout(); // Force logout to get a fresh login
      return;
    }
    
    console.log('Loading user data for ID:', this.user.id);
    
    // Load additional user data from API
    this.apiService.get(`/users/${this.user.id}`).subscribe({
      next: (userData: any) => {
        console.log('User data loaded:', userData);
        
        // Set common profile data
        if (userData.fullName) this.fullName = userData.fullName;
        
        // Load client specific data
        if (this.isClient && userData.client) {
          this.creditCards = userData.client.creditCards || [];
        }
        
        // Load seller specific data
        if (this.isSeller && userData.seller) {
          this.credit = userData.seller.credit || 0;
          this.minimumPrice = userData.seller.minimumPrice || 2;
          this.areasOfExpertise = userData.seller.areasOfExpertise || [];
        }
      },
      error: (error) => {
        console.error('Error loading user data:', error);
        this.showToast('Error loading profile data. Please try again later.');
      }
    });
  }
  
  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
  }
  
  onExpertiseChange(area: string, event: any): void {
    const isChecked = event.detail.checked;
    
    if (isChecked && !this.areasOfExpertise.includes(area)) {
      this.areasOfExpertise.push(area);
    } else if (!isChecked && this.areasOfExpertise.includes(area)) {
      this.areasOfExpertise = this.areasOfExpertise.filter(a => a !== area);
    }
  }
  
  addCreditCard(): void {
    // Replaced with JSONPlaceholder implementation
    this.addCardWithJsonPlaceholder();
  }
  
  async addCardWithJsonPlaceholder(): Promise<void> {
    if (!this.newCardNumber || !this.newCardHolder || !this.newCardExpiry) {
      this.showToast('Please fill all card details');
      return;
    }
    
    // Create card object
    const lastFourDigits = this.newCardNumber.slice(-4);
    const card = {
      cardNumber: this.newCardNumber,
      cardHolder: this.newCardHolder,
      expiryDate: this.newCardExpiry,
      lastFourDigits,
      userId: this.user?.id,
      userType: this.user?.userType
    };

    // Show loading
    const loading = await this.loadingCtrl.create({
      message: 'Processing card...',
      spinner: 'circles'
    });
    await loading.present();
    
    // Use JSONPlaceholder API to simulate adding a card
    this.http.post(`${this.jsonPlaceholderUrl}/posts`, card).subscribe({
      next: (response: any) => {
        console.log('JSONPlaceholder response:', response);
        loading.dismiss();
        
        // Add to local array (the JSONPlaceholder doesn't actually store it)
        this.creditCards.push(card);
        
        // Show success message with the ID from JSONPlaceholder
        this.showToast(`Card added successfully! Card ID: ${response.id}`);
        
        // Reset form
        this.newCardNumber = '';
        this.newCardHolder = '';
        this.newCardExpiry = '';
      },
      error: (error) => {
        loading.dismiss();
        console.error('Error adding card:', error);
        this.showToast('Error adding card. Please try again.');
      }
    });
  }
  
  async removeCreditCard(index: number): Promise<void> {
    // Get the card ID (we'll use the index for demo purposes)
    const cardId = index + 1;
    
    // Show loading
    const loading = await this.loadingCtrl.create({
      message: 'Removing card...',
      spinner: 'circles'
    });
    await loading.present();
    
    // Use JSONPlaceholder to simulate card removal
    this.http.delete(`${this.jsonPlaceholderUrl}/posts/${cardId}`).subscribe({
      next: () => {
        loading.dismiss();
        
        // Remove from local array
        this.creditCards.splice(index, 1);
        this.showToast('Card removed successfully!');
      },
      error: (error) => {
        loading.dismiss();
        console.error('Error removing card:', error);
        
        // For demo purposes, still remove from array since JSONPlaceholder doesn't actually delete
        this.creditCards.splice(index, 1);
        this.showToast('Card removed (demo mode).');
      }
    });
  }
  
  saveProfile(): void {
    // Validate passwords if trying to change password
    if (this.newPassword) {
      if (this.newPassword !== this.confirmPassword) {
        this.showToast('New passwords do not match');
        return;
      }
    }
    
    const userData: any = {
      username: this.username,
      fullName: this.fullName,
      profileImage: this.profileImage
    };
    
    // Add password change if provided
    if (this.newPassword) {
      userData.password = this.newPassword;
    }
    
    // Add type-specific data
    if (this.isClient) {
      userData.creditCards = this.creditCards;
    } else if (this.isSeller) {
      userData.areasOfExpertise = this.areasOfExpertise;
      userData.minimumPrice = this.minimumPrice || 2; // Ensure we have a minimum value
    }
    
    // Save to API
    this.apiService.put('/users/profile', userData).subscribe({
      next: (response) => {
        console.log('Profile updated:', response);
        this.showToast('Profile updated successfully');
        this.isEditMode = false;
        
        // Update local user data
        if (this.user) {
          this.user.username = this.username;
          this.user.profileImage = this.profileImage;
          localStorage.setItem('user', JSON.stringify(this.user));
          this.authService.updateUserFromStorage();
        }
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.showToast('Error updating profile: ' + (error.message || 'Unknown error'));
      }
    });
  }
  
  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top'
    });
    await toast.present();
  }
  
  logout(): void {
    this.authService.logout();
    this.showToast('Successfully logged out');
  }
} 