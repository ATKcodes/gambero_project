import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, map, timeout, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  
  // Fallback URLs in case the primary one doesn't work
  private apiUrls = [
    environment.apiUrl,                   // Primary URL from environment
    'http://localhost:3000/api',          // Using ADB reverse
    'http://10.0.2.2:3000/api',           // Android emulator special IP
    'http://172.27.98.140:3000/api',      // Direct IP
  ];
  
  private currentApiUrlIndex = 0;
  public apiConnectivity = new BehaviorSubject<string>('Unknown');

  constructor(private http: HttpClient) {
    console.log('ApiService initialized with URL:', this.apiUrl);
    this.checkConnectivity();
  }

  // Check connectivity to the backend server
  checkConnectivity() {
    this.apiConnectivity.next('Checking...');
    this.tryNextApiUrl(0);
  }

  private tryNextApiUrl(index: number) {
    if (index >= this.apiUrls.length) {
      console.error('All API URLs failed. No connectivity.');
      this.apiConnectivity.next('Failed');
      return;
    }

    const url = this.apiUrls[index];
    console.log(`Trying API URL ${index + 1}/${this.apiUrls.length}: ${url}`);
    
    this.http.get(`${url}/test`).pipe(
      timeout(5000), // 5 second timeout
      tap(response => {
        console.log(`API call response for ${url}:`, response);
      }),
      catchError(error => {
        console.warn(`API URL ${url} failed:`, error);
        if (error.status) {
          console.error(`Status: ${error.status}, Message: ${error.message || 'No message'}`);
        } else {
          console.error('Network error details:', error);
        }
        this.tryNextApiUrl(index + 1);
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        console.log(`API URL ${url} worked!`, response);
        this.apiUrl = url;
        this.currentApiUrlIndex = index;
        this.apiConnectivity.next('Connected');
      }
    });
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

  // Retry method with URL fallback
  private callWithFallback<T>(request: (url: string) => Observable<T>): Observable<T> {
    const tryUrl = (index: number): Observable<T> => {
      if (index >= this.apiUrls.length) {
        return throwError(() => new Error('All API URLs failed'));
      }
      
      const url = this.apiUrls[index];
      return request(url).pipe(
        timeout(5000),
        catchError(error => {
          console.warn(`Request failed for ${url}:`, error);
          return tryUrl(index + 1);
        })
      );
    };
    
    return tryUrl(this.currentApiUrlIndex);
  }

  // Auth endpoints
  register(username: string, email: string, password: string, userType: string, fullName: string): Observable<any> {
    console.log(`Trying to register user...`);
    
    return this.callWithFallback(url => 
      this.http.post(`${url}/auth/register`, {
        username,
        email,
        password,
        userType,
        fullName
      }).pipe(
        tap(response => console.log('Register API response:', response))
      )
    );
  }

  login(email: string, password: string): Observable<any> {
    console.log(`Trying to login user...`);
    
    return this.callWithFallback(url => 
      this.http.post(`${url}/auth/login`, {
        email,
        password
      }).pipe(
        tap(response => console.log('Login API response:', response))
      )
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
    console.log(`Trying to login with 42 code...`);
    
    // Try the real endpoint only
    return this.callWithFallback(url => 
      this.http.post(`${url}/auth/ft/token`, {
        code
      }).pipe(
        tap(response => console.log('42 login API response:', response))
      )
    );
  }

  get42LoginUrl(isMobile = false): Observable<{ url: string }> {
    console.log('Requesting 42 OAuth URL (mobile:', isMobile, ')');
    
    // Force mobile to false when on localhost for browser testing
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      if (!window.navigator.userAgent.includes('Mobile')) {
        console.log('Detected localhost in browser, forcing non-mobile OAuth URL');
        isMobile = false;
      }
    }
    
    return this.callWithFallback(url => 
      this.http.get<{ url: string }>(`${url}/auth/ft/login${isMobile ? '?mobile=true' : ''}`)
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