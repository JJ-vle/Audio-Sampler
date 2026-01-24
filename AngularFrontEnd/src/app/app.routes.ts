import { Routes } from '@angular/router';
import { Presets } from './presets/presets';
/*
import { AddAssignment } from './presets/add-assignment/add-assignment';
import { AssignmentDetail } from './presets/assignment-detail/assignment-detail';
import { EditAssignmentComponent } from './presets/edit-assignment/edit-assignment';*/

export const routes: Routes = [
    { path: "", redirectTo: "/home", pathMatch: "full"},
    { path: "home", component: Presets}/*,
    { path: "add", component: AddAssignment },
    { path: "presets/:id", component: AssignmentDetail },
    { path: "presets/:id/edit", component: EditAssignmentComponent },*/
];
