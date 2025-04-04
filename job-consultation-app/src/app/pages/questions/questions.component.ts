import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { JobRequest } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { JobModalComponent } from '../../components/job-modal/job-modal.component';

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [CommonModule, IonicModule, JobModalComponent],
  templateUrl: './questions.component.html',
  styleUrl: './questions.component.scss'
})
export class QuestionsComponent implements OnInit {
  questions: JobRequest[] = [];
  loading = true;
  error = false;

  constructor(
    private userService: UserService,
    private router: Router,
    private authService: AuthService,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.loadQuestions();
  }

  loadQuestions() {
    this.loading = true;
    const userId = this.authService.currentUserValue?.id || '';
    
    this.userService.getJobRequests(userId, 'seller').subscribe({
      next: (jobs) => {
        // Filter for open jobs
        this.questions = jobs.filter(job => job.status === 'open');
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load questions:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  async viewQuestion(question: JobRequest) {
    // Create a copy of the job to avoid modifying the original
    const jobCopy = { ...question };
    
    // Ensure the job has an ID before opening modal
    if (!jobCopy.id) {
      console.error('Job is missing ID:', jobCopy);
      
      // Generate a temporary ID and warn the user
      jobCopy.id = `temp-${Date.now()}`;
      this.showError('Warning: This job has an invalid ID. Some operations may not work correctly.');
    }
    
    const modal = await this.modalCtrl.create({
      component: JobModalComponent,
      componentProps: {
        mode: 'view',
        jobRequest: jobCopy
      }
    });
    
    await modal.present();
    
    const { data } = await modal.onDidDismiss();
    if (data) {
      // Refresh the questions list
      this.loadQuestions();
    }
  }

  private showError(message: string) {
    // Create an error element and add it to the page
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<p>${message}</p>`;
    errorDiv.style.color = 'white';
    errorDiv.style.backgroundColor = 'var(--ion-color-danger)';
    errorDiv.style.padding = '10px';
    errorDiv.style.margin = '10px';
    errorDiv.style.borderRadius = '5px';
    
    // Add it to the page
    document.querySelector('ion-content')?.appendChild(errorDiv);
    
    // Remove it after 5 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
}
