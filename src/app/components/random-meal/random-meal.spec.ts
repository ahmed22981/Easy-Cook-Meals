import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RandomMeal } from './random-meal';

describe('RandomMeal', () => {
  let component: RandomMeal;
  let fixture: ComponentFixture<RandomMeal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RandomMeal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RandomMeal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
