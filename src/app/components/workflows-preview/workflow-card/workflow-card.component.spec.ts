import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowCardComponent } from './workflow-card.component';

describe('WorkflowCardComponent', () => {
  let component: WorkflowCardComponent;
  let fixture: ComponentFixture<WorkflowCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkflowCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
