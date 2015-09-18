/// <reference path="../../common/app.module.ts" />
module app {
    'use strict';

    interface ILeaveDialogController {
        cancel():void;
        deleteListItem($modalInstance, options?): ng.IPromise<any>
        displayMode: string;
        fullControl:boolean;
        negotiatingWithServer:boolean;
        //saveListItem(options?): ng.IPromise<any>
        userCanApprove:boolean;
        userCanDelete:boolean;
        userCanEdit:boolean;
    }


    class LeaveDialogController extends ap.modal.APModal implements ILeaveDialogController {
        approvalMode = false;
        approve(): void;
        approversDisplayName = null;
        dataReady = false;
        /** Changes between 6 & 12 depending on the status of allDay */
        dateColumnWidth: number;
        dateHelper(): void;
        /** Strings representations of from/to | time portion of date is updated when record saved */
        fromTime = '07:30';
        leaveRecord: Leave;
        leaveTypes: LeaveType[];
        toTime = '16:00';
        participantHelper(leaveRecord): void;
        personnel: Person[];
        piiMode = false;
        reject(): void;
        save(): void;
        userLookupOptionsById: {lookupId:number}[] = [];
        userLookupOptionsBySid: ap.IUser[] = [];
        userType: string;
        /** Allows advanced functionality by admins */
        toggleAdminMode = false;
        toggleAllDayMode(): void;
        userCanDelete = false;

