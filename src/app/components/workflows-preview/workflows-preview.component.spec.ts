import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowsPreviewComponent } from './workflows-preview.component';

describe('WorkflowsPreviewComponent', () => {
  let component: WorkflowsPreviewComponent;
  let fixture: ComponentFixture<WorkflowsPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowsPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkflowsPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
