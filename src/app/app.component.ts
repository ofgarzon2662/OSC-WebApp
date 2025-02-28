import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ArtifactsPreviewComponent } from './components/artifacts-preview/artifacts-preview.component';
import { WorkflowsPreviewComponent } from './components/workflows-preview/workflows-preview.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NgbModule, ArtifactsPreviewComponent, WorkflowsPreviewComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'OSC-WebApp';
  logoError = false;

  ngOnInit() {
    console.log("AppComponent cargado"); // ⚠️ Si esto aparece dos veces en consola, hay un problema
  }

  onLogoError() {
    this.logoError = true;
    console.error('Error loading logo image');
  }
}
