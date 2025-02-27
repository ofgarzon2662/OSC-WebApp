import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtifactPreviewComponent } from './artifact-preview.component';

describe('ArtifactPreviewComponent', () => {
  let component: ArtifactPreviewComponent;
  let fixture: ComponentFixture<ArtifactPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArtifactPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArtifactPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
