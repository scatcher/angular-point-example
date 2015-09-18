/// <reference path="../app.module.ts" />
module app {
    'use strict';


    /**
     * @ngdoc service
     * @name userFilterService
     * @description
     *
     */
    export class UserFilterService {
        constructor(private userPreferencesModel: UserPreferencesModel) { }
        doesPersonsNameContainFilterString(person: Person, navbarFilterString): boolean {
            var result = true;

            if (navbarFilterString.length > 0) {
                var filter = navbarFilterString.toLowerCase();
                result = person.firstName.toLowerCase().indexOf(filter) > -1 ||
                person.lastName.toLowerCase().indexOf(filter) > -1 ||
                (_.isObject(person.group) && person.group.lookupValue.toLowerCase().indexOf(filter) > -1);
            }
            return result;
        }

        isPersonInSelectedOrgUnits(person: Person): boolean {
            if (this.userPreferencesModel.currentUserPreferences.visibleOrgUnits.length === 0) {
                return true;
            }
            return !!_.find(this.userPreferencesModel.currentUserPreferences.visibleOrgUnits, function(orgUnit) {
                return orgUnit.lookupId === person.group.lookupId;
            });
        }

        isPersonInSelectedUserTypes(person: Person): boolean {
            if (this.userPreferencesModel.currentUserPreferences.visibleUserTypes.length === 0) {
                return true;
            }
            return this.userPreferencesModel.currentUserPreferences.visibleUserTypes.indexOf(person.employeeType) > -1;
        }

        isPersonMyTeamMember(person: Person): boolean {
            return !!_.find(this.userPreferencesModel.currentUserPreferences.teamMembers, function(teamMember) {
                return teamMember.lookupId === person.accountName.lookupId;
            });
        }
    }


    angular
        .module('angular-point-example')
        .service('userFilterService', UserFilterService);


}
