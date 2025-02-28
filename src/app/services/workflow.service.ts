import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Workflow } from '../models/workflow.model';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private readonly mockWorkflows: Workflow[] = [
    {
      id: '1',
      name: 'Name Workflow 1',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      recentUpdates: 'Excepteur sint occaecat, sunt in culpa qui officia deserunt mollit anim id.',
      lastUpdated: new Date()
    },
    {
      id: '2',
      name: 'Name Workflow 2',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      recentUpdates: 'Excepteur sint occaecat, sunt in culpa qui officia deserunt mollit anim id.',
      lastUpdated: new Date(Date.now() - 86400000)
    },
    {
      id: '3',
      name: 'Name Workflow 3',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      recentUpdates: 'Excepteur sint occaecat, sunt in culpa qui officia deserunt mollit anim id.',
      lastUpdated: new Date(Date.now() - 172800000)
    }
  ];

  constructor() { }

  getWorkflows(): Observable<Workflow[]> {
    // Simula una llamada al backend
    return of(this.mockWorkflows);
  }

  getWorkflow(id: string): Observable<Workflow | undefined> {
    const workflow = this.mockWorkflows.find(w => w.id === id);
    return of(workflow);
  }
}
