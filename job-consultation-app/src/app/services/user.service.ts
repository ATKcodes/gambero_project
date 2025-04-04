import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface Certificate {
  id?: string;
  name: string;
  issuer: string;
  date: Date;
  year?: number;
}

export interface Experience {
  id?: string;
  title: string;
  company: string;
  description: string;
  from: Date;
  to?: Date;
  current: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface PaymentMethod {
  id?: string;
  type: string;
  details: string;
  cardType?: string;
  lastFourDigits?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller';
  profileImage?: string;
  bio?: string;
  expertise?: string[];
  hourlyRate?: number;
  minimumPrice?: number;
  isOnline?: boolean;
  description?: string;
  certificates?: Certificate[];
  experiences?: Experience[];
  paymentMethods?: PaymentMethod[];
  createdAt: Date;
}

export interface JobRequest {
  id: string;
  buyerId: string;
  sellerId?: string;
  title: string;
  description: string;
  expertise?: string;
  price: number;
  status: 'open' | 'assigned' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private apiService: ApiService) {}

  getProfile(userId: string): Observable<UserProfile> {
    return this.apiService.get<UserProfile>(`/users/${userId}`).pipe(
      map(response => this.mapToUserProfile(response))
    );
  }

  updateProfile(profileData: Partial<UserProfile>): Observable<UserProfile> {
    return this.apiService.put<UserProfile>('/users/profile', profileData).pipe(
      map(response => this.mapToUserProfile(response))
    );
  }

  getActiveSellers(): Observable<UserProfile[]> {
    return this.apiService.get<UserProfile[]>('/users/sellers').pipe(
      map(response => response.map(profile => this.mapToUserProfile(profile)))
    );
  }

  getJobRequests(userId: string, role: 'buyer' | 'seller'): Observable<JobRequest[]> {
    return this.apiService.get<JobRequest[]>(`/jobs`).pipe(
      map(response => response.map(job => this.mapToJobRequest(job)))
    );
  }

  createJobRequest(job: Partial<JobRequest>): Observable<JobRequest> {
    return this.apiService.post<JobRequest>('/jobs', job).pipe(
      map(response => this.mapToJobRequest(response))
    );
  }

  assignJobRequest(jobId: string, sellerId: string): Observable<JobRequest> {
    return this.apiService.put<JobRequest>(`/jobs/${jobId}/assign`, { sellerId }).pipe(
      map(response => this.mapToJobRequest(response))
    );
  }

  private mapToUserProfile(data: any): UserProfile {
    return {
      id: data.id,
      userId: data.userId || data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      profileImage: data.profileImage,
      bio: data.bio,
      expertise: data.expertise,
      hourlyRate: data.hourlyRate,
      minimumPrice: data.minimumPrice,
      isOnline: data.isOnline || false,
      description: data.description,
      certificates: data.certificates?.map((cert: any) => ({
        id: cert.id,
        name: cert.name,
        issuer: cert.issuer,
        date: new Date(cert.date),
        year: cert.year
      })),
      experiences: data.experiences?.map((exp: any) => ({
        id: exp.id,
        title: exp.title,
        company: exp.company,
        description: exp.description,
        from: new Date(exp.from),
        to: exp.to ? new Date(exp.to) : undefined,
        current: exp.current,
        startDate: exp.startDate ? new Date(exp.startDate) : undefined,
        endDate: exp.endDate ? new Date(exp.endDate) : undefined
      })),
      paymentMethods: data.paymentMethods?.map((pm: any) => ({
        id: pm.id,
        type: pm.type,
        details: pm.details,
        cardType: pm.cardType,
        lastFourDigits: pm.lastFourDigits
      })),
      createdAt: new Date(data.createdAt || Date.now())
    };
  }

  private mapToJobRequest(data: any): JobRequest {
    return {
      id: data.id,
      buyerId: data.buyerId,
      sellerId: data.sellerId,
      title: data.title,
      description: data.description,
      expertise: data.expertise,
      price: data.price,
      status: data.status,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  }
} 