import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Preset } from '../presets/preset.model';

@Injectable({
  providedIn: 'root',
})
export class PresetsService {

  private apiUrl = 'https://audio-sampler.onrender.com/api/presets';
  //private apiUrl = 'http://localhost:3000/api/presets';

  constructor(private http: HttpClient) {}

  // récupérer tous les presets
  getPresets(): Observable<Preset[]> {
    return this.http.get<Preset[]>(this.apiUrl);
  }

  // récupérer un preset par nom ou slug
  getPreset(name: string): Observable<Preset> {
    return this.http.get<Preset>(`${this.apiUrl}/${name}`);
  }

  // ajouter un preset
  addPreset(preset: Preset): Observable<Preset> {
    return this.http.post<Preset>(this.apiUrl, preset);
  }

  // supprimer un preset
  deletePreset(name: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${name}`);
  }

  // modifier complètement un preset (PUT)
  updatePreset(name: string, preset: Preset): Observable<Preset> {
    return this.http.put<Preset>(`${this.apiUrl}/${name}`, preset);
  }

  // dans PresetsService
  uploadFiles(presetName: string, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file, file.name));
    return this.http.post(`${this.apiUrl.replace('/presets', '/upload')}/${presetName}`, formData);
  }

  // modification partielle (PATCH)
  patchPreset(name: string, partial: Partial<Preset>): Observable<Preset> {
    return this.http.patch<Preset>(`${this.apiUrl}/${name}`, partial);
  }
}
