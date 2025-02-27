import { TestBed } from '@angular/core/testing';
import { ArtifactService } from './artifact.service';

describe('ArtifactService', () => {
  let service: ArtifactService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArtifactService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getArtifacts', () => {
    it('should return an observable of all artifacts', (done) => {
      service.getArtifacts().subscribe(artifacts => {
        expect(artifacts).toBeTruthy();
        expect(artifacts.length).toBe(3);
        expect(artifacts[0].id).toBe('1');
        expect(artifacts[1].id).toBe('2');
        expect(artifacts[2].id).toBe('3');
        done();
      });
    });

    it('should return artifacts with correct properties', (done) => {
      service.getArtifacts().subscribe(artifacts => {
        const artifact = artifacts[0];
        expect(artifact.id).toBeDefined();
        expect(artifact.name).toBeDefined();
        expect(artifact.description).toBeDefined();
        expect(artifact.lastUpdated).toBeDefined();
        expect(artifact.name).toContain('Name Artifact');
        expect(artifact.description).toContain('First characters of the description');
        done();
      });
    });
  });

  describe('getArtifact', () => {
    it('should return the artifact with the specified id', (done) => {
      service.getArtifact('2').subscribe(artifact => {
        expect(artifact).toBeTruthy();
        expect(artifact?.id).toBe('2');
        expect(artifact?.name).toBe('Name Artifact 2');
        done();
      });
    });

    it('should return undefined for non-existent artifact id', (done) => {
      service.getArtifact('999').subscribe(artifact => {
        expect(artifact).toBeUndefined();
        done();
      });
    });
  });

  describe('mock data integrity', () => {
    it('should have correct date differences for artifacts', (done) => {
      service.getArtifacts().subscribe(artifacts => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // El primer artefacto debe tener fecha de hoy
        const artifact1Date = new Date(artifacts[0].lastUpdated);
        expect(artifact1Date.getDate()).toBe(today.getDate());

        // El segundo artefacto debe ser de hace 1 día
        const artifact2Date = new Date(artifacts[1].lastUpdated);
        const oneDayAgo = new Date(today);
        oneDayAgo.setDate(today.getDate() - 1);
        expect(artifact2Date.getDate()).toBe(oneDayAgo.getDate());

        // El tercer artefacto debe ser de hace 2 días
        const artifact3Date = new Date(artifacts[2].lastUpdated);
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);
        expect(artifact3Date.getDate()).toBe(twoDaysAgo.getDate());

        done();
      });
    });
  });
});
