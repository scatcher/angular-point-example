/// <reference path="../../common/app.module.ts" />
module app.muster {
    'use strict';

    function MusterRowDirective() {
        return {
            bindToController: true,
            controller: MusterRowController,
            controllerAs: 'row',
            replace: true,
            scope: {
                musterSummary: "="
            },
            templateUrl: 'modules/muster/musterRowTemplate.html',
        };
    }

    class MusterRowController {
        musterSummary: MusterSummary;
        constructor() {
            var row = this;
        };
    }

    angular
        .module('angular-point-example')
        .directive('musterRow', MusterRowDirective);
}
