import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about-us',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './about-us.html',
  styleUrl: './about-us.css',
})
export class AboutUs {}
