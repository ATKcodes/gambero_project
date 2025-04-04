import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { UserService, JobRequest } from '../../services/user.service';

@Component({
  selector: 'app-job-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './job-modal.component.html',
  styleUrls: ['./job-modal.component.scss']
})
export class JobModalComponent implements OnInit {
  @Input() mode: 'create' | 'view' = 'create';
  @Input() jobRequest: any = {
    title: '',
    description: '',
    expertise: [],
    price: 5,
    status: 'open'
  };
  @Input() expertName?: string;
  
  jobAnswer: string = '';
  canTakeJob: boolean = false;
  
  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private authService: AuthService,
    private userService: UserService
  ) {}
  
  ngOnInit() {
    console.log(`Job modal initialized in ${this.mode} mode with job:`, this.jobRequest);
    
    if (!this.jobRequest) {
      console.error('No job request data provided');
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
    
    // If we are creating this job for a specific expert, include their ID
    if (this.jobRequest.sellerId) {
      newJob.sellerId = this.jobRequest.sellerId;
    }
    
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
  
  dismiss() {
    this.modalCtrl.dismiss();
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