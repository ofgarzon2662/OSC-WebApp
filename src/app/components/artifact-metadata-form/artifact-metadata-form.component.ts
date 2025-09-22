import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-artifact-metadata-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './artifact-metadata-form.component.html',
  styleUrls: ['./artifact-metadata-form.component.css']
})
export class ArtifactMetadataFormComponent {
  @Input() artifactForm!: FormGroup;
  @Input() isUpdateMode = false;
}


