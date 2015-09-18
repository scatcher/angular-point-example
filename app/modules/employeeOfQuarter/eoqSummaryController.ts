/// <reference path="../../common/app.module.ts" />
module app.eoq {
    'use strict';

    class SummaryController {
        accordionTemplate = 'modules/employeeOfQuarter/eoqAccordionInformationTemplate.html';
        firstAccordionOpen = true;
        constructor() {
            var vm = this;

        }
    }

    angular.module('angular-point-example')
        .controller('eoqSummaryController', SummaryController);
}
