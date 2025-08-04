import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdateArtifactComponent } from './update-artifact.component';

describe('UpdateArtifactComponent', () => {
  let component: UpdateArtifactComponent;
  let fixture: ComponentFixture<UpdateArtifactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateArtifactComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateArtifactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
