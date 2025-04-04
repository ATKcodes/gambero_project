import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserProfile } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

// Import the market component to access the JobModalComponent defined within it
import { JobModalComponent } from '../../components/job-modal/job-modal.component';

@Component({
  selector: 'app-experts',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './experts.component.html',
  styleUrl: './experts.component.scss'
})
export class ExpertsComponent implements OnInit {
  experts: UserProfile[] = [];
  loading = true;
  error = false;

  constructor(
    private userService: UserService,
    private router: Router,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadExperts();
  }

  loadExperts() {
    this.loading = true;
    this.userService.getActiveSellers().subscribe({
      next: (experts) => {
        this.experts = experts;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load experts:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  viewProfile(userId: string) {
    this.router.navigate(['/view-profile', userId]);
  }

  async createJob(expertId: string) {
    const user = this.authService.getUser();
    
    // Ensure we have a logged-in user before proceeding
    if (!user || !user.id) {
      const toast = await this.toastCtrl.create({
        message: 'Please log in to ask a question',
        duration: 3000,
        position: 'top'
      });
      await toast.present();
      return;
    }
    
    // Get expert details to prefill the modal
    this.userService.getProfile(expertId).subscribe({
      next: async (expert: UserProfile) => {
        const modal = await this.modalCtrl.create({
          component: JobModalComponent,
          componentProps: {
            mode: 'create',
            jobRequest: {
              price: 5,
              buyerId: user.id,
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
          // Show success message
          const toast = await this.toastCtrl.create({
            message: 'Your question has been submitted!',
            duration: 3000,
            position: 'top',
            color: 'success'
          });
          await toast.present();
        }
      },
      error: async (err: Error) => {
        console.error('Failed to get expert details:', err);
        
        // Show error message
        const toast = await this.toastCtrl.create({
          message: 'Failed to create question. Please try again.',
          duration: 3000,
          position: 'top',
          color: 'danger'
        });
        await toast.present();
      }
    });
  }
}
