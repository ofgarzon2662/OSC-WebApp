import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WorkflowCardComponent } from './workflow-card/workflow-card.component';
import { WorkflowListItem } from '../../models/workflow.model';
import { WorkflowService } from '../../services/workflow.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-workflows-preview',
  templateUrl: './workflows-preview.component.html',
  styleUrls: ['./workflows-preview.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, WorkflowCardComponent],
})
export class WorkflowsPreviewComponent implements OnInit {
  workflows: WorkflowListItem[] = [];
  isLoading = true;
  hasError = false;

  constructor(private readonly workflowService: WorkflowService) {}

  ngOnInit(): void {
    this.loadWorkflows();
  }

  loadWorkflows(): void {
    this.isLoading = true;
    this.hasError = false;
    this.workflowService
      .getWorkflows()
      .pipe(map((workflows) => workflows.slice(0, 3)))
      .subscribe({
        next: (workflows) => {
          this.workflows = workflows;
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
        },
      });
  }
}
