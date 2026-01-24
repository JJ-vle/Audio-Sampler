import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Preset } from '../presets/preset.model';

@Injectable({
  providedIn: 'root',
})
export class PresetsService {

  private apiUrl = 'https://audio-sampler.onrender.com/api/presets';

  constructor(private http: HttpClient) {}

  // récupérer tous les presets
  getPresets(): Observable<Preset[]> {
    return this.http.get<Preset[]>(this.apiUrl);
  }

  // récupérer un preset par nom ou slug
  getPreset(nameOrSlug: string): Observable<Preset> {
    return this.http.get<Preset>(`${this.apiUrl}/${nameOrSlug}`);
  }

  // ajouter un preset
  addPreset(preset: Preset): Observable<Preset> {
    return this.http.post<Preset>(this.apiUrl, preset);
  }

  // supprimer un preset
  deletePreset(nameOrSlug: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${nameOrSlug}`);
  }

  // modifier complètement un preset (PUT)
  updatePreset(nameOrSlug: string, preset: Preset): Observable<Preset> {
    return this.http.put<Preset>(`${this.apiUrl}/${nameOrSlug}`, preset);
  }

  // modification partielle (PATCH)
  patchPreset(nameOrSlug: string, partial: Partial<Preset>): Observable<Preset> {
    return this.http.patch<Preset>(`${this.apiUrl}/${nameOrSlug}`, partial);
  }
}
