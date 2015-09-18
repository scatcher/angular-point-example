/// <reference path="../../common/app.module.ts" />
module app.muster {
    'use strict';

    function MusterMetricsDirective() {
        return {
            bindToController: true,
            controller: MusterMetricsController,
            controllerAs: 'metrics',
            replace: true,
            scope: {
                gaugeLabel: "@",
                musterSummaryArray: "="
            },
            templateUrl: 'modules/muster/musterMetricsTemplate.html',
        };
    }

    class MusterMetricsController {
		accountedFor = 0;
        gauge: MusterGauge;
        gaugeLabel: string;
		onLeave = 0;
		onTravel = 0;
		present = 0;
		totalPersonnel = 0;
        musterSummaryArray: MusterSummary[];
        constructor($scope: ng.IScope, musterGaugeFactory: MusterGaugeFactory) {
            var metrics = this;
            metrics.gauge = new musterGaugeFactory.MusterGauge(metrics.gaugeLabel);
            metrics.summarizeMusterSummaryArray();
            $scope.$watch('metrics.musterSummaryArray', (newVal, oldVal) => {
                if(newVal && newVal !== oldVal) {
                    metrics.summarizeMusterSummaryArray();
                }
            });
        }
        summarizeMusterSummaryArray() {
            this.resetMetrics();
            //Only proceed if a valid array of muster summary objects is passed in
            if (_.isArray(this.musterSummaryArray)) {
                this.totalPersonnel = this.musterSummaryArray.length;
                _.each(this.musterSummaryArray, (musterSummary: MusterSummary) => {
                    if (musterSummary.accountedFor) this.accountedFor++;
                    if (musterSummary.onLeave) this.onLeave++;
                    if (musterSummary.onTravel) this.onTravel++;
                    if (musterSummary.muster) this.present++;
                });
                let percentageAccountedFor = this.accountedFor / this.totalPersonnel;
                this.gauge.updateGaugeValue(_.isNaN(percentageAccountedFor) ? 0 : percentageAccountedFor);
            }

        }
        
        resetMetrics() {
            this.accountedFor = 0;
            this.onLeave = 0;
            this.onTravel = 0;
            this.present = 0;
            this.totalPersonnel = 0;
        }
    }

    angular
        .module('angular-point-example')
        .directive('musterMetrics', MusterMetricsDirective);
}
