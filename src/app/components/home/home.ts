import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { Category, CategoriesComponent } from '../categories/categories';
import { FormsModule } from '@angular/forms';
import { MealsService } from '../../services/mealsService'; // Import MealsService

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule, CategoriesComponent, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  @ViewChild('landingText', { static: true }) landingText!: ElementRef;

  isLoggedIn = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    public mealsService: MealsService // Inject MealsService as public
  ) {
    this.isLoggedIn = this.authService.isAuthenticated();
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.landingText.nativeElement.classList.add('is-active');
    }, 100);

    this.isLoggedIn = !!this.authService.getToken();
  }

  logout() {
    this.authService.logout();
    this.isLoggedIn = false;
    this.router.navigate(['/']);
  }

  getUserDisplayName(): string {
    const user = this.authService.user();
    return user ? `${user.firstName} ${user.lastName}` : 'User';
  }
}
