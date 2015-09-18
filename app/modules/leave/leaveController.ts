/// <reference path="../../common/app.module.ts" />
module app {
    'use strict';


    class LeaveController extends CalendarRequestController implements ICalendarRequestController {
        description = 'You deserve a break!';
        icon = 'fa-globe';
        // myRequestsPartial = 'modules/leave/myRequestsTemplate.html';
        pendingRequestsPartial = 'modules/leave/pendingRequestsTemplate.html';
        // requestsPendingCurrentUsersApprovalTemplate = 'modules/leave/requestsPendingCurrentUsersApprovalTemplate.html';
        title = 'Leave';

        constructor(leaveModel: LeaveModel, calendarRequestService: CalendarRequestService) {

            /** Decorate the scope with the standard calendar request components */
            super(leaveModel, calendarEventConstructor, getRequestUserLookup, getRequestOrgLookup, getRequestedApprovalUser);

        }
    }

    //Create simple calendar object, much better performance than using leave records
    function calendarEventConstructor<Leave>(listItem) {
        return {
            //Force boolean
            allDay: !!listItem.allDay,
            //Full Calendar displays events with ending date time as less than full day so add additional day to fix
            end: listItem.allDay ? moment(listItem.end).add(1, 'day') : listItem.end,
            id: listItem.id,
            start: listItem.start,
            title: listItem.title
        };
    }

    function getRequestUserLookup<Leave>(listItem) {
        return listItem.requesterSID;
    }

    function getRequestOrgLookup<Leave>(listItem) {
        return listItem.organizationalUnit;
    }

    function getRequestedApprovalUser<Leave>(listItem) {
        return listItem.gatekeeperSID;
    }



    angular.module('angular-point-example')
        .controller('leaveController', LeaveController);


}
