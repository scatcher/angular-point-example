/// <reference path="../app.module.ts" />
module app {
    'use strict';

    /** Object Constructor (class)*/
    export class UserFeedback extends ap.ListItem<UserFeedback> {
        assignedToSID: ap.IUser;
        description: string;
        submittedBySID: ap.IUser;
        title: string;
        topic: string;
        constructor(obj) {
            super();
            _.assign(this, obj);
        }
    }

    export class UserFeedbackModel extends ap.Model {
        openModal;
        constructor(private $modal) {

            /** Model Constructor */
            super({
                factory: UserFeedback,
                list: {
                    title: 'UserFeedback',
                    /**Maps to the offline XML file in dev folder (no spaces) */
                    guid: '3A39BC68-4330-4B2A-863E-DE759A7EBDF3',
                    /**List GUID can be found in list properties in SharePoint designer */
                    customFields: [
                        /** Array of objects mapping each SharePoint field to a property on a list item object */
                        { staticName: 'AssignedTo', objectType: 'User', mappedName: 'assignedToSID', readOnly: false },
                        { staticName: 'Description', objectType: 'Note', mappedName: 'description', readOnly: false },
                        { staticName: 'SubmittedBy', objectType: 'User', mappedName: 'submittedBySID', readOnly: false },
                        { staticName: 'Title', objectType: 'Text', mappedName: 'title', readOnly: false },
                        { staticName: 'Topic', objectType: 'Text', mappedName: 'topic', readOnly: false }
                    ]
                }
            });
            
            


            /*********************************** Queries ***************************************/

            this.registerQuery({ name: 'primary' });


        /**
         * Opens modal dialog to add/edit an link record
         * @returns {promise} // Success = saved or deleted, Failure = dismissed dialog
         */
            this.openModal = () => {
                var modalInstance = this.$modal.open({
                    templateUrl: 'modules/userFeedback/userFeedbackDialogView.html',
                    controller: 'userFeedbackDialogController',
                    controllerAs: 'vm'
                });
                return modalInstance.result;
            }

        }




    }

    angular.module('angular-point-example')
        .service('userFeedbackModel', UserFeedbackModel);


}
