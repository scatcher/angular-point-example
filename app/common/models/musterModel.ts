/// <reference path="../app.module.ts" />
module app {
    'use strict';

    var apLookupCacheService: ap.lookupCache.LookupCacheService, personnelModel: PersonnelModel,
        lookupFieldsToCache = ['user'];

    /** Object Constructor (class)*/
    export class Muster extends ap.ListItem<Muster> {
        location: string;
        mood: string;
        notes: string;
        user: ap.IUser;
        constructor(obj) {
            super();
            _.assign(this, obj);

            if (this.id) {
                /** Store in cached object so we can reference from lookup reference */
                apLookupCacheService.cacheEntityByLookupId(this, lookupFieldsToCache);
            }

        }
        /** Returns the formatted name of the editor */
        get editorName() {
            return personnelModel.stringifyUserField(this.editor);
        }
        get userSid() {
            return this.user.lookupId;
        }
        getPersonnelDetails(): Person {
            return personnelModel.findBySiteId(this.user.lookupId);
        }

    }


    export class MusterModel extends ap.Model {
        sync: ap.sync.ISyncPoint;
        constructor($injector: ng.auto.IInjectorService, _personnelModel_: PersonnelModel, private $modal: ng.ui.bootstrap.IModalService, apSyncService: ap.sync.ISyncService) {


            /********************* Model Definition ***************************************/

            /** Model constructor */
            super({
                factory: Muster,
                list: {
                    title: 'Muster',
                    guid: '{3DBEB25A-BEF0-4213-A634-00DAF46E3897}',
                    customFields: [
                        { staticName: 'Location', objectType: 'Text', mappedName: 'location', readOnly: false },
                        { staticName: 'Mood', objectType: 'Text', mappedName: 'mood', readOnly: false },
                        { staticName: 'Notes', objectType: 'Note', mappedName: 'notes', readOnly: false },
                        { staticName: 'UserPeoplePicker', objectType: 'User', mappedName: 'user', readOnly: false }
                    ]
                }
            });

            let model = this;

            apLookupCacheService = $injector.get('apLookupCacheService');
            personnelModel = _personnelModel_;
            //Monkey Patch save and delete to allow us to cleanup cache
            apLookupCacheService.manageChangeEvents(Muster, lookupFieldsToCache);

            /*********************************** Queries ***************************************/

            /** The primary query returns all muster records created today */
            model.registerQuery({
                name: 'today',
                //Set an expiration value of 8 hours rather than use the default of 24
                localStorageExpiration: 28800000,
                sessionCache: true,
                query: '' +
                '<Query>' +
                '   <Where>' +
                '       <Geq>' +
                '           <FieldRef Name="Created"/>' +
                '           <Value Type="DateTime"><Today/></Value>' +
                '       </Geq>' +
                '   </Where>' +
                '</Query>'
            });

            /** Fast check for a muster record for the current user.  GetListItems has much less overhead when compared
             * to GetListItemChangesSinceToken */
            model.registerQuery({
                name: 'hasCurrentUserMustered',
                operation: 'GetListItems',
                offlineXML: 'dev/Muster_CurrentUser.xml',
                query: '' +
                '<Query>' +
                '   <Where>' +
                '       <And>' +
                '           <Eq>' +
                '               <FieldRef Name="UserPeoplePicker" LookupId="TRUE" />' +
                '               <Value Type="Integer"><UserID /></Value>' +
                '           </Eq>' +
                '           <Geq>' +
                '               <FieldRef Name="Created"/>' +
                '               <Value Type="DateTime"><Today/></Value>' +
                '           </Geq>' +
                '       </And>' +
                '   </Where>' +
                '</Query>'
            });


            /********************* Model Specific Shared Functions ***************************************/

            //Add a subscription service that will automatically keep data in sync with all other active users
            model.sync = apSyncService.createSyncPoint(model);

            model.sync.subscribeToChanges((event: ap.sync.ISyncServiceChangeEvent, externalEvent: boolean) => {
                if (externalEvent) {
                    console.log('Muster event triggered refresh', event);
                }
            }, false);

        }

