import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LazyLoadEvent, SelectItem } from 'primeng/primeng';
import { MessageService } from 'primeng/components/common/messageservice';
import * as moment from 'moment';
import * as _ from 'lodash';

import { environment } from '../../../environments/environment';
import { DataService } from '../../common/services/data.service';
import { IngestApiService } from './api.service';
import { Ingest } from './api.model';
import { IngestDatatable } from './datatable.model';
import { IngestDatatableService } from './datatable.service';
import { StrikesApiService } from '../../system/strikes/api.service';

@Component({
    selector: 'dev-ingest',
    templateUrl: './component.html',
    styleUrls: ['./component.scss']
})
export class IngestComponent implements OnInit, OnDestroy {
    dateFormat: string = environment.dateFormat;
    ingests: any;
    selectedIngest: any;
    selectedRows: any;
    datatableOptions: IngestDatatable;
    datatableLoading: boolean;
    columns: any[];
    strikeValues: SelectItem[];
    selectedStrike: any = [];
    statusValues: SelectItem[];
    selectedStatus: any = [];
    count: number;
    started: string;
    ended: string;
    filename: string;
    isInitialized: boolean;
    subscription: any;
    applyBtnClass = 'ui-button-secondary';

    constructor(
        private dataService: DataService,
        private ingestDatatableService: IngestDatatableService,
        private ingestApiService: IngestApiService,
        private strikesApiService: StrikesApiService,
        private router: Router,
        private route: ActivatedRoute,
        private messageService: MessageService
    ) {
        this.isInitialized = false;
        this.selectedRows = this.dataService.getSelectedIngestRows();
        this.columns = [
            { field: 'file_name', header: 'File Name' },
            { field: 'file_size', header: 'File Size' },
            { field: 'strike.id', header: 'Strike Process' },
            { field: 'status', header: 'Status' },
            { field: 'transfer_started', header: 'Transfer Started (Z)' },
            { field: 'transfer_ended', header: 'Transfer Ended (Z)' },
            { field: 'ingest_started', header: 'Ingest Started (Z)' },
            { field: 'ingest_ended', header: 'Ingest Ended (Z)' }
        ];
        this.statusValues = [{
            label: 'Transfering',
            value: 'TRANSFERING'
        }, {
            label: 'Transferred',
            value: 'TRANSFERRED'
        }, {
            label: 'Queued',
            value: 'QUEUED'
        }, {
            label: 'Deferred',
            value: 'DEFERRED'
        }, {
            label: 'Ingesting',
            value: 'INGESTING'
        }, {
            label: 'Ingested',
            value: 'INGESTED'
        }, {
            label: 'Errored',
            value: 'ERRORED'
        }, {
            label: 'Duplicate',
            value: 'DUPLICATE'
        }];
    }

