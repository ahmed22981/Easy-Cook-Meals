import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MealsService } from '../../services/mealsService';
import { AuthService } from '../../services/auth';
import { Meal } from '../../models/meals';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favorites.html',
  styleUrls: ['./favorites.css'],
})
export class Favorites implements OnInit {
  // Signals for reactive state management
  private favoriteMealsSignal = signal<Meal[]>([]);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  // Computed signals for derived state
  public favoriteMeals = computed(() => this.favoriteMealsSignal());
  public loading = computed(() => this.loadingSignal());
  public error = computed(() => this.errorSignal());
  public isEmpty = computed(() => !this.loading() && this.favoriteMeals().length === 0);

  // Get favorites count from service
  public favoritesCount = computed(() => this.mealsService.favorites().length);
  public favoriteIds = computed(() => this.mealsService.favorites());

  constructor(
    private mealsService: MealsService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.mealsService.loadFavoritesFromStorage();
    this.loadFavorites();
    this.watchFavoritesChanges();
  }

  private loadFavorites(): void {
    const favoriteIds = this.favoriteIds();

    if (favoriteIds.length === 0) {
      this.favoriteMealsSignal.set([]);
      this.loadingSignal.set(false);
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const mealRequests = favoriteIds.map((id) =>
      this.mealsService.getMealById(id).pipe(
        catchError((error) => {
          console.error(`Error loading meal ${id}:`, error);
          return of(null);
        })
      )
    );

    forkJoin(mealRequests)
      .pipe(
        map((meals) => meals.filter((meal) => meal !== null) as Meal[]),
        catchError((error) => {
          console.error('Error loading favorite meals:', error);
          this.errorSignal.set('Failed to load favorite meals. Please try again.');
          return of([]);
        })
      )
      .subscribe({
        next: (meals) => {
          // ✅ Assign default name if missing, mark as favorite, and sort
          const favoriteMeals = meals
            .filter((meal) => meal !== null)
            .map((meal) => ({
              ...meal,
              strMeal: meal.strMeal || 'Unnamed Meal',
              isFavorite: true,
            }))
            .sort((a, b) => a.strMeal.localeCompare(b.strMeal));

          this.favoriteMealsSignal.set(favoriteMeals);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          console.error('Unexpected error:', error);
          this.errorSignal.set('An unexpected error occurred.');
          this.loadingSignal.set(false);
        },
      });
  }

  private watchFavoritesChanges(): void {
    let previousCount = this.favoritesCount();
    setInterval(() => {
      const currentCount = this.favoritesCount();
      if (currentCount !== previousCount) {
        previousCount = currentCount;
        this.loadFavorites();
      }
    }, 1000);
  }

  removeFavorite(meal: Meal, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.mealsService.removeFavorite(meal.idMeal);
    const updatedMeals = this.favoriteMeals().filter((m) => m.idMeal !== meal.idMeal);
    this.favoriteMealsSignal.set(updatedMeals);
  }

  viewMealDetails(meal: Meal): void {
    this.router.navigate(['/meal', meal.idMeal]);
  }

  exploreMeals(): void {
    this.router.navigate(['/meals']);
  }

  exploreCategory(category: string): void {
    this.router.navigate(['/meals'], { queryParams: { category } });
  }

  retryLoading(): void {
    this.loadFavorites();
  }

  clearAllFavorites(): void {
    if (confirm('Are you sure you want to remove all favorites?')) {
      this.favoriteIds().forEach((id) => this.mealsService.removeFavorite(id));
      this.favoriteMealsSignal.set([]);
    }
  }

  getMealIngredients(meal: Meal): string[] {
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}` as keyof Meal] as string;
      const measure = meal[`strMeasure${i}` as keyof Meal] as string;
      if (ingredient && ingredient.trim()) {
        const formattedIngredient =
          measure && measure.trim() ? `${measure.trim()} ${ingredient.trim()}` : ingredient.trim();
        ingredients.push(formattedIngredient);
      }
    }
    return ingredients;
  }

  getMealTags(meal: Meal): string[] {
    if (!meal.strTags) return [];
    return meal.strTags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }

  truncateText(text: string, maxLength: number = 100): string {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
  }

  hasVideo(meal: Meal): boolean {
    return !!(meal.strYoutube && meal.strYoutube.trim());
  }

  getYouTubeVideoId(url: string): string | null {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/images/meal-placeholder.jpg';
    target.alt = 'Meal image not available';
  }

  trackByMealId(index: number, meal: Meal): string {
    return meal.idMeal;
  }

  getUserDisplayName(): string {
    const user = this.authService.user();
    return user ? `${user.username} `.trim() : 'User';
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}
