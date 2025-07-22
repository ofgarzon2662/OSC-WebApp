import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ArtifactCardComponent } from './artifact-card.component';
import { Artifact } from '../../../models/artifact.model';
import { By } from '@angular/platform-browser';

describe('ArtifactCardComponent', () => {
  let component: ArtifactCardComponent;
  let fixture: ComponentFixture<ArtifactCardComponent>;

  const testArtifact: Artifact = {
    id: '1',
    title: 'Test Artifact Title',
    description: 'This is a test description for the artifact.',
    keywords: ['test', 'artifact'],
    submittedAt: new Date().toISOString(),
    verified: false,
    lastTimeVerified: null,
    lastTimeUpdated: null
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArtifactCardComponent, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ArtifactCardComponent);
    component = fixture.componentInstance;
    component.artifact = testArtifact;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the artifact title', () => {
    const titleEl = fixture.debugElement.query(By.css('.card-header')).nativeElement;
    expect(titleEl.textContent).toContain(testArtifact.title);
  });

  it('should display the artifact description', () => {
    const descriptionEl = fixture.debugElement.query(By.css('.card-text')).nativeElement;
    expect(descriptionEl.textContent).toContain(testArtifact.description);
  });

  it('should display the submission date', () => {
    const dateEl = fixture.debugElement.queryAll(By.css('.card-text'))[1].nativeElement;
    expect(dateEl.textContent).toContain('Submitted at');
  });

  it('should have a "View" button', () => {
    const buttonEl = fixture.debugElement.query(By.css('.view-button')).nativeElement;
    expect(buttonEl).toBeTruthy();
    expect(buttonEl.textContent).toEqual('View');
  });
});
