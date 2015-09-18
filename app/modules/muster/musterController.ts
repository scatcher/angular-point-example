/// <reference path="../../common/app.module.ts" />
module app.muster {
    'use strict';

    var vm: MusterController, musterRecords: ap.IndexedCache<Muster>,
        leaveRequests: ap.IndexedCache<Leave>, travelRequests: ap.IndexedCache<Travel>,
        personnel: ap.IndexedCache<Person>;

    class MusterController {
        displayFilters = false;
        musterSummaryObjects: MusterSummary[];
        navbarFilterString = '';
        scopeReady = false;
        userPreferences: UserPreferences;
        viewStyle = 'Tile';
        visibleMusterSummaryObjects: MusterSummary[];
        constructor($scope: ng.IScope,
            private $q: ng.IQService,
            private musterModel: MusterModel,
            private personnelModel: PersonnelModel,
            private leaveModel: LeaveModel,
            private travelModel: TravelModel,
            private userPreferencesModel: UserPreferencesModel,
            private userFilterService: UserFilterService,
            private toastr: toastr,
            private musterSummaryObjectFactory: MusterSummaryObjectFactory
            ) {

            vm = this;

            /** Wait for all data sources to finish loading */
            $q.all([
                musterModel.executeQuery('today'),
                leaveModel.executeQuery('today'),
                travelModel.executeQuery('today'),
                personnelModel.getPersonnel(),
                userPreferencesModel.getUserPreferences()
            ]).then(function(resolvedPromises) {

                /** Set local references to data */
                musterRecords = resolvedPromises[0];
                leaveRequests = resolvedPromises[1];
                travelRequests = resolvedPromises[2];
                personnel = resolvedPromises[3];
                vm.userPreferences = resolvedPromises[4];



                /** Main call which builds everything */
                vm.processData();

                $scope.$watch('vm.navbarFilterString', function(newVal, oldVal) {
                    if (newVal !== oldVal) {
                        console.log('Filter string update.');
                        vm.processData();
                    }
                });

                vm.scopeReady = true;

                /** Callback to keep data in sync */
                musterModel.sync.subscribeToChanges((event: ap.sync.ISyncServiceChangeEvent, externalEvent: boolean) => {

                    musterModel.executeQuery('today')
                        .then(function(updatedCache: ap.IndexedCache<Muster>) {
                            console.log('Muster Change Detected', event, externalEvent);
                            /** The $watch above should trigger if there are any changes */
                            musterRecords = updatedCache;
                            vm.processData();
                        });
                }, true);

                /** Callback to keep data in sync */
                leaveModel.sync.subscribeToChanges((event: ap.sync.ISyncServiceChangeEvent, externalEvent: boolean) => {

                    leaveModel.executeQuery('today')
                        .then(function(updatedCache: ap.IndexedCache<Leave>) {
                            console.log('Leave Change Detected', event, externalEvent);
                            /** The $watch above should trigger if there are any changes */
                            leaveRequests = updatedCache;
                            vm.processData();
                        });
                }, true);

                /** Callback to keep data in sync */
                userPreferencesModel.sync.subscribeToChanges((event: ap.sync.ISyncServiceChangeEvent, externalEvent: boolean) => {
                    if (!externalEvent) {
                        //Current user changed preferences, update filter
                        console.log('User updated preferences.');
                        vm.processData();

                    }
                }, true);

            });
        }
        filterVisibleMusterSummaryObjects() {
            this.visibleMusterSummaryObjects = _.filter(this.musterSummaryObjects, (musterSummary: MusterSummary) => {
                let userIsVisible = false;
                let person = musterSummary.person;

                /** Evaluate to determine if the current user should be shown */
                if (this.navbarFilterString.length > 0) {
                    userIsVisible = this.userFilterService.doesPersonsNameContainFilterString(person, this.navbarFilterString);
                } else {
                    let isInOrgUnit = this.userFilterService.isPersonInSelectedOrgUnits(person);
                    let isEmployeeType = this.userFilterService.isPersonInSelectedUserTypes(person);
                    let isTeamMember = this.userFilterService.isPersonMyTeamMember(person);
                    userIsVisible = (isInOrgUnit && isEmployeeType) || isTeamMember;
                }

                //Only display users who match current filter criteria
                return userIsVisible;
            })
        }
        processData() {
            this.musterSummaryObjects = this.musterSummaryObjectFactory.generateSummaryObjects(personnel, musterRecords, leaveRequests, travelRequests);
            this.filterVisibleMusterSummaryObjects();
        }

        refresh(): void {
            vm.$q.all([
                vm.musterModel.executeQuery('today'),
                vm.leaveModel.executeQuery('today'),
                vm.travelModel.executeQuery('today')
            ]).then(function() {
                vm.processData();
                vm.toastr.info('Data successfully refreshed.');
            })
        }

        toggleFilters() {
            vm.displayFilters = !vm.displayFilters;
        }

        /** Updates the current view and saves state for future sessions */
        updateView(selectedView: string): void {
            /** Ensure value has changed */
            if (vm.userPreferences.activeMusterView !== selectedView) {
                vm.userPreferences.activeMusterView = selectedView;

                /** Save to server */
                vm.userPreferences.saveChanges();
            }
        }
    }


    angular.module('angular-point-example')
        .controller('musterController', MusterController);


}
