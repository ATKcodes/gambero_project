import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Platform } from '@ionic/angular';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, IonApp, IonRouterOutlet],
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(private platform: Platform) {}
  
  ngOnInit() {
    console.log('App component initialized');
    this.initializeApp();
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
    });
  }
}
