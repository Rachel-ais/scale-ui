import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

import { ApiResults } from '../../api-results.model';
import { Job } from './api.model';
import { JobsDatatable } from './datatable.model';
import { JobExecution } from './execution.model';
import { Observable } from 'rxjs/Rx';

@Injectable()
export class JobsApiService {
    constructor(
        private http: Http
    ) { }
    getJobs(params: JobsDatatable, poll?: Boolean): any {
        const sortStr = params.sortOrder < 0 ? '-' + params.sortField : params.sortField;
        const page = params.first && params.rows ? (params.first / params.rows) + 1 : 1;
        const queryParams = {
            order: sortStr,
            page: page,
            page_size: params.rows,
            started: params.started,
            ended: params.ended,
            status: params.status,
            job_id: params.job_id,
            job_type_id: params.job_type_id,
            job_type_name: params.job_type_name,
            job_type_category: params.job_type_category,
            batch_id: params.batch_id,
            error_category: params.error_category,
            include_superseded: params.include_superseded
        };
        if (poll) {
            const getData = () => {
                return this.http.get('/mocks/jobs', { params: queryParams })
                    .switchMap((data) => Observable.timer(5000)
                        .switchMap(() => getData())
                        .startWith(ApiResults.transformer(data.json())));
            };
            return getData();
        }
        return this.http.get('/mocks/jobs', { params: queryParams })
            .toPromise()
            .then(response => ApiResults.transformer(response.json()))
            .catch(this.handleError);
    }
    getJob(id: number): Promise<Job> {
        return this.http.get(`/mocks/jobs/${id}`)
            .toPromise()
            .then(response => Job.transformer(response.json()))
            .catch(this.handleError);
    }
    getJobExecution(id: number): Promise<JobExecution> {
        return this.http.get(`/mocks/job-executions/${id}`)
            .toPromise()
            .then(response => JobExecution.transformer(response.json()))
            .catch(this.handleError);
    }
    updateJob(id: number, data: any): Promise<any> {
        return this.http.patch(`/mocks/jobs/${id}`, data)
            .toPromise()
            .then(response => response.json())
            .catch(this.handleError);
    }
    requeueJobs(params): Promise<any> {
        params.url = params.url ? params.url : '/mocks/queue/requeue-jobs';
        return this.http.post(params.url, params)
            .toPromise()
            .then(response => response.json())
            .catch(this.handleError);
    }

    private handleError(error: any): Promise<any> {
        console.error('An error occurred', error); // for demo purposes only
        return Promise.reject(error.message || error);
    }
}