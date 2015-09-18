/// <reference path="../../common/app.module.ts" />
module app {
    'use strict';

    interface ICompRequestDialogController {
        cancel():void;
        deleteListItem($modalInstance, options?): ng.IPromise<any>
        displayMode: string;
        fullControl:boolean;
        negotiatingWithServer:boolean;
        saveListItem(options?): ng.IPromise<any>
        userCanApprove:boolean;
        userCanDelete:boolean;
        userCanEdit:boolean;
    }


    class CompRequestDialogController extends ap.modal.APModal implements ICompRequestDialogController {
        approve: () => void;
        changeEnd: () => void;
        compRequest: CompRequest;
        dateExceedsBoundary = false;
        dateHelper: () => void;
        enableApproval = false;
        formInvalid: () => boolean;
        getLabelClass: () => string;
        reject: () => void;
        toggleAdminMode = false;
        userLookupOptionsBySid: ap.Lookup[];

        constructor($scope, $modalInstance, $q, personnelModel: PersonnelModel,
                    organizationalUnitsModel: OrganizationalUnitsModel, compRequest: CompRequest, user) {

            super(compRequest, $modalInstance);

            var vm = this;

            var personnel = [];

            vm.approve = approve;
            vm.changeEnd = changeEnd;
            vm.compRequest = compRequest;
            vm.dateHelper = dateHelper;
            vm.formInvalid = formInvalid;
            vm.getLabelClass = getLabelClass;
            vm.reject = reject;

            activate();


            /**=================PRIVATE=======================*/

            function activate() {

                $q.all([personnelModel.getPersonnel(), organizationalUnitsModel.getOrganizationalUnits()])
                    .then(function (resolvedPromises) {
                        personnel = resolvedPromises[0];

                        /** Expose lookup options to people pickers */
                        vm.userLookupOptionsBySid = personnelModel.userLookupOptionsBySid;

                        //Set watch to automatically set selected users manager
                        $scope.$watch('vm.compRequest.requestedFor', participantHelper);

                        var userSid = personnelModel.userReference.lookupId;

                        if (vm.compRequest.id) {
                            vm.userCanDelete = userSid === vm.compRequest.requestedFor.lookupId || userSid === vm.compRequest.author.lookupId;
                            if (userSid !== compRequest.requestedFor.lookupId && vm.displayMode !== 'New' && !compRequest.approvalDate) {
                                vm.enableApproval = true;
                            }
                        }
                    })
            }

            function formValid(): boolean {
                return _.isDate(compRequest.startDate) && _.isDate(compRequest.endDate) && !_.isEmpty(compRequest.requestedFor) && !_.isEmpty(compRequest.approver);
            }

            function formInvalid(): boolean {
                return !formValid();
            }

            function changeEnd(): void {
                var startDate = new moment(compRequest.startDate);
                var storedEndDate = new moment(compRequest.endDate);
                var endDate = startDate.endOf('month');
                if (storedEndDate > endDate) {
                    compRequest.endDate = endDate.toDate();
                    vm.dateExceedsBoundary = true;
                }
                else {
                    vm.dateExceedsBoundary = false;
                }
            }

            function approve(): void {
                vm.negotiatingWithServer = true;
                compRequest.approve()
                    .then((updatedCompRequest) => {
                        vm.$modalInstance.close();
                    })
                    .catch((err) => {
                        throw new Error(err);
                    });
            }

            function reject(): void {
                var confirmation = window.confirm('Are you sure you want to reject this request?');
                if (confirmation) {
                    //Update approval fields
                    compRequest.approver = user;
                    compRequest.approvalDate = new Date();
                    compRequest.approvalStatus = 'Rejected';
                    //Save the record and update the model
                    vm.saveListItem();
                }
            }

            //Assists with autopopulation of end date
            function dateHelper(): void {
                //Update end date if empty or less than start date
                if (!_.isDate(compRequest.endDate) || compRequest.endDate < compRequest.startDate) {
                    compRequest.endDate = compRequest.startDate;
                }
            }

            function getLabelClass(): string {
                return compRequest.approvalStatus === 'Approved' ? 'label label-success' : 'label label-default';
            }

            //Sets current user and manager if not already set
            function participantHelper() {
                var userGroup;

                //Don't do anything in display mode
                if (vm.displayMode !== 'New') {
                    return;
                }

                if (!compRequest.requestedFor) {
                    compRequest.requestedFor = user;
                }

                //Locate the definition for the selected requester
                var selectedUser = _.find(personnel, function (person) {
                    return person.accountName.lookupId === compRequest.requestedFor.lookupId;
                });


                if (selectedUser) {
                    //Locate the group the requester belongs to
                    userGroup = organizationalUnitsModel.getCachedEntity(selectedUser.group.lookupId);
                }

                if (userGroup) {
                    //If a user group is found, update the organizational unit for this request
                    compRequest.organizationalUnit = {lookupId: userGroup.id, lookupValue: userGroup.abbrev};

                    //Handle case when user is the manager of the group and lookup their manager
                    if (userGroup.manager.lookupId === selectedUser.id) {
                        //Set orgUnit to parent org unit if available
                        if (userGroup.parentUnit) {
                            //User is section or team manager
                            userGroup = organizationalUnitsModel.getCachedEntity(userGroup.parentUnit.lookupId);
                        }
                    }

                    //Identify the manager for the selected user
                    var usersManager = personnelModel.getCachedEntity<Person>(userGroup.manager.lookupId);

                    compRequest.approver = usersManager.accountName;
                }
            }
        }
    }

    angular.module('angular-point-example')
        .controller('compRequestDialogController', CompRequestDialogController);


}
