/// <reference path="../app.module.ts" />
module app {
    'use strict';

    var model: LeaveModel, personnelModel: PersonnelModel, toastr;

    /** Object Constructor (class)*/
    export class Leave extends ap.ListItem<Leave> {
        allDay: boolean;
        approvalDate: Date;
        approver: ap.IUser;
        approverRemarks: string;
        appVersion: number;
        backup: ap.ILookup;
        ccSIDs: ap.IUser[];
        date: string;
        from: Date;
        gatekeeper: ap.ILookup;
        gatekeeperSID: ap.IUser;
        hours: number;
        negotiatingWithServer: boolean = false;
        organizationalUnit: ap.ILookup;
        remarks: string;
        requesterSID: ap.IUser;
        status: string;
        title: string;
        to: Date;
        type: ap.ILookup;
        user: ap.ILookup;

        constructor(obj) {
            super();
            _.assign(this, obj);
        }

        get start() {
            return this.from;
        }

        get end() {
            return this.to;
        }

        get userSid() {
            return this.requesterSID.lookupId;
        }

        approve() {
            if (this.userCanApprove() && !this.negotiatingWithServer) {
                this.negotiatingWithServer = true;
                this.approver = personnelModel.userReference;
                this.approvalDate = new Date();
                this.status = 'Approved';

                return this.saveChanges()
                    .then(() => this.negotiatingWithServer = false)
            }
        }

        /** Allows us to open the modal from anywhere and pass back the promise */
        openModal() {
            return model.openModal(this);
        }

        reject() {
            if (this.userCanApprove()) {
                this.status = 'Rejected';
                return this.saveChanges();
            }
        }

        /** Ensure that user has the required permissions to approve/reject a request */
        userCanApprove() {
            var permMask = this.resolvePermissions();
            var canApprove = permMask.ApproveItems;
            if (!canApprove) {
                toastr.error('You don\'t have the necessary permissions to approve/reject');
            }
            return canApprove;
        }

    }

