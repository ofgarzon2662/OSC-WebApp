import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetailArtifactComponent } from './detail-artifact.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ArtifactService } from '../services/artifact.service';
import { Artifact } from '../../models/artifact.model';

declare const jasmine: any;

describe('DetailArtifactComponent', () => {
  let component: DetailArtifactComponent;
  let fixture: ComponentFixture<DetailArtifactComponent>;

  const mockArtifact: Artifact = {
    id: '123',
    title: 'Test Artifact',
    description: 'Test description',
    keywords: ['test'],
    submittedAt: '',
    verified: false,
    lastTimeVerified: null,
    lastTimeUpdated: null
  };

  const artifactServiceStub = {
    getArtifacts: () => of([mockArtifact])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailArtifactComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(new Map([['id', '123']])) }
        },
        { provide: ArtifactService, useValue: artifactServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DetailArtifactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 