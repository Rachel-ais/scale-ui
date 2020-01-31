import { Component, EventEmitter, Input, OnDestroy, OnInit, AfterViewInit, Output } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { LazyLoadEvent, SelectItem } from 'primeng/primeng';
import { ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/components/common/messageservice';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import 'rxjs/add/observable/timer';
import * as moment from 'moment';
import * as _ from 'lodash';

import { environment } from '../../../environments/environment';
import { DataService } from '../../common/services/data.service';
import { JobsApiService } from './api.service';
import { Job } from './api.model';
import { JobsDatatable } from './datatable.model';
import { JobsDatatableService } from './datatable.service';
import { JobTypesApiService } from '../../configuration/job-types/api.service';
import { JobExecution } from './execution.model';


@Component({
    selector: 'dev-jobs',
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    providers: [ConfirmationService]
})

export class JobsComponent implements OnInit, OnDestroy {
    @Input() jobs: any;
    @Input() datatableOptions: JobsDatatable;
    @Output() datatableChange: EventEmitter<JobsDatatable> = new EventEmitter<JobsDatatable>();
    datatableLoading: boolean;
    apiLoading: boolean;
    columns = [
        { field: 'job_type', header: 'Job Type' },
        { field: 'recipe', header: 'Recipe' },
        { field: 'created', header: 'Created (Z)' },
        { field: 'last_modified', header: 'Last Modified (Z)' },
        { field: 'node.hostname', header: 'Node' },
        { field: 'duration', header: 'Duration', sortableColumnDisabled: true },
        { field: 'status', header: 'Status' },
        { field: 'error.category', header: 'Error Category' },
        { field: 'error.title', header: 'Error' },
        { field: 'id', header: 'Log', sortableColumnDisabled: true }
    ];
    dateFormat = environment.dateFormat;
    jobTypes: any;
    jobTypeOptions: SelectItem[];
    selectedJob: Job;
    selectedJobType: any = [];
    selectedJobExe: JobExecution;
    selectedRows: any;
    logDisplay: boolean;
    statusValues: SelectItem[] = [{
        label: 'Canceled',
        value: 'CANCELED'
    }, {
        label: 'Completed',
        value: 'COMPLETED'
    }, {
        label: 'Failed',
        value: 'FAILED'
    }, {
        label: 'Pending',
        value: 'PENDING'
    }, {
        label: 'Queued',
        value: 'QUEUED'
    }, {
        label: 'Running',
        value: 'RUNNING'
    }];
    selectedStatus: any = [];
    errorCategoryValues: SelectItem[] = [{
        label: 'System',
        value: 'SYSTEM'
    }, {
        label: 'Algorithm',
        value: 'ALGORITHM'
    }, {
        label: 'Data',
        value: 'DATA'
    }];
    selectedErrorCategory: any = [];
    count: number;
    started: string;
    ended: string;
    isInitialized = false;
    subscription: any;
    isMobile: boolean;
    liveRange: number;

    constructor(
        private dataService: DataService,
        private jobsDatatableService: JobsDatatableService,
        private jobsApiService: JobsApiService,
        private jobTypesApiService: JobTypesApiService,
        private router: Router,
        private route: ActivatedRoute,
        private confirmationService: ConfirmationService,
        public breakpointObserver: BreakpointObserver,
        private messageService: MessageService
    ) {}

    private updateData() {
        this.unsubscribe();

        // don't show loading state when in live mode
        if (!this.liveRange) {
            this.datatableLoading = true;
        }

        this.apiLoading = true;
        this.subscription = this.jobsApiService.getJobs(this.datatableOptions, true).subscribe(data => {
            this.datatableLoading = false;
            this.apiLoading = false;
            this.count = data.count;
            _.forEach(data.results, result => {
                const job = _.find(this.selectedRows, { data: { id: result.id } });
                result.selected =  !!job;
            });
            this.jobs = Job.transformer(data.results);
        }, err => {
            this.datatableLoading = false;
            this.apiLoading = false;
            this.messageService.add({severity: 'error', summary: 'Error retrieving jobs', detail: err.statusText});
        });
    }
    private updateOptions() {
        this.datatableOptions = _.pickBy(this.datatableOptions, (d) => {
            return d !== null && typeof d !== 'undefined' && d !== '';
        });

        this.jobsDatatableService.setJobsDatatableOptions(this.datatableOptions);

        // update router params
        const params = this.datatableOptions as Params;
        if (params.liveRange) {
            // if live range was set on the table options, remove started/ended
            delete params.started;
            delete params.ended;
        } else {
            // live range not provided, default back to started/ended set on table options
            params.started = params.started || this.started;
            params.ended = params.ended || this.ended;
        }

        this.router.navigate(['/processing/jobs'], {
            queryParams: params,
            replaceUrl: true
        });
    }
    private getJobTypes() {
        this.selectedJobType = [];
        this.jobTypesApiService.getJobTypes().subscribe(data => {
            this.jobTypes = data.results;
            const selectItems = [];
            _.forEach(this.jobTypes, jobType => {
                selectItems.push({
                    label: jobType.title + ' ' + jobType.version,
                    value: jobType
                });
                if (
                    (_.indexOf(this.datatableOptions.job_type_name, jobType.name) >= 0 &&
                    _.indexOf(this.datatableOptions.job_type_version, jobType.version) >= 0) &&
                    !(_.find(this.selectedJobType, jobType))
                ) {
                    this.selectedJobType.push(jobType);
                }
            });
            this.jobTypeOptions = _.orderBy(selectItems, 'label', 'asc');
            this.selectedJobType = _.orderBy(this.selectedJobType, ['name', 'version'], ['asc', 'asc']);
            this.updateData();
        }, err => {
            this.messageService.add({severity: 'error', summary: 'Error retrieving job types', detail: err.statusText});
        });
    }

    getUnicode(code) {
        return `&#x${code};`;
    }
    unsubscribe() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
    paginate(e) {
        this.datatableOptions = Object.assign(this.datatableOptions, {
            first: e.first,
            rows: parseInt(e.rows, 10)
        });
        this.updateOptions();
    }
    onLazyLoad(e: LazyLoadEvent) {
        // let ngOnInit handle loading data to ensure query params are respected
        if (this.isInitialized) {
            if (e.sortField !== this.datatableOptions.sortField || e.sortOrder !== this.datatableOptions.sortOrder) {
                this.datatableOptions = Object.assign(this.datatableOptions, {
                    first: 0,
                    sortField: e.sortField,
                    sortOrder: e.sortOrder
                });
            }
            this.updateOptions();
        } else {
            // data was just loaded by ngOnInit, so set flag to true
            this.isInitialized = true;
        }
    }
    onJobTypeChange(e) {
        const name = _.map(e.value, 'name');
        const version = _.map(e.value, 'version');
        this.datatableOptions.job_type_name = name.length > 0 ? name : null;
        this.datatableOptions.job_type_version = version.length > 0 ? version : null;
        this.datatableOptions = Object.assign(this.datatableOptions, {
            first: 0
        });
        this.updateOptions();
    }
    onStatusChange(e) {
        this.datatableOptions.status = e.value.length > 0 ? e.value : null;
        this.datatableOptions = Object.assign(this.datatableOptions, {
            first: 0
        });
        this.updateOptions();
    }
    onErrorCategoryChange(e) {
        this.datatableOptions.error_category = e.value.length > 0 ? e.value : null;
        this.datatableOptions = Object.assign(this.datatableOptions, {
            first: 0
        });
        this.updateOptions();
    }
    onRowSelect(e) {
        if (!_.find(this.selectedRows, { data: { id: e.data.id } })) {
            this.dataService.setSelectedJobRows(e);
        }
        if (e.originalEvent.ctrlKey || e.originalEvent.metaKey || e.originalEvent.which === 2) {
            window.open(`/processing/jobs/${e.data.id}`);
        } else {
            this.router.navigate([`/processing/jobs/${e.data.id}`]);
        }
    }

    /**
     * Callback for temporal filter updating the start/end range filter.
     * @param data start and end strings of iso formatted datetimes
     */
    onDateFilterSelected(data: {start: string, end: string}): void {
        // keep local model in sync
        this.started = data.start;
        this.ended = data.end;
        // patch in the values to the datatable
        this.datatableOptions = Object.assign(this.datatableOptions, {
            started: data.start,
            ended: data.end
        });
        // update router
        this.updateOptions();
    }

    /**
     * Callback for temporal filter updating the live range selection.
     * @param data hours that should be used, or null to clear
     */
    onLiveRangeSelected(data: {hours: number}): void {
        // keep model in sync
        this.liveRange = data.hours;
        // patch in the values for datatable
        this.datatableOptions = Object.assign(this.datatableOptions, {
            liveRange: data.hours
        });
        // update router
        this.updateOptions();
    }

    /**
     * Callback for when temporal filter tells this component to update visible date range. This is
     * the signal that either a date range or a live range is being triggered.
     * @param data start and end iso strings for what dates should be filtered
     */
    onTemporalFilterUpdate(data: {start: string, end: string}): void {
        // update the datatable options then call the api
        this.datatableOptions = Object.assign(this.datatableOptions, {
                first: 0,
                started: data.start,
                ended: data.end
            });
        this.updateData();
    }

    requeueJobs(jobsParams?) {
        this.messageService.add({severity: 'success', summary: 'Job requeue has been requested'});
        let errorCategories = null;
        if (this.datatableOptions.error_category) {
            if (Array.isArray(this.datatableOptions.error_category)) {
                errorCategories = this.datatableOptions.error_category;
            } else {
                errorCategories = [this.datatableOptions.error_category];
            }
        }
        let jobTypeNames = null;
        if (this.datatableOptions.job_type_name) {
            if (Array.isArray(this.datatableOptions.job_type_name)) {
                jobTypeNames = this.datatableOptions.job_type_name;
            } else {
                jobTypeNames = [this.datatableOptions.job_type_name];
            }
        }
        let status = null;
        if (this.datatableOptions.status) {
            if (Array.isArray(this.datatableOptions.status)) {
                _.forEach(this.datatableOptions.status, s => {
                    if (s === 'FAILED' || s === 'CANCELED') {
                        status = s;
                    }
                });
            } else {
                status = this.datatableOptions.status;
            }
        }
        if (!jobsParams) {
            jobsParams = {
                started: this.datatableOptions.started,
                ended: this.datatableOptions.ended,
                error_categories: errorCategories,
                status: status,
                job_type_names: jobTypeNames
            };
            // remove null properties
            jobsParams = _.pickBy(jobsParams, d => {
                return d !== null && typeof d !== 'undefined' && d !== '';
            });
        }
        this.jobsApiService.requeueJobs(jobsParams)
            .subscribe(() => {
                this.updateData();
            }, err => {
                this.messageService.add({severity: 'error', summary: 'Error requeuing jobs', detail: err.statusText});
            });
    }
    cancelJobs(jobsParams?) {
        this.messageService.add({severity: 'success', summary: 'Job cancellation has been requested'});
        if (!jobsParams) {
            jobsParams = {
                started: this.datatableOptions.started,
                ended: this.datatableOptions.ended,
                error_categories: this.datatableOptions.error_category ? [this.datatableOptions.error_category] : null,
                status: this.datatableOptions.status === 'RUNNING' || this.datatableOptions.status === 'QUEUED' ?
                    this.datatableOptions.status :
                    null,
                job_type_names: this.datatableOptions.job_type_name ? [this.datatableOptions.job_type_name] : null
            };
            // remove null properties
            jobsParams = _.pickBy(jobsParams);
        }
        this.jobsApiService.cancelJobs(jobsParams)
            .subscribe(() => {
                this.updateData();
            }, err => {
                this.messageService.add({severity: 'error', summary: 'Error canceling jobs', detail: err.statusText});
            });
    }
    showExeLog(id) {
        this.jobsApiService.getJob(id)
            .subscribe(data => {
                this.selectedJobExe = data.execution;
                this.logDisplay = true;
            }, err => {
                this.messageService.add({severity: 'error', summary: 'Error retrieving job details', detail: err.statusText});
            });
    }
    hideExeLog() {
        this.selectedJobExe = null;
    }
    onFilterClick(e) {
        e.stopPropagation();
    }
    requeueAllConfirm() {
        // query for canceled and failed jobs with current params to report an accurate requeue count
        const requeueParams = _.clone(this.datatableOptions);
        requeueParams.status = ['CANCELED', 'FAILED'];
        this.jobsApiService.getJobs(requeueParams)
            .subscribe(data => {
                this.confirmationService.confirm({
                    key: 'jobsConfirm',
                    message: `This will requeue <span class="label label-danger"><strong>${data.count}</strong></span> canceled and failed
                              jobs. Are you sure that you want to proceed?`,
                    header: 'Requeue All Jobs',
                    accept: () => {
                        this.requeueJobs();
                    },
                    reject: () => {
                        console.log('requeue rejected');
                    }
                });
            }, err => {
                this.messageService.add({severity: 'error', summary: 'Error retrieving jobs', detail: err.statusText});
            });
    }
    cancelAllConfirm() {
        // query for running and queued jobs with current params to report an accurate cancel count
        const cancelParams = _.clone(this.datatableOptions);
        cancelParams.status = ['RUNNING', 'QUEUED'];
        this.jobsApiService.getJobs(cancelParams)
            .subscribe(data => {
                this.confirmationService.confirm({
                    key: 'jobsConfirm',
                    message: `This will cancel <span class="label label-danger"><strong>${data.count}</strong></span> running and queued
                              jobs. Are you sure that you want to proceed?`,
                    header: 'Cancel All Jobs',
                    accept: () => {
                        this.cancelJobs();
                    },
                    reject: () => {
                        console.log('cancel rejected');
                    }
                });
            }, err => {
                this.messageService.add({severity: 'error', summary: 'Error retrieving jobs', detail: err.statusText});
            });
    }
    onSelectedJobTypeClick(jobType) {
        _.remove(this.selectedJobType, jobType);
        this.onJobTypeChange({ value: this.selectedJobType });
    }
    ngOnInit() {
        this.selectedRows = this.dataService.getSelectedJobRows();

        this.breakpointObserver.observe(['(min-width: 1275px)']).subscribe((state: BreakpointState) => {
            this.isMobile = !state.matches;
        });

        if (!this.datatableOptions) {
            this.datatableOptions = this.jobsDatatableService.getJobsDatatableOptions();
            // let temporal filter set the start/end
            this.datatableOptions.started = null;
            this.datatableOptions.ended = null;
        }
        this.jobs = [];
        this.route.queryParams.subscribe(params => {
            if (Object.keys(params).length > 0) {
                this.datatableOptions = {
                    first: params.first ? parseInt(params.first, 10) : 0,
                    rows: params.rows ? parseInt(params.rows, 10) : 10,
                    sortField: params.sortField ? params.sortField : 'last_modified',
                    sortOrder: params.sortOrder ? parseInt(params.sortOrder, 10) : -1,
                    started: params.started || this.datatableOptions.started,
                    ended: params.ended || this.datatableOptions.ended,
                    liveRange: params.liveRange ? parseInt(params.liveRange, 10) : null,
                    status: params.status ?
                        Array.isArray(params.status) ?
                            params.status :
                            [params.status]
                        : null,
                    job_id: params.job_id ? parseInt(params.job_id, 10) : null,
                    job_type_name: params.job_type_name ?
                        Array.isArray(params.job_type_name) ?
                            params.job_type_name :
                            [params.job_type_name]
                        : null,
                    job_type_version: params.job_type_version ?
                        Array.isArray(params.job_type_version) ?
                            params.job_type_version :
                            [params.job_type_version]
                        : null,
                    job_type_category: params.job_type_category || null,
                    batch_id: params.batch_id ? parseInt(params.batch_id, 10) : null,
                    error_category: params.error_category ?
                        Array.isArray(params.error_category) ?
                            params.error_category :
                            [params.error_category]
                        : null,
                    include_superseded: params.include_superseded || null
                };
            }
            this.selectedStatus = this.datatableOptions.status ?
                Array.isArray(this.datatableOptions.status) ?
                    this.datatableOptions.status :
                    [this.datatableOptions.status]
                : null;
            this.selectedErrorCategory = this.datatableOptions.error_category ?
                Array.isArray(this.datatableOptions.error_category) ?
                    this.datatableOptions.error_category :
                    [this.datatableOptions.error_category]
                : null;
            this.started = this.datatableOptions.started;
            this.ended = this.datatableOptions.ended;
            this.liveRange = this.datatableOptions.liveRange;

            this.getJobTypes();
        });
    }

    ngOnDestroy() {
        this.unsubscribe();
    }
}
