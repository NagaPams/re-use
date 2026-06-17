import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from './services/mock-data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  router = inject(Router);
  mockService = inject(MockDataService);

  // Signal to track the URL reactively
  currentUrl = signal('');

  // Dropdown visibility state details
  showDropdown = signal(false);

  constructor() {
    this.currentUrl.set(this.router.url);
    
    // Subscribe to navigation events to update the signal reactively
    this.router.events.subscribe(() => {
      this.currentUrl.set(this.router.url);
    });
  }

  // Hide header on login/register pages
  isGuestPage = computed(() => {
    const url = this.currentUrl();
    return url.includes('/login') || url.includes('/register') || url === '/';
  });

  onSearchEnter() {
    this.router.navigate(['/catalog']);
  }

  toggleDropdown() {
    this.showDropdown.set(!this.showDropdown());
  }

  closeDropdown() {
    this.showDropdown.set(false);
  }

  logout() {
    this.mockService.logout();
    this.closeDropdown();
    this.router.navigate(['/login']);
  }
}
