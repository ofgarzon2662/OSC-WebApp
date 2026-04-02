import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowCardComponent } from '../workflows-preview/workflow-card/workflow-card.component';
import { WorkflowListItem } from '../../models/workflow.model';
import { WorkflowService } from '../../services/workflow.service';

@Component({
  selector: 'app-list-workflows',
  standalone: true,
  imports: [CommonModule, WorkflowCardComponent],
  templateUrl: './list-workflows.component.html',
  styleUrls: ['./list-workflows.component.css']
})
export class ListWorkflowsComponent implements OnInit {
  workflows: WorkflowListItem[] = [];
  isLoading = true;

  constructor(private readonly workflowService: WorkflowService) { }

  ngOnInit(): void {
    this.workflowService.getWorkflows().subscribe(workflows => {
      this.workflows = workflows;
      this.isLoading = false;
    });
  }
}

