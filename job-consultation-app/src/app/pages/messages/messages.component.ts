import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { AuthService, User } from '../../services/auth.service';
import { MessageService, Message } from '../../services/message.service';
import { UserService, UserProfile } from '../../services/user.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/main"></ion-back-button>
        </ion-buttons>
        <ion-title>
          {{ selectedChat ? getChatName(selectedChat) : 'Messages' }}
        </ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="chat-container">
        <ion-grid>
          <ion-row>
            <ion-col size="12" size-md="4" class="chat-list-col">
              <ion-list lines="full">
                <ion-list-header>
                  <ion-label>Conversations</ion-label>
                </ion-list-header>
                
                <ion-item *ngFor="let chat of chats" 
                          [class.selected]="selectedChat?.id === chat.id"
                          button (click)="selectChat(chat)">
                  <ion-avatar slot="start">
                    <img src="https://via.placeholder.com/40" alt="Avatar" />
                  </ion-avatar>
                  <ion-label>
                    <h2>{{ getChatName(chat) }}</h2>
                    <p>{{ chat.lastMessage?.content }}</p>
                  </ion-label>
                  <ion-badge *ngIf="chat.unreadCount > 0" color="primary" slot="end">
                    {{ chat.unreadCount }}
                  </ion-badge>
                  <ion-note slot="end">{{ formatTime(chat.lastMessage?.timestamp) }}</ion-note>
                </ion-item>
                
                <ion-item *ngIf="chats.length === 0">
                  <ion-label class="ion-text-center">
                    No conversations yet
                  </ion-label>
                </ion-item>
              </ion-list>
            </ion-col>
            
            <ion-col size="12" size-md="8" class="message-col">
              <ng-container *ngIf="selectedChat; else noChat">
                <div class="message-container">
                  <div class="messages">
                    <div *ngFor="let message of messages" 
                         [class.sent]="message.senderId === currentUser?.id"
                         [class.received]="message.senderId !== currentUser?.id"
                         class="message-bubble">
                      <div class="message-content">
                        {{ message.content }}
                      </div>
                      <div class="message-time">
                        {{ formatTime(message.timestamp) }}
                      </div>
                    </div>
                    
                    <div *ngIf="messages.length === 0" class="no-messages">
                      <p>No messages yet. Send one to start the conversation!</p>
                    </div>
                  </div>
                </div>
                
                <div class="message-input">
                  <ion-item>
                    <ion-input 
                      [(ngModel)]="newMessage" 
                      placeholder="Type a message..." 
                      (keyup.enter)="sendMessage()">
                    </ion-input>
                    <ion-button slot="end" fill="clear" (click)="sendMessage()">
                      <ion-icon name="send"></ion-icon>
                    </ion-button>
                  </ion-item>
                </div>
              </ng-container>
              
              <ng-template #noChat>
                <div class="no-chat-selected">
                  <ion-text color="medium">
                    <h4>Select a conversation to view messages</h4>
                  </ion-text>
                </div>
              </ng-template>
            </ion-col>
          </ion-row>
        </ion-grid>
      </div>
    </ion-content>
  `,
  styles: [`
    .chat-container {
      height: 100%;
      background-color: var(--ion-color-tertiary);
    }
    
    .chat-list-col {
      border-right: 1px solid var(--ion-border-color);
    }
    
    .selected {
      --background: rgba(var(--ion-color-primary-rgb), 0.1);
    }
    
    .message-col {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .message-container {
      flex-grow: 1;
      overflow-y: auto;
      padding: 10px;
    }
    
    .messages {
      display: flex;
      flex-direction: column;
    }
    
    .message-bubble {
      max-width: 80%;
      margin-bottom: 10px;
      padding: 10px;
      border-radius: 10px;
    }
    
    .sent {
      align-self: flex-end;
      background-color: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
    }
    
    .received {
      align-self: flex-start;
      background-color: var(--ion-color-light);
      color: var(--ion-color-dark);
    }
    
    .message-content {
      font-size: 16px;
    }
    
    .message-time {
      font-size: 12px;
      text-align: right;
      margin-top: 5px;
      opacity: 0.7;
    }
    
    .message-input {
      background: white;
      border-top: 1px solid var(--ion-border-color);
    }
    
    .no-chat-selected, .no-messages {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      text-align: center;
    }
    
    @media (max-width: 768px) {
      .chat-list-col {
        display: none;
      }
    }
  `]
})
export class MessagesComponent implements OnInit {
  currentUser: User | null = null;
  chats: any[] = [];
  selectedChat: any = null;
  chatPartner: UserProfile | undefined;
  messages: Message[] = [];
  newMessage = '';
  
  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private userService: UserService,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private toastCtrl: ToastController
  ) {}
  
  ngOnInit() {
    this.currentUser = this.authService.getUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadChats();
    
    // Check if there's a userId in the route params
    this.route.paramMap.subscribe(params => {
      const userId = params.get('userId');
      if (userId) {
        this.openOrCreateChat(userId);
      }
    });
  }
  
  loadChats() {
    // In real implementation, use apiService
    this.messageService.getUserChats(this.currentUser!.id).subscribe(chats => {
      this.chats = chats;
      
      // If there's a selected chat, mark it as read
      if (this.selectedChat) {
        const updatedChat = this.chats.find(c => c.id === this.selectedChat.id);
        if (updatedChat) {
          this.selectedChat = updatedChat;
        }
      }
    });
  }
  
  selectChat(chat: any) {
    this.selectedChat = chat;
    this.loadMessages(chat.id);
    
    // Mark messages as read
    if (chat.unreadCount > 0 && this.currentUser) {
      this.messageService.markChatAsRead(chat.id, this.currentUser.id).subscribe(() => {
        chat.unreadCount = 0;
      });
    }
  }
  
  loadMessages(chatId: string) {
    this.messageService.getChatMessages(chatId).subscribe(messages => {
      this.messages = messages;
      
      // Scroll to bottom after messages load
      setTimeout(() => {
        const messageContainer = document.querySelector('.message-container');
        if (messageContainer) {
          messageContainer.scrollTop = messageContainer.scrollHeight;
        }
      }, 100);
    });
  }
  
  openOrCreateChat(userId: string) {
    // Check if chat already exists
    const existingChat = this.chats.find(chat => 
      chat.participants.includes(userId) && chat.participants.includes(this.currentUser!.id)
    );
    
    if (existingChat) {
      this.selectChat(existingChat);
    } else {
      // If using real API, this would need to be implemented differently
      // For now, we'll just set up a new chat object
      const newChat = {
        id: Math.random().toString(36).substr(2, 9),
        participants: [this.currentUser!.id, userId],
        unreadCount: 0
      };
      
      this.chats.push(newChat);
      this.selectChat(newChat);
    }
  }
  
  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedChat || !this.currentUser) {
      return;
    }
    
    // Get the other participant's ID
    const receiverId = this.selectedChat.participants.find((id: string) => id !== this.currentUser!.id);
    
    // Send the message
    this.messageService.sendMessage({
      senderId: this.currentUser.id,
      receiverId,
      content: this.newMessage.trim()
    }).subscribe({
      next: (message) => {
        this.messages.push(message);
        this.newMessage = '';
        
        // Update the chat's last message
        this.selectedChat.lastMessage = message;
        
        // Scroll to bottom
        setTimeout(() => {
          const messageContainer = document.querySelector('.message-container');
          if (messageContainer) {
            messageContainer.scrollTop = messageContainer.scrollHeight;
          }
        }, 100);
      },
      error: (err) => {
        this.showToast('Error sending message: ' + err.message);
      }
    });
  }
  
  getChatName(chat: any): string {
    if (!chat) return '';
    
    // In a real implementation, you would look up the user's name
    // For now, display a generic name based on the other participant's ID
    const otherParticipantId = chat.participants.find((id: string) => id !== this.currentUser!.id);
    return `Chat with User ${otherParticipantId.slice(-4)}`;
  }
  
  formatTime(date?: Date | string): string {
    if (!date) return '';
    
    const messageDate = new Date(date);
    const now = new Date();
    
    // If the same day, show only time
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If within a week, show day of week
    const diffDays = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short' }) + ' ' + 
             messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise show date
    return messageDate.toLocaleDateString();
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