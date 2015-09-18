/// <reference path="../app.module.ts" />
module app {
    'use strict';

    function FilterPanel() {
        return {
            controller: FilterPanelController,
            controllerAs: 'panel',
            scope: {},
            template: `
            <div class="panel panel-metro-orange">
                <div class="panel-heading">
                    <h3 class="panel-title">
                        <i class="fa fa-filter"></i> Filter Options
                    </h3>
                </div>
                <div class="panel-body">
            		<formly-form model="panel.userPreferences" fields="panel.formFields"></formly-form>
                </div>
            </div>`
        }
    }

    class FilterPanelController {
        copyOfPreferences: UserPreferences;
        formFields: AngularFormly.IFieldConfigurationObject[];
        organizationalUnitLookupOptions: ap.Lookup[];
        ready = false;
        userLookupOptionsBySid: ap.IUser[];
        userPreferences: UserPreferences;
        constructor($scope: ng.IScope, $q: ng.IQService, _, userPreferencesModel: UserPreferencesModel,
            personnelModel: PersonnelModel, organizationalUnitsModel: OrganizationalUnitsModel, $templateRequest) {

            var panel = this;
            userPreferencesModel.getUserPreferences()
                .then((userPreferences) => {
                    panel.userPreferences = userPreferences;
                    panel.formFields = [
                        //TEAM MEMBERS
                        {
                            type: 'lookup-multi',
                            key: 'teamMembers',
                            templateOptions: {
                                label: 'Team Members',
                                options: personnelModel.getPersonnel(),
                                lookupIdProperty: (person: Person) => person.userSid,
                                lookupValueProperty: (person: Person) => person.getFullName(true),
                                placeholder: 'Add team members...',
                                description: 'Employees designated as team members are included in all filter views.'
                            }
                        },
                        //GROUPS
                        {
                            type: 'lookup-multi',
                            key: 'visibleOrgUnits',
                            templateOptions: {
                                label: 'Groups',
                                options: organizationalUnitsModel.getOrganizationalUnits(),
                                lookupIdProperty: 'id',
                                lookupValueProperty: 'abbrev',
                                placeholder: 'Add org units...',
                                description: 'Display users from the selected groups.'
                            }
                        },
                        //EMPLOYEE TYPE
                        {
                            type: 'choice-multi',
                            key: 'visibleUserTypes',
                            templateOptions: {
                                label: 'Employee Types',
                                options: ['Government', 'Contractor'],
                                placeholder: 'Filter by employee type...'
                            }
                        }
                    ];

                    $scope.$watchCollection('[panel.userPreferences.teamMembers, panel.userPreferences.visibleOrgUnits, panel.userPreferences.visibleUserTypes ]', function(newVal, oldVal) {
                        if (newVal && !angular.equals(newVal, oldVal)) {
                            userPreferences.saveChanges();
                            console.log('Filter settings saved.');
                        }
                    });

                });
        }
    }



    angular
        .module('angular-point-example')
        .directive('filterPanel', FilterPanel);

}
