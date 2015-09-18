/// <reference path="../app.module.ts" />
module app{
    'use strict';

    angular
        .module('angular-point-example')
        .filter('userDisplayNameFilter', UserDisplayNameFilter);

    /** Uses the user SID to return the corresponding formal name for a given user */
    function UserDisplayNameFilter(personnelModel: PersonnelModel) {

        return userFilter;

        /**
         * @name userFilter
         * @param {number} id
         * @param {boolean} personnelLookup
         * @returns {string} The formal name for a user.
         */
        function userFilter(id: number, personnelLookup = false) {
            var person = personnelLookup ? personnelModel.findByPersonnelId(id) : personnelModel.findBySiteId(id);
            if(person) {
                return person.getFullName(true);
            }
        }
    }
}
