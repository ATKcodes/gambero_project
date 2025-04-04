import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { UserService, UserProfile, JobRequest } from '../../services/user.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-job-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './market-modal.html', 
})
export class JobModalComponent implements OnInit {
  mode: 'create' | 'view' = 'create';
  jobRequest: Partial<JobRequest> = {
    price: 5 // Set default price
  };
  canTakeJob = false;
  
  constructor(
    public modalCtrl: ModalController,
    private userService: UserService,
    private authService: AuthService,
    private toastCtrl: ToastController
  ) {}
  
  ngOnInit() {
    const currentUser = this.authService.getUser();
    const userType = this.authService.getUserType();
    
    if (this.mode === 'view' && userType === 'seller' && this.jobRequest.status === 'open') {
      this.canTakeJob = true;
    }
  }
  
  saveJob() {
    const currentUser = this.authService.getUser();
    
    if (!currentUser) {
      this.showToast('Please log in to post a job');
      return;
    }
    
    if (!this.jobRequest.title || !this.jobRequest.description) {
      this.showToast('Please fill in all required fields');
      return;
    }
    
    const newJob: Omit<JobRequest, 'id' | 'createdAt'> = {
      title: this.jobRequest.title!,
      description: this.jobRequest.description!,
      buyerId: currentUser.id,
      status: 'open',
      expertise: this.jobRequest.expertise,
      price: this.jobRequest.price || 5, // Default price if not specified
      updatedAt: new Date()
    };
    
    this.userService.createJobRequest(newJob).subscribe({
      next: (job) => {
        this.showToast('Question posted successfully');
        this.modalCtrl.dismiss(job);
      },
      error: (err) => {
        console.error('Error posting question:', err);
        this.showToast('Error posting question. Please try again.');
      }
    });
  }
  
  takeJob() {
    const currentUser = this.authService.getUser();
    
    if (!currentUser) {
      this.showToast('Please log in to accept a job');
      return;
    }
    
    if (!this.jobRequest.id) {
      this.showToast('Invalid job request');
      return;
    }
    
    this.userService.assignJobRequest(this.jobRequest.id, currentUser.id).subscribe({
      next: (job) => {
        this.showToast('Job accepted successfully');
        this.modalCtrl.dismiss(job);
      },
      error: (err) => {
        this.showToast('Error accepting job: ' + err.message);
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
}

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './market.html',
  styleUrls: ['./market.scss'],
})
export class MarketComponent implements OnInit {
  isSeller = false;
  sellers: UserProfile[] = [];
  jobs: JobRequest[] = [];
  user: User | null = null;
  isMessagesPopupOpen = true; // Default to open
  
  constructor(
    private authService: AuthService,
    private userService: UserService,
    public router: Router,
    private modalCtrl: ModalController,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit() {
    console.log('Market component initializing');
    
    // Check if code is in URL params (from 42 OAuth direct callback)
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const token = params['token'];
      
      // If we have a code but no token, we need to exchange it for a token
      if (code && !token) {
        console.log('Market component detected OAuth code in URL, exchanging for token');
        this.authService.loginWith42(code).subscribe({
          next: (user) => {
            if (user) {
              console.log('OAuth code exchanged for token successfully, user type:', user.userType);
              if (user.userType === 'pending') {
                console.log('User type is pending, redirecting to profile completion');
                this.router.navigate(['/complete-profile']);
              } else {
                // Refresh the page to remove the code from URL
                window.location.href = '/market';
              }
            } else {
              console.error('User data not returned after OAuth code exchange');
              this.router.navigate(['/login']);
            }
          },
          error: (err) => {
            console.error('Error exchanging OAuth code for token:', err);
            this.router.navigate(['/login']);
          }
        });
        return;
      }
      
      // If we have a token in the URL (from backend redirect)
      if (token) {
        console.log('Market component detected token in URL');
        
        // Get the user's type
        const currentUser = this.authService.getUser();
        if (currentUser && currentUser.userType === 'pending') {
          console.log('User type is pending, redirecting to profile completion');
          this.router.navigate(['/complete-profile'], { 
            queryParams: { token } 
          });
          return;
        }
      }
    });
    
    this.user = this.authService.getUser();
    this.isSeller = this.authService.getUserType() === 'seller';
    
    if (this.user) {
      if (this.isSeller) {
        this.loadJobs();
      } else {
        this.loadSellers();
      }
    } else {
      this.router.navigate(['/login']);
    }
  }
  
  loadSellers() {
    this.userService.getActiveSellers().subscribe(sellers => {
      this.sellers = sellers;
    });
  }
  
  loadJobs() {
    if (this.user) {
      this.userService.getJobRequests(this.user.id, 'seller').subscribe(jobs => {
        this.jobs = jobs;
      });
    }
  }
  
  viewProfile(userId: string) {
    this.router.navigate(['/view-profile', userId]);
  }
  
  async createJob() {
    const modal = await this.modalCtrl.create({
      component: JobModalComponent,
      componentProps: {
        mode: 'create'
      }
    });
    
    await modal.present();
    
    const { data } = await modal.onDidDismiss();
    if (data) {
      // If we're not a seller, we don't need userJobs anymore
      if (this.isSeller) {
        this.loadJobs();
      }
    }
  }
  
  async viewJob(job: JobRequest) {
    const modal = await this.modalCtrl.create({
      component: JobModalComponent,
      componentProps: {
        mode: 'view',
        jobRequest: job
      }
    });
    
    await modal.present();
    
    const { data } = await modal.onDidDismiss();
    if (data) {
      this.loadJobs();
    }
  }
  
  getStatusColor(status: string): string {
    switch (status) {
      case 'open':
        return 'success';
      case 'assigned':
        return 'warning';
      case 'completed':
        return 'primary';
      default:
        return 'medium';
    }
  }
  
  toggleMessagesPopup() {
    this.isMessagesPopupOpen = !this.isMessagesPopupOpen;
  }

  navigateToQuestions() {
    if (this.isSeller) {
      // For sellers, navigate to unanswered questions
      this.router.navigate(['/questions']);
    } else {
      // For clients, navigate to experts page
      this.router.navigate(['/experts']);
    }
  }
} 