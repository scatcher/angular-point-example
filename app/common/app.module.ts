/// <reference path="../../typings/tsd.d.ts"/>
/// <reference path="../../typings/app.d.ts"/>


module app {
    'use strict';

    var modules = [
        'ngSanitize', 'ngAnimate', 'ngTouch', 'ui.router', 'ui.bootstrap', 'ui.calendar', 'ui.date',
        'ui.select', 'ui.grid', 'ui.grid.autoResize', 'ui.grid.cellNav', 'ui.grid.edit',
        'ui.grid.expandable', 'ui.grid.exporter', 'ui.grid.pinning', 'ui.grid.resizeColumns', 'ui.grid.selection',
        'ngTable', 'firebase', 'angular-loading-bar', 'toastr', 'googlechart', 'ngMessages', 'dndLists',
        'monospaced.elastic', 'formly', 'formlyBootstrap', 'angularPoint', 'apSync', 'apLookupCache', 'apModal'
    ];

    var offline = false;

    if (window.location.href.indexOf('localhost') > -1 ||
        window.location.href.indexOf('http://0.') > -1 ||
        window.location.href.indexOf('http://10.') > -1 ||
        window.location.href.indexOf('http://127.') > -1 ||
        window.location.href.indexOf('http://192.') > -1) {

        offline = true;
        /** Add in mock library if working offline to prevent us from making outside requests */
        modules.push('ngMockE2E');
    } else {
        /** Reference the module used by template cache */
        modules.push('templateCache');
    }

    angular.module('angular-point-example', modules);

    if (offline) {

        angular.module('angular-point-example')
        /** Set a default user in offline */
            .constant('mockUser', {
            lookupId: 441,
            lookupValue: "Joe User"
        })
        /** Allow requests for specific file types to be allowed through */
            .run(function($httpBackend) {

            // Don't mock the html views
            $httpBackend.whenGET(/\.html$/).passThrough();

            $httpBackend.whenGET(/\.xml$/).passThrough();

        });

    }

}
