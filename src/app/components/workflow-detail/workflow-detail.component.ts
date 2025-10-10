import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Workflow } from '../../models/workflow.model';
import { WorkflowService } from '../../services/workflow.service';

@Component({
  selector: 'app-workflow-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './workflow-detail.component.html',
  styleUrls: ['./workflow-detail.component.css']
})
export class WorkflowDetailComponent implements OnInit {
  workflow?: Workflow;
  isLoading = true;
  workflowId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly workflowService: WorkflowService
  ) {}

  ngOnInit(): void {
    this.workflowId = this.route.snapshot.paramMap.get('id') ?? '';
    
    this.workflowService.getWorkflow(this.workflowId).subscribe(workflow => {
      this.workflow = workflow;
      this.isLoading = false;
    });
  }
}

