import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArtifactService } from '../services/artifact.service';
import { Artifact } from '../../models/artifact.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ArtifactCardComponent } from '../../components/artifacts-preview/artifact-card/artifact-card.component';

@Component({
  selector: 'app-list-artifact',
  standalone: true,
  imports: [CommonModule, ArtifactCardComponent],
  templateUrl: './list-artifact.component.html',
  styleUrls: ['./list-artifact.component.css']
})
export class ListArtifactComponent implements OnInit {
  artifacts$: Observable<Artifact[]> | undefined;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 6;
  totalArtifacts = 0;

  constructor(private artifactService: ArtifactService) {}

  ngOnInit(): void {
    this.artifacts$ = this.artifactService.getArtifacts();
    this.artifacts$.subscribe(artifacts => {
      this.totalArtifacts = artifacts.length;
    });
  }

  get paginatedArtifacts$(): Observable<Artifact[]> | undefined {
    return this.artifacts$?.pipe(
      map(artifacts => {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        return artifacts.slice(startIndex, startIndex + this.itemsPerPage);
      })
    );
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  get totalPages(): number {
    return Math.ceil(this.totalArtifacts / this.itemsPerPage);
  }
} 