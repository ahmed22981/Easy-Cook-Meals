import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User, LoginRequest, SignupRequest, AuthResponse, AuthState } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_BASE = 'https://dummyjson.com';
  private readonly TOKEN_KEY = 'easycook_token';
  private readonly USER_KEY = 'easycook_user';
  private readonly REFRESH_KEY = 'easycook_refresh';

  private authState = signal<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  });

  public user = computed(() => this.authState().user);
  public isAuthenticated = computed(() => this.authState().isAuthenticated);
  public loading = computed(() => this.authState().loading);
  public error = computed(() => this.authState().error);

  constructor(private http: HttpClient, private router: Router) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.updateAuthState({
          user,
          isAuthenticated: true,
          loading: false,
          error: null,
        });
      } catch {
        this.clearStorage();
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.updateAuthState({ ...this.authState(), loading: true, error: null });

    return this.http
      .post<AuthResponse>(`${this.API_BASE}/auth/login`, {
        username: credentials.username,
        password: credentials.password,
        expiresInMins: credentials.expiresInMins || 30,
      })
      .pipe(
        tap((response) => this.handleAuthSuccess(response)),
        catchError((error) => {
          this.updateAuthState({
            ...this.authState(),
            loading: false,
            error: error.error?.message || 'Login failed',
          });
          return throwError(() => error);
        })
      );
  }

  signup(userData: SignupRequest): Observable<AuthResponse> {
    this.updateAuthState({ ...this.authState(), loading: true, error: null });

    const mockUser: AuthResponse = {
      id: Math.floor(Math.random() * 1000) + 100,
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      gender: userData.gender,
      image: 'https://dummyjson.com/icon/user/150',
      token: 'mock_token_' + Date.now(),
      refreshToken: 'mock_refresh_' + Date.now(),
    };

    return of(mockUser).pipe(
      tap((response) => this.handleAuthSuccess(response)),
      catchError((error) => {
        this.updateAuthState({
          ...this.authState(),
          loading: false,
          error: 'Signup failed',
        });
        return throwError(() => error);
      })
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const user = this.authState().user;
    if (!user) {
      return throwError(() => new Error('No user available'));
    }

    const mockResponse: AuthResponse = {
      ...user,
      token: 'mock_refreshed_token_' + Date.now(),
      refreshToken: 'mock_refresh_' + Date.now(),
    };

    return of(mockResponse).pipe(tap((response) => this.handleAuthSuccess(response)));
  }

  getCurrentUser(): Observable<User> {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) {
      return throwError(() => new Error('No user in storage'));
    }

    const user: User = JSON.parse(userStr);
    return of(user).pipe(
      tap((u) => {
        this.updateAuthState({
          ...this.authState(),
          user: u,
        });
      })
    );
  }

  logout(): void {
    this.clearStorage();
    this.updateAuthState({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
    this.router.navigate(['/register']);
  }

  private handleAuthSuccess(response: AuthResponse): void {
    const token = (response as any).accessToken || response.token;
    const refreshToken = (response as any).refreshToken || null;

    if (!token) {
      console.error(' No token found in response:', response);
      return;
    }

    const user: User = {
      id: response.id,
      username: response.username,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      gender: response.gender,
      image: response.image,
      token: token,
    };

    localStorage.setItem(this.TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_KEY, refreshToken);
    }
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    this.updateAuthState({
      user,
      isAuthenticated: true,
      loading: false,
      error: null,
    });

    this.router.navigate(['/']);
  }

  private updateAuthState(newState: AuthState): void {
    this.authState.set(newState);
  }

  private clearStorage(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }
}
