import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ModalController, ToastController, NavController, AlertController } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { UserService, UserProfile, JobRequest } from '../../services/user.service';
import { ActivatedRoute } from '@angular/router';
import { ChatModalComponent } from './chat-modal.component';

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
  jobAnswer: string = '';
  
  constructor(
    public modalCtrl: ModalController,
    private userService: UserService,
    private authService: AuthService,
    private toastCtrl: ToastController
  ) {}
  
  ngOnInit() {
    console.log('Job modal initialized with job:', this.jobRequest);
    
    // Ensure the job has all required properties
    if (this.mode === 'view' && (!this.jobRequest || !this.jobRequest.id)) {
      console.error('Invalid job object in modal:', this.jobRequest);
      this.showToast('Error: Invalid job data');
      setTimeout(() => this.modalCtrl.dismiss(), 2000);
      return;
    }
    
    const currentUser = this.authService.getUser();
    const userType = this.authService.getUserType();
    
    console.log('Current user type:', userType);
    console.log('Job status:', this.jobRequest.status);
    
    // Properly set canTakeJob flag - sellers can take open jobs
    if (this.mode === 'view' && 
        userType === 'seller' && 
        this.jobRequest && 
        this.jobRequest.status === 'open') {
      console.log('Can take job set to true');
      this.canTakeJob = true;
    } else {
      console.log('Can take job set to false');
      this.canTakeJob = false;
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
    
    // Ensure we have at least the minimal required fields
    const newJob: Partial<JobRequest> = {
      title: this.jobRequest.title,
      description: this.jobRequest.description,
      buyerId: currentUser.id,
      status: 'open',
      expertise: this.jobRequest.expertise,
      price: this.jobRequest.price || 5, // Default price if not specified
    };
    
    console.log('Creating new job:', newJob);
    this.userService.createJobRequest(newJob).subscribe({
      next: (job) => {
        console.log('Job created successfully:', job);
        
        // Verify the job has a valid ID
        if (!job.id || job.id.startsWith('temp-')) {
          console.error('Server returned job without a valid ID:', job);
          this.showToast('Warning: Question created, but the server did not return a valid ID.');
          
          // Create a temporary ID if needed
          if (!job.id) {
            job.id = `temp-${Date.now()}`;
          }
        }
        
        this.showToast('Question posted successfully');
        this.modalCtrl.dismiss(job);
      },
      error: (err) => {
        console.error('Error posting question:', err);
        this.showToast('Error posting question: ' + (err.message || 'Unknown error'));
      }
    });
  }
  
  takeJob() {
    const currentUser = this.authService.getUser();
    
    if (!currentUser) {
      this.showToast('Please log in to accept a job');
      return;
    }
    
    if (!this.jobRequest || !this.jobRequest.id) {
      console.error('Missing job ID:', this.jobRequest);
      this.showToast('Invalid job request');
      return;
    }
    
    // Validate the job ID before making the API call
    if (this.jobRequest.id.startsWith('temp-')) {
      console.error('Cannot accept job with temporary ID:', this.jobRequest);
      this.showToast('Error: This job has an invalid ID. Please try reloading the page.');
      return;
    }

    if (!this.jobAnswer || this.jobAnswer.trim() === '') {
      this.showToast('Please provide an answer to the question');
      return;
    }
    
    console.log('Taking job with ID:', this.jobRequest.id);
    this.userService.assignJobRequest(this.jobRequest.id, currentUser.id, this.jobAnswer).subscribe({
      next: (job) => {
        console.log('Job accepted successfully:', job);
        this.showToast('Job accepted successfully');
        this.modalCtrl.dismiss({...job, answer: this.jobAnswer});
      },
      error: (err) => {
        console.error('Error accepting job:', err);
        this.showToast('Error accepting job: ' + (err.message || 'Unknown error'));
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
  assignedJobs: JobRequest[] = [];
  user: User | null = null;
  isMessagesPopupOpen = true; // Default to open
  jobSegment: 'available' | 'current' = 'available';
  
  constructor(
    private authService: AuthService,
    private userService: UserService,
    public router: Router,
    private modalCtrl: ModalController,
    private route: ActivatedRoute,
    private toastCtrl: ToastController,
    private modalController: ModalController,
    private navController: NavController,
    private alertController: AlertController
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
      console.log('Loading jobs for user:', this.user.id);
      
      this.userService.getJobRequests(this.user.id, 'seller').subscribe({
        next: (jobs) => {
          console.log(`Loaded ${jobs.length} jobs from server`);
          
          // Filter out jobs with completely invalid data
          const validJobs = jobs.filter(job => {
            if (!job) return false;
            
            // Log jobs with missing IDs but include them
            if (!job.id) {
              console.warn('Job is missing ID:', job);
            }
            
            return true;
          });
          
          // Filter for open and assigned jobs
          this.jobs = validJobs.filter(job => job.status === 'open');
          console.log(`${this.jobs.length} open jobs available`);
          
          this.assignedJobs = validJobs.filter(job => 
            job.status === 'assigned' && job.sellerId === this.user?.id
          );
          console.log(`${this.assignedJobs.length} assigned jobs for this seller`);
        },
        error: (err) => {
          console.error('Error loading jobs:', err);
          const toast = this.toastCtrl.create({
            message: 'Error loading jobs. Please try again.',
            duration: 3000,
            position: 'top'
          });
          toast.then(t => t.present());
        }
      });
    }
  }
  
  viewProfile(userId: string) {
    this.router.navigate(['/view-profile', userId]);
  }
  
  async createJob() {
    console.log('Opening create job modal');
    
    // Ensure we have a logged-in user before proceeding
    if (!this.user || !this.user.id) {
      const toast = await this.toastCtrl.create({
        message: 'Please log in to post a question',
        duration: 3000,
        position: 'top'
      });
      await toast.present();
      return;
    }
    
    const modal = await this.modalCtrl.create({
      component: JobModalComponent,
      componentProps: {
        mode: 'create',
        // Set the buyer ID to ensure it's properly linked to the user
        jobRequest: {
          price: 5,
          buyerId: this.user.id,
          status: 'open'
        }
      }
    });
    
    await modal.present();
    
    const { data } = await modal.onDidDismiss();
    if (data) {
      console.log('Job created:', data);
      // Verify the job has an ID before proceeding
      if (!data.id) {
        console.error('Created job is missing an ID:', data);
        const toast = await this.toastCtrl.create({
          message: 'Error: Created job is missing an ID. Please try again.',
          duration: 3000,
          position: 'top'
        });
        await toast.present();
      }
      
      // If we're a seller, we need to refresh the job list
      if (this.isSeller) {
        this.loadJobs();
      }
    }
  }
  
  async viewJob(job: JobRequest) {
    console.log('Opening job modal with job:', JSON.stringify(job));
    
    // Create a copy of the job to avoid modifying the original
    const jobCopy = { ...job };
    
    // Ensure the job has an ID before opening modal
    if (!jobCopy.id) {
      console.error('Job is missing ID:', jobCopy);
      
      // Generate a temporary ID and warn the user
      jobCopy.id = `temp-${Date.now()}`;
      
      const toast = await this.toastCtrl.create({
        message: 'Warning: This job has an invalid ID. Some operations may not work correctly.',
        duration: 3000,
        position: 'top'
      });
      await toast.present();
    }
    
    const modal = await this.modalCtrl.create({
      component: JobModalComponent,
      componentProps: {
        mode: 'view',
        // Create a clean copy of the job with required properties guaranteed
        jobRequest: {
          id: jobCopy.id,
          title: jobCopy.title || 'No Title',
          description: jobCopy.description || 'No Description',
          buyerId: jobCopy.buyerId || '',
          sellerId: jobCopy.sellerId,
          expertise: jobCopy.expertise,
          price: typeof jobCopy.price === 'number' ? jobCopy.price : 0,
          status: jobCopy.status || 'open',
          answer: jobCopy.answer,
          createdAt: jobCopy.createdAt instanceof Date ? jobCopy.createdAt : new Date(),
          updatedAt: jobCopy.updatedAt instanceof Date ? jobCopy.updatedAt : new Date()
        }
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

  /**
   * Opens a chat modal for the selected job
   * @param job The job to open chat for
   */
  async openChat(job: any) {
    const modal = await this.modalController.create({
      component: ChatModalComponent,
      componentProps: {
        job: job
      },
      cssClass: 'chat-modal'
    });
    
    await modal.present();
    
    // Refresh jobs list after modal is dismissed
    const { data } = await modal.onDidDismiss();
    if (data && data.refresh) {
      this.loadJobs();
    }
  }

  segmentChanged() {
    // This function is triggered when the segment value changes
    console.log('Segment changed to:', this.jobSegment);
  }
} 