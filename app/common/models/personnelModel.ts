/// <reference path="../app.module.ts" />
module app {
    'use strict';

    var lookupFieldsToCache = ['accountName', 'group'];
    var model: PersonnelModel, apIndexedCacheFactory: ap.IndexedCacheFactory, apLookupCacheService: ap.lookupCache.LookupCacheService,
        organizationalUnitsModel: OrganizationalUnitsModel;

    /** Object Constructor (class)*/
    export class Person extends ap.ListItem<Person> {
        _deleteItem: Function;
        _saveChanges: Function;
        accountName: ap.IUser;
        accountRef: string;
        employeeType: string;
        firstName: string;
        group: ap.ILookup;
        lastName: string;
        mgmt: boolean;
        phone: string;

        constructor(obj) {
            super();
            _.assign(this, obj);

            if (this.id) {
                /** Store in cached object so we can reference from lookup reference */
                apLookupCacheService.cacheEntityByLookupId(this, lookupFieldsToCache);
            }
        }
        /** Users name formatted as "FirstName LastName" */
        get fullName() {
            return this.getFullName(false);
        }
        /** Users name formatted as "LastName, FirstName" */
        get lexicographicName() {
            return this.getFullName(true);
        }

        get userSid() {
            return this.accountName.lookupId;
        }

        /**
         * @ngdoc function
         * @name Person:getFullName
         * @methodOf Person
         * Returns the a person's full name as (First Last) and optionally as (Last, First)
         * @param {Boolean} [lastNameFirst=false] Optionally format last name first.
         * @returns {string} Formatted name.
         */
        getFullName(lastNameFirst: boolean = false): string {
            return lastNameFirst === true ?
                this.lastName + ', ' + this.firstName : this.firstName + ' ' + this.lastName;
        }

        getGroup(): OrganizationalUnit {
            return organizationalUnitsModel.getCachedEntity<OrganizationalUnit>(this.group.lookupId);
        }

        getManager(): Person {
            var person = this, manager, userGroup = this.getGroup();
            if (userGroup) {

                //Handle case when user is the manager of the group and lookup their manager
                if (userGroup.manager.lookupId === person.id) {
                    //Set orgUnit to parent org unit if available
                    if (userGroup.parentUnit) {
                        //User is section or team manager
                        userGroup = organizationalUnitsModel.getCachedEntity<OrganizationalUnit>(userGroup.parentUnit.lookupId);
                    }
                }

                //Identify the manager for the selected user
                manager = model.getCachedEntity(userGroup.manager.lookupId);
            }
            return manager;
        }
    }

    export class PersonnelModel extends ap.Model {
        getUser: ng.IPromise<Person>;
        userLookupOptionsReady: ng.IPromise<ap.IUser[]>;
        /** Reference to the current user's Personnel list item */
        user: Person;
        userLookupOptionsById: { lookupId: number }[] = [];
        userLookupOptionsBySid: ap.IUser[] = [];
        /** Reference to the site collection lookup value for the current user. */
        userReference: { lookupId: number; lookupValue: string; formalName: string; };
        lookupReference: { lookupId: number; lookupValue: string };
        usersIndexBySid: ap.IndexedCache<Person>;

