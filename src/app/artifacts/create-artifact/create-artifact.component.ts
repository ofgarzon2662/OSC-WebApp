import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-artifact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-artifact.component.html',
  styleUrls: ['./create-artifact.component.css']
})
export class CreateArtifactComponent implements OnInit {
  artifactForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.artifactForm = this.fb.group({
      title: [''],
      description: [''],
      keywords: [''],
      links: [''],
      doi: [''],
      nsf: [false],
      nih: [false],
      noaa: [false],
      nasa: [false],
      otherAgency: [''],
      acknowledgment: ['']
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.artifactForm.valid) {
      console.log('Form submitted:', this.artifactForm.value);
    }
  }
} 