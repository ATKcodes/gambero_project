import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { UserService, UserProfile, JobRequest } from '../../services/user.service';

@Component({
  selector: 'app-job-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ mode === 'create' ? 'Post a Question' : 'Question Details' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="modalCtrl.dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <ion-item>
        <ion-label position="floating">Title</ion-label>
        <ion-input [(ngModel)]="jobRequest.title" [readonly]="mode === 'view'"></ion-input>
      </ion-item>
      
      <ion-item>
        <ion-label position="floating">Description</ion-label>
        <ion-textarea [(ngModel)]="jobRequest.description" rows="5" [readonly]="mode === 'view'"></ion-textarea>
      </ion-item>
      
      <ion-item *ngIf="mode === 'create'">
        <ion-label>Expertise Needed</ion-label>
        <ion-select [(ngModel)]="jobRequest.expertise">
          <ion-select-option value="Pastry">Pastry</ion-select-option>
          <ion-select-option value="Italian">Italian</ion-select-option>
          <ion-select-option value="Vegetarian">Vegetarian</ion-select-option>
          <ion-select-option value="Wines">Wines</ion-select-option>
        </ion-select>
      </ion-item>
      
      <div *ngIf="mode === 'view'" class="ion-padding-top">
        <ion-item>
          <ion-label>
            <h2>Status</h2>
            <p>{{ jobRequest.status }}</p>
          </ion-label>
        </ion-item>
        
        <ion-item *ngIf="jobRequest.expertise">
          <ion-label>
            <h2>Expertise</h2>
            <p>{{ jobRequest.expertise }}</p>
          </ion-label>
        </ion-item>
        
        <ion-item>
          <ion-label>
            <h2>Created</h2>
            <p>{{ jobRequest.createdAt | date }}</p>
          </ion-label>
        </ion-item>
      </div>
      
      <div class="ion-padding-top">
        <ion-button expand="block" *ngIf="mode === 'create'" (click)="saveJob()">
          Post Question
        </ion-button>
        
        <ion-button expand="block" *ngIf="mode === 'view' && canTakeJob" (click)="takeJob()">
          Accept this job
        </ion-button>
      </div>
    </ion-content>
  `
})
export class JobModalComponent implements OnInit {
  mode: 'create' | 'view' = 'create';
  jobRequest: Partial<JobRequest> = {};
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
      updatedAt: new Date()
    };
    
    this.userService.createJobRequest(newJob).subscribe({
      next: (job) => {
        this.showToast('Question posted successfully');
        this.modalCtrl.dismiss(job);
      },
      error: (err) => {
        this.showToast('Error posting question: ' + err.message);
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
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/main"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isSeller ? 'Available Jobs' : 'Find an Expert' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="market-container">
        <div class="search-area ion-margin-bottom">
          <ion-searchbar
            placeholder="{{ isSeller ? 'Search jobs' : 'Search experts' }}"
            [(ngModel)]="searchTerm"
            (ionChange)="filterItems()"
          ></ion-searchbar>
        </div>
        
        <!-- For buyers: show active sellers -->
        <ng-container *ngIf="!isSeller">
          <ion-grid>
            <ion-row>
              <ion-col size="12">
                <ion-text color="primary">
                  <h2>Who should help you?</h2>
                </ion-text>
              </ion-col>
            </ion-row>
            
            <ion-row>
              <ion-col size-xs="12" size-sm="6" size-md="4" size-lg="3" *ngFor="let seller of filteredSellers">
                <ion-card (click)="viewProfile(seller.userId)">
                  <ion-card-header>
                    <ion-card-subtitle>{{ seller.expertise }}</ion-card-subtitle>
                    <ion-card-title>{{ seller.name }}</ion-card-title>
                  </ion-card-header>
                  <ion-card-content>
                    <ion-img [src]="seller.profileImage" class="seller-img"></ion-img>
                    <p class="seller-bio">{{ seller.bio }}</p>
                    <ion-chip color="secondary">
                      <ion-label>{{ seller.minimumPrice }}€</ion-label>
                    </ion-chip>
                    <ion-button expand="block" fill="outline" (click)="viewProfile(seller.userId); $event.stopPropagation()">
                      View Profile
                    </ion-button>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>
          
          <ion-fab vertical="bottom" horizontal="end" slot="fixed">
            <ion-fab-button (click)="createJob()">
              <ion-icon name="add"></ion-icon>
            </ion-fab-button>
          </ion-fab>
          
          <ion-list>
            <ion-list-header>
              <ion-label>Your Questions</ion-label>
            </ion-list-header>
            
            <ion-item *ngFor="let job of userJobs" button (click)="viewJob(job)">
              <ion-label>
                <h2>{{ job.title }}</h2>
                <p>{{ job.description }}</p>
                <p>Status: {{ job.status }}</p>
              </ion-label>
              <ion-note slot="end">{{ job.createdAt | date:'short' }}</ion-note>
            </ion-item>
          </ion-list>
        </ng-container>
        
        <!-- For sellers: show available jobs -->
        <ng-container *ngIf="isSeller">
          <ion-grid>
            <ion-row>
              <ion-col size="12">
                <ion-text color="primary">
                  <h2>Who can you help?</h2>
                </ion-text>
              </ion-col>
            </ion-row>
          </ion-grid>
          
          <ion-list>
            <ion-item *ngFor="let job of filteredJobs" button (click)="viewJob(job)">
              <ion-label>
                <h2>{{ job.title }}</h2>
                <p>{{ job.description }}</p>
                <p *ngIf="job.expertise">Expertise: {{ job.expertise }}</p>
              </ion-label>
              <ion-badge slot="end" [color]="getStatusColor(job.status)">{{ job.status }}</ion-badge>
              <ion-note slot="end">{{ job.createdAt | date:'short' }}</ion-note>
            </ion-item>
            
            <ion-item *ngIf="filteredJobs.length === 0">
              <ion-label class="ion-text-center">
                No jobs found matching your expertise
              </ion-label>
            </ion-item>
          </ion-list>
        </ng-container>
      </div>
    </ion-content>
  `,
  styles: [`
    .market-container {
      background-color: var(--ion-color-tertiary);
      min-height: 100%;
    }
    
    .seller-img {
      width: 100%;
      max-height: 150px;
      object-fit: cover;
      margin-bottom: 10px;
    }
    
    .seller-bio {
      margin: 10px 0;
      max-height: 60px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }
  `]
})
export class MarketComponent implements OnInit {
  isSeller = false;
  searchTerm = '';
  sellers: UserProfile[] = [];
  filteredSellers: UserProfile[] = [];
  jobs: JobRequest[] = [];
  filteredJobs: JobRequest[] = [];
  userJobs: JobRequest[] = [];
  user: User | null = null;
  
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private modalCtrl: ModalController
  ) {}
  
  ngOnInit() {
    this.user = this.authService.getUser();
    this.isSeller = this.authService.getUserType() === 'seller';
    
    if (this.user) {
      if (this.isSeller) {
        this.loadJobs();
      } else {
        this.loadSellers();
        this.loadUserJobs();
      }
    } else {
      this.router.navigate(['/login']);
    }
  }
  
  loadSellers() {
    this.userService.getActiveSellers().subscribe(sellers => {
      this.sellers = sellers;
      this.filteredSellers = sellers;
    });
  }
  
  loadJobs() {
    if (this.user) {
      this.userService.getJobRequests(this.user.id, 'seller').subscribe(jobs => {
        this.jobs = jobs;
        this.filteredJobs = jobs;
      });
    }
  }
  
  loadUserJobs() {
    if (this.user) {
      this.userService.getJobRequests(this.user.id, 'buyer').subscribe(jobs => {
        this.userJobs = jobs;
      });
    }
  }
  
  filterItems() {
    const search = this.searchTerm.toLowerCase();
    
    if (this.isSeller) {
      this.filteredJobs = this.jobs.filter(job => 
        job.title.toLowerCase().includes(search) || 
        job.description.toLowerCase().includes(search) ||
        (job.expertise && job.expertise.toLowerCase().includes(search))
      );
    } else {
      this.filteredSellers = this.sellers.filter(seller => 
        seller.name.toLowerCase().includes(search) || 
        (seller.expertise && seller.expertise.some(exp => exp.toLowerCase().includes(search)))
      );
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
      this.loadUserJobs();
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
      if (this.isSeller) {
        this.loadJobs();
      } else {
        this.loadUserJobs();
      }
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

  filterJobs(search: string): void {
    if (!search) {
      this.filteredJobs = this.jobs;
      return;
    }

    search = search.toLowerCase();
    this.filteredJobs = this.jobs.filter(job => 
      job.title.toLowerCase().includes(search) ||
      job.description.toLowerCase().includes(search) ||
      (job.expertise && job.expertise.toLowerCase().includes(search))
    );
  }
} 