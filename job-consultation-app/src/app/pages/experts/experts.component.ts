import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserProfile } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-experts',
  standalone: true,
  imports: [CommonModule, IonicModule],
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
    private authService: AuthService
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

  createJob(expertId: string) {
    // Navigate to create job page with expert ID
    this.router.navigate(['/market'], { queryParams: { createJob: true, expertId: expertId } });
  }
}
