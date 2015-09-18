/// <reference path="../../common/app.module.ts" />
module app.eoq {
    'use strict';

    class DetailsController {
        accordionTemplate = 'modules/employeeOfQuarter/eoqAccordionInformationTemplate.html';
        eoq: EmployeeOfQuarterNomination;
        firstAccordionOpen = true;
        form: ng.IFormController; //angular-form object
        formFields: AngularFormly.IFieldGroup[];
        previousState: IPrevousState;
        constructor(eoq: EmployeeOfQuarterNomination, previousState: IPrevousState, private $state: ng.ui.IStateService,
            private personnelModel: PersonnelModel, private toastr, private apLogger: ap.Logger) {
            var vm = this;
            vm.eoq = eoq;
            vm.previousState = previousState;
            vm.formFields = this.generateFieldConfiguration(personnelModel);
        }
        //Need to save in order to add attachments
        addAttachments() {
            //Validate before proceeding
            if (!this.validateForm()) return;
            //Ensure employee org unit is correctly set
            this.updateSupportingInfo();
            
            this.eoq.saveChanges()
                .then((eoq) => {
                    //Successfully saved, navigate to edit view to add attachments
                    this.$state.go('eoq.edit', { id: eoq.id });
                })
                .catch(this.errorHandler);
        }
        back() {
            this.$state.go(this.previousState.name, this.previousState.params);
        }
        cancel() {
            if (this.eoq.id) {
                this.eoq.setPristine(this.eoq);
            }
            this.back();
        }
        delete() {
            let confirmation = confirm('Are you sure you want to delete this submission?');
            if (confirmation && this.eoq.id) {
                this.eoq.deleteItem()
                    .then(() => this.back());
            }
        }
        navigateBack() {
            //Different from back because we want to ensure the user wants to navigate away before changing state
            if (this.form.$dirty) {
                let confirmation = confirm('Are you sure you want to navigate away?  All changes will be lost.');
                if (!confirmation) {
                    return;
                }
            }
            this.back();


        }
        save() {
            if (!this.validateForm()) return;
            //Ensure employee org unit is correctly set
            this.updateSupportingInfo();

            this.eoq.saveChanges()
                .then((submission: EmployeeOfQuarterNomination) => {
                this.toastr.success('Thank you for taking the time to provide your nomination.');
                this.back();
                })
                .catch(this.errorHandler);
        }
        private errorHandler(err) {
            this.toastr.error('Oops...it looks like there was an issue submitting this nomination.  Your nomination has been saved as part of this bug report and our team is on it!')
            //Throw error with values as JSON so we can recover if necessary
            this.apLogger.error('Unable to submit employee nomination. ERR:' + err, { json: { eoq: JSON.stringify(this.eoq) } });
        }
        private generateFieldConfiguration(personnelModel: PersonnelModel): AngularFormly.IFieldGroup[] {
            return [
                //ROW 1
                {
                    className: 'row',
                    fieldGroup: [
                        //NOMINEE
                        {
                            className: 'col-sm-8 col-xs-12',
                            type: 'lookup',
                            key: 'nominee',
                            templateOptions: {
                                label: 'Nominee',
                                required: true,
                                options: personnelModel.getGovernmentPersonnel(),
                                lookupIdProperty: (person: Person) => person.userSid,
                                lookupValueProperty: (person: Person) => person.getFullName(true),
                                placeholder: 'Select a nominee...'
                                // description: 'Employees designated as team members are included in all filter views.'
                            }
                        },
                        //FY
                        {
                            className: 'col-sm-2 col-xs-6',
                            type: 'input',
                            key: 'fy',
                            defaultValue: getCurrentFiscalYear(),
                            templateOptions: {
                                type: 'number',
                                maxlength: 4,
                                label: 'FY',
                                required: true
                            }

                        },
                        //QTR
                        {
                            className: 'col-sm-2 col-xs-6',
                            type: 'input',
                            key: 'qtr',
                            defaultValue: getCurrentFiscalQuarter(),
                            templateOptions: {
                                type: 'number',
                                maxlength: 1,
                                label: 'Qtr',
                                required: true
                            }
                        }
                    ]
                },
                //HELP TEXT
                {
                    fieldGroup: [
                      {template: `<hr class="hr-sm">
                      <div class="help-block">Use the stars below to rate the nominee in each of the areas with 5-stars
                      being exceptional.  Use the information panels at the bottom of the page to find out additional
                      information on the program (click a topic to expand).</div>`}
                  ]  
                },                
                //ROW 2
                {
                    className: 'row',
                    fieldGroup: [
                        //QUALITY OF WORK STANDARDS
                        {
                            template: `<h4>Quality of Work Standards</h4>`
                        },
                        //HIGH QUALITY
                        {
                            className: 'col-xs-12',
                            type: 'eoqFiveStarRating',
                            key: 'highQuality',
                            templateOptions: {
                                required: true
                            }
                        },
                        //TIMELY TASK COMPLETION
                        {
                            className: 'col-xs-12',
                            type: 'eoqFiveStarRating',
                            key: 'timelyTaskCompletion',
                            templateOptions: {
                                required: true
                            }
                        },
                        //DEPENDABLE
                        {
                            className: 'col-xs-12',
                            type: 'eoqFiveStarRating',
                            key: 'dependable',
                            templateOptions: {
                                required: true
                            }
                        }
                    ]
                },          
                //ROW 3
                {
                    className: 'row',
                    fieldGroup: [
                        //ATTITUDE STANDARDS
                        {
                            template: `<h4>Attitude Standards</h4>`
                        },
                        //COURTEOUS
                        {
                            className: 'col-xs-12',
                            type: 'eoqFiveStarRating',
                            key: 'courteous',
                            templateOptions: {
                                required: true
                            }
                        },
                        //WILLINGNESS TO HELP
                        {
                            className: 'col-xs-12',
                            type: 'eoqFiveStarRating',
                            key: 'willingnessToHelp',
                            templateOptions: {
                                required: true
                            }
                        },
                        //PROFESSIONAL
                        {
                            className: 'col-xs-12',
                            type: 'eoqFiveStarRating',
                            key: 'professional',
                            templateOptions: {
                                required: true
                            }
                        }
                    ]
                },
                //ROW 4
                {
                    className: 'row',
                    fieldGroup: [
                        //VALUES ALIGNMENT STANDARDS
                        {
                            template: `<h4>Values Alignment Standards</h4>`
                        },
                        //EXCELLENCE
                        {
                            className: 'col-xs-12',
                            type: 'eoqFiveStarRating',
                            key: 'excellence',
                            templateOptions: {
                                required: true
                            }
                        },
                        //TEAMWORK
                        {
                            className: 'col-xs-12',
                            type: 'eoqFiveStarRating',
                            key: 'teamwork',
                            templateOptions: {
                                required: true
                            }
                        },
                        //INTEGRITY
                        {
                            className: 'col-xs-12',
                            type: 'eoqFiveStarRating',
                            key: 'integrity',
                            templateOptions: {
                                required: true
                            }
                        },
                        //INNOVATION
                        {
                            className: 'col-xs-12',
                            type: 'eoqFiveStarRating',
                            key: 'innovation',
                            templateOptions: {
                                required: true
                            }
                        }
                    ]
                },
                //ROW 5
                {
                    className: 'row',
                    fieldGroup: [
                        {
                            className: 'col-xs-12',
                            type: 'note',
                            key: 'writeUp',
                            templateOptions: {
                                label: 'Write Up'
                            }
                        }
                    ]
                },
                //ROW 5
                {
                    className: 'row',
                    //Only show attachments if we're in edit view
                    hideExpression: "!model.id",
                    fieldGroup: [
                        {
                            className: 'col-xs-12',
                            type: 'attachments',
                            key: 'attachments',
                            templateOptions: {
                                label: 'Attachments'
                            }
                        }
                    ]
                },
                //HELP TEXT
                {
                    fieldGroup: [
                      {template: `
                      <div class="text-info h4">Please note that the narrative is included in final
                      scoring.  It is important that the nominator provide ample details to allow
                      the Selection Committee to assess the nomination appropriately.</div>
                      <hr class="hr-sm">`} 
                  ]  
                },                                

            ]
        }
        private updateSupportingInfo() {
            let person = this.personnelModel.findBySiteId(this.eoq.nominee.lookupId);
            if (!person) {
                this.toastr.warning('Please make sure you have selected a valid nominee.');
                //Throw error with values as JSON so we can recover
                this.apLogger.error('Unable to find requested empoyee to complete nomination.', { json: JSON.stringify(this.eoq) });
            }
            this.eoq.organizationalUnit = person.group;
            this.eoq.title = person.getFullName();
        }
        private validateForm() {
            if (this.form.$invalid) {
                this.toastr.warning('Please ensure all requied fields and star ratings are filled in before moving forward.');
            }
            return this.form.$valid;
        }
    }

    function getCurrentFiscalQuarter(): number {
        let currentCalendarQuarter = moment().quarter();
        return currentCalendarQuarter == 4 ? 1 : currentCalendarQuarter + 1;
    }
    function getCurrentFiscalYear(): number {
        let currentCalendarQuarter = moment().quarter();
        let currentCalendarYear = moment().year();
        return currentCalendarQuarter < 4 ? currentCalendarYear : currentCalendarYear + 1;
    }

    angular.module('angular-point-example')
        .controller('eoqDetailsController', DetailsController);
}
