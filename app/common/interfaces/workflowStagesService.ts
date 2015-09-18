/// <reference path="../app.module.ts" />
module app {
    'use strict';


	export interface IWorkflowStagesService<T> {
		approvalStages: IWorkflowStage<T>[];
		generateDashboardUrl(listItem: ap.ListItem<T>): string;
		generateEmailDetails(listItem: ap.ListItem<T>): string;
		generateEmailNotification(listItem: ap.ListItem<T>, workflowStage: IWorkflowStage<T>, to: ap.ILookup|ap.ILookup[],
			body?: string, options?: { cc?: ap.IUser|ap.IUser[]; customText?: string }): ng.IPromise<T>;
		generateEmailSubject(listItem: ap.ListItem<T>, customText: string): string;
		generateRejectionEmail(listItem: ap.ListItem<T>, workflowStage: IWorkflowStage<T>, notificationText: string): ng.IPromise<T>
		generateReviewNotificationBody(listItem: ap.ListItem<T>): string;
		generateWorkflowNameArray(): string[];
		getFullNameOfTeamMember(listItem: ap.ListItem<T>, userFieldName: string, lastNameFirst?: boolean): string;
		getWorkflowStageByTitle(workflowTitle: string): IWorkflowStage<T>;
		logToHistoryList(listItem: ap.ListItem<T>, msg: string, options?: { description: string; }): ng.IPromise<any>;
        stagesIndexedByTitle: { [key: string]: IWorkflowStage<T> };
        workflowStages: IWorkflowStage<T>[];
	}

}