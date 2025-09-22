import { Directive, ElementRef, HostListener, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appMealBox]',
  standalone: true,
})
export class MealBox implements OnInit {
  constructor(private ele: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.renderer.addClass(this.ele.nativeElement, 'meal-box');

    this.renderer.listen(this.ele.nativeElement, 'mouseenter', () => {
      this.renderer.addClass(this.ele.nativeElement, 'meal-box-hover');
    });
    this.renderer.listen(this.ele.nativeElement, 'mouseleave', () => {
      this.renderer.removeClass(this.ele.nativeElement, 'meal-box-hover');
    });
  }
}
