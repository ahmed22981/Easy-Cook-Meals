import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { authReverseGuard } from './auth-reverse-guard';

describe('authReverseGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => authReverseGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