    export class LeaveModel extends ap.Model implements ICalendarRequestModel {
        icon = 'fa-suitcase';
        openModal: (leave: Leave) => ng.IPromise<any>;
        /** Array of choices for status */
        statusOptions = ['Pending Approval', 'Approved', 'Rejected'];
        sync: ap.sync.ISyncPoint;
        constructor($injector, apSyncService: ap.sync.ISyncService, apModalService) {

            //Model constructor
            super({
                factory: Leave,
                list: {
                    title: 'Leave',
                    guid: '{36795658-44A7-49CF-811B-5EE6092F3390}',
                    customFields: [
                        //User last name for display purposes in list only
                        { staticName: 'Title', objectType: 'Text', mappedName: 'title', readOnly: false },

                        //Dates of leave
                        { staticName: 'From', objectType: 'DateTime', mappedName: 'from', readOnly: false },
                        { staticName: 'To', objectType: 'DateTime', mappedName: 'to', readOnly: false },

                        //String representation of date range | used in email notifications
                        { staticName: 'DisplayDate', objectType: 'Text', mappedName: 'date', readOnly: false },

                        //All Day Event
                        { staticName: 'AllDay', objectType: 'Boolean', mappedName: 'allDay', readOnly: false },

                        //User that leave is being requested for and the SharePoint SID for that user
                        { staticName: 'User1', objectType: 'Lookup', mappedName: 'user', readOnly: false },
                        {
                            staticName: 'Requester_x002e_Name',
                            objectType: 'User',
                            mappedName: 'requesterSID',
                            readOnly: false
                        },

                        //User identified approver and SharePoint SID | approval request email sent to this person
                        { staticName: 'User2', objectType: 'Lookup', mappedName: 'gatekeeper', readOnly: false },
                        //Site collection SID of the gatekeeper above
                        {
                            staticName: 'Gatekeeper_x002e_Name',
                            objectType: 'User',
                            mappedName: 'gatekeeperSID',
                            readOnly: false
                        },

                        //Backup or POC while out
                        { staticName: 'InternalPOC', objectType: 'Lookup', mappedName: 'backup', readOnly: false },

                        //Any number of users who should be notified of the request for SA (They don't see request PII)
                        { staticName: 'CC', objectType: 'UserMulti', mappedName: 'ccSIDs', readOnly: false },

                        //User who approved request
                        { staticName: 'Approver', objectType: 'User', mappedName: 'approver', readOnly: false },

                        //Internal SharePoint approval status
                        {
                            staticName: '_ModerationStatus',
                            objectType: 'Integer',
                            mappedName: 'moderationStatus',
                            readOnly: true
                        },
                        //Approval status
                        { staticName: 'Status', objectType: 'Text', mappedName: 'status', readOnly: false },

                        //Approval Date
                        {
                            staticName: 'ApprovalDate',
                            objectType: 'DateTime',
                            mappedName: 'approvalDate',
                            readOnly: false
                        },

                        //Number of hours requested
                        { staticName: 'TotalHours', objectType: 'Float', mappedName: 'hours', readOnly: false },

                        //OU of the user requesting leave | helps to filter records by OU
                        {
                            staticName: 'OrganizationalUnit',
                            objectType: 'Lookup',
                            mappedName: 'organizationalUnit',
                            readOnly: false
                        },

                        //Version of the application responsible for creating the leave record (1App = 2)
                        { staticName: 'AppVersion', objectType: 'Integer', mappedName: 'appVersion', readOnly: false },

                        //PII Fields
                        { staticName: 'Remarks', objectType: 'Note', mappedName: 'remarks', readOnly: false },
                        {
                            staticName: 'ApprovalRemarks',
                            objectType: 'Note',
                            mappedName: 'approverRemarks',
                            readOnly: false
                        },
                        { staticName: 'LeaveType', objectType: 'Lookup', mappedName: 'type', readOnly: false }

                    ]
                }
            });

            model = this;
            personnelModel = $injector.get('personnelModel');
            toastr = $injector.get('toastr');


            /** Register a single query that by default returns all newer that 30 days ago */
            model.registerQuery({
                name: 'primary',
                query: '' +
                `<Query>
                   <Where>
                       <Geq>
                           <FieldRef Name="To"/>
                           <Value Type="DateTime">
                               <Today OffsetDays="-30"/>
                           </Value>
                       </Geq>
                   </Where>
                   <OrderBy>
                       <FieldRef Name="From" Ascending="TRUE"/>
                   </OrderBy>
                </Query>`
            });

            /** Get all records for the current user **/
            model.registerQuery({
                name: 'currentUser',
                //Store in session cache to speed up future requests for same data
                sessionCache: true,
                query: '' +
                `<Query>
                   <Where>
                       <Eq>
                           <FieldRef Name="Requester_x002e_Name" LookupId="TRUE" />
                           <Value Type="Integer"><UserID /></Value>
                       </Eq>
                   </Where>
                   <OrderBy>
                       <FieldRef Name="From" Ascending="FALSE"/>
                   </OrderBy>
                </Query>`
            });


            /** Get all pending requests **/
            model.registerQuery({
                name: 'pending',
                //Store in session cache to speed up future requests for pending requests
                sessionCache: true,
                query: '' +
                `<Query>
                   <Where>
                       <Eq>
                           <FieldRef Name="Status"/>
                           <Value Type="Text">${model.statusOptions[0]}</Value>
                       </Eq>
                   </Where>
                   <OrderBy>
                       <FieldRef Name="From" Ascending="TRUE"/>
                   </OrderBy>
                </Query>`
            });

            /** Pending My Approval **/
            model.registerQuery({
                name: 'pendingMyApproval',
                operation: 'GetListItems',
                query: '' +
                `<Query>
                   <Where>
                       <And>
                           <Eq>
                               <FieldRef Name="Gatekeeper_x002e_Name" LookupId="TRUE" />
                               <Value Type="Integer"><UserID /></Value>
                           </Eq>
                           <Eq>
                               <FieldRef Name="Status"/>
                               <Value Type="Text">${model.statusOptions[0]}</Value>
                           </Eq>
                       </And>
                   </Where>
                   <OrderBy>
                       <FieldRef Name="From" Ascending="TRUE"/>
                   </OrderBy>
                </Query>`
            });

            /** Get all requests overlapping the current day, don't want to use the session cache
             * here because we're using GetListItems so it's already a small request and we want
             * fresh data **/
            model.registerQuery({
                name: 'today',
                operation: 'GetListItems',
                query: '' +
                `<Query>
                   <Where>
                       <And>
                          <Leq>
                               <FieldRef Name="From"/>
                               <Value Type="DateTime"><Today/></Value>
                           </Leq>
                          <Geq>
                               <FieldRef Name="To"/>
                               <Value Type="DateTime"><Today/></Value>
                           </Geq>
                       </And>
                   </Where>
                </Query>`
            });


            model.openModal = apModalService.modalModelProvider({
                controller: 'leaveDialogController',
                controllerAs: 'vm',
                size: 'lg',
                templateUrl: 'modules/leave/leaveDialogView.html',
                resolver: function(leaveRecord: Leave) {
                    return {
                        leaveRecord: function(leaveModel, personnelModel, moment) {
                            return leaveRecord || leaveModel.createEmptyItem({
                                allDay: true,
                                from: moment({ hour: 7, minute: 30 }).toDate(),
                                to: moment({ hour: 16, minute: 0 }).toDate(),
                                user: personnelModel.lookupReference,
                                status: leaveModel.statusOptions[0],
                                /** v2 is the 1App version */
                                appVersion: 2,
                                type: { lookupId: 1 }
                            });
                        }
                    }
                }
            });

            model.sync = apSyncService.createSyncPoint(model);

        }

