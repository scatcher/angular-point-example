/// <reference path="../app.module.ts" />
module app {
    'use strict';

    /** Object Constructor */
    export class ChargeGuidance extends ap.ListItem<ChargeGuidance> {
        endDate: Date;
        fileName: string;
        fileRef: ap.ILookup;
        fy: number;
        startDate: Date;
        constructor(obj) {
            super();
            _.assign(this, obj);
        }
        //Direct access to the URL we care about
        get link() {
            return this.fileRef.lookupValue;
        }
        //File name without file extension
        get title() {
            return _.first(this.fileName.split('.'));
        }
    }

    /**
    * @ngdoc function
    * @name chargeGuidanceModel
    * @description Model handling the ChargeGuidance document library.
    */
    export class ChargeGuidanceModel extends ap.Model {
        initialRequestForChargeGuidance:ng.IPromise< ap.IndexedCache<ChargeGuidance> >;
        constructor() {

            //Model constructor
            super({
                factory: ChargeGuidance,
                list: {
                    title: 'ChargeGuidance',
                    guid: '{33C45B06-ACCF-4393-B71C-7D44720263CE}',
                    customFields: [
                        {
                            mappedName: 'endDate',
                            objectType: 'DateTime',
                            staticName: 'End'
                        },
                        {
                            mappedName: 'fileRef',
                            objectType: 'Lookup',
                            staticName: 'FileRef',
                            readOnly: true
                        },
                        {
                            mappedName: 'fy',
                            objectType: 'Number',
                            staticName: 'FY'
                        },
                        {
                            mappedName: 'fileName',
                            objectType: 'String',
                            staticName: 'LinkFilename'
                        },
                        {
                            mappedName: 'startDate',
                            objectType: 'DateTime',
                            staticName: 'Start'
                        },
                        {
							mappedName: 'title',
							objectType: 'Text',
							staticName: 'Title'
						}
                    ]
                }
            });

            /**
             * Register a single query that by default returns all records in the document library using
             * the much more efficient "GetListItems" operation because we don't expect to make multiple
             * requests throughout user session.
             */
            this.registerQuery({
                name: 'primary',
                operation: 'GetListItems'
            });
        }
        /**
         * @ngdoc function
         * @name chargeGuidanceModel.getChargeGuidance
         * @methodOf chargeGuidanceModel
         * @description Make a single request for documents from the server and return
         * the resolved promise for all future calls.
         */
        getChargeGuidance() {
            if (!this.initialRequestForChargeGuidance) {
                this.initialRequestForChargeGuidance = this.executeQuery('primary');
            }
            return this.initialRequestForChargeGuidance;
        }
    }

    angular.module('angular-point-example')
        .service('chargeGuidanceModel', ChargeGuidanceModel);
}
