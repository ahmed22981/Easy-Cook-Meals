import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth';
import { LoginRequest, SignupRequest } from '../../models/user';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register {
  // Signals
  private isLoginMode = signal(true);
  private showPassword = signal(false);
  private showConfirmPassword = signal(false);

  // Computed
  public currentMode = computed(() => (this.isLoginMode() ? 'login' : 'signup'));
  public modeTitle = computed(() => (this.isLoginMode() ? 'Welcome Back!' : 'Create Account'));
  public modeSubtitle = computed(() =>
    this.isLoginMode()
      ? 'Sign in to discover delicious meals'
      : 'Join us to explore amazing recipes'
  );
  public submitButtonText = computed(() => (this.isLoginMode() ? 'Sign In' : 'Create Account'));
  public toggleText = computed(() =>
    this.isLoginMode() ? "Don't have an account? Sign up" : 'Already have an account? Sign in'
  );

  // Forms
  loginForm!: FormGroup;
  signupForm!: FormGroup;

  // Navigation
  private returnUrl: string = '/';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.initializeForms();
  }

  // ======== Getters ========
  get isLogin() {
    return this.isLoginMode();
  }
  get passwordVisible() {
    return this.showPassword();
  }
  get confirmPasswordVisible() {
    return this.showConfirmPassword();
  }
  get loading() {
    return this.authService.loading();
  }
  get error() {
    return this.authService.error();
  }

  // ======== Forms ========
  private initializeForms(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      rememberMe: [false],
    });

    this.signupForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        gender: ['male', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  // ======== Toggle ========
  toggleMode(): void {
    this.isLoginMode.set(!this.isLoginMode());
    this.resetForms();
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  // ======== Helper to Fill Test Credentials ========
  fillTestCredentials(): void {
    this.loginForm.patchValue({
      username: 'emilys',
      password: 'emilyspass',
    });
  }

  // ======== Submit ========
  onSubmit(): void {
    if (this.isLoginMode()) {
      this.onLogin();
    } else {
      this.onSignup();
    }
  }

  onLogin(): void {
    console.log('Return URL:', this.returnUrl);

    if (this.loginForm.valid) {
      const loginData: LoginRequest = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password,
        expiresInMins: this.loginForm.value.rememberMe ? 1440 : 30,
      };

      this.authService.login(loginData).subscribe({
        next: (res) => {
          console.log('✅ Login successful:', res);
          // LocalStorage and Redirect are handled by the AuthService's handleAuthSuccess method
          // But as a fallback in case your service doesn't redirect automatically:
          // this.router.navigateByUrl(this.returnUrl || '/');
        },
        error: (error) => {
          console.error('❌ Login failed:', error);
          // If you want to show a browser alert for debugging:
          // alert('Login failed. Please check credentials.');
        },
      });
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  onSignup(): void {
    console.log(this.returnUrl);
    if (this.signupForm.valid) {
      const signupData: SignupRequest = {
        firstName: this.signupForm.value.firstName,
        lastName: this.signupForm.value.lastName,
        username: this.signupForm.value.username,
        email: this.signupForm.value.email,
        gender: this.signupForm.value.gender,
        password: this.signupForm.value.password,
      };

      this.authService.signup(signupData).subscribe({
        next: () => {
          this.router.navigateByUrl(this.returnUrl || '/');
        },
        error: (error) => {
          console.error('Signup failed:', error);
        },
      });
    } else {
      this.markFormGroupTouched(this.signupForm);
    }
  }

  // ======== Helpers ========
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private resetForms(): void {
    this.loginForm.reset();
    this.signupForm.reset();
    this.signupForm.patchValue({ gender: 'male' });
    this.showPassword.set(false);
    this.showConfirmPassword.set(false);
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength'])
        return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['email']) return 'Please enter a valid email address';
    }
    return '';
  }

  getPasswordMatchError(): string {
    if (
      this.signupForm.errors &&
      this.signupForm.errors['passwordMismatch'] &&
      this.signupForm.get('confirmPassword')?.touched
    ) {
      return 'Passwords do not match';
    }
    return '';
  }
}
