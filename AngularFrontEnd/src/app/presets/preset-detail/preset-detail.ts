import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { PresetsService } from '../../shared/presets.service';
import { Preset } from '../preset.model';

@Component({
  selector: 'app-preset-detail',
  imports: [CommonModule,
    MatCardModule, MatButtonModule,
    MatListModule, MatDividerModule
  ],
  templateUrl: './preset-detail.html',
  styleUrl: './preset-detail.css',
})

export class PresetDetail implements OnInit {

  preset?: Preset;

  constructor(
    private presetsService: PresetsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getPreset();
  }

  getPreset() {
    const name = this.route.snapshot.params['_id'];
    this.presetsService.getPreset(name).subscribe({
      next: p => this.preset = p,
      error: err => console.error(err)
    });
  }

  onDelete() {
    if (!this.preset) return;

    this.presetsService.deletePreset(this.preset.name).subscribe({
      next: () => this.router.navigate(['/home']),
      error: err => console.error(err)
    });
  }

  onEdit() {
    if (!this.preset) return;

    this.router.navigate([
      '/presets',
      this.preset._id,
      'edit'
    ]);
  }
}