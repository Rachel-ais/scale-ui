import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import * as _ from 'lodash';

import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/internal/operators';

import { DataService } from '../../common/services/data.service';
import { ApiResults } from '../../common/models/api-results.model';
import { Batch } from './api.model';
import { BatchesDatatable } from './datatable.model';

@Injectable()
export class BatchesApiService {
    apiPrefix: string;

    constructor(
        private http: HttpClient,
        private dataService: DataService
    ) {
        this.apiPrefix = this.dataService.getApiPrefix('batches');
    }

    getBatches(params: BatchesDatatable, poll?: Boolean): Observable<any> {
        const sortStr = params.sortOrder < 0 ? '-' + params.sortField : params.sortField;
        const page = params.first && params.rows ? (params.first / params.rows) + 1 : 1;
        let apiParams = {
            order: sortStr,
            page: page.toString(),
            page_size: params.rows ? params.rows.toString() : null,
            started: params.started,
            ended: params.ended,
            recipe_type_id: params.recipe_type_id,
            is_creation_done: params.is_creation_done,
            is_superseded: params.is_superseded,
            root_batch_id: params.root_batch_id
        };
        apiParams = _.pickBy(apiParams, (d) => {
            return d !== null && typeof d !== 'undefined' && d !== '';
        });
        const queryParams = new HttpParams({
            fromObject: apiParams
        });
        if (poll) {
            const request = this.http.get(`${this.apiPrefix}/batches/`, { params: queryParams });
            const mapRequest = response => {
                return ApiResults.transformer(response);
            };
            return this.dataService.generatePoll(600000, request, mapRequest);
        }
        return this.http.get<ApiResults>(`${this.apiPrefix}/batches/`, { params: queryParams })
            .pipe(
                map(response => {
                    return ApiResults.transformer(response);
                }),
                catchError(this.dataService.handleError)
            );
    }

    getBatch(id): Observable<any> {
        return this.http.get<Batch>(`${this.apiPrefix}/batches/${id}/`)
            .pipe(
                map(response => {
                    return Batch.transformer(response);
                }),
                catchError(this.dataService.handleError)
            );
    }

    validateBatch(batch): Observable<any> {
        return this.http.post<any>(`${this.apiPrefix}/batches/validation/`, batch)
            .pipe(
                map(response => {
                    return response;
                }),
                catchError(this.dataService.handleError)
            );
    }
}
