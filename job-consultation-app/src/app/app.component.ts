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
      
      // You might want to handle different platform initializations here
      
      // Setup deep link handling
      App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
        console.log('App opened with URL:', event.url);
        this.handleOpenUrl(event.url);
      });
    });
  }

  private handleOpenUrl(url: string) {
    // Check if this is our OAuth callback URL
    if (url.includes('oauth-callback')) {
      // Parse the URL to extract the code parameter
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      
      if (code) {
        console.log('OAuth code received via deep link:', code);
        // Navigate to the OAuth callback route with the code
        this.router.navigate(['/oauth-callback'], { queryParams: { code } });
      } else {
        console.error('No code found in OAuth callback URL');
        this.router.navigate(['/login']);
      }
    }
  }
}
