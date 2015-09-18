/// <reference path="../../common/app.module.ts" />
module app {
    'use strict';

    let vm: TravelDialogController;

    interface ITravelDialogController {
        cancel(): void;
        deleteListItem($modalInstance, options?): ng.IPromise<any>
        displayMode: string;
        fullControl: boolean;
        negotiatingWithServer: boolean;
        userCanApprove: boolean;
        userCanDelete: boolean;
        userCanEdit: boolean;
    }


    class TravelDialogController extends ap.modal.APModal implements ITravelDialogController {
        $modalInstance: ng.ui.bootstrap.IModalServiceInstance;
        activeTab = 'Main';
        approvalMode = false;
        canDelete = false;
        dataReady = false;
        toggleAdminMode = false;  //Allows advanced functionality by admins
        travelCodes: ap.IndexedCache<TravelCode>;
        travelRequest: Travel;
        userLookupOptionsBySid: ap.ILookup[];
        constructor($scope: ng.IScope, $modalInstance: ng.ui.bootstrap.IModalServiceInstance, $q: ng.IQService,
            private $filter, private toastr, travelCodesModel: TravelCodesModel, organizationalUnitsModel: OrganizationalUnitsModel,
            private personnelModel: PersonnelModel, travelRequest: Travel) {

            super(travelRequest, $modalInstance);

            vm = this;
            var orgUnits, personnel, travelCodes;

            vm.travelRequest = travelRequest;


            if (travelRequest.id && travelRequest.requestStatus.indexOf('Pending') !== -1) {
                vm.approvalMode = vm.userCanApprove;
            }

            $q.all([
                organizationalUnitsModel.getOrganizationalUnits(),
                personnelModel.getPersonnel(),
                travelCodesModel.getTravelCodes()
            ]).then(function(resolvedPromises) {

                orgUnits = resolvedPromises[0];
                personnel = resolvedPromises[1];
                travelCodes = resolvedPromises[2];

                /** Expose to view */
                /** Expose lookup options to people pickers */
                vm.userLookupOptionsBySid = personnelModel.userLookupOptionsBySid;
                vm.travelCodes = travelCodes.toArray();

                vm.dataReady = true;
                vm.participantHelper(travelRequest);

                $scope.$watch('vm.travelRequest.requestedFor', function(newVal, oldVal) {
                    if (oldVal) {
                        vm.participantHelper(travelRequest);
                    }
                });

                if (travelRequest.author) {
                    vm.canDelete = (personnelModel.userReference.lookupId === travelRequest.author.lookupId);
                }
            });
        }

        approve(travelRequest: Travel): void {
            vm.negotiatingWithServer = true;
            if (travelRequest.id) {
                travelRequest.approve()
                    .then(function() {
                        vm.toastr.success('Travel approved');
                        vm.$modalInstance.close();
                    }, function() {
                        vm.toastr.error('There was a problem updating this travel record');
                    });
            }
        }
        //Assists with autopopulation of end date
        dateHelper(travelRequest: Travel): void {
            //Update end date if empty or less than start date
            if (travelRequest.travelStartDate && travelRequest.travelEndDate && travelRequest.travelEndDate.getTime() < travelRequest.travelStartDate.getTime()) {
                travelRequest.travelEndDate = travelRequest.travelStartDate;
            }
        }
        /** Define role of the current user and based on that, handle form functionality */
        participantHelper(travelRequest: Travel) {
            /** Only process if user is able to edit */
            if (vm.displayMode === 'View') {

                var currentUsersSID = vm.personnelModel.userReference.lookupId;
                /** The user travel is being requested for */
                var currentUsersRequest = currentUsersSID === travelRequest.requestedFor.lookupId;
                /** The user who requested travel for another user */
                var currentUserCreatedRequest = currentUsersSID === travelRequest.author.lookupId;
                /** User identified as the person who should approve */
                var currentUserIsRequestApprover = currentUsersSID === travelRequest.approvedBy.lookupId;
                /** Check if any of these conditions are true */
                if (currentUsersRequest || currentUserCreatedRequest || currentUserIsRequestApprover) {
                    vm.canDelete = vm.userCanDelete;
                }
            } else if (vm.displayMode === "New") {

                //Locate the definition for the selected requester
                var selectedUser = vm.personnelModel.findBySiteId(travelRequest.requestedFor.lookupId);

                //Locate the group the requester belongs to
                var userGroup = selectedUser.getGroup();

                if (userGroup) {
                    //If a user group is found, update the organizational unit for this request
                    travelRequest.requesterOrgUnit = { lookupId: userGroup.id, lookupValue: userGroup.abbrev };

                    //Identify the manager for the selected user
                    var usersManager = selectedUser.getManager();

                    if (usersManager) {
                        travelRequest.requestSubmittedTo = {
                            lookupId: usersManager.accountName.lookupId,
                            lookupValue: usersManager.lastName + ', ' + usersManager.firstName
                        };
                    }

                }
            }
        }

        reject(travelRequest: Travel): void {
            var confirmation = window.confirm('Are you sure you want to reject this travel request?');
            if (confirmation) {
                vm.negotiatingWithServer = true;

                if (travelRequest.id) {
                    travelRequest.reject()
                        .then(function() {
                            vm.toastr.success('Travel Rejected');
                            vm.$modalInstance.close();
                        }, function() {
                            vm.toastr.error('There was a problem updating this travel record');
                        });
                }
            }
        }

        saveRequest(travelRequest: Travel): void {
            let requiredFields = [['requestedFor', 'Requester'], ['requestSubmittedTo', 'Requested Approver'],
                ['travelStartDate', 'Start Date'], ['travelEndDate', 'End Date']];
            let formValid = true;

            _.each(requiredFields, (field: [string, string]) => {
                if(!travelRequest[field[0]]) {
                    formValid = false;
                    //Alert user using the display name for the field
                    return vm.toastr.warning(`${field[1]} is required to complete this request.`);
                }
            });

            //Prevent submission if any of the required fields are empty.
            if(!formValid) return;


            //Combine the time strings with the dates set in calendar control prior to submission
            vm.negotiatingWithServer = true;
            var selectedUser = vm.personnelModel.findBySiteId(travelRequest.requestedFor.lookupId);
            travelRequest.title = vm.$filter('userDisplayNameFilter')(travelRequest.requestedFor.lookupId) + ' - ' +
                moment(travelRequest.travelStartDate).format('l');
            travelRequest.requesterOrgUnit = selectedUser.group;

            travelRequest.saveChanges()
                .then(function() {
                    vm.toastr.success('Travel updated');
                    vm.$modalInstance.close();
                }, function() {
                    vm.toastr.error('There was a problem updating this travel record');
                });

        }

    }

    angular.module('angular-point-example')
        .controller('travelDialogController', TravelDialogController);

}
