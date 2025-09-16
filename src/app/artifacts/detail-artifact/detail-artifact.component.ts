import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ArtifactService } from '../services/artifact.service';
import { ArtifactDetail } from '../../models/artifact-detail.model';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-detail-artifact',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detail-artifact.component.html',
  styleUrls: ['./detail-artifact.component.css']
})
export class DetailArtifactComponent implements OnInit {
  artifact?: ArtifactDetail;
  isLoading = true;
  showBlockchain = false;
  showPeer = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly artifactService: ArtifactService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap(params => {
          const id = params.get('id');
          return id ? this.artifactService.getArtifactById(id) : of(null);
        })
      )
      .subscribe(detail => {
        this.artifact = detail || undefined;
        this.isLoading = false;
      });
  }

  printManifest(): void {
    if (!this.artifact?.manifest?.length) return;

    const manifestText = this.artifact.manifest
      .map(item => `${item.filename}\t${item.hash}\t${item.algorithm}`)
      .join('\n');

    const win = window.open('', '_blank'); // keep it simple, no “noopener,noreferrer”
    if (!win) {
      alert('Please allow pop-ups to print the manifest.');
      return;
    }

    const doc = win.document;
    doc.title = 'Artifact Manifest';

    // Inject basic styles
    const styleEl = doc.createElement('style');
    styleEl.textContent = 'body { font-family: monospace; margin: 16px; }';
    doc.head.appendChild(styleEl);

    // Put manifest into a <pre> to preserve whitespace without manual escaping
    const pre = doc.createElement('pre');
    pre.textContent = manifestText;
    doc.body.innerHTML = '';
    doc.body.appendChild(pre);

    // Give the browser a paint cycle, then print
    setTimeout(() => {
      win.focus();
      win.print();
    }, 10);
  }

  onUpdateArtifact(): void {
    if (!this.artifact) return;
    this.router.navigate(['/update-artifact', this.artifact.id]);
  }

  truncated(value: string | null, len = 12): string {
    if (!value) return '—';
    return value.length > len ? value.slice(0, len) + '…' : value;
  }
} 