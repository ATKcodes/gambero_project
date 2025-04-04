import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { MessageService, Message } from '../../services/message.service';

interface Job {
  _id: string;
  userId: string;
  sellerId?: string;
  title: string;
  description: string;
  answer?: string;
}

@Component({
  selector: 'app-chat-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './chat-modal.component.html',
  styleUrls: ['./chat-modal.component.scss']
})
export class ChatModalComponent implements OnInit {
  @Input() job: Job | undefined;
  @ViewChild('messageList') messageList!: ElementRef;
  
  messages: Message[] = [];
  newMessage: string = '';
  currentUserId: string = '';
  otherUserId: string = '';
  isLoading: boolean = false;
  
  constructor(
    private modalController: ModalController,
    private userService: UserService,
    private authService: AuthService,
    private messageService: MessageService,
    private toastCtrl: ToastController
  ) {}
  
  ngOnInit() {
    this.currentUserId = this.authService.getUser()?.id || '';
    
    // Determine the other user in the conversation
    if (this.job) {
      // If current user is buyer, other user is seller
      if (this.job.userId === this.currentUserId) {
        this.otherUserId = this.job.sellerId || '';
      } else {
        // Current user is seller, other user is buyer
        this.otherUserId = this.job.userId || '';
      }
      
      // Load existing messages
      this.loadMessages();
    }
  }
  
  /**
   * Loads messages for the current job
   */
  loadMessages() {
    if (!this.job?._id) return;
    
    this.isLoading = true;
    this.messageService.getJobMessages(this.job._id).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.isLoading = false;
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.isLoading = false;
      }
    });
  }
  
  /**
   * Sends a new message
   */
  sendMessage() {
    if (!this.newMessage.trim() || !this.job?._id || !this.otherUserId) return;
    
    this.messageService.sendJobMessage(
      this.job._id,
      this.newMessage.trim(),
      this.otherUserId
    ).subscribe({
      next: (message) => {
        this.messages.push(message);
        this.newMessage = '';
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error sending message:', error);
      }
    });
  }
  
  /**
   * Scrolls the message list to the bottom
   */
  scrollToBottom() {
    if (this.messageList?.nativeElement) {
      const element = this.messageList.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
  
  /**
   * Dismisses the chat modal
   */
  dismiss(refresh: boolean = false) {
    this.modalController.dismiss({
      refresh
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