/// <reference path="../../common/app.module.ts" />
module app {
    'use strict';
    var vm: AboutController;
    class AboutController {
        buildDate: Date;
        buildNumber: string;
        constructor(apConfig: IAPConfig) {
            var vm = this;
            vm.buildDate = apConfig.buildDate;
            vm.buildNumber = apConfig.buildNumber;
        }
    }

    angular.module('angular-point-example')
        .controller('aboutController', AboutController);
}
