/// <reference path="../app.module.ts" />
module app {
    'use strict';

    var vm: CalendarRequestController, $q: ng.IQService, $filter: ng.IFilterService, organizationalUnitsModel: OrganizationalUnitsModel,
        userPreferencesModel: UserPreferencesModel, personnelModel: PersonnelModel, toastr: toastr,
        uiCalendarConfig, NgTableParams: ngTable.INGTableParams, userFilterService: UserFilterService;

    export interface ICalendarEventFormatter {
        <T extends ap.ListItem<any>>(listItem: T): { title: string; start: Date; end: Date; id: number };
    }

    export interface IEventUserLookup {
        <T extends ap.ListItem<any>>(listItem: T): ap.IUser;
    }

    export interface IEventOrgLookup {
        <T extends ap.ListItem<any>>(listItem: T): ap.ILookup;
    }

    export interface IEventApproverLookup {
        <T extends ap.ListItem<any>>(listItem: T): ap.IUser;
    }

    export interface ICalendarRequestController {
        description: string;
        icon: string;
        pendingRequestsPartial: string;
        title: string;
    }

    export interface ICalendarRequestModel extends ap.Model {
        calendarLookup(start: Date, end: Date): ng.IPromise<ap.IndexedCache<any>>;
        openModal(request: ap.ListItem<any>): ng.IPromise<any>
        sync: ap.sync.ISyncPoint;
    }

    /**
     * @name ExtendVM
     * @description Primary decorator function for this service that attempts to reuse much of the
     * logic shared by calendar request controllers
     */
    export class CalendarRequestController {
        dataCalendarConfig: { calendar: Object; sources: Function[] }
        description: string;
        displayFilters = false;
        foundPendingRequests = false;
        icon: string;
        organizationalUnits: OrganizationalUnit[];
        pageState = {};
        pendingRequestsPartial: string;
        pendingRequestSummary = {};
        pendingRequestsTable: ngTable.INGTable;
        requestsPendingMyApproval = false;
        selectedGroup: OrganizationalUnit;
        showFilters = false;
        title: string;
        userPreferences: UserPreferences;
        visibleCalendarEvents = [];

        constructor(private requestModel: ICalendarRequestModel,
            private calendarEventConstructor: ICalendarEventFormatter,
            private getRequestUserLookup: IEventUserLookup,
            private getRequestOrgLookup: IEventOrgLookup,
            private getRequestedApprovalUser: IEventApproverLookup) {

            vm = this;
            var userPreferences;

            /** Initialize data */
            var getPendingRequests = requestModel.executeQuery('pending');
            var getOrgUnits = organizationalUnitsModel.getOrganizationalUnits();
            var getCurrentUser = personnelModel.getCurrentUser();
            var getUserPreferences = userPreferencesModel.getUserPreferences();

            /** Main ready event, will resolve once all promises are resolved */
            $q.all([
                getOrgUnits,
                getUserPreferences,
                personnelModel.getPersonnel()
            ]).then(function(resolvedPromises) {

                /** Expose to view */
                vm.organizationalUnits = resolvedPromises[0].toArray();
                vm.userPreferences = resolvedPromises[1];

                /** Refresh if either the current user or another user makes a change to the underlying data */
                requestModel.sync.subscribeToChanges((event: ap.sync.ISyncServiceChangeEvent, externalEvent: boolean) => {
                    if (externalEvent) {
                        console.log('Refresh Event Triggered By External User', event);
                    } else {
                        console.log('Refresh Event Triggered By Current User', event);
                    }
                    vm.refreshView();
                }, true);

                /** Callback to keep data in sync by only trigger when current user makes change */
                userPreferencesModel.sync.subscribeToChanges((event: ap.sync.ISyncServiceChangeEvent, externalEvent: boolean) => {
                    if (!externalEvent) {
                        //Current user changed preferences, update filter
                        console.log('User updated preferences.');;
                        vm.refreshView();
                    }
                }, true);

            });

            /** NG-Table config for all Pending Requests */
            vm.pendingRequestsTable = new NgTableParams({
                page: 1,            // show first page
                count: 5,           // count per page
                sorting: {
                    created: 'desc'
                },
                ready: false
            }, {
                    counts: [], // hide page counts control
                    total: 0, // length of data
                    getData: function(params) {
                        /** Include org units here because we need to ensure data is ready before cache search */
                        return $q.all([getPendingRequests, getCurrentUser, getOrgUnits])
                            .then(function(resolvedPromises) {

                                var pendingRequests = resolvedPromises[0];

                                vm.createPendingSummary(pendingRequests);

                                if (!vm.selectedGroup) {
                                    /** Expect an array containing a single user */
                                    var currentUser = resolvedPromises[1];
                                    /** Set the initial filter group to the group of the current user */
                                    vm.selectedGroup = organizationalUnitsModel.getCachedEntity<OrganizationalUnit>(currentUser.group.lookupId);
                                }

                                var orderedData = pendingRequests.toArray();

                                /** Sort */
                                params.sorting() ?
                                    $filter('orderBy')(orderedData, params.orderBy()) :
                                    orderedData;

                                /** Filter to only show pending records from the selected group and those that haven't been approved */
                                orderedData = _.filter(orderedData, function(request) {
                                    return getRequestOrgLookup(request).lookupId === vm.selectedGroup.id && !request.approvalDate;
                                });

                                params.ready = true;
                                params.total(orderedData.length);
                                vm.foundPendingRequests = orderedData.length > 0;
                                return orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
                            });

                    }
                });


            vm.dataCalendarConfig = {
                calendar: {
                    editable: false,
                    eventClick: (calEvent) => {
                        var request = _.find(vm.visibleCalendarEvents, { id: calEvent.id });
                        vm.openModal(request);
                    },
                    header: {
                        left: 'month, basicWeek, agendaDay',
                        center: 'title',
                        right: 'today prev,next'
                    },
                    defaultView: 'basicWeek',
                    titleFormat: 'MMM D YYYY',
                    lazyFetching: false,
                    weekends: false
                },
                sources: [vm.fetchCalendarData]
            }
        }

