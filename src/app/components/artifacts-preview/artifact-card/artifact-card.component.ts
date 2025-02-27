import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Artifact } from '../../../models/artifact.model';

@Component({
  selector: 'app-artifact-card',
  templateUrl: './artifact-card.component.html',
  styleUrls: ['./artifact-card.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ArtifactCardComponent {
  @Input() artifact!: Artifact;
}
