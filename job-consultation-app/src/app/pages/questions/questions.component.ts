import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { JobRequest } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './questions.component.html',
  styleUrl: './questions.component.scss'
})
export class QuestionsComponent implements OnInit {
  questions: JobRequest[] = [];
  loading = true;
  error = false;
  showQuestion = false;
  selectedQuestion: JobRequest | null = null;

  constructor(
    private userService: UserService,
    private router: Router,
    private authService: AuthService
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

  viewQuestion(question: JobRequest) {
    this.selectedQuestion = question;
    this.showQuestion = true;
  }

  acceptQuestion(question: JobRequest) {
    const sellerId = this.authService.currentUserValue?.id || '';
    
    // Validate the job ID before making the API call
    if (!question.id || question.id.startsWith('temp-')) {
      console.error('Cannot accept question with invalid ID:', question);
      this.showError('Cannot accept this question due to an invalid ID. Please try reloading the page.');
      return;
    }
    
    console.log('Accepting question with ID:', question.id);
    
    this.userService.assignJobRequest(question.id, sellerId).subscribe({
      next: (response) => {
        console.log('Successfully accepted question:', response);
        // Remove the question from the list or update its status
        this.questions = this.questions.filter(q => q.id !== question.id);
        this.showQuestion = false;
        this.selectedQuestion = null;
      },
      error: (err) => {
        console.error('Failed to accept question:', err);
        this.showError(`Failed to accept question: ${err.message || 'Unknown error'}`);
      }
    });
  }

  closeQuestion() {
    this.showQuestion = false;
    this.selectedQuestion = null;
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