        className(key): string {
            return key ? 'fa-check-square-o' : 'fa-square-o';
        }

        createPendingSummary(pendingRequests) {
            vm.pendingRequestSummary = {};
            _.each(pendingRequests, (entity) => {
                var orgUnit = vm.getRequestOrgLookup(entity).lookupValue;
                vm.pendingRequestSummary[orgUnit] = vm.pendingRequestSummary[orgUnit] || 0;
                vm.pendingRequestSummary[orgUnit]++;
            });
        }


        fetchCalendarData(start, end, timezone, callback) {
            /** Fetch calendar data and make sure filters are set */
            vm.requestModel.calendarLookup(start, end)
            //$q.all([requestModel.calendarLookup(start, end), setFilter()])
                .then(function(calendarEvents) {
                    vm.visibleCalendarEvents = _.filter(calendarEvents, (entity) => {
                        return vm.validateCalendarEvent(entity);
                    });

                    var calendarSummaryObjects = _.map(vm.visibleCalendarEvents, (calendarEvent) => {
                        return vm.calendarEventConstructor(calendarEvent);
                    })

                    // var visibleCalendarObjects = [];
                    // /** Don't pass real request objects in because full calendar will update them so
                    //  * instead pass in condensed summary objects with the required properties */
                    // _.each(vm.visibleCalendarEvents, (event) => {
                    //     visibleCalendarObjects.push(vm.calendarEventConstructor(event));
                    // });
                    // callback(visibleCalendarObjects);
                    callback(calendarSummaryObjects);
                });
        }

        /** Sets the color of the label based on the status of the request record */
        labelStatusClass(request) {
            var labelClass = '';
            switch (request.requestStatus || request.status) {
                case 'Approved':
                    labelClass = 'label-success';
                    break;
                case 'Rejected':
                    labelClass = 'label-danger';
                    break;
                default:
                    labelClass = 'label-warning';
                    break;
            }
            return labelClass;
        }


        /** Reference to the openModal function on model */
        openModal(request) {
            vm.requestModel.openModal(request)
                .then(() => {
                    vm.refreshView();
                }, function() {
                    //Dismissed dialog

                });
        }

        /** Wrapper than can be called from the view and displays a toast once operation is complete */
        refresh() {
            vm.refreshView()
                .then(() => toastr.info('Data successfully refreshed.'));
        }

        /** Internally used method to reload data unlike method above which acts as a wrapper */
        refreshView() {
            /** Re-fetch calendar events using jQuery object on dom */
            uiCalendarConfig.calendars.requestCalendar.fullCalendar('refetchEvents');

            /** Update data */
            return $q.all([
                vm.requestModel.executeQuery('pending')
            ]).then((resolvedPromises) => {
                /** Refresh tables */
                vm.pendingRequestsTable.reload();
                vm.createPendingSummary(resolvedPromises[1]);
            });
        }

        /** Checks the current filter settings to determine if an event should be displayed */
        validateCalendarEvent(event) {
            var valid = false;
            var requesterSid = vm.getRequestUserLookup(event).lookupId;
            var person = personnelModel.findBySiteId(requesterSid);

            if (person) {
                var isInOrgUnit = userFilterService.isPersonInSelectedOrgUnits(person);
                var isEmployeeType = userFilterService.isPersonInSelectedUserTypes(person);
                var isTeamMember = userFilterService.isPersonMyTeamMember(person);
                valid = (isInOrgUnit && isEmployeeType) || isTeamMember;
            }
            return valid;
        }

    }



    export class CalendarRequestService {
        constructor($injector) {

            $filter = $injector.get('$filter');
            $q = $injector.get('$q');
            NgTableParams = $injector.get('NgTableParams');
            organizationalUnitsModel = $injector.get('organizationalUnitsModel');
            personnelModel = $injector.get('personnelModel');
            toastr = $injector.get('toastr');
            userFilterService = $injector.get('userFilterService');
            uiCalendarConfig = $injector.get('uiCalendarConfig');
            userPreferencesModel = $injector.get('userPreferencesModel');

        }
    }

    angular.module('angular-point-example')
        .service('calendarRequestService', CalendarRequestService);

}