        getCachedMusterForUser(userSid: number): ap.IndexedCache<Muster> {
            return apLookupCacheService.retrieveLookupCacheById('user', model.list.getListId(), userSid, true);
        }

        /**
         * Dynamic query that allows us to register as needed
         * Returns all records for the past X days for a user
         * @param {Number} userSid
         * @param {Number} [numberOfRecords=30] Default to 30 if not specified
         * @returns {defer|*|defer|Promise|Function|defer}
         */
        fetchUserHistory(userSid, numberOfRecords = 30) {
            /** Unique query name base on params */
            var queryKey = 'userSid' + userSid + 'rowLimit' + numberOfRecords;

            /** Register project query dynamically if it doesn't exist */
            if (!_.isObject(this.queries[queryKey])) {
                this.registerQuery({
                    name: queryKey,
                    operation: 'GetListItems',
                    rowLimit: numberOfRecords,
                    query: `
                    <Query>
                       <Where>
                           <And>` +
                                /** Don't include muster for current day */
                                `<Neq>
                                    <FieldRef Name="Created"/>
                                    <Value Type="DateTime"><Today/></Value>
                                </Neq>
                                <And>` +
                                    /** Muster for the current user */
                                    `<Eq>
                                        <FieldRef Name="UserPeoplePicker" LookupId="TRUE" />
                                        <Value Type="Integer">${userSid}</Value>
                                    </Eq>` +
                                    /** Created by the current user */
                                    `<Eq>
                                        <FieldRef Name="Author" LookupId="TRUE" />
                                        <Value Type="Integer">${userSid}</Value>
                                    </Eq>
                                </And>
                           </And>
                       </Where>
                       <OrderBy>
                           <FieldRef Name="ID" Ascending="FALSE"/>
                       </OrderBy>
                    </Query>`
                });
            }
            return this.executeQuery(queryKey, { offlineXML: 'dev/Muster_User_History.xml' });
        }

        /**
         * Opens modal dialog for the current user when logging in
         * @returns {promise} // Success = saved or deleted, Failure = dismissed dialog
         */
        openAutoMusterModal() {
            return personnelModel.getCurrentUser()
                .then((currentUser: Person) => this.openModal(currentUser));
        }
        /**
         * Opens modal dialog for to complete muster of a user
         * @param {Person} person - Person being mustered.
         * @returns {promise} // Success = saved or deleted, Failure = dismissed dialog
         */
        openModal(person: Person) {
            //Expose up here so we can cleanup if user cancels
            let musterForUser: Muster;

            let modalInstance = this.$modal.open({
                templateUrl: 'modules/muster/musterDialogView.html',
                controller: 'musterDialogController',
                controllerAs: 'vm',
                resolve: {
                    muster: (apUtilityService: ap.UtilityService) => {
                        let cachedMuster = this.getCachedMusterForUser(person.userSid);
                        //The cached muster record with the highest ID is going to be the newest
                        let mostRecentMuster = cachedMuster.last();
                        //See if there is a muster record for this user today
                        if (mostRecentMuster && apUtilityService.yyyymmdd(new Date()) === apUtilityService.yyyymmdd(mostRecentMuster.created)) {
                            //User has muster for today
                            musterForUser = mostRecentMuster;
                        } else {
                            //No muster in the system so create a new one
                            musterForUser = this.createEmptyItem<Muster>({
                                user: person.accountName
                            })
                        }
                        return musterForUser;
                    }
                }
            });

            //Promise which is resolved when user closes modal dialog
            modalInstance.result.then(function() {
                //Record saved, no action necessary

            }, function() {
                //User cancelled
                if (musterForUser && musterForUser.id) {
                    //Need to revert to original data in case user made any changes
                    musterForUser.setPristine(musterForUser);
                }

            })
            return modalInstance.result;
        }

    }

    angular.module('angular-point-example')
        .service('musterModel', MusterModel);

}
