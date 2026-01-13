import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, combineLatest, map, catchError, throwError } from 'rxjs';
import {
  Meal,
  MealDetailsResponse,
  MealsResponse,
  Country,
  Category,
  CategoriesResponse,
} from '../models/meals';

@Injectable({
  providedIn: 'root',
})
export class MealsService {
  private http = inject(HttpClient);
  private readonly API_BASE = 'https://www.themealdb.com/api/json/v1/1';
  private readonly FAVORITES_KEY = 'mealFavorites';

  // ✅ Signals for managing state
  private favoritesSignal = signal<string[]>([]);

  constructor() {
    this.loadFavoritesFromStorage(); // تأكد من تحميل الـ favorites
  }

  // -------- Favorites with signals --------
  get favorites() {
    return this.favoritesSignal.asReadonly();
  }

  loadFavoritesFromStorage() {
    const saved = localStorage.getItem(this.FAVORITES_KEY);
    if (saved) {
      this.favoritesSignal.set(JSON.parse(saved));
    }
  }

  private saveFavoritesToStorage() {
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(this.favoritesSignal()));
  }

  addFavorite(mealId: string) {
    if (!this.favoritesSignal().includes(mealId)) {
      this.favoritesSignal.update((list) => [...list, mealId]);
      this.saveFavoritesToStorage();
    }
  }

  removeFavorite(mealId: string) {
    this.favoritesSignal.update((list) => list.filter((id) => id !== mealId));
    this.saveFavoritesToStorage();
  }

  // -------- Get meal by ID --------
  getMealById(id: string): Observable<Meal | null> {
    return this.http.get<MealDetailsResponse>(`${this.API_BASE}/lookup.php?i=${id}`).pipe(
      map((response) => (response.meals && response.meals.length > 0 ? response.meals[0] : null)),
      catchError((err) => {
        console.error('Error getting meal by ID:', err);
        return of(null); // ✅ تعديل: منع throwError لضمان forkJoin يكمل
      })
    );
  }

  // -------- Get All Meals By Letters --------
  getAllMealsByLetter(): Observable<Meal[]> {
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const requests = letters.map((letter) =>
      this.http.get<MealsResponse>(`${this.API_BASE}/search.php?f=${letter}`)
    );

    return combineLatest(requests).pipe(
      map((responses) => {
        const allMeals: Meal[] = [];
        responses.forEach((response) => {
          if (response.meals) {
            allMeals.push(...response.meals);
          }
        });
        return allMeals;
      }),
      catchError((err) => {
        console.error('Error getting meals by letter:', err);
        return throwError(() => err);
      })
    );
  }

  // -------- Search Meals By Name --------
  searchMealsByName(name: string): Observable<Meal[]> {
    if (!name.trim()) return of([]);
    return this.http.get<MealDetailsResponse>(`${this.API_BASE}/search.php?s=${name}`).pipe(
      map((response) => response.meals || []),
      catchError((err) => {
        console.error('Error searching meals:', err);
        return throwError(() => err);
      })
    );
  }

  // -------- Search Meals --------
  searchMeals(query: string): Observable<Meal[]> {
    return this.http.get<MealsResponse>(`${this.API_BASE}/search.php?s=${query}`).pipe(
      map((response) => response.meals || []),
      catchError((error) => {
        console.error('Error searching meals:', error);
        return throwError(() => error);
      })
    );
  }

  // -------- Get Meals By Category --------
  getMealsByCategory(category: string): Observable<Meal[]> {
    return this.http.get<MealDetailsResponse>(`${this.API_BASE}/filter.php?c=${category}`).pipe(
      map((response) => response.meals || []),
      catchError((err) => {
        console.error('Error getting meals by category:', err);
        return throwError(() => err);
      })
    );
  }

  // -------- Get Meals By Country / Area --------
  getMealsByCountry(country: string): Observable<Meal[]> {
    return this.http.get<MealDetailsResponse>(`${this.API_BASE}/filter.php?a=${country}`).pipe(
      map((response) => response.meals || []),
      catchError((err) => {
        console.error('Error getting meals by country:', err);
        return throwError(() => err);
      })
    );
  }

  getMealsByArea(area: string): Observable<Meal[]> {
    return this.http.get<MealsResponse>(`${this.API_BASE}/filter.php?a=${area}`).pipe(
      map((response) => response.meals || []),
      catchError((error) => {
        console.error('Error getting meals by area:', error);
        return throwError(() => error);
      })
    );
  }

  // -------- Get All Categories --------
  getCategories(): Observable<string[]> {
    return this.http.get<{ meals: Category[] }>(`${this.API_BASE}/list.php?c=list`).pipe(
      map((res) => res.meals.map((c) => c.strCategory).sort()),
      catchError((err) => {
        console.error('Error getting categories:', err);
        return throwError(() => err);
      })
    );
  }

  // -------- Get Full Categories --------
  getFullCategories(): Observable<Category[]> {
    return this.http.get<CategoriesResponse>(`${this.API_BASE}/categories.php`).pipe(
      map((res) => res.categories || []),
      catchError((error) => {
        console.error('Error getting full categories:', error);
        return throwError(() => error);
      })
    );
  }

  // -------- Get All Countries --------
  getCountries(): Observable<string[]> {
    return this.http.get<{ meals: Country[] }>(`${this.API_BASE}/list.php?a=list`).pipe(
      map((res) => res.meals.map((c) => c.strArea).sort()),
      catchError((err) => {
        console.error('Error getting countries:', err);
        return throwError(() => err);
      })
    );
  }

  // -------- Get Random Meal --------
  getRandomMeal(): Observable<Meal | null> {
    return this.http.get<MealDetailsResponse>(`${this.API_BASE}/random.php`).pipe(
      map((response) => (response.meals && response.meals.length > 0 ? response.meals[0] : null)),
      catchError((err) => {
        console.error('Error getting random meal:', err);
        return throwError(() => err);
      })
    );
  }
}
