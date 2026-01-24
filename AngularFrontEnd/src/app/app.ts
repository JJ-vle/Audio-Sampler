import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
//import { Presets } from './presets/presets';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink,
    MatButtonModule, MatDividerModule, MatIconModule, 
    MatToolbarModule/*, Presets*/],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'Application de gestion des Presets';
}