    private updateData() {
        this.datatableLoading = true;
        this.unsubscribe();
        this.subscription = this.ingestApiService.getIngests(this.datatableOptions, true).subscribe(data => {
            this.datatableLoading = false;
            this.count = data.count;
            _.forEach(data.results, result => {
                const ingest = _.find(this.selectedRows, { data: { id: result.id } });
                result.selected =  !!ingest;
            });
            this.ingests = Ingest.transformer(data.results);
        }, err => {
            this.datatableLoading = false;
            this.messageService.add({severity: 'error', summary: 'Error retrieving ingests', detail: err.statusText});
        });
    }
    private updateOptions() {
        this.datatableOptions = _.pickBy(this.datatableOptions, (d) => {
            return d !== null && typeof d !== 'undefined' && d !== '';
        });

        this.ingestDatatableService.setIngestDatatableOptions(this.datatableOptions);
        this.router.navigate(['/data/ingest'], {
            queryParams: this.datatableOptions,
            replaceUrl: true
        });

        this.updateData();
    }
    private getStrikes() {
        this.selectedStrike = [];
        this.strikesApiService.getStrikes().subscribe(data => {
            const selectItems = [];
            _.forEach(data.results, strike => {
                selectItems.push({
                    label: strike.title,
                    value: strike
                });
                if (_.indexOf(this.datatableOptions.strike_id, strike.id) >= 0) {
                    this.selectedStrike.push(strike);
                }
            });
            this.strikeValues = _.orderBy(selectItems, ['title'], ['asc']);
            this.updateOptions();
        }, err => {
            this.messageService.add({severity: 'error', summary: 'Error retrieving strikes', detail: err.statusText});
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
    onStrikeChange(e) {
        const strikeId = _.map(e.value, 'id');
        this.datatableOptions.strike_id = strikeId.length > 0 ? strikeId : null;
        this.updateOptions();
    }
    onStatusChange(e) {
        this.datatableOptions.status = e.value || null;
        this.updateOptions();
    }
    onRowSelect(e) {
        if (!_.find(this.selectedRows, { data: { id: e.data.id } })) {
            this.dataService.setSelectedIngestRows(e);
        }
        if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) {
            window.open(`/data/ingest/${e.data.id}`);
        } else {
            this.router.navigate([`/data/ingest/${e.data.id}`]);
        }
    }
    onStartSelect(e) {
        this.started = moment.utc(e, this.dateFormat).startOf('d').format(this.dateFormat);
        this.applyBtnClass = 'ui-button-primary';
    }
    onEndSelect(e) {
        this.ended = moment.utc(e, this.dateFormat).endOf('d').format(this.dateFormat);
        this.applyBtnClass = 'ui-button-primary';
    }
    onDateFilterApply() {
        this.datatableOptions = Object.assign(this.datatableOptions, {
            first: 0,
            started: moment.utc(this.started, this.dateFormat).toISOString(),
            ended: moment.utc(this.ended, this.dateFormat).toISOString()
        });
        this.applyBtnClass = 'ui-button-secondary';
        this.updateOptions();
    }
    setDateFilterRange(unit: any, range: any) {
        this.started = moment.utc().subtract(range, unit).toISOString();
        this.ended = moment.utc().toISOString();
        this.onDateFilterApply();
    }
    onFilterClick(e) {
        e.stopPropagation();
    }
    ngOnInit() {
        if (!this.datatableOptions) {
            this.datatableOptions = this.ingestDatatableService.getIngestDatatableOptions();
        }
        this.ingests = [];
        this.route.queryParams.subscribe(params => {
            if (Object.keys(params).length > 0) {
                this.datatableOptions = {
                    first: params.first ? parseInt(params.first, 10) : 0,
                    rows: params.rows ? parseInt(params.rows, 10) : 10,
                    sortField: params.sortField ? params.sortField : 'last_modified',
                    sortOrder: params.sortOrder ? parseInt(params.sortOrder, 10) : -1,
                    started: params.started ? params.started : moment.utc().subtract(1, 'd').startOf('d').toISOString(),
                    ended: params.ended ? params.ended : moment.utc().endOf('d').toISOString(),
                    status: params.status ?
                        Array.isArray(params.status) ?
                            params.status :
                            [params.status]
                        : null,
                    scan_id: params.scan_id ? +params.scan_id : null,
                    strike_id: params.strike_id ?
                        Array.isArray(params.strike_id) ?
                            params.strike_id.map(id => {
                                return +id;
                            }) :
                            [+params.strike_id]
                        : null,
                    file_name: params.file_name || null
                };
            }
            this.selectedStatus = [];
            _.forEach(this.statusValues, status => {
                if (_.indexOf(this.datatableOptions.status, status.value) >= 0) {
                    this.selectedStatus.push(status.value);
                }
            });
            this.started = moment.utc(this.datatableOptions.started).format(this.dateFormat);
            this.ended = moment.utc(this.datatableOptions.ended).format(this.dateFormat);
            this.getStrikes();
        });
    }
    ngOnDestroy() {
        this.unsubscribe();
    }
}
