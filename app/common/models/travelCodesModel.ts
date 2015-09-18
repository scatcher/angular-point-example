/// <reference path="../app.module.ts" />
module app {
    'use strict';

    /** Object Constructor */
    export class TravelCode extends ap.ListItem<TravelCode> {
        code: string;
        title: string;
        constructor(obj) {
            super();
            _.assign(this, obj);
        }
    }

    export class TravelCodesModel extends ap.Model {
        requestForTravelCodes: ng.IPromise<ap.IndexedCache<TravelCode>>;
        constructor() {

            /** Model Constructor */
            super({
                factory: TravelCode,
                list: {
                    title: 'TravelCodes',
                    guid: '{6167EB87-1B0B-40EF-ABE7-85AFDA8D2FB1}',
                    customFields: [
                        { staticName: 'Code', objectType: 'Text', mappedName: 'code', readOnly: false },
                        { staticName: 'Title', objectType: 'Text', mappedName: 'title', readOnly: false }
                    ]
                }
            });

            /*********************************** Queries ***************************************/

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
        /** Only execute request once, after that just return the cached promise */
        getTravelCodes() {
            if (!this.requestForTravelCodes) {
                this.requestForTravelCodes = this.executeQuery('primary');
            }

            return this.requestForTravelCodes;
        }
    }

    angular.module('angular-point-example')
        .service('travelCodesModel', TravelCodesModel);


}
