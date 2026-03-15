import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly labelSubject = new BehaviorSubject<string>('');
  readonly label$ = this.labelSubject.asObservable();

  setLabel(label: string): void {
    this.labelSubject.next(label);
  }

  reset(): void {
    this.labelSubject.next('');
  }
}
