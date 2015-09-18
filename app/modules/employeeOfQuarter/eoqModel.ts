/// <reference path="../../common/app.module.ts" />
module app.eoq {
    'use strict';

    /** Object Constructor */
    export class EmployeeOfQuarterNomination extends ap.ListItem<EmployeeOfQuarterNomination> {
        attachments: string[];
        courteous: number;
        dependable: number;
        excellence: number;
        fy: number;
        highQuality: number;
        innovation: number;
        integrity: number;
        nominee: ap.IUser;
        organizationalUnit: ap.ILookup;
        professional: number;
        qtr: number;
        teamwork: number;
        timelyTaskCompletion: number;
        title: string;
        willingnessToHelp: number;
        writeUp: string;
        constructor(obj) {
            super();
            _.assign(this, obj);
        }
    }

    //Rating scale used for each rating based question
    let ratings: number[] = [1, 2, 3, 4, 5];

    /**
    * @ngdoc function
    * @name EmployeeOfQuarterModel
    * @description Model handling the EmployeeOfQuarter document library.
    */
    export class EmployeeOfQuarterModel extends ap.Model {
        submitEmployeeOfQuarter: ng.IPromise<ap.IndexedCache<EmployeeOfQuarterNomination>>;
        constructor() {

            //Model constructor
            super({
                factory: EmployeeOfQuarterNomination,
                list: {
                    title: 'EmployeeOfQuarter',
                    guid: '{02CB632F-80A7-4FC3-B07B-DAC0030488A4}',
                    customFields: [
                        {
                            mappedName: 'attachments',
                            objectType: 'Attachments',
                            staticName: 'Attachments',
                            readOnly: true
                        },
                        {
                            mappedName: 'courteous',
                            objectType: 'Choice',
                            staticName: 'Courteous',
                            description: 'The employee is courteous to fellow employees, supervisor, and staff.',
                            choices: ratings
                        },
                        {
                            mappedName: 'dependable',
                            objectType: 'Choice',
                            staticName: 'Dependable',
                            description: 'The employee is dependable and makes good use of their time.',
                            choices: ratings
                        },
                        {
                            mappedName: 'excellence',
                            objectType: 'Choice',
                            staticName: 'Excellence',
                            description: 'The employee demonstrates excellence with regular frequency.',
                            choices: ratings
                        },
                        {
                            mappedName: 'fy',
                            objectType: 'Number',
                            staticName: 'FY',
                            description: 'Fiscal Year'
                        },
                        {
                            mappedName: 'highQuality',
                            objectType: 'Choice',
                            staticName: 'HighQuality',
                            description: 'The employee provides high quality work.',
                            choices: ratings
                        },
                        {
                            mappedName: 'innovation',
                            objectType: 'Choice',
                            staticName: 'Innovation',
                            description: 'The employee demonstrates innovation with regular frequency.',
                            choices: ratings
                        },
                        {
                            mappedName: 'integrity',
                            objectType: 'Choice',
                            staticName: 'Integrity',
                            description: 'The employee demonstrates integrity with regular frequency.',
                            choices: ratings
                        },
                        {
                            mappedName: 'nominee',
                            objectType: 'User',
                            staticName: 'Nominee'
                        },
                        {
                            mappedName: 'organizationalUnit',
                            objectType: 'Lookup',
                            staticName: 'OrganizationalUnit',
                            description: 'Org unit for the nominee.'
                        },
                        {
                            mappedName: 'professional',
                            objectType: 'Choice',
                            staticName: 'Professional',
                            description: 'The employee is professional in interactions.',
                            choices: ratings
                        },
                        {
                            mappedName: 'qtr',
                            objectType: 'Number',
                            staticName: 'Qtr',
                            description: 'Fiscal quarter.'
                        },
                        {
                            mappedName: 'teamwork',
                            objectType: 'Choice',
                            staticName: 'Teamwork',
                            description: 'The employee demonstrates teamwork with regular frequency.',
                            choices: ratings
                        },
                        {
                            mappedName: 'timelyTaskCompletion',
                            objectType: 'Choice',
                            staticName: 'TimelyTaskCompletion',
                            description: 'The employee completed all tasks assigned in a timely manner.',
                            choices: ratings
                        },
                        {
                            mappedName: 'title',
                            objectType: 'Text',
                            staticName: 'Title',
                            description: 'Employees formatted name.'
                        },
                        {
                            mappedName: 'willingnessToHelp',
                            objectType: 'Choice',
                            staticName: 'WillingnessToHelp',
                            description: 'The employee demonstrates a willingness to help others.',
                            choices: ratings
                        },
                        {
                            mappedName: 'writeUp',
                            objectType: 'Note',
                            staticName: 'WriteUp',
                            description: 'State why this employee should be considered for Angular-Point-Example Employee of the Quarter. Describe any particular situations when the employee’s performance was exceptional for the period of nomination.',
                            choices: ratings
                        }
                    ]
                }
            });

            /**
             * Register a single query that by default returns all records for this list in ascending
             * order based on ID.  No name is necessary because this is the only query.
             */
            this.registerQuery({
                name: 'createdByCurrentUser',
                query: `
                <Query>
                    <Where>
                        <Eq>
                            <FieldRef Name="Author" LookupId="TRUE" />
                            <Value Type="Integer"><UserID /></Value>
                        </Eq>
                    </Where>
                </Query>`
            });            

        }


    }

    angular.module('angular-point-example')
        .service('employeeOfQuarterModel', EmployeeOfQuarterModel);
}
