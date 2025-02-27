import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Artifact } from '../models/artifact.model';

@Injectable({
  providedIn: 'root'
})
export class ArtifactService {
  private readonly mockArtifacts: Artifact[] = [
    {
      id: '1',
      name: 'Name Artifact 1',
      description: 'First characters of the description with ellipses at the end ...',
      lastUpdated: new Date()
    },
    {
      id: '2',
      name: 'Name Artifact 2',
      description: 'First characters of the description with ellipses at the end ...',
      lastUpdated: new Date(Date.now() - 86400000) // 1 day ago
    },
    {
      id: '3',
      name: 'Name Artifact 3',
      description: 'First characters of the description with ellipses at the end ...',
      lastUpdated: new Date(Date.now() - 172800000) // 2 days ago
    }
  ];

  constructor() { }

  getArtifacts(): Observable<Artifact[]> {
    // Simula una llamada al backend
    return of(this.mockArtifacts);
  }

  getArtifact(id: string): Observable<Artifact | undefined> {
    const artifact = this.mockArtifacts.find(a => a.id === id);
    return of(artifact);
  }
}
