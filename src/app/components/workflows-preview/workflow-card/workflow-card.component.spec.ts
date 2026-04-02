import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkflowCardComponent } from './workflow-card.component';
import { WorkflowListItem } from '../../../models/workflow.model';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';

describe('WorkflowCardComponent', () => {
  let component: WorkflowCardComponent;
  let fixture: ComponentFixture<WorkflowCardComponent>;

  const testWorkflow: WorkflowListItem = {
    id: '1',
    title: 'Test Workflow',
    description: 'This is a test description for the workflow',
    keywords: ['test', 'workflow'],
    submissionState: 'PENDING',
    submittedAt: new Date('2023-01-15'),
    updatedAt: null as any,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, RouterTestingModule, WorkflowCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowCardComponent);
    component = fixture.componentInstance;
    component.workflow = testWorkflow;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should receive the workflow input correctly', () => {
    expect(component.workflow).toEqual(testWorkflow);
  });

  it('should display the workflow title', () => {
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('Test Workflow');
  });

  it('should display the workflow description', () => {
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('This is a test description');
  });

  it('should display the submitted date', () => {
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('Submitted at');
  });

  it('should have a view button', () => {
    const viewButton = fixture.debugElement.query(By.css('.btn-primary, .view-button'));
    expect(viewButton).toBeTruthy();
    expect(viewButton.nativeElement.textContent.trim()).toBe('View');
  });

  it('should apply the correct CSS classes', () => {
    const cardElement = fixture.debugElement.query(By.css('.card'));
    expect(cardElement).toBeTruthy();
    const headerElement = fixture.debugElement.query(By.css('.card-header'));
    expect(headerElement).toBeTruthy();
    const bodyElement = fixture.debugElement.query(By.css('.card-body'));
    expect(bodyElement).toBeTruthy();
  });
});
