import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ArtifactsPreviewComponent } from '../components/artifacts-preview/artifacts-preview.component';
import { WorkflowsPreviewComponent } from '../components/workflows-preview/workflows-preview.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ArtifactsPreviewComponent,
    WorkflowsPreviewComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {}
