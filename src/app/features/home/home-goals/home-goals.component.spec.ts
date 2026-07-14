import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeGoalsComponent } from './home-goals.component';

describe('HomeGoalsComponent', () => {
  let component: HomeGoalsComponent;
  let fixture: ComponentFixture<HomeGoalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeGoalsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeGoalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
