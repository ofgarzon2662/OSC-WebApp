import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowCardComponent } from './workflow-card/workflow-card.component';
import { Workflow } from '../../models/workflow.model';
import { WorkflowService } from '../../services/workflow.service';

@Component({
  selector: 'app-workflows-preview',
  templateUrl: './workflows-preview.component.html',
  styleUrls: ['./workflows-preview.component.css'],
  standalone: true,
  imports: [CommonModule, WorkflowCardComponent]
})
export class WorkflowsPreviewComponent implements OnInit {
  workflows: Workflow[] = [];

  constructor(private workflowService: WorkflowService) { }

  ngOnInit(): void {
    this.workflowService.getWorkflows().subscribe(workflows => {
      this.workflows = workflows;
    });
  }
}
