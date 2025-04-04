import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, map, timeout, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  
  // Fallback URLs in case the primary one doesn't work
  private apiUrls = [
    'http://localhost:3000/api',          // Using ADB reverse - try first for mobile
    'http://10.0.2.2:3000/api',           // Android emulator special IP
    environment.apiUrl,                   // URL from environment
    'http://172.27.98.140:3000/api',      // Direct IP
  ];
  
  private currentApiUrlIndex = 0;
  public apiConnectivity = new BehaviorSubject<string>('Unknown');

  constructor(private http: HttpClient, private injector: Injector) {
    console.log('ApiService initialized with URL:', this.apiUrl);
    this.checkConnectivity();
  }

  // Check connectivity to the backend server
  checkConnectivity() {
    this.apiConnectivity.next('Checking...');
    console.log('Checking connectivity to backend server...');
    console.log('Current environment API URL:', environment.apiUrl);
    console.log('Available fallback URLs:', this.apiUrls);
    
    // On mobile devices, attempt to use specific localhost formats 
    if (typeof (window as any).Capacitor !== 'undefined') {
      console.log('Running on Capacitor - will try mobile-specific connection methods');
    }
    
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
      catchError(error => this.handleError(error))
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
      catchError(error => this.handleError(error))
    );
  }

  // User/Profile endpoints
  getUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/profile`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  updateUserProfile(profileData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/profile`, profileData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  getProfileById(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/profile/${userId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  getSellers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/sellers`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Job endpoints
  createJob(jobData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobs`, jobData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  getJobs(): Observable<any> {
    return this.http.get(`${this.apiUrl}/jobs`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  getJobById(jobId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/jobs/${jobId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  assignJob(jobId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/jobs/${jobId}/assign`, {}, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  completeJob(jobId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/jobs/${jobId}/complete`, {}, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError(error))
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
      catchError(error => this.handleError(error))
    );
  }

  getConversations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/messages`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  getMessagesWith(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/messages/${userId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  markMessagesAsRead(userId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/messages/read/${userId}`, {}, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  getUnreadCount(): Observable<any> {
    return this.http.get(`${this.apiUrl}/messages/unread/count`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Enhanced error handling
  private handleError = (error: any): Observable<never> => {
    let apiUrl = this.apiUrl || environment.apiUrl;
    console.error('Request failed for ' + apiUrl + ':', error);
    let errorMessage = 'Unknown error occurred';
    
    if (error.status === 0) {
      // Connection refused or network error
      errorMessage = `Cannot connect to server at ${apiUrl}. Please check that:
      1. The backend server is running
      2. The server address in your environment configuration is correct
      3. Your network connection is stable`;
      
      // Show a toast if available
      this.showConnectionError();
    } else if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
  
  private showConnectionError() {
    // If we have a toast service, use it (or you can add one)
    if (this.injector && this.injector.get(ToastController, null)) {
      const toast = this.injector.get(ToastController);
      toast.create({
        message: 'Cannot connect to server. Is your backend running?',
        duration: 5000,
        position: 'bottom',
        color: 'danger',
        buttons: [
          {
            text: 'Retry',
            role: 'cancel',
            handler: () => {
              // Attempt to check connectivity again
              this.checkConnectivity();
            }
          }
        ]
      }).then(t => t.present());
    }
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${endpoint}`, { headers: this.getHeaders() }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, data, { headers: this.getHeaders() }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, data, { headers: this.getHeaders() }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`, { headers: this.getHeaders() }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Get OAuth configuration information
   * @returns Observable with OAuth redirect URIs
   */
  getOAuthConfigInfo(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/oauth-info`).pipe(
      tap(response => console.log('Retrieved OAuth config:', response)),
      catchError(error => {
        console.error('Error getting OAuth configuration:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Set temporary OAuth redirect URIs for troubleshooting
   * @param webUri Web redirect URI
   * @param mobileUri Mobile redirect URI
   * @returns Observable with result
   */
  setOAuthRedirectUris(webUri: string, mobileUri: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/oauth-info/set-uri`, {
      webUri,
      mobileUri
    }).pipe(
      tap(response => console.log('Set temporary OAuth URIs:', response)),
      catchError(error => {
        console.error('Error setting OAuth URIs:', error);
        return throwError(() => error);
      })
    );
  }
} 