        /** Given a start and end date, function pulls records within that time period */
        calendarLookup(startDate: Date, endDate: Date): ng.IPromise<ap.IndexedCache<Leave>> {

            //A string date in ISO format, e.g., '2013-05-08T01: 20: 29Z-05: 00'
            var startString = moment(startDate).startOf('day').format('YYYY-MM-DDTHH: mm: ss[Z]Z');
            var endString = moment(endDate).endOf('day').format('YYYY-MM-DDTHH: mm: ss[Z]Z');

            //Reference to this query so we can use it again
            var queryKey = 'cal-' + startString + ' - ' + endString;

            /** Register query dynamically if it doesn't exist */
            if (!_.isObject(model.queries[queryKey])) {
                model.registerQuery({
                    name: queryKey,
                    //Store in session cache to speed up future requests for same date range and just request
                    //changes instead of entire dataset
                    sessionCache: true,
                    query: '' +
                    `<Query>
                        <Where>
                        <Or>` +
                    // Request start is before and end is after
                    `<And>
                                <Geq>
                                    <FieldRef Name="From"/>
                                    <Value Type="DateTime">${endString}</Value>
                                </Geq>
                                <Leq>
                                    <FieldRef Name="To"/>
                                    <Value Type="DateTime">${startString}</Value>
                                </Leq>
                            </And>
                            <Or>` +
                    // Request start date is within timeframe
                    `<And>
                                    <Geq>
                                        <FieldRef Name="From"/>
                                        <Value Type="DateTime">${startString}</Value>
                                    </Geq>
                                    <Leq>
                                        <FieldRef Name="From"/>
                                        <Value Type="DateTime">${endString}</Value>
                                    </Leq>
                                </And>` +
                    // Request end date is within timeframe
                    `<And>
                                    <Geq>
                                        <FieldRef Name="To"/>
                                        <Value Type="DateTime">${startString}</Value>
                                    </Geq>
                                    <Leq>
                                        <FieldRef Name="To"/>
                                        <Value Type="DateTime">${endString}</Value>
                                    </Leq>
                                </And>
                            </Or>
                        </Or>
                        </Where>
                        <OrderBy>
                            <FieldRef Name="From" Ascending="TRUE"/>
                        </OrderBy>
                    </Query>`
                });
            }
            return model.executeQuery<Leave>(queryKey);
        }


    }

    angular.module('angular-point-example')
        .service('leaveModel', LeaveModel);

}
