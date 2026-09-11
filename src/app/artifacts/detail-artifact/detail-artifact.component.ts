import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ArtifactDetail } from '../../models/artifact-detail.model';
import { ArtifactService } from '../services/artifact.service';

@Component({
  selector: 'app-detail-artifact',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detail-artifact.component.html',
  styleUrls: ['./detail-artifact.component.css'],
})
export class DetailArtifactComponent implements OnInit {
  artifact?: ArtifactDetail;
  isLoading = true;
  errorMessage = '';
  idCopied = false;
  private artifactId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly artifactService: ArtifactService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.artifactId = params.get('id') ?? '';
      this.loadArtifact();
    });
  }

  loadArtifact(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.artifact = undefined;

    if (!this.artifactId) {
      this.isLoading = false;
      this.errorMessage = 'This artifact record does not have a valid ID.';
      return;
    }

    this.artifactService.getArtifactById(this.artifactId).subscribe({
      next: (detail) => {
        this.artifact = detail || undefined;
        this.isLoading = false;
        if (!detail) {
          this.errorMessage = 'This artifact record could not be found.';
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage =
          'We could not load this artifact record. The catalog may be temporarily unavailable.';
      },
    });
  }

  copyId(): void {
    if (!this.artifact) return;
    navigator.clipboard.writeText(this.recordId()).then(() => {
      this.idCopied = true;
      setTimeout(() => (this.idCopied = false), 2000);
    });
  }

  recordId(): string {
    if (!this.artifact) return '';
    return this.artifact.id.startsWith('artifact-')
      ? `osc-is-${this.artifact.id}`
      : `osc-is-artifact-${this.artifact.id}`;
  }

  printManifest(): void {
    if (!this.artifact?.manifest?.length) return;

    const manifestText = this.artifact.manifest
      .map((item) => `${item.filename}\t${item.hash}\t${item.algorithm}`)
      .join('\n');

    const win = window.open('', '_blank');
    if (!win) {
      alert('Please allow pop-ups to print the manifest.');
      return;
    }

    const doc: any = win.document;
    doc.title = 'Artifact Manifest';

    if (doc?.head && doc?.body && typeof doc.createElement === 'function') {
      const styleElement = doc.createElement('style');
      styleElement.textContent =
        'body { font-family: monospace; margin: 16px; white-space: pre-wrap; }';
      doc.head.appendChild(styleElement);

      const manifest = doc.createElement('pre');
      manifest.textContent = manifestText;
      doc.body.innerHTML = '';
      doc.body.appendChild(manifest);
    } else {
      const escaped = manifestText.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      const html = `<!doctype html><html><head><title>Artifact Manifest</title><style>body { font-family: monospace; white-space: pre; margin: 16px; }</style></head><body>${escaped}</body></html>`;
      if (typeof doc.open === 'function') doc.open();
      if (typeof doc.write === 'function') doc.write(html);
      if (typeof doc.close === 'function') doc.close();
    }

    setTimeout(() => {
      if (typeof (win as any).focus === 'function') (win as any).focus();
      if (typeof (win as any).print === 'function') (win as any).print();
    }, 10);
  }

  onUpdateArtifact(): void {
    if (!this.artifact) return;
    this.router.navigate(['/update-artifact', this.artifact.id]);
  }

  truncated(value: string | null, len = 12): string {
    if (!value) return '\u2014';
    return value.length > len ? value.slice(0, len) + '\u2026' : value;
  }
}
