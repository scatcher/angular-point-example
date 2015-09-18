/// <reference path="../app.module.ts" />
module app {
    'use strict';

    var model:TravelModel, personnelModel:PersonnelModel;

    /** Object Constructor (class)*/
    export class Travel extends ap.ListItem<Travel> {
        accomodations:string;
        additionalTravelers:string;
        approvalDate:Date;
        approvalRemarks:string;
        approvedBy:ap.IUser;
        attachments:string[];
        automobileRental:boolean;
        chargeNumber:string;
        contactPhone:string;
        location:string;
        modeOfTravel:string;
        negotiatingWithServer:boolean = false;
        ormAttached:boolean;
        purpose:string;
        remarks:string;
        requestedFor:ap.IUser;
        requesterOrgUnit:ap.ILookup;
        requestStatus:string;
        requestSubmittedTo:ap.IUser;
        title:string;
        travelCode:ap.ILookup;
        travelEndDate:Date;
        travelStartDate:Date;

        constructor(obj) {
            super();
            _.assign(this, obj);
        }

        get allDay() {
            return true;
        }

        get start() {
            return this.travelStartDate;
        }

        get end() {
            return this.travelEndDate;
        }

        get userSid(){
            return this.requestedFor.lookupId;
        }


        approve() {
            var self = this;
            if (this.userCanApprove(self) && !this.negotiatingWithServer) {
                self.negotiatingWithServer = true;
                self.approvedBy = personnelModel.userReference;
                self.approvalDate = new Date();
                self.requestStatus = 'Approved';

                return self.saveChanges()
                    .then(function () {
                        /** Remove temp flag to prevent multiple requests */
                        self.negotiatingWithServer = false;
                    });
            }
        }

        //Allows us to open the modal from anywhere and pass back the promise
        openModal() {
            return model.openModal(this);
        }

        reject() {
            var self = this;
            if (self.userCanApprove(self) && !self.negotiatingWithServer) {
                self.negotiatingWithServer = true;
                self.requestStatus = 'Rejected';
                return self.saveChanges()
                    .then(function () {
                        /** Remove temp flag to prevent multiple requests */
                        self.negotiatingWithServer = false;
                    });
            }
        }

        /** Ensure that user has the required permissions to approve/reject a request */
        userCanApprove(entity) {
            var permMask = entity.resolvePermissions();
            var canApprove = permMask.ApproveItems;
            if (!canApprove) {
                toastr.error('You don\'t have the necessary permissions to approve/reject');
            }
            return canApprove;
        }


    }

    export class TravelModel extends ap.Model implements ICalendarRequestModel {
        icon = 'fa-plane';
        openModal: (travel: Travel) => ng.IPromise<any>;
        sync:ap.sync.ISyncPoint;

