/// <reference path="..//app.module.ts" />
module app {
    'use strict';

    angular
        .module('angular-point-example')
    /** Reference globally available moment library (3rd party) */
        .constant('moment', moment);

}
