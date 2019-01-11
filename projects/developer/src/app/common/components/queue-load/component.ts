import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import {UIChart} from 'primeng/chart';
import * as moment from 'moment';
import * as _ from 'lodash';

import { ColorService } from '../../services/color.service';
import { QueueApiService } from '../../services/queue/api.service';

@Component({
    selector: 'dev-queue-load',
    templateUrl: './component.html',
    styleUrls: ['./component.scss']
})
export class QueueLoadComponent implements OnInit, OnDestroy, OnChanges {
    @ViewChild('chart') chart: UIChart;
    @Input() started: string;
    @Input() ended: string;
    @Input() jobTypeIds: any;
    @Input() maintainAspectRatio: boolean;
    @Output() chartLoaded: EventEmitter<UIChart> = new EventEmitter<UIChart>();
    subscription: any;
    chartLoading = false;
    data: any;
    options = {
        scales: {
            xAxes: [{
                type: 'time',
                time: {
                    displayFormats: {
                        hour: 'DD MMM HHmm[Z]'
                    }
                },
                ticks: {
                    callback: (value, index, values) => {
                        if (!values[index]) {
                            return;
                        }
                        return moment.utc(values[index]['value']).format('DD MMM HHmm[Z]');
                    }
                }
            }],
            yAxes: [{
                stacked: true
            }]
        },
        plugins: {
            datalabels: false
        },
        maintainAspectRatio: this.maintainAspectRatio
    };
    constructor(
        private messageService: MessageService,
        private colorService: ColorService,
        private queueApiService: QueueApiService
    ) {
    }

    private unsubscribe() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    ngOnInit() {
    }

    ngOnChanges(changes: SimpleChanges) {
        this.chartLoading = true;
        this.unsubscribe();
        const params = {
            started: changes.started.currentValue,
            ended: changes.ended.currentValue,
            job_type_id: changes.jobTypeIds.currentValue
        };
        this.subscription = this.queueApiService.getLoad(params, true).subscribe(data => {
            this.chartLoading = false;
            this.data = {
                datasets: [{
                    label: 'Running',
                    backgroundColor: this.colorService.RUNNING,
                    borderColor: '#9dd3ff',
                    borderWidth: 2,
                    data: []
                }, {
                    label: 'Queued',
                    backgroundColor: this.colorService.QUEUED,
                    borderColor: '#9dd3ff',
                    borderWidth: 2,
                    data: []
                }, {
                    label: 'Pending',
                    backgroundColor: this.colorService.PENDING,
                    borderColor: '#9dd3ff',
                    borderWidth: 2,
                    data: []
                }]
            };
            _.forEach(this.data.datasets, dataset => {
                _.forEach(data.results, result => {
                    dataset.data.push({
                        x: moment.utc(result.time).toDate(),
                        y: dataset.label === 'Pending' ?
                            result.pending_count :
                            dataset.label === 'Queued' ?
                                result.queued_count :
                                result.running_count
                    });
                });
            });
            this.chartLoaded.emit(this.chart);
        }, err => {
            this.chartLoading = false;
            this.messageService.add({severity: 'error', summary: 'Error retrieving queue load', detail: err.statusText});
        });
    }

    ngOnDestroy() {
        this.unsubscribe();
    }
}
