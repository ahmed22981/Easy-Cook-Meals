import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Meal } from '../../models/meals';
import { MealBox } from '../../directives/meal-box';
import { MealsService } from '../../services/mealsService';

@Component({
  selector: 'app-meals',
  standalone: true,
  imports: [CommonModule, FormsModule, MealBox],
  templateUrl: './meals.html',
  styleUrls: ['./meals.css'],
})
export class Meals implements OnInit {
  private mealsService = inject(MealsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  originalMeals: Meal[] = [];
  meals: Meal[] = [];
  countries: string[] = [];
  categories: string[] = [];

  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 0;
  paginatedMeals: Meal[] = [];

  searchTerm = '';
  selectedCountry = '';
  selectedCategory = '';

  loading = true;

  private searchSubject = new BehaviorSubject<string>('');
  private countrySubject = new BehaviorSubject<string>('');
  private categorySubject = new BehaviorSubject<string>('');

  Math = Math;

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const category = params['category'] || '';
      this.selectedCategory = category;
      this.categorySubject.next(category);
    });

    this.loadInitialData();

    this.setupSearch();

    this.mealsService.getAllMealsByLetter().subscribe({
      next: (meals) => {
        if (this.selectedCategory) {
          this.filterMeals('', '', this.selectedCategory);
        }
      },
      error: (err) => console.error('Error filtering by category on init:', err),
    });
  }

  private loadInitialData() {
    this.loading = true;

    combineLatest([
      this.mealsService.getAllMealsByLetter(),
      this.mealsService.getCountries(),
      this.mealsService.getCategories(),
    ]).subscribe({
      next: ([meals, countries, categories]) => {
        this.originalMeals = meals;
        this.meals = [...this.originalMeals];
        this.countries = countries;
        this.categories = categories;
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading data:', err);
        this.loading = false;
      },
    });
  }

  private setupSearch() {
    combineLatest([
      this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()),
      this.countrySubject.pipe(distinctUntilChanged()),
      this.categorySubject.pipe(distinctUntilChanged()),
    ]).subscribe(([search, country, category]) => {
      this.filterMeals(search, country, category);
    });
  }

  private filterMeals(search: string, country: string, category: string) {
    let filtered = [...this.originalMeals];

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (m) => m.strMeal.toLowerCase().includes(lower) || m.strArea.toLowerCase().includes(lower)
      );
    }

    if (country) filtered = filtered.filter((m) => m.strArea === country);
    if (category) filtered = filtered.filter((m) => m.strCategory === category);

    this.meals = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  private updatePagination() {
    this.totalPages = Math.ceil(this.meals.length / this.itemsPerPage);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedMeals = this.meals.slice(start, end);

    const currentFavorites = this.mealsService.favorites();
    this.paginatedMeals.forEach((m) => {
      m.isFavorite = currentFavorites.includes(m.idMeal);
    });
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  onCountryChange() {
    this.countrySubject.next(this.selectedCountry);
  }

  onCategoryChange() {
    this.categorySubject.next(this.selectedCategory);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  getPaginationNumbers(): number[] {
    const delta = 2;
    const range: number[] = [];
    const result: number[] = [];

    for (
      let i = Math.max(2, this.currentPage - delta);
      i <= Math.min(this.totalPages - 1, this.currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (this.currentPage - delta > 2) {
      result.push(1, -1);
    } else {
      result.push(1);
    }

    result.push(...range);

    if (this.currentPage + delta < this.totalPages - 1) {
      result.push(-1, this.totalPages);
    } else {
      result.push(this.totalPages);
    }

    return result;
  }

  toggleFavorite(meal: Meal) {
    const currentFavorites = this.mealsService.favorites();

    if (currentFavorites.includes(meal.idMeal)) {
      this.mealsService.removeFavorite(meal.idMeal);
      meal.isFavorite = false;
    } else {
      this.mealsService.addFavorite(meal.idMeal);
      meal.isFavorite = true;
    }
  }

  getShortDescription(text: string): string {
    if (!text) return 'No Description Available';
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCountry = '';
    this.selectedCategory = '';
    this.searchSubject.next('');
    this.countrySubject.next('');
    this.categorySubject.next('');
    this.loadInitialData();
  }

  trackByMeal(i: number, meal: Meal) {
    return meal.idMeal;
  }

  viewMealDetails(meal: Meal) {
    this.router.navigate(['/meal', meal.idMeal]);
  }
}
