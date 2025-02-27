import { TestBed } from '@angular/core/testing';
import { WorkflowService } from './workflow.service';

describe('WorkflowService', () => {
  let service: WorkflowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkflowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getWorkflows', () => {
    it('should return an observable of all workflows', (done) => {
      service.getWorkflows().subscribe(workflows => {
        expect(workflows).toBeTruthy();
        expect(workflows.length).toBe(3);
        expect(workflows[0].id).toBe('1');
        expect(workflows[1].id).toBe('2');
        expect(workflows[2].id).toBe('3');
        done();
      });
    });

    it('should return workflows with correct properties', (done) => {
      service.getWorkflows().subscribe(workflows => {
        const workflow = workflows[0];
        expect(workflow.id).toBeDefined();
        expect(workflow.name).toBeDefined();
        expect(workflow.description).toBeDefined();
        expect(workflow.recentUpdates).toBeDefined();
        expect(workflow.lastUpdated).toBeDefined();
        expect(workflow.name).toContain('Name Workflow');
        expect(workflow.description).toContain('Lorem ipsum');
        expect(workflow.recentUpdates).toContain('Excepteur sint');
        done();
      });
    });
  });

  describe('getWorkflow', () => {
    it('should return the workflow with the specified id', (done) => {
      service.getWorkflow('2').subscribe(workflow => {
        expect(workflow).toBeTruthy();
        expect(workflow?.id).toBe('2');
        expect(workflow?.name).toBe('Name Workflow 2');
        done();
      });
    });

    it('should return undefined for non-existent workflow id', (done) => {
      service.getWorkflow('999').subscribe(workflow => {
        expect(workflow).toBeUndefined();
        done();
      });
    });
  });

  describe('mock data integrity', () => {
    it('should have correct date differences for workflows', (done) => {
      service.getWorkflows().subscribe(workflows => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // El primer workflow debe tener fecha de hoy
        const workflow1Date = new Date(workflows[0].lastUpdated);
        expect(workflow1Date.getDate()).toBe(today.getDate());

        // El segundo workflow debe ser de hace 1 día
        const workflow2Date = new Date(workflows[1].lastUpdated);
        const oneDayAgo = new Date(today);
        oneDayAgo.setDate(today.getDate() - 1);
        expect(workflow2Date.getDate()).toBe(oneDayAgo.getDate());

        // El tercer workflow debe ser de hace 2 días
        const workflow3Date = new Date(workflows[2].lastUpdated);
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);
        expect(workflow3Date.getDate()).toBe(twoDaysAgo.getDate());

        done();
      });
    });
  });
});
