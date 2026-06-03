import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './backstage/guards/auth.guard';

export const routes: Routes = [


  // ── BACKSTAGE: LOGIN ──
  {
    path: 'backstage',
    loadComponent: () => import('./backstage/auth/login.component').then(m => m.LoginComponent),
    canActivate: [publicGuard],
    title: 'Sign in'
  },

  // ── BACKSTAGE: PROTECTED ROUTES ──
  {
    path: 'backstage',
    loadComponent: () => import('./backstage/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./backstage/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard'
      },
      {
        path: 'products',
        loadComponent: () => import('./backstage/products/product-list.component').then(m => m.ProductListComponent),
        title: 'Products'
      },
      {
        path: 'products/new',
        loadComponent: () => import('./backstage/products/product-form.component').then(m => m.ProductFormComponent),
        title: 'Add Product'
      },
      {
        path: 'products/edit/:id',
        loadComponent: () => import('./backstage/products/product-form.component').then(m => m.ProductFormComponent),
        title: 'Edit Product'
      },
      {
        path: 'categories',
        loadComponent: () => import('./backstage/categories/categories.component').then(m => m.CategoriesComponent),
        title: 'Categories'
      },
      {
        path: 'analytics',
        loadComponent: () => import('./backstage/analytics/analytics.component').then(m => m.AnalyticsComponent),
        title: 'Analytics'
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  { path: '**', redirectTo: '' }
];
