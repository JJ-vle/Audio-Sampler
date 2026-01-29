import { Routes } from '@angular/router';
import { Presets } from './presets/presets';
import { AddPreset } from './presets/add-preset/add-preset';
/*
import { AssignmentDetail } from './presets/assignment-detail/assignment-detail';
import { EditAssignmentComponent } from './presets/edit-assignment/edit-assignment';*/

export const routes: Routes = [
    { path: "", redirectTo: "/home", pathMatch: "full"},
    { path: "home", component: Presets },
    { path: "add", component: AddPreset }/*,
    { path: "presets/:id", component: AssignmentDetail },
    { path: "presets/:id/edit", component: EditAssignmentComponent },*/
];