        constructor($injector: ng.auto.IInjectorService, $q, _apIndexedCacheFactory_, _apLookupCacheService_,
            _organizationalUnitsModel_, toastr, apUserModel: ap.UserModel) {


            /** Model Constructor */
            super({
                factory: Person,
                list: {
                    title: 'Personnel',
                    /**Maps to the offline XML file in dev folder (no spaces) */
                    guid: '{B8E7997D-79C9-4DA1-8494-27E07F3963C7}',
                    /**List GUID can be found in list properties in SharePoint designer */
                    customFields: [
                        /** Array of objects mapping each SharePoint field to a property on a list item object */
                        //ACCOUNT NAME
                        {
                            staticName: 'AccountName',
                            objectType: 'User',
                            mappedName: 'accountName'
                        },
                        //ACCOUNT REFERENCE
                        {
                            staticName: 'AccountReference',
                            objectType: 'Text',
                            mappedName: 'accountRef'
                        },
                        //EMPLOYEE TYPE
                        {
                            staticName: 'EmployeeType',
                            objectType: 'Text',
                            mappedName: 'employeeType'
                        },
                        //FIRST NAME
                        {
                            staticName: 'FirstName',
                            objectType: 'Text',
                            mappedName: 'firstName'
                        },
                        //GROUP (MAPS TO ORGANIZATIONAL UNITS)
                        {
                            staticName: 'Group',
                            objectType: 'Lookup',
                            mappedName: 'group'
                        },
                        //LAST NAME
                        {
                            staticName: 'Title',
                            objectType: 'Text',
                            mappedName: 'lastName'
                        },
                        //PHONE
                        {
                            staticName: 'CustomPhone',
                            objectType: 'Text',
                            mappedName: 'phone'
                        }
                    ]
                }
            });

            model = this;

            apIndexedCacheFactory = _apIndexedCacheFactory_;
            apLookupCacheService = _apLookupCacheService_;
            organizationalUnitsModel = _organizationalUnitsModel_;

            var deferredRequestForCurrentUser = $q.defer();
            var deferredRequestForUserLookupValues = $q.defer();
            model.userLookupOptionsReady = deferredRequestForUserLookupValues.promise
            model.getUser = deferredRequestForCurrentUser.promise;
            model.usersIndexBySid = new apIndexedCacheFactory.IndexedCache<Person>();

            //Monkey Patch save and delete to allow us to cleanup cache
            apLookupCacheService.manageChangeEvents(Person, lookupFieldsToCache);

            /*********************************** Queries ***************************************/

            /** Allows us to quickly identify the current user; only runs once and should return a single user */
            model.registerQuery({
                name: 'currentUser',
                offlineXML: 'dev/Personnel-CurrentUser.xml',
                operation: 'GetListItems',
                rowLimit: 1,
                query: '' +
                '<Query>' +
                '   <Where>' +
                '       <Eq>' +
                '           <FieldRef Name="AccountName" LookupId="TRUE" />' +
                '           <Value Type="Integer"><UserID /></Value>' +
                '       </Eq>' +
                '   </Where>' +
                '</Query>'
            });

            /** Retrieve the current user */
            model.executeQuery<Person>('currentUser')
                .then(function(queryResponse) {
                    /** Create personnelModel.user as a reference to the current user */
                    if (queryResponse.count() > 0) {
                        /** Expose reference to the user object for the current user */
                        model.user = queryResponse.first();
                        deferredRequestForCurrentUser.resolve(model.user);
                        /**
                         * Expose the lookup definition (SID) for the current user so we don't need to constantly be
                         * referencing model.user.accountName.lookupId
                         * @type {{lookupId: (number), lookupValue: (string)}}
                         */
                        model.userReference = {
                            lookupId: model.user.accountName.lookupId,
                            lookupValue: model.user.accountName.lookupValue,
                            formalName: model.user.getFullName()
                        };
                        model.lookupReference = {
                            lookupId: model.user.id,
                            lookupValue: model.user.getFullName()
                        };
                    } else {
                        //TODO: Find a way to create a new user Personnel record if none exists
                        // let userPreferencesModel: UserPreferencesModel = $injector.get('userPreferencesModel');
                        // userPreferencesModel.getUserPreferences()
                        //     .then((userPreferences: UserPreferences) => {

                        //     })
                        let msg = 'No valid account found.  Please contact Angular-Point-Example SharePoint support.';
                        toastr.error(msg);
                        throw new Error(msg);
                    }
                });

            /** Primary query pulls all active employees from the Personnel list.  Using 'GetListItems'
             * because we don't anticipate these values changing mid sessions so it doesn't need to use change
             * tokens and all the extra overhead associated with GetListItemChangesSinceToken.  Only makes a single
             * call and then uses cached values for future calls.
             */
            model.registerQuery({
                name: 'primary',
                operation: 'GetListItems',
                query: '' +
                '<Query>' +
                '   <Where>' +
                '       <And>' +
                '           <Eq>' +
                '               <FieldRef Name="Active"/>' +
                '               <Value Type="Text">1</Value>' +
                '           </Eq>' +
                '           <IsNotNull>' +
                '               <FieldRef Name="AccountName"/>' +
                '           </IsNotNull>' +
                '           </And>' +
                '   </Where>' +
                '</Query>'
            });

            /** Immediately make a request for personnel because we use this data throughout the application */
            model.executeQuery('primary')
                .then(function(indexedCache) {

                    /** Create arrays of lookup options for lookups of users and lookups of lookups of the Personnel list */
                    var sortedPersonnel = _.sortBy(indexedCache.toArray(), 'firstName');

                    _.each(sortedPersonnel, function(person) {
                        model.userLookupOptionsById.push({
                            /** Don't add lookupValue because we don't know the lookup is always using the title field */
                            lookupId: person.id
                        });
                        model.userLookupOptionsBySid.push(person.accountName);

                        /** Create an index by user SID that we can search */
                        model.usersIndexBySid[person.accountName.lookupId] = person;
                    });

                    model.userLookupOptionsBySid = _.sortBy(model.userLookupOptionsBySid, 'lookupValue');

                    deferredRequestForUserLookupValues.resolve(model.userLookupOptionsBySid);

                });

        }

