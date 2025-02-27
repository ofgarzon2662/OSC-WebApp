import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListArtifacstComponent } from './list-artifacst.component';

describe('ListArtifacstComponent', () => {
  let component: ListArtifacstComponent;
  let fixture: ComponentFixture<ListArtifacstComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListArtifacstComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListArtifacstComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
