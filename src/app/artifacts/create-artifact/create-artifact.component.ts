import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(3000)]],
      keywords: ['', [Validators.maxLength(1000), this.validateCommaSeparated()]],
      links: ['', [Validators.maxLength(2000), this.validateLinks()]],
      doi: ['', [this.validateDoi()]],
      nsf: [false],
      nih: [false],
      noaa: [false],
      nasa: [false],
      otherAgency: ['', [Validators.maxLength(100), this.validateCommaSeparated()]],
      acknowledgment: ['', [Validators.maxLength(3000)]]
    });
  }

  ngOnInit(): void {}

  // Validador personalizado para valores separados por comas
  private validateCommaSeparated() {
    return (control: any) => {
      if (!control.value) {
        return null; // Campo vacío es válido
      }

      const values = control.value.split(',').map((item: string) => item.trim());
      const hasEmptyValues = values.some((item: string) => item === '');

      return hasEmptyValues ? { invalidFormat: true } : null;
    };
  }

  // Validador personalizado para URLs
  private validateLinks() {
    return (control: any) => {
      if (!control.value) {
        return null; // Campo vacío es válido
      }

      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      const urls = control.value.split(',').map((url: string) => url.trim());
      
      const invalidUrls = urls.some((url: string) => !urlPattern.test(url));
      
      return invalidUrls ? { invalidLinks: true } : null;
    };
  }

  // Validador personalizado para DOIs
  private validateDoi() {
    return (control: any) => {
      if (!control.value) {
        return null; // Campo vacío es válido
      }

      const doiPattern = /^10.\d{4,9}\/[-._;()\/:A-Z0-9]+$/i;
      const dois = control.value.split(',').map((doi: string) => doi.trim());
      
      const invalidDois = dois.some((doi: string) => !doiPattern.test(doi));
      
      return invalidDois ? { invalidDoi: true } : null;
    };
  }

  onSubmit(): void {
    // Marcar todos los campos como tocados para mostrar errores
    Object.keys(this.artifactForm.controls).forEach(key => {
      const control = this.artifactForm.get(key);
      control?.markAsTouched();
    });

    if (this.artifactForm.valid) {
      console.log('Form submitted:', this.artifactForm.value);
    } else {
      console.log('Form is invalid:', this.artifactForm.errors);
    }
  }
} 