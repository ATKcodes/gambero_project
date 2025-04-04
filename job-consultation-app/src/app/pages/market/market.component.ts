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
import { JobModalComponent } from '../../components/job-modal/job-modal.component';

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, JobModalComponent, ChatModalComponent],
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
      const createJobParam = params['createJob'];
      const expertId = params['expertId'];
      
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
      
      // If createJob parameter is present, open the job creation modal
      if (createJobParam === 'true' && expertId) {
        console.log('Market component detected createJob=true and expertId in URL, opening job creation modal');
        // Wait for component to initialize first
        setTimeout(() => {
          this.createJobForExpert(expertId);
        }, 500);
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
  
  async createJobForExpert(expertId: string) {
    console.log('Opening create job modal for expert ID:', expertId);
    
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
    
    // First, try to get expert details to prefill the modal
    this.userService.getProfile(expertId).subscribe({
      next: async (expert: UserProfile) => {
        const modal = await this.modalCtrl.create({
          component: JobModalComponent,
          componentProps: {
            mode: 'create',
            // Set the buyer ID to ensure it's properly linked to the user
            jobRequest: {
              price: 5,
              buyerId: this.user?.id,
              sellerId: expertId,  // Pre-assign to the expert
              status: 'open',
              expertise: expert.expertise ? [expert.expertise[0]] : []  // Use the expert's first expertise area if available
            },
            expertName: expert.name || 'Selected Expert'
          }
        });
        
        await modal.present();
        
        const { data } = await modal.onDidDismiss();
        if (data) {
          console.log('Job created for expert:', data);
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
        }
      },
      error: async (err: Error) => {
        console.error('Failed to get expert details:', err);
        
        // Fall back to creating a job without expert details
        const modal = await this.modalCtrl.create({
          component: JobModalComponent,
          componentProps: {
            mode: 'create',
            jobRequest: {
              price: 5,
              buyerId: this.user?.id,
              sellerId: expertId,
              status: 'open'
            },
            expertName: 'Selected Expert'
          }
        });
        
        await modal.present();
      }
    });
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