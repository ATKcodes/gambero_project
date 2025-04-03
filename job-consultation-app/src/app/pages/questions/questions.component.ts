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
    
    this.userService.assignJobRequest(question.id, sellerId).subscribe({
      next: () => {
        // Remove the question from the list or update its status
        this.questions = this.questions.filter(q => q.id !== question.id);
        this.showQuestion = false;
        this.selectedQuestion = null;
      },
      error: (err) => {
        console.error('Failed to accept question:', err);
      }
    });
  }

  closeQuestion() {
    this.showQuestion = false;
    this.selectedQuestion = null;
  }
}