        /** Allows us to easily find an individual user by their user id */
        findByPersonnelId(pid: number): Person {
            var indexedCache = model.getCache<Person>('primary');
            return indexedCache[pid];
        }

        /**
         * @ngdoc function
         * @name personnelModel:findBySiteId
         * @methodOf personnelModel
         * @param {number} sid ID of user.
         * @description
         * Find Person by their site collection id.
         * @returns {Person}
         */
        findBySiteId(sid: number): Person {
            var matchingPerson;
            var personArray = apLookupCacheService.retrieveLookupCacheById<Person>('accountName', model.list.getListId(), sid);
            if (personArray.length === 1) {
                matchingPerson = personArray[0];
            }
            return matchingPerson;
        }

        getCurrentUser(): ng.IPromise<Person> {
            return model.getUser;
        }

        /**
         * @ngdoc function
         * @name personnelModel:getGovernmentPersonnel
         * @methodOf personnelModel
         * @description
         * Async fetches all personnel and retuns just the government.
         * @returns {IndexedCache<Person>} Government personnel.
         */
        getGovernmentPersonnel(): ng.IPromise<ap.IndexedCache<Person>> {
            return this.getPersonnel()
                .then((allPersonnel) => {
                    let newIndexedCache = new apIndexedCacheFactory.IndexedCache<Person>();
                    _.each(allPersonnel, (person: Person) => {
                        if (person.employeeType === 'Government') {
                            newIndexedCache.addEntity(person);
                        }
                    })
                    return newIndexedCache;
                })
        }

        /**
         * @ngdoc function
         * @name personnelModel:getPersonnel
         * @methodOf personnelModel
         * @description
         * Async fetches all personnel a single time and returns the original promise for all subsequent calls.
         * @returns {IndexedCache<Person>} Active Angular-Point-Example personnel.
         */
        getPersonnel(): ng.IPromise<ap.IndexedCache<Person>> {
            /** Only query personnel once, data shouldn't change during session
             *  so just pass back the existing promise */
            var query = model.getQuery<Person>('primary');
            return query.promise;
        }

        /**
         * @ngdoc function
         * @name personnelModel:getUsersByGroupId
         * @methodOf personnelModel
         * @param {number} groupId Lookup ID of specified group.
         * @param {boolean} [asObject=false]  Optionally prevent conversion to an array.
         * @description
         * Return cached users by group.
         * @returns {Person}
         */
        getUsersByGroupId(groupId: number, asObject = false): ap.IndexedCache<Person> {
            return apLookupCacheService.retrieveLookupCacheById<Person>('group', model.list.getListId(), groupId, asObject);
        }

        /**
         * @ngdoc function
         * @name personnelModel:stringifyUserField
         * @methodOf personnelModel
         * @param {IUser|IUser[]} userObject User or UserMulti field on ListItem.
         * @param {object} [options] Optional params.
         * @param {string} [delim=';']  Delim used to seperate UserMulti user names.
         * @param {boolean} [lastNameFirst=false]  Format with users last name first.
         * @description
         * Converts a User or UserMulti type attribute on a ListItem into a string containing
         * their formatted name(s).
         * @returns {string} Formatted user names.
         */
        stringifyUserField(userObject: ap.IUser | ap.IUser[], options?: { delim?: string, lastNameFirst?: boolean }): string {
            var str = '';
            var opts: { delim?: string, lastNameFirst?: boolean } = _.assign({ delim: ';', lastNameFirst: false }, options);
            if (_.isArray(userObject)) {
                _.each(userObject, (userSid: ap.IUser, index: number) => {
                    var person = model.findBySiteId(userSid.lookupId);
                    if (person) {
                        str += index > 0 ? opts.delim + ' ' : '';
                        str += person.getFullName(opts.lastNameFirst);
                    }
                })
            } else if (userObject.lookupId) {
                var person = model.findBySiteId(userObject.lookupId);
                if (person) {
                    str = person.getFullName(opts.lastNameFirst);
                }
            }

            return str;
        }


    }

    angular.module('angular-point-example')
        .service('personnelModel', PersonnelModel);

}
