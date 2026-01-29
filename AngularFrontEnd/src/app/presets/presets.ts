import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';

import { Preset } from './preset.model';
import { PresetsService } from '../shared/presets.service';

@Component({
  selector: 'app-presets',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatDividerModule,
    MatButtonModule,
    MatListModule
  ],
  templateUrl: './presets.html',
  styleUrl: './presets.css',
})

export class Presets implements OnInit {

  title = 'List of presets';
  presets: Preset[] = [];

  constructor(private presetsService: PresetsService) {}

  ngOnInit(): void {
    console.log('Presets component initialized');

    this.presetsService.getPresets().subscribe({
      next: (presets) => {
        this.presets = presets;
        console.log('Presets received from API:', presets);
      },
      error: (err) => {
        console.error('Error while fetching presets', err);
      }
    });

    console.log('Request sent to PresetsService');
  }

  trackByName(index: number, preset: Preset): string {
    return preset.name;
  }
}
