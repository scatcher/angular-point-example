/// <reference path="../app.module.ts" />
module app {
    'use strict';

    var model: CompRequestsModel, personnelModel: PersonnelModel, toastr: Toastr;

    /** Object Constructor (class)*/
    export class CompRequest extends ap.ListItem<CompRequest> {
        approvalComments: string;
        approvalDate: Date;
        approvalStatus: string;
        approver: ap.IUser;
        compHours: number;
        creditHours: number;
        endDate: Date;
        holidayHours: number;
        justification: string;
        negotiatingWithServer = false;
        organizationalUnit: ap.Lookup;
        overtimeHours: number;
        requestedFor: ap.IUser;
        startDate: Date;
        title: string;

        constructor(obj) {
            super();
            _.assign(this, obj);
        }
        /** Reference the Site Collection id for the requester */
        get userSid() {
            return this.requestedFor.lookupId;
        }
        /** Update approval fields and save changes */
        approve() {
            if (this.userCanApprove() && !this.negotiatingWithServer) {
                this.negotiatingWithServer = true;
                this.approver = personnelModel.userReference;
                this.approvalDate = new Date();
                this.approvalStatus = 'Approved';

                return this.saveChanges()
                    .then(() => {
                        this.negotiatingWithServer = false;
                    });
            }
        }        
        /** Returns the requesters name formatted as "LastName, FirstName" if a personnel record is available otherwise we
         * default to the Site Collection Name for the user.
         */
        getRequestersFullName() {
            let person = personnelModel.findBySiteId(this.requestedFor.lookupId);
            return person ? person.lexicographicName : this.requestedFor.lookupValue;
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


    export class CompRequestsModel extends ap.Model {
        icon = 'fa-hourglass-half';
        openModal: (compRequest: CompRequest) => ng.IPromise<any>;
        sync: ap.sync.ISyncPoint;
        constructor(private apModalService, $injector: ng.auto.IInjectorService, apSyncService: ap.sync.ISyncService) {

            /** Model Constructor */
            super({
                factory: CompRequest,
                list: {
                    title: 'CompRequests',
                    guid: '{CB511068-22C0-4AA3-8430-8D8AD56730F5}',
                    customFields: [
                        {staticName: 'Title', objectType: 'Text', mappedName: 'title', readOnly: false},
                        {staticName: 'Approver', objectType: 'User', mappedName: 'approver', readOnly: false},
                        {staticName: 'StartDate', objectType: 'DateTime', mappedName: 'startDate', readOnly: false},
                        {staticName: 'EndDate', objectType: 'DateTime', mappedName: 'endDate', readOnly: false},
                        {staticName: 'CompHours', objectType: 'Integer', mappedName: 'compHours', readOnly: false},
                        {staticName: 'CreditHours', objectType: 'Integer', mappedName: 'creditHours', readOnly: false},
                        {
                            staticName: 'OvertimeHours',
                            objectType: 'Integer',
                            mappedName: 'overtimeHours',
                            readOnly: false
                        },
                        {
                            staticName: 'HolidayHours',
                            objectType: 'Integer',
                            mappedName: 'holidayHours',
                            readOnly: false
                        },
                        {staticName: 'Justification', objectType: 'Memo', mappedName: 'justification', readOnly: false},
                        {
                            staticName: 'ApprovalComments',
                            objectType: 'Memo',
                            mappedName: 'approvalComments',
                            readOnly: false
                        },
                        {
                            staticName: 'ApprovalStatus',
                            objectType: 'Choice',
                            mappedName: 'approvalStatus',
                            readOnly: false
                        },
                        {
                            staticName: 'ApprovalDate',
                            objectType: 'DateTime',
                            mappedName: 'approvalDate',
                            readOnly: false
                        },
                        {staticName: 'RequestedFor', objectType: 'User', mappedName: 'requestedFor', readOnly: false},
                        {
                            staticName: 'OrganizationalUnit',
                            objectType: 'Lookup',
                            mappedName: 'organizationalUnit',
                            readOnly: false
                        }
                    ]
                }
            });
            
            model = this;
            personnelModel = $injector.get('personnelModel');
            toastr = $injector.get('toastr');
            model.sync = apSyncService.createSyncPoint(model);

            /*********************************** Queries ***************************************/

            model.registerQuery({name: 'primary'});

            /** Get all records for the current user **/
            model.registerQuery({
                name: 'currentUser',
                operation: 'GetListItems',
                offlineXML: 'xml-cache/CompRequests-Mine.xml',
                query: '' +
                '<Query>' +
                '   <Where>' +
                '       <Eq>' +
                '           <FieldRef Name="RequestedFor" LookupId="TRUE" />' +
                '           <Value Type="Integer"><UserID /></Value>' +
                '       </Eq>' +
                '   </Where>' +
                '   <OrderBy>' +
                '       <FieldRef Name="EndDate" Ascending="FALSE"/>' +
                '   </OrderBy>' +
                '</Query>'
            });

            /** Get all pending requests **/
            model.registerQuery({
                name: 'pending',
                operation: 'GetListItems',
                offlineXML: 'xml-cache/CompRequests-Pending.xml',
                query: '' +
                '<Query>' +
                '   <Where>' +
                '       <Eq>' +
                '           <FieldRef Name="ApprovalStatus"/>' +
                '           <Value Type="Text">Pending</Value>' +
                '       </Eq>' +
                '   </Where>' +
                '   <OrderBy>' +
                '       <FieldRef Name="EndDate" Ascending="TRUE"/>' +
                '   </OrderBy>' +
                '</Query>'
            });

            /** Register a single query that returns all newer that 30 days ago */
            model.registerQuery({
                name: 'recent',
                operation: 'GetListItems',
                offlineXML: 'xml-cache/CompRequests-Recent.xml',
                query: '' +
                '<Query>' +
                '   <Where>' +
                '       <And>' +
                '         <Geq>' +
                '             <FieldRef Name="Created"/>' +
                '             <Value Type="DateTime">' +
                '                 <Today OffsetDays="-30"/>' +
                '             </Value>' +
                '         </Geq>' +
                '         <Eq>' +
                '             <FieldRef Name="ApprovalStatus"/>' +
                '             <Value Type="Text">Approved</Value>' +
                '         </Eq>' +
                '       </And>' +
                '   </Where>' +
                '   <OrderBy>' +
                '       <FieldRef Name="ID" Ascending="FALSE"/>' +
                '   </OrderBy>' +
                '</Query>'
            });
            
            /** Pending My Approval **/
            model.registerQuery({
                name: 'pendingMyApproval',
                //Store in session cache to speed up future requests for same data
                operation: 'GetListItems',
                query: '' +
                `<Query>
                   <Where>
                       <And>
                           <Eq>
                               <FieldRef Name="Approver" LookupId="TRUE" />
                               <Value Type="Integer"><UserID /></Value>
                           </Eq>
                           <Eq>
                               <FieldRef Name="ApprovalStatus"/>
                               <Value Type="Text">Pending</Value>
                           </Eq>
                       </And>
                   </Where>
                   <OrderBy>
                       <FieldRef Name="ID" Ascending="FALSE"/>
                   </OrderBy>
                </Query>`
            });


            /********************* Model Specific Shared Functions ***************************************/

            /**
             * Opens modal dialog to add/edit/view a Comp Request
             * @param {object} request - defaults to new request if a request param isn't provided
             * @returns {promise} // Success = saved or deleted, Failure = dismissed dialog
             */
            model.openModal = apModalService.modalModelProvider({
                templateUrl: 'modules/compRequests/compRequestsDialogView.html',
                controller: 'compRequestDialogController',
                controllerAs: 'vm',
                resolver: function (compRequest: CompRequest) {
                    return {
                        compRequest: (compRequestsModel: CompRequestsModel, user) => {
                            /**Create empty request record if not provided**/
                            return compRequest || compRequestsModel.createEmptyItem({
                                    approvalStatus: 'Pending',
                                    requestedFor: user,
                                    /** Auto populate start and end with first and last days of the month for new requests*/
                                    startDate: moment().startOf('month').toDate(),
                                    endDate: moment().endOf('month').toDate()
                                });
                        },
                        modelExtended: () => model.extendListMetadata()
                    }
                }
            });

        }
    }

    angular.module('angular-point-example')
        .service('compRequestsModel', CompRequestsModel);


}
