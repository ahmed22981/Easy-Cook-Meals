import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Meals } from './components/meals/meals';
import { NotFound } from './components/not-found/not-found';
import { MealDetails } from './components/meal-details/meal-details';
import { AboutUs } from './components/about-us/about-us';
import { Register } from './components/register/register';
import { Favorites } from './components/favorites/favorites';
import { authGuard } from './guards/auth-guard';
import { authReverseGuard } from './guards/auth-reverse-guard';

export const routes: Routes = [
  { path: 'register', component: Register, canActivate: [authReverseGuard] },
  { path: '', component: Home },
  { path: 'meals', component: Meals, canActivate: [authGuard] },
  { path: 'meal/:id', component: MealDetails, canActivate: [authGuard] },
  { path: 'favorites', component: Favorites, canActivate: [authGuard] },
  { path: 'aboutus', component: AboutUs, canActivate: [authGuard] },
  { path: '**', component: NotFound },
];