        constructor($injector, apModalService:ap.modal.APModalService, private apUtilityService:ap.UtilityService,
                    apSyncService:ap.sync.ISyncService) {


            /** Model Constructor */
            super({
                factory: Travel,
                list: {
                    title: 'Travel',
                    guid: '{EB0104BD-EA8C-43FF-8385-CFAA3CC3BC3C}',
                    customFields: [
                        {staticName: 'Title', objectType: 'Text', mappedName: 'title', readOnly: false},
                        {staticName: 'RequestedFor', objectType: 'User', mappedName: 'requestedFor', readOnly: false},
                        {
                            staticName: 'RequestSubmittedTo',
                            objectType: 'User',
                            mappedName: 'requestSubmittedTo',
                            readOnly: false
                        },
                        {staticName: 'ApprovedBy', objectType: 'User', mappedName: 'approvedBy', readOnly: false},
                        {
                            staticName: 'TravelStartDate',
                            objectType: 'DateTime',
                            mappedName: 'travelStartDate',
                            readOnly: false
                        },
                        {
                            staticName: 'TravelEndDate',
                            objectType: 'DateTime',
                            mappedName: 'travelEndDate',
                            readOnly: false
                        },
                        {staticName: 'RequestStatus', objectType: 'Text', mappedName: 'requestStatus', readOnly: false},
                        {
                            staticName: 'ApprovalDate',
                            objectType: 'DateTime',
                            mappedName: 'approvalDate',
                            readOnly: false
                        },
                        {
                            staticName: 'ApprovalRemarks',
                            objectType: 'Note',
                            mappedName: 'approvalRemarks',
                            readOnly: false
                        },
                        {staticName: 'ChargeNumber', objectType: 'Text', mappedName: 'chargeNumber', readOnly: false},
                        {staticName: 'Purpose', objectType: 'Note', mappedName: 'purpose', readOnly: false},
                        {staticName: 'Location', objectType: 'Text', mappedName: 'location', readOnly: false},
                        {staticName: 'ModeOfTravel', objectType: 'Text', mappedName: 'modeOfTravel', readOnly: false},
                        {staticName: 'TravelCode', objectType: 'Lookup', mappedName: 'travelCode', readOnly: false},
                        {staticName: 'ContactPhone', objectType: 'Text', mappedName: 'contactPhone', readOnly: false},
                        {staticName: 'Accomodations', objectType: 'Note', mappedName: 'accomodations', readOnly: false},
                        {staticName: 'ORMAttached', objectType: 'Boolean', mappedName: 'ormAttached', readOnly: false},
                        {
                            staticName: 'AutomobileRental',
                            objectType: 'Boolean',
                            mappedName: 'automobileRental',
                            readOnly: false
                        },
                        {
                            staticName: 'AdditionalTravelers',
                            objectType: 'Text',
                            mappedName: 'additionalTravelers',
                            readOnly: false
                        },
                        {staticName: 'Remarks', objectType: 'Note', mappedName: 'remarks', readOnly: false},
                        {
                            staticName: 'RequesterOrgUnit',
                            objectType: 'Lookup',
                            mappedName: 'requesterOrgUnit',
                            readOnly: false
                        },
                        {
                            staticName: 'Attachments',
                            objectType: 'Attachments',
                            mappedName: 'attachments',
                            readOnly: true
                        }
                    ]
                }
            });


            personnelModel = $injector.get('personnelModel');
            model = this;


            /*********************************** Queries ***************************************/

            model.registerQuery({
                name: 'primary',
                query: '' +
                `<Query>
                   <Where>
                       <Geq>
                           <FieldRef Name="TravelStartDate"/>
                           <Value Type="DateTime">
                               <Today OffsetDays="-70"/>
                           </Value>
                       </Geq>
                   </Where>
                   <OrderBy>
                       <FieldRef Name="TravelStartDate" Ascending="TRUE"/>
                   </OrderBy>
                </Query>`
            });

            /** Get all records for the current user **/
            model.registerQuery({
                name: 'currentUser',
                query: '' +
                `<Query>
                   <Where>
                       <Eq>
                           <FieldRef Name="RequestedFor" LookupId="TRUE" />
                           <Value Type="Integer"><UserID /></Value>
                       </Eq>
                   </Where>
                   <OrderBy>
                       <FieldRef Name="TravelStartDate" Ascending="FALSE"/>
                   </OrderBy>
                </Query>`
            });


            /** Get all pending requests **/
            model.registerQuery({
                name: 'pending',
                query: '' +
                `<Query>
                   <Where>
                       <Eq>
                           <FieldRef Name="RequestStatus"/>
                           <Value Type="Text">Pending</Value>
                       </Eq>
                   </Where>
                   <OrderBy>
                       <FieldRef Name="TravelStartDate" Ascending="TRUE"/>
                   </OrderBy>
                </Query>`
            });

            /** All requests pending the current users approval **/
            model.registerQuery({
                name: 'pendingMyApproval',
                operation: 'GetListItems',
                query: '' +
                `<Query>
                   <Where>
                       <And>
                           <Eq>
                               <FieldRef Name="RequestSubmittedTo" LookupId="TRUE" />
                               <Value Type="Integer"><UserID /></Value>
                           </Eq>
                           <Eq>
                               <FieldRef Name="RequestStatus"/>
                               <Value Type="Text">Pending</Value>
                           </Eq>
                       </And>
                   </Where>
                   <OrderBy>
                       <FieldRef Name="TravelStartDate" Ascending="TRUE"/>
                   </OrderBy>
                </Query>`
            });


            /** Get all requests overlapping the current day **/
            model.registerQuery({
                name: 'today',
                operation: 'GetListItems',
                offlineXML: 'dev/Travel-Today.xml',
                query: '' +
                `<Query>
                   <Where>
                       <And>
                          <Leq>
                               <FieldRef Name="TravelStartDate"/>
                               <Value Type="DateTime"><Today/></Value>
                           </Leq>
                          <Geq>
                               <FieldRef Name="TravelEndDate"/>
                               <Value Type="DateTime"><Today/></Value>
                           </Geq>
                       </And>
                   </Where>
                </Query>`
            });

            model.openModal = apModalService.modalModelProvider({
                controller: 'travelDialogController',
                controllerAs: 'vm',
                size: 'lg',
                templateUrl: 'modules/travel/travelDialogView.html',
                resolver: function (travelRequest:Travel) {
                    return {
                        travelRequest: function (personnelModel:PersonnelModel, travelModel:TravelModel) {
                            return travelRequest || travelModel.createEmptyItem({
                                    requestStatus: 'Pending',
                                    requestedFor: {
                                        lookupId: personnelModel.user.accountName.lookupId,
                                        lookupValue: personnelModel.user.getFullName()
                                    }
                                });
                        }
                    }
                }
            });


            /********************* Model Specific Shared Functions ***************************************/

            model.sync = apSyncService.createSyncPoint(model);

        }

