import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  jobId?: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  // Mock data for development
  private mockChats: Map<string, Chat> = new Map();
  private mockMessages: Map<string, Message[]> = new Map();

  constructor(private apiService: ApiService) {
    // Initialize some mock data for development
    this.initMockData();
  }

  // Initialize mock data for development
  private initMockData(): void {
    // This would be replaced by real API calls in production
    const chat1: Chat = {
      id: 'chat1',
      participants: ['user1', 'user2'],
      lastMessage: {
        id: 'msg3',
        senderId: 'user2',
        receiverId: 'user1',
        content: 'When can we meet?',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        read: false
      },
      unreadCount: 1
    };

    const chat2: Chat = {
      id: 'chat2',
      participants: ['user1', 'user3'],
      lastMessage: {
        id: 'msg6',
        senderId: 'user1',
        receiverId: 'user3',
        content: 'Thanks for your help!',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        read: true
      },
      unreadCount: 0
    };

    // Store mock chats
    this.mockChats.set(chat1.id, chat1);
    this.mockChats.set(chat2.id, chat2);

    // Store mock messages for chat1
    this.mockMessages.set(chat1.id, [
      {
        id: 'msg1',
        senderId: 'user1',
        receiverId: 'user2',
        content: 'Hello, I need help with my project',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        read: true
      },
      {
        id: 'msg2',
        senderId: 'user2',
        receiverId: 'user1',
        content: 'I can help you. What do you need?',
        timestamp: new Date(Date.now() - 5400000), // 1.5 hours ago
        read: true
      },
      {
        id: 'msg3',
        senderId: 'user2',
        receiverId: 'user1',
        content: 'When can we meet?',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        read: false
      }
    ]);

    // Store mock messages for chat2
    this.mockMessages.set(chat2.id, [
      {
        id: 'msg4',
        senderId: 'user3',
        receiverId: 'user1',
        content: 'Hi, I saw your job posting',
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
        read: true
      },
      {
        id: 'msg5',
        senderId: 'user1',
        receiverId: 'user3',
        content: 'Great! Can you help me with my Angular project?',
        timestamp: new Date(Date.now() - 100800000), // 1.2 days ago
        read: true
      },
      {
        id: 'msg6',
        senderId: 'user1',
        receiverId: 'user3',
        content: 'Thanks for your help!',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        read: true
      }
    ]);
  }

  // Get all chats for a user
  getUserChats(userId: string): Observable<Chat[]> {
    // In production, this would use the apiService
    if (this.isUsingMockData()) {
      // For mock data, filter chats where user is a participant
      const userChats = Array.from(this.mockChats.values())
        .filter(chat => chat.participants.includes(userId));
      return of(userChats);
    }

    return this.apiService.getConversations().pipe(
      map(response => {
        // Transform API response to Chat objects
        return response.map((convo: any) => ({
          id: convo._id,
          participants: [convo.user._id, userId],
          lastMessage: convo.lastMessage ? {
            id: convo.lastMessage._id,
            senderId: convo.lastMessage.sender,
            receiverId: convo.lastMessage.receiver,
            content: convo.lastMessage.content,
            timestamp: new Date(convo.lastMessage.timestamp),
            read: convo.lastMessage.read
          } : undefined,
          unreadCount: convo.unreadCount || 0
        }));
      }),
      catchError(error => {
        console.error('Error fetching conversations:', error);
        return of([]);
      })
    );
  }

  // Get messages for a specific chat
  getChatMessages(chatId: string): Observable<Message[]> {
    // In production, this would use the apiService
    if (this.isUsingMockData()) {
      const messages = this.mockMessages.get(chatId) || [];
      return of([...messages]); // Return a copy to prevent mutations
    }

    // Find the second participant (not the current user)
    const chat = this.mockChats.get(chatId);
    if (!chat) {
      return of([]);
    }

    const userId = chat.participants.find(id => id !== 'user1'); // Assuming current user is 'user1'
    if (!userId) {
      return of([]);
    }

    return this.apiService.getMessagesWith(userId).pipe(
      map(response => {
        // Transform API response to Message objects
        return response.map((msg: any) => ({
          id: msg._id,
          senderId: msg.sender,
          receiverId: msg.receiver,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          read: msg.read
        }));
      }),
      catchError(error => {
        console.error('Error fetching messages:', error);
        return of([]);
      })
    );
  }

  // Mark messages in a chat as read
  markChatAsRead(chatId: string, userId: string): Observable<boolean> {
    // In production, this would use the apiService
    if (this.isUsingMockData()) {
      const chat = this.mockChats.get(chatId);
      if (chat) {
        chat.unreadCount = 0;
        
        const messages = this.mockMessages.get(chatId) || [];
        messages.forEach(msg => {
          if (msg.receiverId === userId) {
            msg.read = true;
          }
        });
        
        return of(true);
      }
      return of(false);
    }

    // Find the other participant
    const chat = this.mockChats.get(chatId);
    if (!chat) {
      return of(false);
    }

    const otherUserId = chat.participants.find(id => id !== userId);
    if (!otherUserId) {
      return of(false);
    }

    return this.apiService.markMessagesAsRead(otherUserId).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  // Send a new message
  sendMessage(messageData: { senderId: string; receiverId: string; content: string }): Observable<Message> {
    // In production, this would use the apiService
    if (this.isUsingMockData()) {
      const { senderId, receiverId, content } = messageData;
      
      // Create a new message
      const newMessage: Message = {
        id: `msg${Date.now()}`,
        senderId,
        receiverId,
        content,
        timestamp: new Date(),
        read: false
      };
      
      // Find or create chat
      let chatId = this.findChatId(senderId, receiverId);
      
      if (!chatId) {
        // Create new chat
        chatId = `chat${Date.now()}`;
        const newChat: Chat = {
          id: chatId,
          participants: [senderId, receiverId],
          lastMessage: newMessage,
          unreadCount: 1
        };
        
        this.mockChats.set(chatId, newChat);
        this.mockMessages.set(chatId, []);
      } else {
        // Update existing chat
        const chat = this.mockChats.get(chatId);
        if (chat) {
          chat.lastMessage = newMessage;
          chat.unreadCount += 1;
        }
      }
      
      // Add message to chat
      const messages = this.mockMessages.get(chatId) || [];
      messages.push(newMessage);
      this.mockMessages.set(chatId, messages);
      
      return of(newMessage);
    }

    return this.apiService.sendMessage(messageData.receiverId, messageData.content).pipe(
      map(response => ({
        id: response._id,
        senderId: response.sender,
        receiverId: response.receiver,
        content: response.content,
        timestamp: new Date(response.timestamp),
        read: response.read
      })),
      catchError(error => {
        console.error('Error sending message:', error);
        throw error;
      })
    );
  }

  // Get count of unread messages
  getUnreadCount(userId: string): Observable<number> {
    // In production, this would use the apiService
    if (this.isUsingMockData()) {
      let count = 0;
      this.mockChats.forEach(chat => {
        if (chat.participants.includes(userId)) {
          count += chat.unreadCount;
        }
      });
      return of(count);
    }

    return this.apiService.getUnreadCount().pipe(
      map(response => response.count),
      catchError(() => of(0))
    );
  }

  // Helper to find a chat ID by the participants
  private findChatId(user1: string, user2: string): string | null {
    for (const [id, chat] of this.mockChats.entries()) {
      if (
        chat.participants.includes(user1) &&
        chat.participants.includes(user2)
      ) {
        return id;
      }
    }
    return null;
  }

  // Helper to decide if we're using mock data
  private isUsingMockData(): boolean {
    // In a real app, you might check environment or configuration
    return !this.apiService;
  }

  /**
   * Get messages for a specific job
   * @param jobId The ID of the job to get messages for
   * @returns Observable of Message array
   */
  getJobMessages(jobId: string): Observable<Message[]> {
    return this.apiService.get(`/api/messages/job/${jobId}`).pipe(
      map((response: any[]) => {
        return response.map(msg => ({
          id: msg._id,
          senderId: msg.sender,
          receiverId: msg.receiver,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          read: msg.read,
          jobId: msg.jobId
        }));
      }),
      catchError(error => {
        console.error('Error fetching job messages:', error);
        return of([]);
      })
    );
  }

  /**
   * Send a message in a job chat
   * @param jobId The ID of the job
   * @param content The message content
   * @param receiverId The ID of the message recipient
   * @returns Observable of the sent Message
   */
  sendJobMessage(jobId: string, content: string, receiverId: string): Observable<Message> {
    return this.apiService.post('/api/messages/job', {
      jobId,
      content,
      receiver: receiverId
    }).pipe(
      map((response: any) => ({
        id: response._id,
        senderId: response.sender,
        receiverId: response.receiver,
        content: response.content,
        timestamp: new Date(response.timestamp),
        read: response.read,
        jobId: response.jobId
      })),
      catchError(error => {
        console.error('Error sending job message:', error);
        throw error;
      })
    );
  }
} 