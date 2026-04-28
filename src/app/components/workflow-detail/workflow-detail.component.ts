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
  expandedRepos: Set<number> = new Set();
  idCopied = false;

  toggleContents(repoIndex: number): void {
    if (this.expandedRepos.has(repoIndex)) {
      this.expandedRepos.delete(repoIndex);
    } else {
      this.expandedRepos.add(repoIndex);
    }
  }

  isExpanded(repoIndex: number): boolean {
    return this.expandedRepos.has(repoIndex);
  }

  isFolder(filename: string): boolean {
    return filename.endsWith('/');
  }

  copyId(): void {
    if (!this.workflow) return;
    const fullId = 'osc-is-workflow-' + this.workflow.id;
    navigator.clipboard.writeText(fullId).then(() => {
      this.idCopied = true;
      setTimeout(() => this.idCopied = false, 2000);
    });
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly workflowService: WorkflowService
  ) {}

  ngOnInit(): void {
    this.workflowId = this.route.snapshot.paramMap.get('id') ?? '';

    this.workflowService.getWorkflow(this.workflowId).subscribe({
      next: workflow => {
        this.workflow = workflow;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