        constructor($modalInstance,
                    $q,
                    $scope,
                    leaveRecord: Leave,
                    leaveModel: LeaveModel,
                    leaveTypesModel: LeaveTypesModel,
                    organizationalUnitsModel: OrganizationalUnitsModel,
                    personnelModel: PersonnelModel,
                    toastr,
                    userPreferencesModel: UserPreferencesModel) {

            super(leaveRecord, $modalInstance);

            var vm = this, personnel, leaveTypes;

            vm.approve = approve;
            vm.dateHelper = dateHelper;
            vm.leaveRecord = leaveRecord;
            vm.participantHelper = participantHelper;
            vm.reject = reject;
            vm.save = save;
            vm.toggleAllDayMode = toggleAllDayMode;

            activate();


            /**========================PRIVATE========================**/

            function activate() {

                /** Use default values as template if a leave record isn't passed in */
                if (!leaveRecord.id) {
                    vm.piiMode = true;
                } else {
                    /** Check to see if request is pending approval (accepts Pending Approval and Pending) */
                    if (leaveRecord.status.indexOf('Pending') > -1) {
                        /** Get the permission collection for the current user with this request */
                        var userPermMask = leaveRecord.resolvePermissions();
                        /** Update approval mode depending on the current users approval rights */
                        vm.approvalMode = userPermMask.ApproveItems;
                    }
                    /** Update the time string to reflect times in from & to */
                    vm.fromTime = moment(leaveRecord.from).format('HH:mm');
                    vm.toTime = moment(leaveRecord.to).format('HH:mm');
                }

                /** Set leaveRecord.allDay : Changes between 6 & 12 depending on the status of allDay */
                vm.dateColumnWidth = leaveRecord.allDay ? 12 : 6;

                /** Wait for all data sources to finish loading */
                $q.all([
                    personnelModel.getPersonnel(),
                    leaveTypesModel.getLeaveTypes(),
                    organizationalUnitsModel.getOrganizationalUnits(),
                    userPreferencesModel.getUserPreferences()
                ]).then(function (resolvedPromises) {

                    personnel = resolvedPromises[0];
                    leaveTypes = resolvedPromises[1];

                    /** Set the display name of the approver */
                    if (leaveRecord.approver) {
                        var approver = personnelModel.findBySiteId(leaveRecord.approver.lookupId);
                        vm.approversDisplayName = approver.firstName + ' ' + approver.lastName;
                    }

                    /** Expose lookup options to people pickers */
                    vm.userLookupOptionsById = _.chain(personnel)
                        .sortBy('lastName')
                        .map((person) => { return {lookupId: person.id } })
                        .value();

                    vm.userLookupOptionsBySid = personnelModel.userLookupOptionsBySid;
                    vm.personnel = personnel.toArray();

                    vm.leaveTypes = leaveTypes.toArray();

                    $scope.$watch('vm.leaveRecord.hours', function (newVal, oldVal) {
                        /** Set to an allDay request if the requested amount exceeds 8 hours and isn't currently set */
                        if (oldVal && newVal !== oldVal && newVal >= 8 && leaveRecord.allDay === false) {
                            vm.toggleAllDayMode();
                        }
                    });

                    participantHelper(leaveRecord);

                    $scope.$watch('vm.leaveRecord.user', function (newVal, oldVal) {
                        /** Display requested approver only if gov */
                        if (oldVal) {
                            /** Locate the definition for the selected requester */
                            var selectedUser = personnelModel.getCachedEntity(leaveRecord.user.lookupId);
                            vm.userType = selectedUser.employeeType;
                            participantHelper(leaveRecord);
                        }
                    });


                    if (vm.displayMode !== 'New') {
                        /** Check to see if current user either submitted request or is the user making the request */
                        if (
                            /** The user leave is being requested for */
                        (personnelModel.user.id === leaveRecord.user.lookupId) ||
                        /** The user who requested leave for another user */
                        (personnelModel.userReference.lookupId === leaveRecord.author.lookupId) ||
                        /** User identified as the person who should approve */
                        (personnelModel.user.id === leaveRecord.gatekeeper.lookupId)
                        ) {
                            vm.piiMode = true;
                            vm.userCanDelete = true;
                        } else {
                            vm.userCanDelete = false;
                        }
                    }
                    vm.dataReady = true;
                });
            }


            /** Used to toggle the time input fields */
            function toggleAllDayMode() {
                if (vm.displayMode !== 'New') {
                    return;
                }
                if (leaveRecord.allDay) {
                    leaveRecord.allDay = false;
                    vm.dateColumnWidth = 6;
                } else {
                    leaveRecord.allDay = true;
                    vm.dateColumnWidth = 12;
                }
            }

            /** Sets current user and manager if not already set */
            function participantHelper(leaveRecord): void {
                /** Only proceed if we're not in display mode */
                if (vm.displayMode === 'New') {
                    /** Locate the definition for the selected requester */
                    var selectedUser = personnelModel.getCachedEntity(leaveRecord.user.lookupId);

                    /** Locate the group the requester belongs to */
                    var userGroup = selectedUser.getGroup();

                    if (userGroup) {
                        /** If a user group is found, update the organizational unit for this request */
                        leaveRecord.organizationalUnit = {lookupId: userGroup.id, lookupValue: userGroup.abbrev};

                        var usersManager = selectedUser.getManager();

                        /** Cause scope to digest so the updated manager will be shown */
                            //$timeout(function () {
                        leaveRecord.gatekeeperSID = usersManager.accountName;
                        leaveRecord.gatekeeper = {
                            lookupId: usersManager.id,
                            lookupValue: usersManager.lastName + ', ' + usersManager.firstName
                        };
                        //}, 10);
                    }
                }
            }

            /** Assists with autopopulation of end date */
            function dateHelper(): void {
                /** Update end date if empty or less than start date */
                if (_.isEmpty(leaveRecord.to) || leaveRecord.to < leaveRecord.from) {
                    leaveRecord.to = leaveRecord.from;
                }
            }

            /** Parse time from string */
            function parseTimeString(date, str) {
                /** Accept times with or without colan */
                if (moment(str, ['HH:mm', 'HHmm']).isValid()) {
                    var time = moment(str, ['HH:mm', 'HHmm']);
                    var hour = moment(time).format('HH');
                    var min = moment(time).format('mm');
                    return moment(date).hour(hour).minute(min);
                } else {
                    toastr.error('A valid time must be provided for both start and end of the request');
                }
            }

            function approve() {
                toastr.info('Communicating with the server');
                /** Disable form buttons */
                vm.negotiatingWithServer = true;
                if (leaveRecord.id) {
                    leaveRecord.approve()
                        .then(function () {
                            toastr.success('Leave approved');
                            $modalInstance.close();
                        }, function () {
                            toastr.error('There was a problem updating this leave record');
                            $modalInstance.close();
                        });
                }
            }

            function reject(): void {
                toastr.info('Communicating with the server');
                /** Disable form buttons */
                var confirmation = window.confirm('Are you sure you want to reject this leave request?');
                if (confirmation && leaveRecord.id) {
                    vm.negotiatingWithServer = true;
                    leaveRecord.reject().then(function () {
                        toastr.success('Leave request rejected');
                        $modalInstance.close();
                    }, function () {
                        toastr.error('There was a problem updating this leave record');
                        $modalInstance.close();
                    });
                }
            }

            function validateForm() {
                var valid = true;
                var toast = '';
                if (!_.isNumber(leaveRecord.hours) || leaveRecord.hours <= 0) {
                    valid = false;
                    toast = 'Please identify the number of hours you\'re requesting.';
                }

                if (!valid) {
                    toastr.error(toast);
                }
                return valid;
            }

            function save(): void {

                if (validateForm()) {
                    /** Disable form buttons */
                    vm.negotiatingWithServer = true;

                    var requestToServer;
                    /** Combine the time strings with the dates set in calendar control prior to submission */
                    if (leaveRecord.allDay) {
                        /** Set the standard start/stop time 07:30 - 16:00 */
                        leaveRecord.from = moment(leaveRecord.from).hour(7).minute(30).second(0).millisecond(0).toDate();
                        leaveRecord.to = moment(leaveRecord.to).hour(16).minute(0).second(0).millisecond(0).toDate();

                        /** Set formatted date string */
                        if (moment(leaveRecord.from).isSame(leaveRecord.to, 'day')) {
                            /** Single all day request */
                            leaveRecord.date = moment(leaveRecord.from).format('MM/DD/YYYY');
                        } else {
                            /** Multiple day request */
                            leaveRecord.date = moment(leaveRecord.from).format('MM/DD/YYYY') + ' - ' +
                                moment(leaveRecord.to).format('MM/DD/YYYY');
                        }
                    } else {
                        leaveRecord.from = parseTimeString(leaveRecord.from, vm.fromTime).toDate();
                        leaveRecord.to = parseTimeString(leaveRecord.to, vm.toTime).toDate();

                        /** Set formatted date string to date with from and to times */
                        leaveRecord.date = moment(leaveRecord.from).format('MM/DD/YYYY HH:mm') + ' - ' +
                            moment(leaveRecord.to).format('HH:mm');
                    }

                    /** Automatically approve contractor requests and set supporting info */
                    var requester = personnelModel.getCachedEntity(leaveRecord.user.lookupId);
                    if (requester.employeeType === 'Contractor') {
                        /** Set the contractor as the requested approver */
                        leaveRecord.gatekeeper = leaveRecord.user;
                        /** Define approver */
                        leaveRecord.approver = leaveRecord.approver || {};
                        /** Set the approver to the user because contractors don't require approval */
                        leaveRecord.approver.lookupId = requester.accountName.lookupId;
                        leaveRecord.status = 'Approved';
                        leaveRecord.approvalDate = new Date();
                    }

                    /** Update user SID fields to allow easier user based query in future */
                    leaveRecord.requesterSID = {lookupId: requester.accountName.lookupId};
                    var gateKeeper = personnelModel.getCachedEntity(leaveRecord.gatekeeper.lookupId);
                    leaveRecord.gatekeeperSID = {lookupId: gateKeeper.accountName.lookupId};

                    if (leaveRecord.id) {
                        /** Existing leave record being updated */
                        requestToServer = leaveRecord.saveChanges()
                            .then(function () {
                                toastr.success('Leave updated');
                            }, function () {
                                toastr.error('There was a problem updating this leave record');
                            });
                    } else {

                        /** Set the list item title to user's (last name, first name) */
                        leaveRecord.title = requester.getFullName(true) || personnelModel.user.lastName;

                        /** Create new leave record */
                        requestToServer = leaveModel.addNewItem(leaveRecord)
                            .then(function () {
                                toastr.success('Leave request successfully created');
                            }, function () {
                                toastr.error('There was a problem creating a new leave record');
                            });
                    }

                    /** Close dialog after response from server */
                    requestToServer.then(function () {
                        $modalInstance.close();
                    }, function () {
                        $modalInstance.close();
                    });
                }
            }
        }
    }

    angular.module('angular-point-example')
        .controller('leaveDialogController', LeaveDialogController);


}