        /** Given a start and end date, function pulls records within that time period */
        calendarLookup(startDate:Date, endDate:Date):ng.IPromise<ap.IndexedCache<Travel>> {
            //A string date in ISO format, e.g., '2013-05-08T01: 20: 29Z-05: 00'
            var startString = moment(startDate).startOf('day').format('YYYY-MM-DDTHH: mm: ss[Z]Z');
            var endString = moment(endDate).endOf('day').format('YYYY-MM-DDTHH: mm: ss[Z]Z');

            //Reference to this query so we can use it again
            var queryKey = 'cal-' + startString + ' - ' + endString;

            /** Register query dynamically if it doesn't exist */
            if (!_.isObject(model.queries[queryKey])) {
                model.registerQuery({
                    name: queryKey,
                    query: '' +
                    `<Query>
                        <Where>
                        <Or>` +
                            // Request start is before and end is after
                            `<And>
                                <Geq>
                                    <FieldRef Name="TravelStartDate"/>
                                    <Value Type="DateTime">${endString}</Value>
                                </Geq>
                                <Leq>
                                    <FieldRef Name="TravelEndDate"/>
                                    <Value Type="DateTime">${startString}</Value>
                                </Leq>
                            </And>
                            <Or>` +
                                // Request start date is within timeframe
                                `<And>
                                    <Geq>
                                        <FieldRef Name="TravelStartDate"/>
                                        <Value Type="DateTime">${startString}</Value>
                                    </Geq>
                                    <Leq>
                                        <FieldRef Name="TravelStartDate"/>
                                        <Value Type="DateTime">${endString}</Value>
                                    </Leq>
                                </And>` +
                                // Request end date is within timeframe
                                `<And>
                                    <Geq>
                                        <FieldRef Name="TravelEndDate"/>
                                        <Value Type="DateTime">${startString}</Value>
                                    </Geq>
                                    <Leq>
                                        <FieldRef Name="TravelEndDate"/>
                                        <Value Type="DateTime">${endString}</Value>
                                    </Leq>
                                </And>
                            </Or>
                        </Or>
                        </Where>
                        <OrderBy>
                            <FieldRef Name="TravelStartDate" Ascending="TRUE"/>
                        </OrderBy>
                    </Query>`
                });
            }
            return model.executeQuery(queryKey);
        }

        userTravelToday(user) {
            var travelRecords = [];
            _.each(model.getCachedEntities(), (travelRecord) => {
                if (model.apUtilityService.dateWithinRange(travelRecord.travelStartDate, travelRecord.travelEndDate)) {
                    if (travelRecord.requestedFor.lookupId === user.accountName.lookupId) {
                        travelRecords.push(travelRecord);
                    }
                }
            });
            return travelRecords;
        }

    }

    angular.module('angular-point-example')
        .service('travelModel', TravelModel);


}
