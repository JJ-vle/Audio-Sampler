import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Preset } from '../preset.model';
import { PresetsService } from '../../shared/presets.service';

@Component({
  selector: 'app-add-preset',
  standalone: true,
  imports: [ CommonModule, FormsModule,
    MatInputModule, MatFormFieldModule,
    MatButtonModule, MatCheckboxModule
  ],
  templateUrl: './add-preset.html',
  styleUrl: './add-preset.css',
})

export class AddPreset {
  preset: Preset = {
    name: '',
    type: '',
    isFactoryPresets: false,
    samples: [],
    updatedAt: new Date()
  };

  constructor(
    private presetsService: PresetsService,
    private router: Router
  ) {}

  addSample() {
    this.preset.samples.push({ name: '', url: '' });
  }

  removeSample(index: number) {
    this.preset.samples.splice(index, 1);
  }

  onAjouterPreset(){
    this.presetsService.addPreset(this.preset).subscribe({
      next: () => this.router.navigate(['/home']),
      error: err => console.error(err)
    });
  }

}
