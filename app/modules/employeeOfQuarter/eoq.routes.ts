/// <reference path="../../common/app.module.ts" />
module app.eoq {
    'use strict';

    export interface IPrevousState {
        name: string;
        params: string;
        url: string;
    }

    class rmRoutes {
        constructor($stateProvider: ng.ui.IStateProvider, $urlRouterProvider: ng.ui.IUrlRouterProvider) {

            // Now set up the states
            $stateProvider
                .state('eoq', {
                    url: '/eoq',
                    template: '<ui-view></ui-view>',
                    resolve: {
                        previousState: ($state: ng.ui.IStateService) => {
                            //Navigate to App home if user navigated directly here
                            let currentState = $state.current.name || 'home'
                            let previousState = {
                                name: currentState,
                                params: $state.params,
                                url: $state.href(currentState, $state.params)
                            };
                            return previousState;
                        }
                    }
                })
                .state('eoq.summary', {
                    url: '/summary',
                    templateUrl: 'modules/employeeOfQuarter/eoqSummaryView.html',
                    controller: 'eoqSummaryController',
                    controllerAs: 'vm'
                })
                .state('eoq.new', {
                    url: '/new',
                    templateUrl: 'modules/employeeOfQuarter/eoqDetailsView.html',
                    controller: 'eoqDetailsController',
                    controllerAs: 'vm',
                    resolve: {
                        eoq: (employeeOfQuarterModel: EmployeeOfQuarterModel) => {
                            return employeeOfQuarterModel.createEmptyItem<EmployeeOfQuarterNomination>({
                                fy: undefined,
                                qtr: undefined
                            });
                        }
                    }
                })
                .state('eoq.edit', {
                    url: '/edit?id',
                    templateUrl: 'modules/employeeOfQuarter/eoqDetailsView.html',
                    controller: 'eoqDetailsController',
                    controllerAs: 'vm',
                    resolve: {
                        eoq: function($q, $stateParams, employeeOfQuarterModel: EmployeeOfQuarterModel, toastr) {
                            var deferred = $q.defer();
                            var eocId = parseInt($stateParams.id);
                            var cachedEntity = employeeOfQuarterModel.getCachedEntity(eocId);
                            if (cachedEntity) {
                                deferred.resolve(cachedEntity);
                            } else {
                                employeeOfQuarterModel.getListItemById<EmployeeOfQuarterNomination>(eocId)
                                    .then(function(requestedEntity) {
                                        if (!requestedEntity) {
                                            toastr.error('The Requested Employee of the Quarter submission either never existed or ' +
                                                'was deleted.  Please alert one of the division staff if this is a ' +
                                                'problem, this event has been logged and our team of nerds are hard at work debugging...');
                                            throw new Error('User tried to lookup a employee of the quarter summision record that doesn\'t exist = ' + eocId);
                                        }
                                        deferred.resolve(requestedEntity);
                                    });
                            }
                            return deferred.promise;
                        }
                    }
                });
        }
    }

    angular
        .module('angular-point-example')
        .config(rmRoutes);

}
