import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CreateArtifactComponent } from '../create-artifact/create-artifact.component';
import { ArtifactService } from '../services/artifact.service';
import { ToastrService } from 'ngx-toastr';
import { ArtifactDetail } from '../../models/artifact-detail.model';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-update-artifact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
    private readonly route: ActivatedRoute
  ) {
    super(fb, location, artService, toastrSvc);
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
    this.toastrSvc.info('Your request is being processed');
  }
}
