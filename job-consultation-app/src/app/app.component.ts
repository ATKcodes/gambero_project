import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Platform } from '@ionic/angular';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { App, URLOpenListenerEvent } from '@capacitor/app';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, IonApp, IonRouterOutlet],
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private platform: Platform,
    private router: Router
  ) {
    this.initializeApp();
  }
  
  ngOnInit() {
    console.log('App component initialized');
  }

  initializeApp() {
    this.platform.ready().then(() => {
      console.log('Platform ready');
      
      // Log platform information for debugging
      console.log('Running on:', this.platform.platforms());
      console.log('Is native:', this.platform.is('capacitor') || this.platform.is('cordova'));
      console.log('Is Android:', this.platform.is('android'));
      console.log('Is iOS:', this.platform.is('ios'));
      console.log('Is mobile:', this.platform.is('mobile'));
      console.log('Is desktop:', this.platform.is('desktop'));
      console.log('API URL:', environment.apiUrl);
      
      // DEVELOPMENT HELPER: Clear localStorage when requested
      // For testing, add ?clear=true to the URL query params
      // Or use this on first app load during development to reset state
      if (this.platform.is('capacitor') || this.platform.is('cordova')) {
        console.log('Checking if we should clear localStorage...');
        try {
          // Use a flag in localStorage to know if this is the first run after a build
          const lastBuildTime = localStorage.getItem('lastBuildTime');
          const currentBuildTime = `${new Date().toISOString()}`; // Build timestamp
          
          if (lastBuildTime !== currentBuildTime) {
            console.log('New build detected, clearing localStorage');
            localStorage.clear();
            localStorage.setItem('lastBuildTime', currentBuildTime);
          }
        } catch (e) {
          console.error('Error managing localStorage:', e);
        }
      }
      
      // Debug network connectivity
      if (this.platform.is('android')) {
        console.log('Testing backend connection from Android...');
        const testUrl = environment.apiUrl + '/test';
        console.log('Testing URL:', testUrl);
        
        fetch(testUrl)
          .then(response => {
            console.log('Backend connection test response status:', response.status);
            return response.json();
          })
          .then(data => {
            console.log('Backend connection test data:', data);
          })
          .catch(error => {
            console.error('Backend connection test failed:', error);
          });
      }
      
      // You might want to handle different platform initializations here
      
      // Setup deep link handling
      App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
        console.log('App opened with URL:', event.url);
        this.handleOpenUrl(event.url);
      });
    });
  }

  private handleOpenUrl(url: string) {
    console.log('Handling deep link URL:', url);
    
    // Check if this is our OAuth callback URL
    if (url.includes('oauth-callback')) {
      console.log('OAuth callback URL detected in deep link');
      
      try {
        // Parse the URL to extract the code parameter
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        const state = urlObj.searchParams.get('state');
        
        console.log('Parsed deep link URL:', {
          fullUrl: url,
          code: code ? `${code.substring(0, 10)}...` : 'none',
          state: state
        });
        
        if (code) {
          console.log('OAuth code received via deep link, navigating to callback handler');
          
          // Force a small delay to ensure app is fully ready
          setTimeout(() => {
            // Navigate to the OAuth callback route with the code
            this.router.navigate(['/oauth-callback'], { 
              queryParams: { code, state }
            });
          }, 500);
        } else {
          console.error('No code found in OAuth callback URL');
          setTimeout(() => this.router.navigate(['/login']), 500);
        }
      } catch (e) {
        console.error('Error parsing deep link URL:', e);
        
        // Extract code manually if URL parsing fails
        try {
          const codeMatch = url.match(/[?&]code=([^&]+)/);
          if (codeMatch && codeMatch[1]) {
            const code = codeMatch[1];
            console.log('Extracted code using regex:', code.substring(0, 10) + '...');
            setTimeout(() => {
              this.router.navigate(['/oauth-callback'], { queryParams: { code } });
            }, 500);
            return;
          }
        } catch (regexError) {
          console.error('Regex extraction failed:', regexError);
        }
        
        // If all extraction methods fail, go back to login
        setTimeout(() => this.router.navigate(['/login']), 500);
      }
    }
  }
}
