import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { CreateArtifactComponent } from '../create-artifact/create-artifact.component';
import { ArtifactService } from '../services/artifact.service';
import { ToastrService } from 'ngx-toastr';
import { ArtifactDetail } from '../../models/artifact-detail.model';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import { UpdateArtifactDTO, ManifestItem } from '../models/artifact';

@Component({
  selector: 'app-update-artifact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './update-artifact.component.html',
  styleUrls: ['./update-artifact.component.css']
})
export class UpdateArtifactComponent extends CreateArtifactComponent implements OnInit {
  artifact?: ArtifactDetail;

  constructor(
    fb: FormBuilder,
    location: Location,
    private readonly artService: ArtifactService,
    private readonly toastrSvc: ToastrService,
    private readonly route: ActivatedRoute,
    router: Router
  ) {
    super(fb, location, artService, toastrSvc, router);
  }

  override ngOnInit(): void {
    // Initialize form and hidden inputs from parent implementation
    super.ngOnInit();

    // Fetch artifact data and populate form
    this.route.paramMap
      .pipe(
        switchMap(params => {
          const id = params.get('id');
          return id ? this.artService.getArtifactById(id) : of(null);
        })
      )
      .subscribe(detail => {
        if (!detail) return;
        this.artifact = detail;
        this.prefillForm(detail);
      });
  }

  private prefillForm(detail: ArtifactDetail): void {
    // Populate form with existing values
    this.artifactForm.patchValue({
      title: detail.title,
      description: detail.description,
      keywords: detail.keywords?.join(', '),
      links: detail.links?.join(', '),
      doi: detail.dois?.join(', '),
      nsf: detail.fundingAgencies?.includes('NSF') ?? false,
      nih: detail.fundingAgencies?.includes('NIH') ?? false,
      noaa: detail.fundingAgencies?.includes('NOAA') ?? false,
      nasa: detail.fundingAgencies?.includes('NASA') ?? false,
      otherAgency: detail.fundingAgencies?.filter(ag => !['NSF','NIH','NOAA','NASA'].includes(ag)).join(', '),
      acknowledgment: detail.acknowledgements ?? ''
    });

    // Disable title & description so they cannot be edited
    this.artifactForm.get('title')?.disable();
    this.artifactForm.get('description')?.disable();
  }

  override onSubmit(): void {
    this.isSubmitting = true;

    if (!this.artifact || !this.isFormAndFileValid()) {
      this.isSubmitting = false;
      this.toastrSvc.error('Please select files/folder and ensure the form is valid.');
      return;
    }

    const formValues = this.artifactForm.getRawValue();

    const keywords = this.processCommaSeparatedField(formValues.keywords);
    const links = this.processCommaSeparatedField(formValues.links, 'links');
    const dois = this.processCommaSeparatedField(formValues.doi);
    const fundingAgencies = this.processFundingAgencies(formValues);

    const manifest: ManifestItem[] = this.selectedFilesData.map(f => ({
      hash: f.hash,
      filename: f.name,
      algorithm: 'sha256'
    }));

    // Single-file rule; otherwise hash canonical manifest
    let footprint: string;
    if (this.selectedFilesData.length === 1) {
      footprint = this.selectedFilesData[0].hash;
    } else {
      const canonical = this.buildCanonicalManifestForUpdate(manifest);
      footprint = CryptoJS.SHA256(canonical).toString();
    }

    const dto: UpdateArtifactDTO = {
      keywords,
      links,
      dois,
      fundingAgencies,
      acknowledgements: formValues.acknowledgment ?? '',
      submission_comment: formValues.submission_comment ?? '',
      manifest,
      footprint
    };

    this.artService.updateArtifactMetadataOnly(this.artifact.id, dto)
      .subscribe({
        next: () => {
          const id = this.artifact!.id;
          this.lastCreatedId ??= id;
          const link = `/artifacts/${id}`;
          this.toastrSvc.success(
            `Artifact updated successfully! <a href='${link}'>Check your modified artifact</a>`,
            'Success!',
            { enableHtml: true, timeOut: 5000 }
          );
          this.isSubmitting = false;
        },
        error: (err) => {
          this.toastrSvc.error(err?.message || 'Failed to update artifact');
          this.isSubmitting = false;
        }
      });
  }

  private buildCanonicalManifestForUpdate(manifest: ManifestItem[]): string {
    return [...manifest]
      .sort((a, b) => a.filename.localeCompare(b.filename, undefined, { sensitivity: 'base' }))
      .map(m => `${m.filename}\t${m.hash}\t${m.algorithm}`)
      .join('\n');
  }
}
