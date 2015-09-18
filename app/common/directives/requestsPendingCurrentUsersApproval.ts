/// <reference path="../app.module.ts" />
module app {
    'use strict';

    function RequestsPendingCurrentUsersApprovalPanel() {
        return {
            bindToController: true,
            controller: RequestsPendingCurrentUsersApprovalPanelController,
            controllerAs: 'panel',
            scope: {
                color: '=',
                title: '='
            },
            templateUrl: 'common/directives/requestsPendingCurrentUsersApproval.html'
        }
    }

    class RequestsPendingCurrentUsersApprovalPanelController {
        color: string;
        icon: string;
        pendingRequests = false;
        //Either Leave or Travel
        requestModel: ICalendarRequestModel;
        requestsPendingCurrentUsersApproval: ap.ListItem<any>[];
        template: string;
        title: string;
        userHasRequests = false;
        constructor(NgTableParams: ngTable.INGTableParams, $filter: ng.IFilterService, private toastr, leaveModel: LeaveModel, travelModel: TravelModel, compRequestsModel: CompRequestsModel) {

            var panel = this;
            panel.color = panel.color || 'base-blue';

            switch (panel.title) {
                case 'Comp Requests':
                    panel.template = 'modules/compRequests/requestsPendingCurrentUsersApprovalTemplate.html';
                    panel.requestModel = compRequestsModel;
                    panel.icon = compRequestsModel.icon;
                    break;
                case 'Leave':
                    panel.template = 'modules/leave/requestsPendingCurrentUsersApprovalTemplate.html';
                    panel.requestModel = leaveModel;
                    panel.icon = leaveModel.icon;
                    break;
                case 'Travel':
                    panel.template = 'modules/travel/requestsPendingCurrentUsersApprovalTemplate.html';
                    panel.requestModel = travelModel;
                    panel.icon = travelModel.icon;
                    break;
                default:
                    throw new Error('Invalid title.  Either "Comp Requests", "Leave" or "Travel" must be specified.');
            }

            /** Refresh if either the current user or another user makes a change to the underlying data */
            panel.requestModel.sync.subscribeToChanges((event: ap.sync.ISyncServiceChangeEvent, externalEvent: boolean) => {
                if (externalEvent) {
                    //Refresh Event Triggered By External User

                } else {
                    //Refresh Event Triggered By Current User
                    panel.refreshView();
                }
            }, true);

            //Pull initial data            
            panel.refreshView();
        }
        /** Reference to the openModal function on model */
        openModal(request) {
            this.requestModel.openModal(request)
                .then(() => {
                    //User made changes
                    this.refreshView();
                });
        }
        quickApprove(entity) {
            this.toastr.info('Communicating with the server.');
            entity.approve()
                .then(() => {
                    this.toastr.success('Request successfully approved.');
                    this.refreshView();
                });
        }
        /** Internally used method to reload data unlike method above which acts as a wrapper */
        refreshView() {
            this.requestModel.executeQuery('pendingMyApproval')
                .then((indexedCache) => {
                    this.requestsPendingCurrentUsersApproval = indexedCache.toArray();
                    this.pendingRequests = this.requestsPendingCurrentUsersApproval.length > 0;
                });
        }
    }

    angular
        .module('angular-point-example')
        .directive('requestsPendingCurrentUsersApproval', RequestsPendingCurrentUsersApprovalPanel);
}
