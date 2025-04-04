import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { UserService, JobRequest } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chat-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Chat - {{ job?.title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="modalCtrl.dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="chat-container">
        <!-- Question and Answer section at the top -->
        <div class="qa-section">
          <ion-card>
            <ion-card-header>
              <ion-card-title>Original Question</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p>{{ job?.description }}</p>
            </ion-card-content>
          </ion-card>
          
          <ion-card *ngIf="job?.answer">
            <ion-card-header>
              <ion-card-title>Your Answer</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p>{{ job?.answer }}</p>
            </ion-card-content>
          </ion-card>
        </div>
        
        <!-- Chat messages -->
        <div class="chat-messages">
          <div *ngIf="!messages || messages.length === 0" class="ion-text-center">
            <p>No messages yet. Start the conversation!</p>
          </div>
          
          <div *ngFor="let message of messages" 
               [ngClass]="{'message-right': message.senderId === currentUserId, 'message-left': message.senderId !== currentUserId}" 
               class="message">
            <div class="message-bubble">
              <p>{{ message.text }}</p>
              <small>{{ message.timestamp | date:'short' }}</small>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
    
    <ion-footer>
      <ion-toolbar>
        <ion-input 
          [(ngModel)]="newMessage" 
          placeholder="Type a message..." 
          (keyup.enter)="sendMessage()">
        </ion-input>
        <ion-buttons slot="end">
          <ion-button (click)="sendMessage()" [disabled]="!newMessage">
            <ion-icon name="send"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .qa-section {
      margin-bottom: 20px;
    }
    
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
    }
    
    .message {
      margin-bottom: 10px;
      display: flex;
    }
    
    .message-left {
      justify-content: flex-start;
    }
    
    .message-right {
      justify-content: flex-end;
    }
    
    .message-bubble {
      max-width: 80%;
      padding: 10px;
      border-radius: 10px;
      background-color: #f4f5f8;
    }
    
    .message-right .message-bubble {
      background-color: #dcf8c6;
    }
    
    .message p {
      margin: 0;
    }
    
    .message small {
      font-size: 0.7rem;
      color: #888;
    }
  `]
})
export class ChatModalComponent implements OnInit {
  @Input() job: JobRequest | undefined;
  messages: any[] = [];
  newMessage: string = '';
  currentUserId: string = '';
  
  constructor(
    public modalCtrl: ModalController,
    private userService: UserService,
    private authService: AuthService,
    private toastCtrl: ToastController
  ) {}
  
  ngOnInit() {
    const currentUser = this.authService.getUser();
    if (currentUser) {
      this.currentUserId = currentUser.id;
    }
    
    // For demonstration purposes, adding some dummy messages
    if (this.job) {
      this.messages = [
        {
          senderId: this.job.buyerId,
          text: 'Thank you for accepting my question!',
          timestamp: new Date(Date.now() - 60000) // 1 minute ago
        },
        {
          senderId: this.job.sellerId || this.currentUserId,
          text: 'You\'re welcome! Let me know if you need any clarification.',
          timestamp: new Date()
        }
      ];
    }
  }
  
  sendMessage() {
    if (!this.newMessage || !this.job) {
      return;
    }
    
    // In a real app, this would send the message to a backend service
    this.messages.push({
      senderId: this.currentUserId,
      text: this.newMessage,
      timestamp: new Date()
    });
    
    this.newMessage = '';
    
    // Scroll to the bottom after sending a message
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
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