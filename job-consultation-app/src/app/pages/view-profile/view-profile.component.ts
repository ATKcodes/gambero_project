import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { UserService, UserProfile, Certificate, Experience } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-view-profile',
  standalone: true,
  imports: [IonicModule, CommonModule],
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
        <div class="profile-header">
          <ion-avatar>
            <img [src]="profile.profileImage || 'https://via.placeholder.com/150'" alt="Profile" />
          </ion-avatar>
          <h1>{{ profile.name }}</h1>
          <p class="created-date">Member since {{ formatDate(currentUser?.createdAt) }}</p>
        </div>
        
        <ion-card>
          <ion-card-header>
            <ion-card-title>About</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>{{ profile.bio || 'No bio provided' }}</p>
            
            <ion-chip *ngIf="profile.expertise" color="secondary">
              <ion-label>{{ profile.expertise }}</ion-label>
            </ion-chip>
            
            <div *ngIf="profile.minimumPrice" class="price-info">
              <ion-text color="primary">
                <h3>Minimum consultation price: {{ profile.minimumPrice }}€</h3>
              </ion-text>
            </div>
          </ion-card-content>
        </ion-card>
        
        <!-- Certificates section (for sellers) -->
        <ion-card *ngIf="profile.certificates && profile.certificates.length > 0">
          <ion-card-header>
            <ion-card-title>Certificates</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              <ion-item *ngFor="let cert of profile.certificates">
                <ion-icon name="ribbon-outline" slot="start" color="secondary"></ion-icon>
                <ion-label>
                  <h3>{{ cert.name }}</h3>
                  <p>{{ cert.issuer }} ({{ cert.year }})</p>
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
                  <p>{{ formatDate(exp.startDate) }} - {{ exp.endDate ? formatDate(exp.endDate) : 'Present' }}</p>
                  <p *ngIf="exp.description">{{ exp.description }}</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
        
        <ion-button expand="block" color="secondary" *ngIf="isSellerProfile && !isOwnProfile" (click)="askQuestion()">
          Ask a Question
        </ion-button>
      </div>
      
      <div *ngIf="!profile" class="ion-padding ion-text-center">
        <ion-spinner></ion-spinner>
        <p>Loading profile...</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .profile-container {
      background-color: var(--ion-color-tertiary);
      min-height: 100%;
      padding: 16px;
    }
    
    .profile-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .profile-header ion-avatar {
      width: 120px;
      height: 120px;
      margin-bottom: 16px;
    }
    
    .profile-header h1 {
      margin: 0;
      color: var(--ion-color-dark);
      font-size: 24px;
      font-weight: bold;
    }
    
    .created-date {
      font-size: 14px;
      color: var(--ion-color-medium);
      margin-top: 5px;
    }
    
    .price-info {
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
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private messageService: MessageService,
    private alertCtrl: AlertController
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
        this.isSellerProfile = !!profile.expertise;
        
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
    this.router.navigate(['/market']);
  }
} 