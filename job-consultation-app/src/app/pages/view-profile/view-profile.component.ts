import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { UserService, UserProfile, Certificate, Experience } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { MessageService } from '../../services/message.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-view-profile',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/market"></ion-back-button>
        </ion-buttons>
        <ion-title>Profile</ion-title>
        <ion-buttons slot="end" *ngIf="profile?.userId !== currentUser?.id">
          <ion-button (click)="sendMessage()">
            <ion-icon name="chatbubble-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="profile-container" *ngIf="profile">
        <!-- Profile Header -->
        <div class="profile-header">
          <ion-avatar>
            <img [src]="profile.profileImage || 'assets/icons/avatar-placeholder.png'" alt="Profile" />
          </ion-avatar>
          <div class="profile-info">
            <h1>{{ profile.name }}</h1>
            <h3 class="username">{{'@'}}{{ getUserName(profile) }}</h3>
            <p class="user-type">{{ profile.role === 'seller' ? 'Expert' : 'Client' }}</p>
            <p class="created-date">Member since {{ formatDate(profile.createdAt) }}</p>
          </div>
        </div>
        
        <!-- Basic Info Card -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Contact Information</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item lines="none">
              <ion-icon name="mail-outline" slot="start" color="primary"></ion-icon>
              <ion-label>{{ profile.email }}</ion-label>
            </ion-item>
          </ion-card-content>
        </ion-card>
        
        <!-- Seller-specific information -->
        <div *ngIf="isSellerProfile">
          <!-- About Card -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>About</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p>{{ profile.bio || 'No bio provided' }}</p>
              
              <h3 class="section-title">Areas of Expertise</h3>
              <div class="expertise-chips">
                <ion-chip *ngFor="let area of getExpertiseArray(profile.expertise)" color="secondary">
                  <ion-label>{{ area }}</ion-label>
                </ion-chip>
                <p *ngIf="!profile.expertise || getExpertiseArray(profile.expertise).length === 0">
                  No areas of expertise listed
                </p>
              </div>
              
              <div *ngIf="profile.minimumPrice !== undefined" class="price-info">
                <ion-text color="primary">
                  <h3>Minimum consultation price: {{ profile.minimumPrice }}€</h3>
                </ion-text>
              </div>
            </ion-card-content>
          </ion-card>
          
          <!-- Certificates section (for sellers) -->
          <ion-card *ngIf="profile.certificates && profile.certificates.length > 0">
            <ion-card-header>
              <ion-card-title>Certificates & Qualifications</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list lines="none">
                <ion-item *ngFor="let cert of profile.certificates">
                  <ion-icon name="ribbon-outline" slot="start" color="secondary"></ion-icon>
                  <ion-label>
                    <h3>{{ cert.name }}</h3>
                    <p>{{ cert.issuer }} ({{ cert.year || formatYear(cert.date) }})</p>
                  </ion-label>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>
          
          <!-- Experience section (for sellers) -->
          <ion-card *ngIf="profile.experiences && profile.experiences.length > 0">
            <ion-card-header>
              <ion-card-title>Work Experience</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list lines="none">
                <ion-item *ngFor="let exp of profile.experiences">
                  <ion-icon name="briefcase-outline" slot="start" color="secondary"></ion-icon>
                  <ion-label>
                    <h3>{{ exp.title }}</h3>
                    <h4>{{ exp.company }}</h4>
                    <p>{{ formatDate(exp.startDate || exp.from) }} - {{ exp.endDate || exp.to ? formatDate(exp.endDate || exp.to) : 'Present' }}</p>
                    <p *ngIf="exp.description">{{ exp.description }}</p>
                  </ion-label>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>
        </div>
        
        <!-- Client-specific information -->
        <div *ngIf="!isSellerProfile">
          <ion-card *ngIf="profile.paymentMethods && profile.paymentMethods.length > 0">
            <ion-card-header>
              <ion-card-title>Payment Methods</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list lines="none">
                <ion-item *ngFor="let payment of profile.paymentMethods">
                  <ion-icon name="card-outline" slot="start" color="secondary"></ion-icon>
                  <ion-label>
                    <h3>{{ payment.cardType || payment.type }}</h3>
                    <p *ngIf="payment.lastFourDigits">Ending in {{ payment.lastFourDigits }}</p>
                  </ion-label>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>
        </div>
        
        <!-- Ask Question Button for Sellers -->
        <ion-button 
          expand="block" 
          color="secondary" 
          *ngIf="isSellerProfile && !isOwnProfile" 
          (click)="askQuestion()"
          class="ask-button">
          Ask a Question
        </ion-button>
      </div>
      
      <div *ngIf="!profile" class="ion-padding ion-text-center">
        <ion-spinner></ion-spinner>
        <p>Loading profile...</p>
      </div>
      
      <!-- Question Form Modal -->
      <div class="question-form" *ngIf="showQuestionForm">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Ask a Question</ion-card-title>
            <ion-button fill="clear" (click)="cancelQuestion()">
              <ion-icon name="close-outline"></ion-icon>
            </ion-button>
          </ion-card-header>
          
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Question Title</ion-label>
              <ion-input [(ngModel)]="questionTitle" placeholder="Brief title for your question"></ion-input>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Your Question</ion-label>
              <ion-textarea 
                [(ngModel)]="questionText" 
                placeholder="What would you like to ask?" 
                rows="6">
              </ion-textarea>
            </ion-item>
            
            <ion-item *ngIf="profile?.minimumPrice !== undefined">
              <ion-label position="stacked">
                Your Offer (Minimum: {{ profile?.minimumPrice || 0 }}€)
              </ion-label>
              <ion-input 
                [(ngModel)]="questionPrice" 
                type="number" 
                [min]="profile?.minimumPrice || 0"
                placeholder="Enter amount in €">
              </ion-input>
            </ion-item>
            
            <div class="button-container">
              <ion-button color="medium" (click)="cancelQuestion()">Cancel</ion-button>
              <ion-button color="primary" (click)="submitQuestion()">Submit</ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .profile-container {
      min-height: 100%;
      padding: 16px 0;
    }
    
    .profile-header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      background-color: var(--ion-color-light);
      padding: 20px;
      border-radius: 12px;
    }
    
    .profile-header ion-avatar {
      width: 100px;
      height: 100px;
      margin-right: 20px;
      border: 3px solid var(--ion-color-primary);
    }
    
    .profile-info {
      flex: 1;
    }
    
    .profile-header h1 {
      margin: 0;
      color: var(--ion-color-dark);
      font-size: 22px;
      font-weight: bold;
    }
    
    .username {
      margin-top: 0;
      color: var(--ion-color-medium);
      font-size: 16px;
    }
    
    .user-type {
      display: inline-block;
      background-color: var(--ion-color-primary);
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      margin: 5px 0;
    }
    
    .created-date {
      font-size: 14px;
      color: var(--ion-color-medium);
      margin-top: 5px;
    }
    
    .section-title {
      margin-top: 20px;
      margin-bottom: 10px;
      font-weight: 600;
      color: var(--ion-color-dark);
    }
    
    .expertise-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    
    .price-info {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid var(--ion-color-light);
    }
    
    .ask-button {
      margin-top: 20px;
    }
    
    .question-form {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0,0,0,0.5);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .question-form ion-card {
      width: 100%;
      max-width: 500px;
    }
    
    .question-form ion-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .button-container {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
  `]
})
export class ViewProfileComponent implements OnInit {
  profileId: string | null = null;
  profile: UserProfile | undefined;
  currentUser: User | null = null;
  isSellerProfile = false;
  isOwnProfile = false;
  
  // Question form
  showQuestionForm = false;
  questionTitle = '';
  questionText = '';
  questionPrice = 0;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private messageService: MessageService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}
  
  ngOnInit() {
    this.currentUser = this.authService.getUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.route.paramMap.subscribe(params => {
      this.profileId = params.get('id');
      if (this.profileId) {
        this.loadProfile(this.profileId);
      }
    });
  }
  
  loadProfile(userId: string) {
    this.userService.getProfile(userId).subscribe(profile => {
      this.profile = profile;
      
      if (profile) {
        // Check if this is a seller profile (has expertise)
        this.isSellerProfile = profile.role === 'seller' || !!profile.expertise;
        
        // Set initial price for question form
        if (profile.minimumPrice !== undefined) {
          this.questionPrice = profile.minimumPrice;
        }
        
        // Check if this is the current user's profile
        this.isOwnProfile = this.currentUser?.id === profile.userId;
      }
    });
  }
  
  formatDate(date?: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString();
  }
  
  formatYear(date?: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.getFullYear().toString();
  }
  
  getExpertiseArray(expertise?: string | string[]): string[] {
    if (!expertise) return [];
    if (Array.isArray(expertise)) return expertise;
    return expertise.split(',').map(e => e.trim()).filter(e => e);
  }
  
  async sendMessage() {
    if (!this.profile || !this.currentUser) return;
    
    const alert = await this.alertCtrl.create({
      header: 'Send Message',
      inputs: [
        {
          name: 'message',
          type: 'textarea',
          placeholder: 'Type your message...'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Send',
          handler: (data) => {
            if (data.message.trim()) {
              this.messageService.sendMessage({
                senderId: this.currentUser!.id,
                receiverId: this.profile!.userId,
                content: data.message.trim()
              }).subscribe();
            }
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  askQuestion() {
    this.showQuestionForm = true;
  }
  
  cancelQuestion() {
    this.showQuestionForm = false;
    this.questionTitle = '';
    this.questionText = '';
  }
  
  async submitQuestion() {
    if (!this.profile || !this.currentUser) return;
    
    // Validate form
    if (!this.questionTitle.trim()) {
      this.showToast('Please provide a title for your question');
      return;
    }
    
    if (!this.questionText.trim()) {
      this.showToast('Please enter your question');
      return;
    }
    
    if (this.profile.minimumPrice !== undefined && this.questionPrice < this.profile.minimumPrice) {
      this.showToast(`Price must be at least ${this.profile.minimumPrice}€`);
      return;
    }
    
    // Create job request
    const jobRequest = {
      buyerId: this.currentUser.id,
      sellerId: this.profile.userId,
      title: this.questionTitle,
      description: this.questionText,
      price: this.questionPrice,
      expertise: Array.isArray(this.profile.expertise) 
        ? this.profile.expertise[0] 
        : this.profile.expertise
    };
    
    this.userService.createJobRequest(jobRequest).subscribe({
      next: (response) => {
        this.showToast('Question submitted successfully!', 'success');
        this.cancelQuestion();
        
        // Send notification message to seller
        this.messageService.sendMessage({
          senderId: this.currentUser!.id,
          receiverId: this.profile!.userId,
          content: `I've submitted a new question: "${this.questionTitle}" - Please check your messages!`
        }).subscribe();
      },
      error: (error) => {
        console.error('Error creating job request:', error);
        this.showToast('Failed to submit question. Please try again.');
      }
    });
  }
  
  async showToast(message: string, color: 'danger' | 'success' | 'warning' = 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color
    });
    toast.present();
  }
  
  /**
   * Gets a username to display, handling cases where it might not be available
   */
  getUserName(profile: UserProfile | undefined): string {
    if (!profile) return 'username';
    
    // Try to find a username property that might be in different formats
    const username = (profile as any).username || 
                    profile.userId || 
                    profile.name?.split(' ')[0]?.toLowerCase() || 
                    'username';
    
    return username;
  }
} 