/// <reference path="../app.module.ts" />
module app {
        'use strict';

        export interface IUninstantiatedWorkflowStage<T>{
                //Description of task the users sees informing how to proceed
                action?: string;
                //Method to determine if the current user has any action at this stage
                actionRequired?: (listItem: ap.ListItem<T>) => boolean;
                //Is this an approval milestone
                approvalStage: boolean;
                //Property on list item to update if approval stage with current user
                approverField?: string;
                //Array of properties names on list item containing users to notifiy or predefined users/groups
                commentRecipients?: string[]| ap.IUser[];
                //Returns the To/CC recipients for rejection email
                getRejectionRecipients?(rmRecord: RMTracker): IWorkflowRejectionRecipients;
                //Determines if a list item is considered approved once it makes it to this stage
                isApproved?: boolean;
                //Identify the method on the list item prototype to call in order to advance workflow
                methodToProceed?: string;
                //Optionally provide a method to call when this stage is activated
                notify?(listItem: ap.ListItem<T>): ng.IPromise<any>;
                //Name of this stage
                title: string;
        }

        export interface IWorkflowStage<T> extends IUninstantiatedWorkflowStage<T>{
                index?: number;
                //Method called when a new comment is added during this workflow stage
                generateCommentNotification(listItem: ap.ListItem<T>, subject: string, comment: string): ng.IPromise<any>;
                //Resets to this stage on approver rejection
                getDefaultRejectionStage(): IWorkflowStage<T>;
                //Identifies the follow on workflow stage once this one is complete
                getNextStage(): IWorkflowStage<T>;
        }

        export interface IWorkflowRejectionRecipients {
                to: ap.IUser[];
                cc?: ap.IUser[];
        }

};