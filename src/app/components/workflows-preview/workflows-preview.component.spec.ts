import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkflowsPreviewComponent } from './workflows-preview.component';
import { WorkflowService } from '../../services/workflow.service';
import { Workflow } from '../../models/workflow.model';
import { of } from 'rxjs';
import { Component, Input } from '@angular/core';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

// Mock del componente WorkflowCardComponent
@Component({
  selector: 'app-workflow-card',
  template: '<div>{{workflow.name}}</div>',
  standalone: true
})
class MockWorkflowCardComponent {
  @Input() workflow!: Workflow;
}

// Mock de datos de workflows
const mockWorkflows: Workflow[] = [
  {
    id: '1',
    name: 'Test Workflow 1',
    description: 'Description 1',
    recentUpdates: 'Recent updates 1',
    lastUpdated: new Date()
  },
  {
    id: '2',
    name: 'Test Workflow 2',
    description: 'Description 2',
    recentUpdates: 'Recent updates 2',
    lastUpdated: new Date()
  }
];

// Mock del servicio WorkflowService
class MockWorkflowService {
  getWorkflows() {
    return of(mockWorkflows);
  }
}

describe('WorkflowsPreviewComponent', () => {
  let component: WorkflowsPreviewComponent;
  let fixture: ComponentFixture<WorkflowsPreviewComponent>;
  let workflowService: WorkflowService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        WorkflowsPreviewComponent,
        MockWorkflowCardComponent
      ],
      providers: [
        { provide: WorkflowService, useClass: MockWorkflowService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowsPreviewComponent);
    component = fixture.componentInstance;
    workflowService = TestBed.inject(WorkflowService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load workflows on init', () => {
    expect(component.workflows.length).toBe(2);
    expect(component.workflows).toEqual(mockWorkflows);
  });

  it('should display the section title', () => {
    const titleElement = fixture.debugElement.query(By.css('.section-title'));
    expect(titleElement).toBeTruthy();
    expect(titleElement.nativeElement.textContent).toContain('Workflows');
  });

  it('should display a "VIEW ALL" link', () => {
    const linkElement = fixture.debugElement.query(By.css('.view-all-link'));
    expect(linkElement).toBeTruthy();
    expect(linkElement.nativeElement.textContent.trim()).toBe('VIEW ALL');
  });

  it('should render workflow cards for each workflow', () => {
    const cardElements = fixture.debugElement.queryAll(By.css('app-workflow-card'));
    expect(cardElements.length).toBe(2);
  });

  it('should contain the workflow names in the rendered output', () => {
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('Test Workflow 1');
    expect(textContent).toContain('Test Workflow 2');
  });

  it('should call getWorkflows from the service', () => {
    // Crear un espía para el método getWorkflows
    const spy = spyOn(workflowService, 'getWorkflows').and.callThrough();

    // Reinicializar el componente para que llame a ngOnInit de nuevo
    component.ngOnInit();

    // Verificar que el método fue llamado
    expect(spy).toHaveBeenCalled();
  });
});
