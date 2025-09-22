import { Component, OnInit, OnDestroy, signal, computed, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, Subscription } from 'rxjs';
import { catchError, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';

// Category interface matching TheMealDB API
export interface Category {
  idCategory: string;
  strCategory: string;
  strCategoryThumb: string;
  strCategoryDescription: string;
}

export interface CategoriesResponse {
  categories: Category[];
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class CategoriesComponent implements OnInit, OnDestroy {
  private readonly API_URL = 'https://www.themealdb.com/api/json/v1/1/categories.php';
  private isBrowser: boolean;
  private autoSlideSubscription?: Subscription;

  // Signals for reactive state management
  private categoriesSignal = signal<Category[]>([]);
  private loadingSignal = signal(true);
  private errorSignal = signal<string | null>(null);
  private currentSlideSignal = signal(0);
  private isPausedSignal = signal(false);

  // Computed signals for derived state
  public categories = computed(() => this.categoriesSignal());
  public loading = computed(() => this.loadingSignal());
  public error = computed(() => this.errorSignal());
  public currentSlide = computed(() => this.currentSlideSignal());
  public isPaused = computed(() => this.isPausedSignal());

  // Slider configuration
  public slidesToShow = computed(() => {
    if (!this.isBrowser) return 4;
    const width = window.innerWidth;
    if (width < 576) return 1;
    if (width < 768) return 2;
    if (width < 992) return 3;
    return 4;
  });

  public maxSlide = computed(() => {
    const totalCategories = this.categories().length;
    const visible = this.slidesToShow();
    return Math.max(0, totalCategories - visible);
  });

  public slideWidth = computed(() => {
    return 100 / this.slidesToShow();
  });

  // Auto-slide configuration
  private readonly AUTO_SLIDE_INTERVAL = 4000; // 4 seconds

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.loadCategories();
    if (this.isBrowser) {
      this.setupAutoSlide();
      this.setupResizeListener();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
    if (this.isBrowser && window.removeEventListener) {
      window.removeEventListener('resize', this.onResize.bind(this));
    }
  }

  // Load categories from TheMealDB API
  private loadCategories(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.http
      .get<CategoriesResponse>(this.API_URL)
      .pipe(
        catchError((error) => {
          console.error('Error loading categories:', error);
          return throwError(
            () => 'Failed to load categories. Please check your internet connection.'
          );
        })
      )
      .subscribe({
        next: (response) => {
          // Filter to get main categories (limit to 12 for better performance)
          const mainCategories = response.categories.slice(0, 12);
          this.categoriesSignal.set(mainCategories);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(error);
          this.loadingSignal.set(false);
        },
      });
  }

  // Navigation methods
  public nextSlide(): void {
    if (this.currentSlide() < this.maxSlide()) {
      this.currentSlideSignal.set(this.currentSlide() + 1);
    } else {
      // Loop back to start
      this.currentSlideSignal.set(0);
    }
  }

  public previousSlide(): void {
    if (this.currentSlide() > 0) {
      this.currentSlideSignal.set(this.currentSlide() - 1);
    } else {
      // Loop to end
      this.currentSlideSignal.set(this.maxSlide());
    }
  }

  public goToSlide(index: number): void {
    if (index >= 0 && index <= this.maxSlide()) {
      this.currentSlideSignal.set(index);
    }
  }

  // Auto-slide functionality
  private setupAutoSlide(): void {
    this.autoSlideSubscription = interval(this.AUTO_SLIDE_INTERVAL).subscribe(() => {
      if (!this.isPaused()) {
        this.nextSlide();
      }
    });
  }

  private stopAutoSlide(): void {
    if (this.autoSlideSubscription) {
      this.autoSlideSubscription.unsubscribe();
      this.autoSlideSubscription = undefined;
    }
  }

  public pauseAutoSlide(): void {
    this.isPausedSignal.set(true);
  }

  public resumeAutoSlide(): void {
    this.isPausedSignal.set(false);
  }

  // Navigation to meals page
  public navigateToMeals(category: Category): void {
    // Navigate to meals page with category parameter
    this.router.navigate(['/meals'], {
      queryParams: { category: category.strCategory },
    });
  }

  // Utility methods
  public retryLoading(): void {
    this.loadCategories();
  }

  public trackByCategory(index: number, category: Category): string {
    return category.idCategory;
  }
  trackByIndex(index: number, item: number) {
    return index;
  }

  public truncateText(text: string, maxLength: number = 80): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  public onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/images/category-placeholder.jpg';
  }

  // Pagination helpers
  public getSlideIndicators(): number[] {
    const totalSlides = this.maxSlide() + 1;
    return Array.from({ length: totalSlides }, (_, i) => i);
  }

  public getProgressPercentage(): number {
    const total = this.maxSlide();
    if (total === 0) return 100;
    return ((this.currentSlide() + 1) / (total + 1)) * 100;
  }

  // Responsive handling
  private setupResizeListener(): void {
    if (this.isBrowser) {
      window.addEventListener('resize', this.onResize.bind(this));
    }
  }

  private onResize(): void {
    // Reset slide position on resize to prevent layout issues
    const maxSlide = this.maxSlide();
    if (this.currentSlide() > maxSlide) {
      this.currentSlideSignal.set(Math.max(0, maxSlide));
    }
  }

  // Accessibility methods
  public onKeyboardNavigation(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.previousSlide();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nextSlide();
        break;
      case 'Home':
        event.preventDefault();
        this.goToSlide(0);
        break;
      case 'End':
        event.preventDefault();
        this.goToSlide(this.maxSlide());
        break;
    }
  }
}
