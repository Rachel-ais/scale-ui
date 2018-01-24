import { TestBed, inject } from '@angular/core/testing';
import { HttpModule } from '@angular/http';

import { IngestApiService } from './api.service';

describe('IngestApiService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpModule],
            providers: [IngestApiService]
        });
    });

    it('should be created', inject([IngestApiService], (service: IngestApiService) => {
        expect(service).toBeTruthy();
    }));
});
