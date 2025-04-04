import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { MarketGuard } from './guards/market.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'oauth-callback',
    loadComponent: () => import('./pages/oauth-callback/oauth-callback.component').then(m => m.OAuthCallbackComponent)
  },
  {
    path: 'login-success',
    redirectTo: 'market',
    pathMatch: 'full'
  },
  {
    path: 'complete-profile',
    loadComponent: () => import('./pages/profile-completion/profile-completion.component').then(m => m.ProfileCompletionComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'market',
    loadComponent: () => import('./pages/market/market.component').then(m => m.MarketComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'experts',
    loadComponent: () => import('./pages/experts/experts.component').then(m => m.ExpertsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'questions',
    loadComponent: () => import('./pages/questions/questions.component').then(m => m.QuestionsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'view-profile/:id',
    loadComponent: () => import('./pages/view-profile/view-profile.component').then(m => m.ViewProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'messages',
    loadComponent: () => import('./pages/messages/messages.component').then(m => m.MessagesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'messages/:userId',
    loadComponent: () => import('./pages/messages/messages.component').then(m => m.MessagesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: 'market',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
