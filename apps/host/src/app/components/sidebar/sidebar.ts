import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'sug-sidebar',
  imports: [RouterLink],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {}
