/// <reference path="../app.module.ts" />
module app {
    'use strict';

    /** Object Constructor */
    export class LeaveType extends ap.ListItem<LeaveType> {
        abbreviation:string;
        title: string;
        constructor(obj) {
            super();
            _.assign(this, obj);
        }
    }

    export class LeaveTypesModel extends ap.Model {
        initialRequestForLeaveTypes:ng.IPromise< ap.IndexedCache<LeaveType> >;
        constructor(apModelFactory) {

            //Model constructor
            super({
                factory: LeaveType,
                list: {
                    title: 'LeaveTypes',
                    guid: '{F643D42B-3790-435C-ACD6-E6E2DD117A64}',
                    customFields: [
                        {staticName: 'Abbreviation', objectType: 'Text', mappedName: 'abbreviation', readOnly: false},
                        {staticName: 'Title', objectType: 'Text', mappedName: 'title', readOnly: false}
                    ]
                }
            });

            /**
             * Register a single query that by default returns all records for this list in ascending
             * order based on Title.  No name is necessary because this is the only query.
             */
            this.registerQuery({
                name: 'primary',
                operation: 'GetListItems',
                query: '' +
                '<Query>' +
                '   <OrderBy>' +
                '       <FieldRef Name="Title" Ascending="TRUE"/>' +
                '   </OrderBy>' +
                '</Query>'
            });


        }
        getLeaveTypes() {
            if (!this.initialRequestForLeaveTypes) {
                this.initialRequestForLeaveTypes = this.executeQuery('primary');
            }
            return this.initialRequestForLeaveTypes;
        }
    }

    angular.module('angular-point-example')
        .service('leaveTypesModel', LeaveTypesModel);
}
