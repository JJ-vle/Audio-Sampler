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

  files: File[][] = [];

  constructor(
    private presetsService: PresetsService,
    private router: Router
  ) {}

  addSample() {
    this.preset.samples.push({ name: '', url: '' });
    this.files.push([]);
  }

  removeSample(index: number) {
    this.preset.samples.splice(index, 1);
  }

  triggerFileInput(index: number) {
    const input = document.getElementById('fileInput' + index) as HTMLInputElement | null;
    if (input) {
      input.click();
    }
  }
  
  onFileSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.files[index] = Array.from(input.files);
  
      // Mettre automatiquement nom du premier fichier dans le sample
      let firstFileName = input.files[0].name;
  
      // Retirer l'extension
      const dotIndex = firstFileName.lastIndexOf('.');
      if (dotIndex > 0) {
        firstFileName = firstFileName.substring(0, dotIndex);
      }
  
      this.preset.samples[index].name = firstFileName;
  
      // Vider l'URL pour éviter les conflits
      this.preset.samples[index].url = '';
    }
  }
  


  /*
  onAjouterPreset(){
    this.presetsService.addPreset(this.preset).subscribe({
      next: () => this.router.navigate(['/home']),
      error: err => console.error(err)
    });
  }
  */

  onAjouterPreset() {
    // créer le preset dans MongoDB (sans fichiers)
    this.presetsService.addPreset(this.preset).subscribe({
      next: createdPreset => {
        // si  fichiers électionnés --> upload
        const allFiles = this.files.flat(); // fusionne tous les fichiers des samples
        if (allFiles.length > 0) {
          this.presetsService.uploadFiles(createdPreset.name, allFiles).subscribe({
            next: (res) => {
              console.log("Fichiers uploadés :", res);
              this.router.navigate(['/home']);
            },
            error: err => console.error("Erreur upload fichiers :", err)
          });
        } else {
          // pas de fichiers, on navigue directement
          this.router.navigate(['/home']);
        }
      },
      error: err => console.error("Erreur création preset :", err)
    });
  }
  

}
