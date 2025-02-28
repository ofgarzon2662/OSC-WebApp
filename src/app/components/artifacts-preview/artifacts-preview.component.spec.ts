import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArtifactsPreviewComponent } from './artifacts-preview.component';
import { ArtifactService } from '../../services/artifact.service';
import { Artifact } from '../../models/artifact.model';
import { of } from 'rxjs';
import { Component, Input } from '@angular/core';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

// Mock del componente ArtifactCardComponent
@Component({
  selector: 'app-artifact-card',
  template: '<div class="mock-artifact-card">{{artifact.name}}</div>',
  standalone: true
})
class MockArtifactCardComponent {
  @Input() artifact!: Artifact;
}

// Mock de datos de artefactos
const mockArtifacts: Artifact[] = [
  {
    id: '1',
    name: 'Test Artifact 1',
    description: 'Description 1',
    lastUpdated: new Date()
  },
  {
    id: '2',
    name: 'Test Artifact 2',
    description: 'Description 2',
    lastUpdated: new Date()
  }
];

// Mock del servicio ArtifactService
class MockArtifactService {
  getArtifacts() {
    return of(mockArtifacts);
  }
}

describe('ArtifactsPreviewComponent', () => {
  let component: ArtifactsPreviewComponent;
  let fixture: ComponentFixture<ArtifactsPreviewComponent>;
  let artifactService: ArtifactService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ArtifactsPreviewComponent,
        MockArtifactCardComponent
      ],
      providers: [
        { provide: ArtifactService, useClass: MockArtifactService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ArtifactsPreviewComponent);
    component = fixture.componentInstance;
    artifactService = TestBed.inject(ArtifactService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load artifacts on init', () => {
    expect(component.artifacts.length).toBe(2);
    expect(component.artifacts).toEqual(mockArtifacts);
  });

  it('should display the section title', () => {
    const titleElement = fixture.debugElement.query(By.css('.section-title'));
    expect(titleElement).toBeTruthy();
    expect(titleElement.nativeElement.textContent).toContain('Artifacts');
  });

  it('should display a "VIEW ALL" link', () => {
    const linkElement = fixture.debugElement.query(By.css('.view-all-link'));
    expect(linkElement).toBeTruthy();
    expect(linkElement.nativeElement.textContent.trim()).toBe('VIEW ALL');
  });

  it('should render artifact cards for each artifact', () => {
    const cardElements = fixture.debugElement.queryAll(By.css('app-artifact-card'));
    expect(cardElements.length).toBe(2);
  });

  it('should pass the correct artifact to each card', () => {
    expect(component.artifacts[0].name).toBe('Test Artifact 1');
    expect(component.artifacts[1].name).toBe('Test Artifact 2');

    const cardElements = fixture.debugElement.queryAll(By.css('app-artifact-card'));
    expect(cardElements.length).toBe(2);
  });

  it('should call getArtifacts from the service', () => {
    const spy = spyOn(artifactService, 'getArtifacts').and.callThrough();

    component.ngOnInit();

    expect(spy).toHaveBeenCalled();
  });
});
