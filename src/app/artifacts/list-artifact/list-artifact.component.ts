import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArtifactService } from '../services/artifact.service';
import { Artifact } from '../../models/artifact.model';
import { ArtifactCardComponent } from '../../components/artifacts-preview/artifact-card/artifact-card.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-list-artifact',
  standalone: true,
  imports: [CommonModule, ArtifactCardComponent, FormsModule],
  templateUrl: './list-artifact.component.html',
  styleUrls: ['./list-artifact.component.css']
})
export class ListArtifactComponent implements OnInit {
  // State
  isLoading = true;
  allArtifacts: Artifact[] = [];
  filteredArtifacts: Artifact[] = [];
  paginatedArtifacts: Artifact[] = [];
  searchTerm = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 6;

  constructor(private artifactService: ArtifactService) {}

  ngOnInit(): void {
    this.artifactService.getArtifacts().subscribe(artifacts => {
      this.allArtifacts = artifacts;
      this.filteredArtifacts = artifacts;
      this.isLoading = false;
      this.refreshView();
    });
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredArtifacts = this.allArtifacts.filter(artifact => 
      artifact.title.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.refreshView();
  }

  onPageChange(page: number | string): void {
    if (typeof page === 'number') {
      this.currentPage = page;
      this.refreshView();
    }
  }

  refreshView(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedArtifacts = this.filteredArtifacts.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredArtifacts.length / this.itemsPerPage);
  }

  getPages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2;
    const left = current - delta;
    const right = current + delta + 1;
    const result: (number | string)[] = [];
    const range: number[] = [];

    if (total <= 1) {
      return [];
    }

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= left && i < right)) {
        range.push(i);
      }
    }

    let l: number | null = null;
    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          result.push(l + 1);
        } else if (i - l > 2) {
          result.push('...');
        }
      }
      result.push(i);
      l = i;
    }
    return result;
  }
} 