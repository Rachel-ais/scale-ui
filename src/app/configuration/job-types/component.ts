import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { SelectItem, TreeNode } from 'primeng/primeng';
import * as _ from 'lodash';

import { JobTypesApiService } from './api.service';

@Component({
    selector: 'app-job-types',
    templateUrl: './component.html',
    styleUrls: ['./component.scss']
})

export class JobTypesComponent implements OnInit, OnDestroy {
    private routeParams: any;
    jobTypes: SelectItem[];
    selectedJobType: SelectItem;
    selectedJobTypeDetail: any;
    interfaceData: TreeNode[];
    chartData6h: any;
    total6h: number;
    failed6h: number;
    chartData12h: any;
    total12h: number;
    failed12h: number;
    chartData24h: any;
    total24h: number;
    failed24h: number;
    private readonly STATUS_VALUES = ['COMPLETED', 'BLOCKED', 'QUEUED', 'RUNNING', 'FAILED', 'CANCELED', 'PENDING'];
    private readonly CATEGORY_VALUES = ['SYSTEM', 'ALGORITHM', 'DATA'];

    constructor(
        private jobTypesApiService: JobTypesApiService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        if (this.router.events) {
            this.router.events.subscribe(currentRoute => {
                if (currentRoute instanceof NavigationEnd) {
                    this.jobTypes = [];
                    let id = null;
                    if (this.route && this.route.paramMap) {
                        this.routeParams = this.route.paramMap.subscribe(params => {
                            id = +params.get('id');
                        });
                    }
                    this.jobTypesApiService.getJobTypes().then(data => {
                        _.forEach(data.results, (result) => {
                            this.jobTypes.push({
                                label: result.title + ' ' + result.version,
                                value: result
                            });
                            if (id === result.id) {
                                this.selectedJobType = _.clone(result);
                            }
                        });
                        if (id) {
                            this.getJobTypeDetail(id);
                        }
                    });
                }
            });
        }
    }

    private setInterfaceData(data) {
        const dataArr = [];
        _.forEach(data, (d) => {
            dataArr.push({
                data: d
            });
        });
        return dataArr;
    }
    private getChartData(data: any): any[] {
        const returnData = [];
        const getCount = (status: string, category?: string) => {
            if (category) {
                return _.sum(_.map(_.filter(data, (jobCount) => {
                    return jobCount.status === status && jobCount.category === category;
                }), 'count'));
            }
            return _.sum(_.map(_.filter(data, (jobCount) => {
                return jobCount.status === status;
            }), 'count'));
        };

        _.forEach(this.STATUS_VALUES, status => {
            if (status === 'FAILED') {
                _.forEach(this.CATEGORY_VALUES, category => {
                    returnData.push({
                        label: category,
                        value: getCount(status, category)
                    });
                });
            } else {
                returnData.push({
                    label: status,
                    value: getCount(status)
                });
            }
        });
        return returnData;
    }
    private getChartTotals(data: any, type: string): number {
        if (type === 'total') {
            return _.sum(_.map(_.filter(data, jobCount => {
                return jobCount.status !== 'RUNNING';
            }), 'count'));
        }
        return _.sum(_.map(_.filter(data, jobCount => {
            return jobCount.status === 'FAILED';
        }), 'count'));
    }
    private getJobTypeDetail(id: number) {
        console.log('getJobTypeDetail');
        this.jobTypesApiService.getJobType(id).then(data => {
            this.interfaceData = [
                {
                    data: {
                        name: 'Input Data',
                        type: '',
                        media_types: ''
                    },
                    children: this.setInterfaceData(data.job_type_interface.input_data)
                },
                {
                    data: {
                        name: 'Output Data',
                        type: '',
                        media_type: ''
                    },
                    children: this.setInterfaceData(data.job_type_interface.output_data)
                }
            ];
            this.chartData6h = this.getChartData(data.job_counts_6h);
            this.total6h = this.getChartTotals(data.job_counts_6h, 'total');
            this.failed6h = this.getChartTotals(data.job_counts_6h, 'failed');
            this.chartData12h = this.getChartData(data.job_counts_12h);
            this.total12h = this.getChartTotals(data.job_counts_12h, 'total');
            this.failed12h = this.getChartTotals(data.job_counts_12h, 'failed');
            this.chartData24h = this.getChartData(data.job_counts_24h);
            this.total24h = this.getChartTotals(data.job_counts_24h, 'total');
            this.failed24h = this.getChartTotals(data.job_counts_24h, 'failed');
            this.selectedJobTypeDetail = data;
        });
    }

    getUnicode(code) {
        return `&#x${code};`;
    }
    onRowSelect(e) {
        this.router.navigate([`/configuration/job-types/${e.value.id}`]);
    }
    ngOnInit() {
    }
    ngOnDestroy() {
        if (this.routeParams) {
            this.routeParams.unsubscribe();
        }
    }
}
