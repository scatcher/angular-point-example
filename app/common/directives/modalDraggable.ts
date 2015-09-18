/// <reference path="../app.module.ts" />
module app {
    'use strict';

	//Allows us to drag any ui-bootstrap modal dialogs around    
	function draggable() {
		return {
			restrict: 'EA',
			link: function(scope, element) {
				element.draggable();
			}
		}
	}

	angular
        .module('angular-point-example')
        .directive('modalWindow', draggable);
}