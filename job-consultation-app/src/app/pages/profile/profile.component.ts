import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { UserService, UserProfile, Certificate, Experience, PaymentMethod } from '../../services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/main"></ion-back-button>
        </ion-buttons>
        <ion-title>Profile</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="profile-container">
        <ion-avatar class="profile-avatar">
          <img [src]="profile.profileImage || 'https://via.placeholder.com/150'" alt="Profile" />
        </ion-avatar>
        
        <h2>{{ profile.name || 'Your Name' }}</h2>
        
        <!-- Basic Profile Info (for both buyer and seller) -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Basic Information</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="floating">Name</ion-label>
              <ion-input [(ngModel)]="profile.name"></ion-input>
            </ion-item>
            
            <ion-item>
              <ion-label position="floating">Bio</ion-label>
              <ion-textarea [(ngModel)]="profile.bio" rows="4"></ion-textarea>
            </ion-item>
            
            <ion-item>
              <ion-label position="floating">Profile Image URL</ion-label>
              <ion-input [(ngModel)]="profile.profileImage"></ion-input>
            </ion-item>
          </ion-card-content>
        </ion-card>
        
        <!-- Seller-specific sections -->
        <ng-container *ngIf="isSeller">
          <!-- Expertise section -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Area of Expertise</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-label position="floating">Expertise</ion-label>
                <ion-input [(ngModel)]="profile.expertise"></ion-input>
              </ion-item>
              
              <ion-item>
                <ion-label position="floating">Minimum Price ($)</ion-label>
                <ion-input type="number" [(ngModel)]="profile.minimumPrice"></ion-input>
              </ion-item>
            </ion-card-content>
          </ion-card>
          
          <!-- Certificates section -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Certificates</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item *ngFor="let cert of profile.certificates">
                  <ion-label>
                    <h3>{{ cert.name }}</h3>
                    <p>{{ cert.issuer }} ({{ cert.year }})</p>
                  </ion-label>
                  <ion-button slot="end" fill="clear" color="danger" (click)="removeCertificate(cert)">
                    <ion-icon name="trash-outline"></ion-icon>
                  </ion-button>
                </ion-item>
              </ion-list>
              
              <div class="certificate-form">
                <ion-item>
                  <ion-label position="floating">Certificate Name</ion-label>
                  <ion-input [(ngModel)]="newCertificate.name"></ion-input>
                </ion-item>
                
                <ion-item>
                  <ion-label position="floating">Issuer</ion-label>
                  <ion-input [(ngModel)]="newCertificate.issuer"></ion-input>
                </ion-item>
                
                <ion-item>
                  <ion-label position="floating">Year</ion-label>
                  <ion-input type="number" [(ngModel)]="newCertificate.year"></ion-input>
                </ion-item>
                
                <ion-button expand="block" (click)="addCertificate()">
                  Add Certificate
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
          
          <!-- Experience section -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Experience</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item *ngFor="let exp of profile.experiences">
                  <ion-label>
                    <h3>{{ exp.title }}</h3>
                    <p>{{ exp.company }}</p>
                    <p>{{ formatDate(exp.startDate) }} - {{ exp.endDate ? formatDate(exp.endDate) : 'Present' }}</p>
                    <p *ngIf="exp.description">{{ exp.description }}</p>
                  </ion-label>
                  <ion-button slot="end" fill="clear" color="danger" (click)="removeExperience(exp)">
                    <ion-icon name="trash-outline"></ion-icon>
                  </ion-button>
                </ion-item>
              </ion-list>
              
              <div class="experience-form">
                <ion-item>
                  <ion-label position="floating">Title</ion-label>
                  <ion-input [(ngModel)]="newExperience.title"></ion-input>
                </ion-item>
                
                <ion-item>
                  <ion-label position="floating">Company</ion-label>
                  <ion-input [(ngModel)]="newExperience.company"></ion-input>
                </ion-item>
                
                <ion-item>
                  <ion-label position="floating">Start Date</ion-label>
                  <ion-datetime-button datetime="startDate"></ion-datetime-button>
                  <ion-modal [keepContentsMounted]="true">
                    <ng-template>
                      <ion-datetime id="startDate" [(ngModel)]="newExperience.startDate"></ion-datetime>
                    </ng-template>
                  </ion-modal>
                </ion-item>
                
                <ion-item>
                  <ion-label position="floating">End Date (leave empty if current)</ion-label>
                  <ion-datetime-button datetime="endDate"></ion-datetime-button>
                  <ion-modal [keepContentsMounted]="true">
                    <ng-template>
                      <ion-datetime id="endDate" [(ngModel)]="newExperience.endDate"></ion-datetime>
                    </ng-template>
                  </ion-modal>
                </ion-item>
                
                <ion-item>
                  <ion-label position="floating">Description</ion-label>
                  <ion-textarea [(ngModel)]="newExperience.description" rows="3"></ion-textarea>
                </ion-item>
                
                <ion-button expand="block" (click)="addExperience()">
                  Add Experience
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
        </ng-container>
        
        <!-- Buyer-specific sections -->
        <ng-container *ngIf="!isSeller">
          <ion-card>
            <ion-card-header>
              <ion-card-title>Payment Methods</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item *ngFor="let payment of profile.paymentMethods">
                  <ion-icon 
                    [name]="payment.type === 'credit_card' ? 'card-outline' : 'logo-paypal'" 
                    slot="start">
                  </ion-icon>
                  <ion-label>
                    <h3>{{ payment.type === 'credit_card' ? payment.cardType + ' Card' : 'PayPal' }}</h3>
                    <p *ngIf="payment.lastFourDigits">**** **** **** {{ payment.lastFourDigits }}</p>
                  </ion-label>
                  <ion-button slot="end" fill="clear" color="danger" (click)="removePaymentMethod(payment)">
                    <ion-icon name="trash-outline"></ion-icon>
                  </ion-button>
                </ion-item>
              </ion-list>
              
              <div class="payment-form">
                <ion-item>
                  <ion-label>Payment Type</ion-label>
                  <ion-select [(ngModel)]="newPayment.type">
                    <ion-select-option value="credit_card">Credit Card</ion-select-option>
                    <ion-select-option value="paypal">PayPal</ion-select-option>
                  </ion-select>
                </ion-item>
                
                <ion-item *ngIf="newPayment.type === 'credit_card'">
                  <ion-label position="floating">Card Number</ion-label>
                  <ion-input type="text" maxlength="16" [(ngModel)]="cardNumber"></ion-input>
                </ion-item>
                
                <ion-item *ngIf="newPayment.type === 'credit_card'">
                  <ion-label position="floating">Card Type</ion-label>
                  <ion-select [(ngModel)]="newPayment.cardType">
                    <ion-select-option value="Visa">Visa</ion-select-option>
                    <ion-select-option value="Mastercard">Mastercard</ion-select-option>
                    <ion-select-option value="American Express">American Express</ion-select-option>
                  </ion-select>
                </ion-item>
                
                <ion-button expand="block" (click)="addPaymentMethod()">
                  Add Payment Method
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
        </ng-container>
        
        <ion-button expand="block" color="secondary" (click)="saveProfile()">
          Save Profile
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .profile-container {
      background-color: var(--ion-color-tertiary);
      min-height: 100%;
      padding: 16px;
    }
    
    .profile-avatar {
      width: 120px;
      height: 120px;
      margin: 0 auto 20px;
    }
    
    h2 {
      text-align: center;
      font-weight: bold;
      margin-bottom: 20px;
    }
    
    .certificate-form, .experience-form, .payment-form {
      margin-top: 20px;
      border-top: 1px dashed #ccc;
      padding-top: 20px;
    }
    
    ion-button[expand="block"] {
      margin-top: 16px;
    }
  `]
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  isSeller = false;
  profile: UserProfile = {
    id: '',
    userId: '',
    name: '',
    email: '',
    role: 'buyer',
    bio: '',
    expertise: [],
    certificates: [],
    experiences: [],
    paymentMethods: [],
    minimumPrice: 0,
    createdAt: new Date()
  };
  
  newCertificate: Certificate = {
    name: '',
    issuer: '',
    date: new Date(),
    year: new Date().getFullYear()
  };
  
  newExperience: Experience = {
    title: '',
    company: '',
    description: '',
    from: new Date(),
    current: false,
    startDate: new Date(),
    endDate: undefined
  };
  
  newPayment: PaymentMethod = { 
    type: 'credit_card',
    details: '',
    cardType: 'Visa',
    lastFourDigits: ''
  };
  
  cardNumber = '';
  
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}
  
  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
      if (this.user) {
        this.isSeller = this.user.userType === 'seller';
        this.userService.getProfile(this.user.id).subscribe((profile: UserProfile) => {
          this.profile = profile;
        });
      }
    }
  }
  
  addCertificate() {
    if (!this.newCertificate.name || !this.newCertificate.issuer) {
      this.showToast('Please fill in all certificate fields');
      return;
    }
    
    const certificate: Certificate = {
      id: Math.random().toString(36).substring(2, 9),
      name: this.newCertificate.name,
      issuer: this.newCertificate.issuer,
      date: this.newCertificate.date,
      year: this.newCertificate.year
    };
    
    this.profile.certificates?.push(certificate);
    this.newCertificate = {
      name: '',
      issuer: '',
      date: new Date(),
      year: new Date().getFullYear()
    };
  }
  
  removeCertificate(certificate: Certificate) {
    if (this.profile.certificates) {
      this.profile.certificates = this.profile.certificates.filter(c => c.id !== certificate.id);
    }
  }
  
  addExperience() {
    if (!this.newExperience.title || !this.newExperience.company || !this.newExperience.startDate) {
      this.showToast('Please fill in all required experience fields');
      return;
    }
    
    const experience: Experience = {
      id: Math.random().toString(36).substring(2, 9),
      title: this.newExperience.title,
      company: this.newExperience.company,
      description: this.newExperience.description,
      from: this.newExperience.from || this.newExperience.startDate,
      current: this.newExperience.current || false,
      startDate: this.newExperience.startDate,
      endDate: this.newExperience.endDate
    };
    
    this.profile.experiences?.push(experience);
    this.newExperience = {
      title: '',
      company: '',
      description: '',
      from: new Date(),
      current: false,
      startDate: new Date(),
      endDate: undefined
    };
  }
  
  removeExperience(experience: Experience) {
    if (this.profile.experiences) {
      this.profile.experiences = this.profile.experiences.filter(e => e.id !== experience.id);
    }
  }
  
  addPaymentMethod() {
    if (this.newPayment.type === 'credit_card' && !this.cardNumber) {
      this.showToast('Please enter a valid card number');
      return;
    }
    
    const paymentMethod: PaymentMethod = {
      id: Math.random().toString(36).substring(2, 9),
      type: this.newPayment.type,
      details: this.newPayment.type === 'credit_card' 
        ? `${this.newPayment.cardType} ending in ${this.cardNumber.slice(-4)}` 
        : 'PayPal Account',
      cardType: this.newPayment.cardType,
      lastFourDigits: this.cardNumber ? this.cardNumber.slice(-4) : undefined
    };
    
    this.profile.paymentMethods?.push(paymentMethod);
    this.newPayment = {
      type: 'credit_card',
      details: '',
      cardType: 'Visa',
      lastFourDigits: ''
    };
    this.cardNumber = '';
  }
  
  removePaymentMethod(paymentMethod: PaymentMethod) {
    if (this.profile.paymentMethods) {
      this.profile.paymentMethods = this.profile.paymentMethods.filter(p => p.id !== paymentMethod.id);
    }
  }
  
  saveProfile() {
    this.userService.updateProfile(this.profile).subscribe({
      next: () => {
        this.showToast('Profile saved successfully');
      },
      error: (err) => {
        this.showToast('Error saving profile: ' + err.message);
      }
    });
  }
  
  formatDate(date: string | Date | undefined): string {
    if (!date) return 'Present';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  }
  
  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top'
    });
    await toast.present();
  }
} 