import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
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
  answer?: string;
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
    console.log('Creating job request with data:', job);
    
    // Clone the job object to avoid modifying the original
    const jobToCreate = { ...job };
    
    return this.apiService.post<any>('/jobs', jobToCreate).pipe(
      map(response => {
        console.log('Response from job creation API:', response);
        
        // The backend might return the MongoDB document directly
        // Make sure we handle MongoDB's _id format
        if (response) {
          // MongoDB returns either id or _id
          if (response._id && !response.id) {
            // If we have _id but no id, use _id
            response.id = response._id;
          } else if (!response._id && !response.id) {
            // If neither exists, create a temp ID
            response.id = `temp-${Date.now()}`;
            console.error('Backend did not return a valid ID for the created job');
          }
          
          // Make sure key fields are populated
          if (!response.buyerId && response.buyer) {
            response.buyerId = typeof response.buyer === 'string' ? response.buyer : response.buyer._id || response.buyer.id;
          }
          
          // Ensure dates are properly formatted
          if (response.createdAt && !(response.createdAt instanceof Date)) {
            response.createdAt = new Date(response.createdAt);
          }
          
          if (response.updatedAt && !(response.updatedAt instanceof Date)) {
            response.updatedAt = new Date(response.updatedAt);
          }
        }
        
        return this.mapToJobRequest(response);
      }),
      catchError(error => {
        console.error('Error creating job request:', error);
        return throwError(() => error);
      })
    );
  }

  assignJobRequest(jobId: string, sellerId: string, answer?: string): Observable<JobRequest> {
    return this.apiService.put<JobRequest>(`/jobs/${jobId}/assign`, { sellerId, answer }).pipe(
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
    // Log the raw data for debugging
    console.log('Raw job data from server:', data);
    
    // Check if the job data is valid
    if (!data) {
      console.error('Received null or undefined job data');
      // Return a safe default job with a generated ID to prevent errors
      return {
        id: `temp-${Date.now()}`,
        buyerId: '',
        title: 'Error: Invalid Job',
        description: 'This job has invalid data',
        price: 0,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    // Handle MongoDB document format (check both id and _id)
    const jobId = data.id || (data._id ? (typeof data._id === 'object' ? data._id.toString() : data._id) : null);
    
    if (!jobId) {
      console.error('Job is missing ID field:', data);
    }
    
    // Handle buyer ID which can be an object or string in MongoDB
    let buyerId = data.buyerId || '';
    if (!buyerId && data.buyer) {
      // If buyer is an object with _id, use that
      if (typeof data.buyer === 'object' && data.buyer) {
        buyerId = data.buyer._id || data.buyer.id || '';
      } else {
        // Otherwise assume it's a string ID
        buyerId = data.buyer;
      }
    }
    
    return {
      id: jobId || `temp-${Date.now()}`, // Generate a temporary ID if none exists
      buyerId: buyerId,
      sellerId: data.sellerId || (data.seller ? (typeof data.seller === 'object' ? data.seller._id || data.seller.id : data.seller) : undefined),
      title: data.title || 'Untitled',
      description: data.description || '',
      expertise: data.expertise,
      price: typeof data.price === 'number' ? data.price : 0,
      status: data.status || 'open',
      answer: data.answer,
      createdAt: new Date(data.createdAt || Date.now()),
      updatedAt: new Date(data.updatedAt || Date.now())
    };
  }
} 