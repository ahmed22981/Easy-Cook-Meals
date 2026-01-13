import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { Meal, Ingredient } from '../../models/meals';
import { MealsService } from '../../services/mealsService';
import { LoadingService } from '../../services/loading';
import { FadeInDirective } from '../../directives/fade-in';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-meal-details',
  standalone: true,
  imports: [CommonModule, FadeInDirective, FormsModule],
  templateUrl: './meal-details.html',
  styleUrls: ['./meal-details.css'],
})
export class MealDetails implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mealsService = inject(MealsService);
  private loadingService = inject(LoadingService);
  private sanitizer = inject(DomSanitizer);
  private destroy$ = new Subject<void>();

  meal: Meal | null = null;
  ingredients: Ingredient[] = [];
  youtubeUrl: SafeResourceUrl | null = null;
  loading$ = this.loadingService.loading$;
  error: string | null = null;

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const mealId = params['id'];
      if (mealId) {
        this.loadMealDetails(mealId);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMealDetails(id: string) {
    this.error = null;

    this.mealsService
      .getMealById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (meal: Meal | null) => {
          if (meal) {
            this.meal = meal;
            const currentFavorites = this.mealsService.favorites();
            this.meal.isFavorite = currentFavorites.includes(meal.idMeal);
            this.extractIngredients(meal);
            this.extractYoutubeUrl(meal.strYoutube);
          } else {
            this.error = 'Meal not found';
          }
        },
        error: (err: any) => {
          console.error('Error loading meal details:', err);
          this.error = 'Failed to load meal details. Please try again.';
        },
      });
  }

  private extractIngredients(meal: Meal) {
    this.ingredients = [];

    for (let i = 1; i <= 20; i++) {
      const ingredient = (meal as any)[`strIngredient${i}`];
      const measure = (meal as any)[`strMeasure${i}`];

      if (ingredient && ingredient.trim()) {
        this.ingredients.push({
          name: ingredient.trim(),
          measure: measure ? measure.trim() : '',
        });
      }
    }
  }

  private extractYoutubeUrl(youtubeUrl?: string) {
    if (!youtubeUrl) {
      this.youtubeUrl = null;
      return;
    }

    let videoId = '';
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = youtubeUrl.match(regExp);

    if (match && match[7].length === 11) {
      videoId = match[7];
      this.youtubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${videoId}`
      );
    } else {
      this.youtubeUrl = null;
    }
  }

  toggleFavorite() {
    if (!this.meal) return;

    const currentFavorites = this.mealsService.favorites();

    if (currentFavorites.includes(this.meal.idMeal)) {
      this.mealsService.removeFavorite(this.meal.idMeal);
      this.meal.isFavorite = false;
    } else {
      this.mealsService.addFavorite(this.meal.idMeal);
      this.meal.isFavorite = true;
    }
  }

  goBack() {
    this.router.navigate(['/meals']);
  }

  getTags(): string[] {
    return this.meal?.strTags ? this.meal.strTags.split(',').map((tag) => tag.trim()) : [];
  }

  getInstructionSteps(): string[] {
    if (!this.meal?.strInstructions) return [];

    return this.meal.strInstructions
      .split(/(?:\r\n|\r|\n)/g)
      .filter((step) => step.trim().length > 0)
      .map((step) => step.trim());
  }
}
