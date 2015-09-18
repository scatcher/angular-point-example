/// <reference path="app.module.ts" />
module app {
    'use strict';

	/**
	 * @ngdoc Function
	 * @name Run
	 * @description
	 * Instantiate anything that needs to be run immediately when the application is loaded.
	 */
    function Run(logsModel: LogsModel) {
		//Logs model is ready to catch thrown exceptions

    }

	angular
        .module('angular-point-example')
        .run(Run);

}
