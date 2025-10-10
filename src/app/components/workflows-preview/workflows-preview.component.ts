import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WorkflowCardComponent } from './workflow-card/workflow-card.component';
import { Workflow } from '../../models/workflow.model';
import { WorkflowService } from '../../services/workflow.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-workflows-preview',
  templateUrl: './workflows-preview.component.html',
  styleUrls: ['./workflows-preview.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, WorkflowCardComponent]
})
export class WorkflowsPreviewComponent implements OnInit {
  workflows: Workflow[] = [];

  constructor(private readonly workflowService: WorkflowService) { }

  ngOnInit(): void {
    this.workflowService.getWorkflows().pipe(
      map(workflows => workflows.slice(0, 3))
    ).subscribe(workflows => {
      this.workflows = workflows;
    });
  }
}
