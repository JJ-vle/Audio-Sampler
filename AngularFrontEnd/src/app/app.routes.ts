import { Routes } from '@angular/router';
import { Presets } from './presets/presets';
import { AddPreset } from './presets/add-preset/add-preset';
import { PresetDetail } from './presets/preset-detail/preset-detail';

import { EditPresetComponent } from './presets/edit-preset/edit-preset';/**/

export const routes: Routes = [
    { path: "", redirectTo: "/home", pathMatch: "full"},
    { path: "home", component: Presets },
    { path: "add", component: AddPreset },
    { path: "presets/:_id/edit", component: EditPresetComponent },
    { path: "presets/:_id", component: PresetDetail }
];
