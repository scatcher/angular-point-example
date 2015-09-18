/// <reference path="../app.module.ts" />
module app {
    'use strict';

    var model: UserPreferencesModel;

    export class UserPreferences extends ap.ListItem<UserPreferences> {
        activeMusterView: string;
        browserVersion: string;
        teamMembers: ap.IUser[];
        visibleOrgUnits: ap.ILookup[];
        visibleUserTypes: string[];
        title: string;

        constructor(obj) {
            super();
            _.assign(this, obj);
        }
    }

    export class UserPreferencesModel extends ap.Model {
        currentUserPreferences: UserPreferences;
        deferred: ng.IDeferred<UserPreferences>;
        sync: ap.sync.ISyncPoint;
        constructor($q, private $modal, personnelModel: app.PersonnelModel, private user,
            private apSyncService, private apConfig) {

            super({
                factory: UserPreferences,
                list: {
                    guid: '{A98872CA-F9EA-4B59-A650-41A1832A3711}',
                    title: 'UserPreferences',
                    customFields: [
                        { staticName: 'Title', objectType: 'Text', mappedName: 'title', readOnly: false },
                        //{staticName: 'Preferences', objectType: 'JSON', mappedName: 'preferences', readOnly: false},
                        {
                            staticName: 'TeamMembers',
                            objectType: 'UserMulti',
                            mappedName: 'teamMembers',
                            readOnly: false,
                            description: 'Users we should include in filter results for the current user.'
                        },
                        {
                            staticName: 'VisibleUserTypes',
                            label: 'Employee Types',
                            objectType: 'MultiChoice',
                            mappedName: 'visibleUserTypes',
                            readOnly: false,
                            choices: ['Government', 'Contractor'],
                            description: 'Optionally display either Gov or Ctr or both on views with filter options.'
                        },
                        {
                            staticName: 'VisibleOrgUnits',
                            objectType: 'LookupMulti',
                            mappedName: 'visibleOrgUnits',
                            readOnly: false,
                            description: 'Org units to display on screens with filter options.'
                        },
                        {
                            staticName: 'ActiveMusterView',
                            objectType: 'Choice',
                            mappedName: 'activeMusterView',
                            readOnly: false,
                            choices: ['Tile', 'List'],
                            description: 'The default view when opening muster.'
                        },
                        {
                            staticName: 'BrowserVersion',
                            objectType: 'Text',
                            mappedName: 'browserVersion',
                            readOnly: false,
                            description: 'Store the user\'s browser version so we can get a better idea what people are using.'
                        }
                    ]
                }
            });

            model = this;
            model.deferred = $q.defer();


            /**
             * Register a single query that by default returns all records for this list in ascending
             * order based on ID.  No name is necessary because this is the only query.
             */
            model.registerQuery({
                name: 'primary',
                operation: 'GetListItems',
                query: '' +
                '<Query>' +
                '   <Where>' +
                '       <And>' +
                //          Record created by current user
                '           <Eq>' +
                '               <FieldRef Name="Author" LookupId="TRUE" />' +
                '               <Value Type="Integer"><UserID /></Value>' +
                '           </Eq>' +
                //          Preferences for 1App
                '           <Eq>' +
                '               <FieldRef Name="Title"/>' +
                '               <Value Type="Text">1App</Value>' +
                '           </Eq>' +
                '       </And>' +
                '   </Where>' +
                '</Query>'
            });

            /** Execute query immediately because this data is used throughout the application */
            model.executeQuery()
                .then(function(indexedCache) {
                    if (indexedCache.count() === 0) {
                        /** Create new user preferences list item */
                        personnelModel.getCurrentUser()
                            .then(function(currentUser) {
                                /** Set the default visible org unit to the user's org unit */
                                var newItem = model.createEmptyItem({
                                    title: '1App',
                                    visibleOrgUnits: [currentUser.group]
                                });
                                newItem.saveChanges().then(function(userPreferences) {
                                    model.identifyUser(userPreferences);
                                });
                            });
                    } else {
                        /** Use existing user preferences list item */
                        model.identifyUser(indexedCache.first());
                    }
                });
                
            //Add a subscription service that will automatically keep data in sync with all other active users
            this.sync = apSyncService.createSyncPoint(this);


        }

        /** Creates a reference to the current user on the personnel model */
        identifyUser(userPreferences) {

            model.currentUserPreferences = userPreferences;

            /** Extend shared reference to the current User object with correct lookupValue and lookupId */
            _.assign(model.user, userPreferences.author);

            model.deferred.resolve(userPreferences);
            model.apSyncService.initialize(userPreferences.author.lookupId, model.apConfig.firebaseURL);

            /** Identify the version of the user's web browser and store if different from previously saved version */
            var currentBrowserVersion = (function() {
                var ua = navigator.userAgent, tem,
                    M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
                if (/trident/i.test(M[1])) {
                    tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
                    return 'IE ' + (tem[1] || '');
                }
                if (M[1] === 'Chrome') {
                    tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
                    if (tem != null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
                }
                M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
                if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
                return M.join(' ');
            })();

            if (currentBrowserVersion !== userPreferences.browserVersion) {
                userPreferences.browserVersion = currentBrowserVersion;
                userPreferences.saveFields('browserVersion');
            }


        }

        /** Always return the same promise for each of the many calls for this data */
        getUserPreferences() {
            return model.deferred.promise;
        }

        openModal() {

            var modalInstance = model.$modal.open({
                templateUrl: 'modules/favorites/favoritesView.html',
                controller: 'favoritesController'
            });
            return modalInstance.result;
        }



    }

    angular.module('angular-point-example')
        .service('userPreferencesModel', UserPreferencesModel);

}
