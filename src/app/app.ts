// src/app/app.component.ts
import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Footer } from './components/footer/footer';
import { Navbar } from './components/navbar/navbar';
@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: true,
  imports: [Navbar, RouterOutlet, Footer],
})
export class AppComponent {
  protected readonly title = signal('meals');
  constructor(private router: Router) {}
  showNavbar(): boolean {
    return this.router.url !== '/';
  }
}
