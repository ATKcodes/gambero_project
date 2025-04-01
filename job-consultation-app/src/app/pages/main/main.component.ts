import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule, PopoverController, ModalController } from '@ionic/angular';
import { AuthService, User } from '../../services/auth.service';
import { MessageService, Chat } from '../../services/message.service';

@Component({
  selector: 'app-chat-popover',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <ion-list lines="full">
      <ion-list-header>Recent Messages</ion-list-header>
      <ion-item *ngIf="chats.length === 0">
        <ion-label>No messages yet</ion-label>
      </ion-item>
      <ion-item *ngFor="let chat of chats" button (click)="selectChat(chat)">
        <ion-avatar slot="start">
          <img src="https://via.placeholder.com/40" alt="Avatar" />
        </ion-avatar>
        <ion-label>
          <h2>{{ getChatName(chat) }}</h2>
          <p>{{ chat.lastMessage?.content }}</p>
        </ion-label>
        <ion-badge *ngIf="chat.unreadCount > 0" color="primary" slot="end">{{ chat.unreadCount }}</ion-badge>
        <ion-note slot="end">{{ formatTime(chat.lastMessage?.timestamp) }}</ion-note>
      </ion-item>
      <ion-item button (click)="viewAllMessages()">
        <ion-icon name="chatbubbles-outline" slot="start" color="primary"></ion-icon>
        <ion-label color="primary">View All Messages</ion-label>
      </ion-item>
    </ion-list>
  `
})
export class ChatPopoverComponent {
  chats: Chat[] = [];

  constructor(
    private popoverCtrl: PopoverController,
    private messageService: MessageService,
    private authService: AuthService,
    private router: Router
  ) {}

  ionViewWillEnter() {
    this.loadChats();
  }

  async loadChats() {
    const userId = this.authService.getUser()?.id;
    if (userId) {
      this.messageService.getUserChats(userId).subscribe(chats => {
        this.chats = chats;
      });
    }
  }

  selectChat(chat: Chat) {
    this.popoverCtrl.dismiss(chat);
  }

  viewAllMessages() {
    this.popoverCtrl.dismiss();
    this.router.navigate(['/messages']);
  }

  getChatName(chat: Chat): string {
    const currentUserId = this.authService.getUser()?.id;
    // In a real app, we would look up the other user's name
    return `Chat ${chat.id}`;
  }

  formatTime(date?: Date): string {
    if (!date) return '';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // If less than a day, show hours:minutes
    if (diff < 86400000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise, show date
    return date.toLocaleDateString();
  }
}

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>HUGE</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="openChatPopover($event)">
            <ion-icon name="chatbubbles-outline"></ion-icon>
            <ion-badge *ngIf="unreadCount > 0" color="danger">{{ unreadCount }}</ion-badge>
          </ion-button>
          <ion-button (click)="goToProfile()">
            <ion-icon name="person-outline"></ion-icon>
          </ion-button>
          <ion-button (click)="logout()">
            <ion-icon name="log-out-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="main-container">
        <h1>Welcome, {{ user?.username }}!</h1>
        
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ isSeller ? 'Post Your Services' : 'Need a Consultation?' }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>{{ isSeller ? 'Share your expertise and help others with their questions.' : 'Find an expert to get professional advice on your questions.' }}</p>
            
            <ion-button expand="block" color="secondary" (click)="goToMarket()">
              {{ isSeller ? 'Post Job' : 'Ask a question' }}
            </ion-button>
          </ion-card-content>
        </ion-card>
        
        <ion-card>
          <ion-card-header>
            <ion-card-title>Messages</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>Stay in touch with consultants and clients through our messaging system.</p>
            
            <ion-button expand="block" color="tertiary" (click)="goToMessages()">
              <ion-icon name="chatbubbles-outline" slot="start"></ion-icon>
              View Messages
              <ion-badge *ngIf="unreadCount > 0" color="danger" slot="end">{{ unreadCount }}</ion-badge>
            </ion-button>
          </ion-card-content>
        </ion-card>
        
        <ion-card>
          <ion-card-content>
            <ion-datetime-button datetime="datetime"></ion-datetime-button>
            <ion-modal [keepContentsMounted]="true">
              <ng-template>
                <ion-datetime id="datetime"></ion-datetime>
              </ng-template>
            </ion-modal>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .main-container {
      background-color: var(--ion-color-tertiary);
      min-height: 100%;
      padding: 16px;
    }
    
    h1 {
      color: black;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
    }
  `]
})
export class MainComponent implements OnInit {
  user: User | null = null;
  isSeller = false;
  unreadCount = 0;

  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router,
    private popoverCtrl: PopoverController
  ) {}

  ngOnInit() {
    this.user = this.authService.getUser();
    this.isSeller = this.authService.getUserType() === 'seller';
    this.loadUnreadCount();
  }

  loadUnreadCount() {
    if (this.user) {
      this.messageService.getUnreadCount(this.user.id).subscribe(count => {
        this.unreadCount = count;
      });
    }
  }

  async openChatPopover(event: any) {
    const popover = await this.popoverCtrl.create({
      component: ChatPopoverComponent,
      event,
      translucent: true
    });
    
    await popover.present();
    
    const { data } = await popover.onDidDismiss();
    if (data) {
      // Open the messages page with this chat
      this.router.navigate(['/messages', data.participants.find((id: string) => id !== this.user?.id)]);
    }
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  goToMarket() {
    this.router.navigate(['/market']);
  }

  goToMessages() {
    this.router.navigate(['/messages']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
} 