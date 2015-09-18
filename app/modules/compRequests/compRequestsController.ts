/// <reference path="../../common/app.module.ts" />
///<reference path="../../../bower_components/angular-point/src/factories/apModelFactory.ts"/>
module app {
    'use strict';

    interface IPanel {
        className: string;
        data: CompRequest[];
        emptyMessage: string;
        icon: string;
        queryName: string;
        ready: boolean;
        requestCount: number;
        table: ngTable.INGTable;
        title: string;
    }

    class CompRequestController {

        havePendingRequests = false;
        haveRecentRequests = false;
        panels: {[key:string]: IPanel} = {
            myRequests: {
                className: 'panel-base-blue',
                data: [],
                emptyMessage: 'You have no requests in the system.',
                icon: 'fa-user',
                queryName: 'currentUser',
                ready: false,
                requestCount: 0,
                table: undefined,
                title: 'My Comp Requests'
            },
            pendingRequests: {
                className: 'panel-base-red-light',
                data: [],
                emptyMessage: 'All requests have been addressed.',
                icon: 'fa-clock-o',
                queryName: 'pending',
                ready: false,
                requestCount: 0,
                table: undefined,
                title: 'Pending Comp Requests'
            },
            recentRequests: {
                className: 'panel-base-purple',
                data: [],
                emptyMessage: 'There aren\'t any recent requests to display.',
                icon: 'fa-check-square-o',
                queryName: 'recent',
                ready: false,
                requestCount: 0,
                table: undefined,
                title: 'Recent Comp Requests'
            }
        };

        userHasRequests = false;

        constructor(NgTableParams: ngTable.INGTableParams, private compRequestsModel: CompRequestsModel,
                    private personnelModel: PersonnelModel, $filter: ng.IFilterService) {
            var vm = this;

            _.each(vm.panels, (panel) => {

                panel.table = new NgTableParams({
                    page: 1,            // show first page
                    total: 1,  // value less than count hide pagination
                    count: 5           // count per page
                    // sorting: {
                    //     endDate: 'desc'
                    // }
                }, {
                    counts: [], // hide page counts control
                    getData: (params): void => {
                        // use build-in angular filter
                        var orderedData = params.sorting() ?
                            $filter('orderBy')(panel.data, params.orderBy()) :
                            panel.data;

                        params.total(orderedData.length); // set total for recalc pagination
                        return orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
                    }
                });
            }); 


            /** Fetch data to initially populate tables */
            vm.reloadData();

        }

        getUser(request: CompRequest) {
            var user = this.personnelModel.findBySiteId(request.requestedFor.lookupId);
            return user ? user.getFullName(true) : request.requestedFor.lookupValue;
        }

        openModalForm(request: CompRequest) {
            this.compRequestsModel.openModal(request).then(() => {
                //Saved or Deleted
                this.reloadData();
            }, function () {
                //Cancel
            });
        }

        /** Function responsible for pulling data for each table and notifying the table to refresh */
        reloadData() {
            var vm = this;
            _.each(vm.panels, (panel: IPanel) => {
                vm.compRequestsModel.executeQuery<CompRequest>(panel.queryName)
                    .then((entities: ap.IndexedCache<CompRequest>) => {
                        panel.data = _.sortBy(entities.toArray(), '!endDate');
                        panel.ready = true;
                        panel.requestCount = panel.data.length;
                        panel.table.reload();
                    });
            });
        };
    }


    angular.module('angular-point-example')
        .controller('compRequestController', CompRequestController);
}
