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
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
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