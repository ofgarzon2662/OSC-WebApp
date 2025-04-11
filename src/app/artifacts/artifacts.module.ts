import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { artifactsRoutes } from './artifacts.routes';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(artifactsRoutes)
  ]
})
export class ArtifactsModule { } 