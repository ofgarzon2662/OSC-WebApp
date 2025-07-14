import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListArtifactComponent } from './list-artifact.component';

describe('ListArtifactComponent', () => {
  let component: ListArtifactComponent;
  let fixture: ComponentFixture<ListArtifactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListArtifactComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListArtifactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 