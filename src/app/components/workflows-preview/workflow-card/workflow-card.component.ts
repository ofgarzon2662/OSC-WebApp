import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Workflow } from '../../../models/workflow.model';

@Component({
  selector: 'app-workflow-card',
  templateUrl: './workflow-card.component.html',
  styleUrls: ['./workflow-card.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class WorkflowCardComponent {
  @Input() workflow!: Workflow;
}
