import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArtifactCardComponent } from './artifact-card/artifact-card.component';
import { Artifact } from '../../models/artifact.model';
import { ArtifactService } from '../../artifacts/services/artifact.service';
import { map } from 'rxjs/operators';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-artifacts-preview',
  templateUrl: './artifacts-preview.component.html',
  styleUrls: ['./artifacts-preview.component.css'],
  standalone: true,
  imports: [CommonModule, ArtifactCardComponent, RouterModule],
})
export class ArtifactsPreviewComponent implements OnInit {
  artifacts: Artifact[] = [];
  isLoading = true;
  hasError = false;

  constructor(private readonly artifactService: ArtifactService) {}

  ngOnInit(): void {
    this.loadArtifacts();
  }

  loadArtifacts(): void {
    this.isLoading = true;
    this.hasError = false;
    this.artifactService
      .getArtifacts()
      .pipe(map((artifacts) => artifacts.slice(0, 3)))
      .subscribe({
        next: (artifacts) => {
          this.artifacts = artifacts;
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
        },
      });
  }
}
