/// <reference path="../../common/app.module.ts" />
module app {
    'use strict';

    interface INavLocation {
        label:string;
        icon:string;
        type:string;
    }

    interface IOutsideLocation {
        label:string;
        url:string;
    }

    class NavbarController {
        activeNav: INavLocation;
        isActive = (location) => this.$location.$$path === location;
        isAdmin = false;
        navByType = (navType) => _.where(this.navLocations, {type: navType});
        openFavorites: Function;
        provideFeedback: Function;

        constructor($rootScope: ng.IRootScopeService, private $location: ng.ILocationService, userPreferencesModel: UserPreferencesModel,
            userFeedbackModel: UserFeedbackModel, apUserModel: ap.IUserModel, musterModel: MusterModel) {
        // constructor($rootScope, private $location, userPreferencesModel, userFeedbackModel, apUserModel, musterModel) {
            var vm = this;
            locateActiveNav();

            apUserModel.checkIfMember('Group Managers')
                .then((response) => vm.isAdmin = response);

            $rootScope.$on('$stateChangeSuccess', (event, toState, toParams, fromState, fromParams) => locateActiveNav());

            vm.provideFeedback = userFeedbackModel.openModal;
            vm.openFavorites = userPreferencesModel.openModal;

            /** Quick check to see if current user has completed muster, faster than waiting for all other queries to finish loading */
            musterModel.executeQuery<Muster>('hasCurrentUserMustered').then((results) => {
                if (results.count() === 0) {
                    /** No muster record found so open dialog */
                    musterModel.openAutoMusterModal();
                }
            });

            function locateActiveNav() {
                vm.activeNav = undefined;
                _.each(vm.navLocations, (nav) => {
                    var rootState = nav.state.split('.')[0];
                    if ($location.$$path.indexOf(rootState) > -1) {
                        vm.activeNav = nav;
                    }
                });
            }
        }

        navLocations = [
            {label: 'Comp Requests', state: 'comprequests', icon: 'fa-briefcase', type: 'primary'},
            {label: 'Employee Of Quarter', state: 'eoq.summary', icon: 'fa-trophy', type: 'primary'},
            {label: 'Leave', state: 'leave', icon: 'fa-suitcase', type: 'primary'},
            {label: 'Metrics', state: 'metrics', icon: 'fa-line-chart', type: 'primary'},
            {label: 'Muster', state: 'muster', icon: 'fa-globe', type: 'primary'},
            {label: 'Travel', state: 'travel', icon: 'fa-plane', type: 'primary'},
            {label: 'Group Manager', state: 'groupmanager', icon: 'fa-group', type: 'debug'},
            {label: 'Offline XML', state: 'offline', icon: 'fa-download', type: 'debug'},
            {label: 'About', state: 'about', icon: 'fa-info', type: 'support'}
        ];

        outsideLinks = [
            {label: 'Home / Blog', url: '/site/blog.aspx'},
            {label: 'Check Mark', url: '/site/TrainingCheck.aspx'},
            {label: 'New Business', url: '/nb/SitePages/default.aspx'}
        ]
    }

    angular.module('angular-point-example')
        .controller('navbarController', NavbarController);

}
