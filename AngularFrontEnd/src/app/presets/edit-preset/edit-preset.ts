import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Preset } from '../preset.model';
import { PresetsService } from '../../shared/presets.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
selector: 'app-edit-preset',
standalone: true,
imports: [
  FormsModule,
  MatInputModule,
  MatFormFieldModule,
  MatDatepickerModule,
  MatButtonModule,
],
templateUrl: './edit-preset.html',
styleUrl: './edit-preset.css',
})

export class EditPresetComponent implements OnInit {
  
  preset: Preset | undefined;
  newName = '';

  constructor(
    private presetsService: PresetsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadPreset();
  }

  loadPreset() {
    const id = this.route.snapshot.params['_id'];
    if (!id) return;

    this.presetsService.getPreset(id).subscribe({
      next: preset => {
        this.preset = preset;
        this.newName = preset.name;
      },
      error: err => console.error(err),
    });
  }

  onSave() {
    if (!this.preset || !this.newName.trim()) return;

    this.presetsService
      .patchPreset(this.preset.name, { name: this.newName })
      .subscribe({
        next: () => this.router.navigate(['/home']),
        error: err => console.error(err),
      });
  }
}
