import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArtifactCardComponent } from './artifact-card/artifact-card.component';
import { Artifact } from '../../models/artifact.model';
import { ArtifactService } from '../../services/artifact.service';

@Component({
  selector: 'app-artifacts-preview',
  templateUrl: './artifacts-preview.component.html',
  styleUrls: ['./artifacts-preview.component.css'],
  standalone: true,
  imports: [CommonModule, ArtifactCardComponent]
})
export class ArtifactsPreviewComponent implements OnInit {
  artifacts: Artifact[] = [];

  constructor(private readonly artifactService: ArtifactService) { }

  ngOnInit(): void {
    this.artifactService.getArtifacts().subscribe(artifacts => {
      this.artifacts = artifacts;
    });
  }
}
