/// <reference path="../app.module.ts" />
module app {
    'use strict';

    function MyRequestsPanel() {
        return {
            bindToController: true,
            controller: MyRequestsPanelController,
            controllerAs: 'panel',
            scope: {
                color: '=',
                title: '='
            },
            templateUrl: 'common/directives/myRequestsPanel.html'
        }
    }

    class MyRequestsPanelController {
        color: string;
        icon: string;
        myRequestsTable: ngTable.INGTable;
        ready = false;
        //Either Leave or Travel
        requestModel: ICalendarRequestModel;
        template: string;
        title: string;
        userHasRequests = false;
        constructor(NgTableParams: ngTable.INGTableParams, $filter: ng.IFilterService, leaveModel: LeaveModel, travelModel: TravelModel, compRequestsModel: CompRequestsModel) {

            var panel = this;
            panel.color = panel.color || 'base-blue';
            
            switch (panel.title) { 
                case 'Comp Requests':
                    panel.template = 'modules/compRequests/myRequestsTemplate.html';
                    panel.requestModel = compRequestsModel;
                    panel.icon = compRequestsModel.icon;
                    break;
                case 'Leave':
                    panel.template = 'modules/leave/myRequestsTemplate.html';
                    panel.requestModel = leaveModel;
                    panel.icon = leaveModel.icon;
                    break;
                case 'Travel':
                    panel.template = 'modules/travel/myRequestsTemplate.html';
                    panel.requestModel = travelModel;
                    panel.icon = travelModel.icon;                    
                    break;    
                default:
                    throw new Error('Invalid title.  "Comp Requests", "Leave" or "Travel" must be specified.');
            }
            
            /** Initialize data */
            var getMyRequests = panel.requestModel.executeQuery('currentUser');

            /** NG-Table config for My Requests */
            panel.myRequestsTable = new NgTableParams({
                page: 1,            // show first page
                count: 5,           // count per page
                sorting: {
                    from: 'desc'
                }
            }, {
                    counts: [], // hide page counts control
                    total: 0, // length of data
                    getData: function(params) {
                        return getMyRequests.then(function(entities) {
                            /** Sort */
                            var orderedData = entities.toArray();

                            orderedData = params.sorting() ?
                                $filter('orderBy')(orderedData, params.orderBy()) :
                                orderedData;

                            /** Optional filter */
                            orderedData = params.filter() ?
                                $filter('filter')(orderedData, params.filter()) :
                                orderedData;

                            panel.ready = true;
                            params.total(orderedData.length);
                            panel.userHasRequests = orderedData.length > 0;
                            return orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
                        });
                    }
                });

            /** Refresh if either the current user or another user makes a change to the underlying data */
            panel.requestModel.sync.subscribeToChanges((event: ap.sync.ISyncServiceChangeEvent, externalEvent: boolean) => {
                if (externalEvent) {
                    console.log('Refresh Event Triggered By External User', event);
                } else {
                    console.log('Refresh Event Triggered By Current User', event);
                    panel.refreshView();
                }
            }, true);


        }
        /** Reference to the openModal function on model */
        openModal(request) {
            this.requestModel.openModal(request)
                .then(() => {
                    //User made changes
                    this.refreshView();
                });
        }
        /** Internally used method to reload data unlike method above which acts as a wrapper */
        refreshView() {
            this.requestModel.executeQuery('currentUser')
                .then((indexedCache) => this.myRequestsTable.reload() );
        }
    }

    angular
        .module('angular-point-example')
        .directive('myRequestsPanel', MyRequestsPanel);
}
