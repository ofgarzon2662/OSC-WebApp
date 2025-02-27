import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtifactsPreviewComponent } from './artifacts-preview.component';

describe('ArtifactsPreviewComponent', () => {
  let component: ArtifactsPreviewComponent;
  let fixture: ComponentFixture<ArtifactsPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArtifactsPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArtifactsPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
