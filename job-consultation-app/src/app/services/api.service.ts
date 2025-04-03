import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    console.log('ApiService initialized with URL:', this.apiUrl);
  }

  // Helper method to get auth token
  private getAuthToken(): string | null {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.token || null;
      } catch (e) {
        console.error('Error parsing user data from localStorage:', e);
        return null;
      }
    }
    return null;
  }

  // Helper method to create headers with auth token
  private getHeaders(): HttpHeaders {
    const token = this.getAuthToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-auth-token': token || ''
    });
  }

  // Auth endpoints
  register(username: string, email: string, password: string, userType: string, fullName: string): Observable<any> {
    console.log(`Making register request to ${this.apiUrl}/auth/register`);
    return this.http.post(`${this.apiUrl}/auth/register`, {
      username,
      email,
      password,
      userType,
      fullName
    }).pipe(
      tap(response => console.log('Register API response:', response)),
      catchError(this.handleError)
    );
  }

  login(email: string, password: string): Observable<any> {
    console.log(`Making login request to ${this.apiUrl}/auth/login`);
    return this.http.post(`${this.apiUrl}/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => console.log('Login API response:', response)),
      catchError(this.handleError)
    );
  }

  loginWith42(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/42`, {
      token
    }).pipe(
      catchError(this.handleError)
    );
  }

  loginWith42Code(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/ft/token`, {
      code
    }).pipe(
      catchError(this.handleError)
    );
  }

  get42LoginUrl(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/ft/login`).pipe(
      catchError(this.handleError)
    );
  }

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/user`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // User/Profile endpoints
  getUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/profile`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateUserProfile(profileData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/profile`, profileData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getProfileById(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/profile/${userId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getSellers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/sellers`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Job endpoints
  createJob(jobData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobs`, jobData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getJobs(): Observable<any> {
    return this.http.get(`${this.apiUrl}/jobs`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getJobById(jobId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/jobs/${jobId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  assignJob(jobId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/jobs/${jobId}/assign`, {}, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  completeJob(jobId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/jobs/${jobId}/complete`, {}, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Message endpoints
  sendMessage(receiverId: string, content: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/messages`, {
      receiver: receiverId,
      content
    }, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getConversations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/messages`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getMessagesWith(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/messages/${userId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  markMessagesAsRead(userId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/messages/read/${userId}`, {}, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getUnreadCount(): Observable<any> {
    return this.http.get(`${this.apiUrl}/messages/unread/count`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Enhanced error handling
  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
      console.error('Client-side error:', error.error.message);
    } else if (error.error && error.error.msg) {
      // Server-side error with message
      errorMessage = error.error.msg;
      console.error('Server returned error:', error.error.msg);
    } else if (error.status) {
      // HTTP error
      errorMessage = `HTTP Error ${error.status}: ${error.statusText}`;
      console.error(`Server returned status code ${error.status}:`, error.statusText);
      
      // Additional network debugging for specific status codes
      if (error.status === 0) {
        console.error('Network error - could not connect to server. Check CORS, server availability, and network connectivity.');
      } else if (error.status === 404) {
        console.error('API endpoint not found. Check if the URL is correct:', error.url);
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${endpoint}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, data, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, data, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }
} 