/// <reference path="../../common/app.module.ts" />
module app {
    'use strict';


    class TravelController extends CalendarRequestController implements ICalendarRequestController {
        description = 'Completing the mission, worldwide.';
        icon = 'fa-plane';
        // myRequestsPartial = 'modules/travel/myRequestsTemplate.html';
        pendingRequestsPartial = 'modules/travel/pendingRequestsTemplate.html';
        // requestsPendingCurrentUsersApprovalTemplate = 'modules/travel/requestsPendingCurrentUsersApprovalTemplate.html';
        title = 'Travel';

        constructor($filter: ng.IFilterService, travelModel: TravelModel, calendarRequestService: CalendarRequestService) {


            /** Decorate the scope with the standard calendar request components */
            super(travelModel, calendarEventConstructor, getRequestUserLookup, getRequestOrgLookup, getRequestedApprovalUser);


            function calendarEventConstructor<Travel>(listItem) {
                return {
                    //Travel is always all day
                    allDay: true,
                    //Full Calendar displays events with ending date time as less than full day so add additional day to fix
                    end: moment(listItem.end).add(1, 'day'),
                    id: listItem.id,
                    start: listItem.start,
                    title: $filter('userDisplayNameFilter')(listItem.requestedFor.lookupId)
                };
            }

            function getRequestUserLookup<Travel>(listItem) {
                return listItem.requestedFor;
            }

            function getRequestOrgLookup<Travel>(listItem) {
                return listItem.requesterOrgUnit;
            }

            function getRequestedApprovalUser<Travel>(listItem) {
                return listItem.requestSubmittedTo;
            }

        }
    }


    angular.module('angular-point-example')
        .controller('travelController', TravelController);
}
