/// <reference path="../../common/app.module.ts" />
module app {
    'use strict';

    var model: LogsModel, logCounter = 0, maxLogsPerSesssion = 5;

    /**
     * @ngdoc function
     * @name Log
     * @description
     * Entity Constructor
     * @param {object} obj New entity to extend.
     * @constructor
     */
    export class Log extends ap.ListItem<Log>{
        cause: string;
        event: string;
        formattedStackTrace: string;
        json: Object;
        message: string;
        stackTrace: string[];
        type: string;
        url: string;
        constructor(obj) {
            super();
            _.assign(this, obj);
            /** Create a formatted representation of the stacktrace to display in email notification */
            if (this.stackTrace && !this.formattedStackTrace) {
                this.formattedStackTrace = '';
                _.each(this.stackTrace, (traceEntry) => {
                    this.formattedStackTrace += `${traceEntry}
                `;
                });
            }
        }
    }



    export class LogsModel extends ap.Model {
        constructor(apLogger: ap.Logger) {
            model = this;
            super({
                factory: Log,
                list: {
                    title: 'Logs',
                    guid: '{1035ED27-1511-4951-BC0B-4532E01DCF29}',
                    customFields: [
                        { staticName: 'Message', objectType: 'Note', mappedName: 'message', readOnly: false },
                        { staticName: 'Title', objectType: 'Text', mappedName: 'url', readOnly: false },
                        { staticName: 'LogType', objectType: 'Text', mappedName: 'type', readOnly: false },
                        { staticName: 'StackTrace', objectType: 'JSON', mappedName: 'stackTrace', readOnly: false },
                        { staticName: 'Cause', objectType: 'Text', mappedName: 'cause', readOnly: false },
                        { staticName: 'JSON', objectType: 'JSON', mappedName: 'json', readOnly: false },
                        { staticName: 'Event', objectType: 'Text', mappedName: 'event', readOnly: false },
                        {
                            staticName: 'FormattedStackTrace',
                            objectType: 'Note',
                            mappedName: 'formattedStackTrace',
                            readOnly: false,
                            description: 'Trace formatted to be readable in email notification.'
                        }
                    ]
                }
            });

            /** Register this model as the list where all logs will be stored */
            apLogger.subscribe(function(event: ap.ILogEvent) {
                /** Ensure we keep logging under control, prevents spamming server if loop occurs */
                if (logCounter < maxLogsPerSesssion) {
                    var newLog = model.createEmptyItem<Log>(event);
                    console.log(newLog);
                    newLog.saveChanges();
                    logCounter++;
                }
            });


        }
    }

    /**
     * @ngdoc service
     * @name LogsModel
     * @model
     * @description
     * Common definitions used in the application.
     *
     * @requires apModalService
     */
    angular.module('angular-point-example')
        .service('logsModel', LogsModel);

}
