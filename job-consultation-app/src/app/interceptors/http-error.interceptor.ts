import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Log outgoing requests if debug enabled
    if (environment.logRequests) {
      console.log(`🌍 HTTP Request: ${request.method} ${request.url}`);
      if (request.body) {
        console.log('Request Body:', request.body);
      }
    }

    return next.handle(request).pipe(
      // Retry failed requests once
      retry(1),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 0) {
          console.error('❌ Network Error:', error);
          console.log('📱 Is this a CORS issue? Check the network tab for details.');
        } else {
          console.error(`❌ HTTP Error ${error.status}:`, error.message);
          if (error.error) {
            console.error('Error details:', error.error);
          }
        }

        // Add application-specific error handling here
        // For example, show toast notifications, redirect to login page on 401, etc.

        return throwError(() => error);
      })
    );
  }
} 