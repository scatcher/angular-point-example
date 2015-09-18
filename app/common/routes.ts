/// <reference path="app.module.ts" />
module app {
    'use strict';

    function Routes($stateProvider: ng.ui.IStateProvider, $urlRouterProvider: ng.ui.IUrlRouterProvider, apConfig: IAPConfig) {

        // For any unmatched url, redirect to /state1
        $urlRouterProvider.otherwise('/');

        // Now set up the states
        $stateProvider
            //HOME
            .state('home', {
                url: '/',
                templateUrl: 'modules/main/mainView.html',
                controller: 'mainController',
                controllerAs: 'vm'
            })

            //COMP REQUESTS
            .state('comprequests', {
                url: '/comprequests',
                templateUrl: 'modules/compRequests/compRequestsView.html',
                controller: 'compRequestController',
                controllerAs: 'vm'
            })

            //LEAVE
            .state('leave', {
                url: '/leave',
                templateUrl: 'views/calendarRequestView.html',
                controller: 'leaveController',
                controllerAs: 'vm'
            })

            //MUSTER
            .state('muster', {
                url: '/muster',
                templateUrl: 'modules/muster/musterView.html',
                controller: 'musterController',
                controllerAs: 'vm'
            })
            
            //METRICS
            .state('metrics', {
                url: '/metrics',
                templateUrl: 'modules/metrics/metricsView.html',
                controller: 'metricsController',
                controllerAs: 'vm'
            })

            //TRAVEL
            .state('travel', {
                url: '/travel',
                templateUrl: 'views/calendarRequestView.html',
                controller: 'travelController',
                controllerAs: 'vm'
            })

            //ABOUT
            .state('about', {
                url: '/about',
                templateUrl: 'modules/about/aboutView.html',
                controller: 'aboutController',
                controllerAs: 'vm'
            })


            /** Development Support Routes **/

            //GROUP MANAGER
            .state('groupmanager', {
                url: '/group_manager',
                template: '<ap-group-manager></ap-group-manager>'
            })

            //OFFLINE
            .state('offline', {
                url: '/offline',
                template: `<ap-offline-generator site-url="${apConfig.defaultUrl}"></ap-offline-generator>`
            })

    }

    angular
        .module('angular-point-example')
        .config(Routes);

}