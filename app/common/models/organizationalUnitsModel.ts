/// <reference path="../app.module.ts" />
module app {
    'use strict';

    /** Object Constructor (class)*/
    export class OrganizationalUnit extends ap.ListItem<OrganizationalUnit> {
        abbrev: string;
        backups: ap.ILookup[];
        manager: ap.ILookup;
        name: string;
        parentUnit: ap.ILookup;
        title: string;
        constructor(obj) {
            super();
            _.assign(this, obj);
        }
    }

    export class OrganizationalUnitsModel extends ap.Model {
        constructor() {

            //Model constructor
            super({
                factory: OrganizationalUnit,
                list: {
                    title: 'OrganizationalUnits',
                    guid: '{7A442041-2856-4CF1-9375-3960649B62E5}',
                    customFields: [
                        { staticName: 'Backups', objectType: 'LookupMulti', mappedName: 'backups', readOnly: false },
                        { staticName: 'Manager', objectType: 'Lookup', mappedName: 'manager', readOnly: false },
                        { staticName: 'Name', objectType: 'Text', mappedName: 'name', readOnly: false },
                        { staticName: 'ParentUnit', objectType: 'Lookup', mappedName: 'parentUnit', readOnly: false },
                        { staticName: 'Title', objectType: 'Text', mappedName: 'abbrev', readOnly: false }
                    ]
                }
            });

            /*********************************** Queries ***************************************/

            /** Primary query pulls all active employees from the Personnel list.  Using 'GetListItems'
             * because we don't anticipate these values changing mid sessions so it doesn't need to use change
             * tokens and all the extra overhead associated with GetListItemChangesSinceToken.  Only makes a single
             * call and then uses cached values for future calls.
             */
            this.registerQuery({
                name: 'primary',
                operation: 'GetListItems'
            });

            /** Execute Immediately */
            this.executeQuery('primary');


        }

        /** Data doesn't change often so we only need to make the request once */
        getOrganizationalUnits(): ng.IPromise<ap.IndexedCache<OrganizationalUnit>> {
            var query = this.getQuery('primary');
            return query.promise;
        }

    }

    angular.module('angular-point-example')
        .service('organizationalUnitsModel', OrganizationalUnitsModel);

}
