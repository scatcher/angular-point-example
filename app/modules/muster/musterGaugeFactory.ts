/// <reference path="../../common/app.module.ts" />
module app.muster {
    'use strict';

    var $timeout: ng.ITimeoutService;


    /** Constructor to provide the default template for a gauge object */
    export class MusterGauge {
        type = 'Gauge';
        displayed = true;
        data = {
            cols: [
                { id: 'label', type: 'string' },
                { id: 'value', type: 'number' }
            ],
            rows: [
                { c: [{ v: '', f: '0%' }, { v: 0, f: '0%' }] }
            ]
        };
        options = {
            animation: {
                duration: 1000,
                easing: 'inAndOut'
            },
            max: 100,
            fontName: '"Arial"',
            fontSize: 10,
            majorTicks: [0, 20, 40, 60, 80, 100]
        };
        constructor(label) {
            this.data.rows[0].c[0].v = label;
        }
        updateGaugeValue(percent) {
            if(_.isNaN(percent)) {
                percent = 0;
            }
            var numericValue = parseInt(percent * 1000) / 10;
            
            /** Pause prior to triggering animation */
            $timeout( () => {
                this.data.rows[0].c[1].v = numericValue;
                this.data.rows[0].c[1].f = numericValue + '%';
            }, 1000);
        }
    }

    export class MusterGaugeFactory{
        MusterGauge = MusterGauge;
        constructor($injector) {
            $timeout = $injector.get('$timeout');
        }
    }

    angular.module('angular-point-example')
        .service('musterGaugeFactory', MusterGaugeFactory);

}