/// <reference path="../../common/app.module.ts" />
module app {
    'use strict';
    
    interface IPanel {
        label: string;
        template: string;
    }
    
    // let panels: IPanel[] = [
    //     {
    //         label: 'chargeGuidance',
    //         template: '<charge-guidance-panel></charge-guidance-panel>'
    //     },
    //     {
    //         label: 'workforceAvailability',
    //         template: '<workforce-availability-panel></workforce-availability-panel>'
    //     },
    //     {
    //         label: 'myEmployeeOfQuarterNominations',
    //         template: '<my-employee-of-quarter-nominations></my-employee-of-quarter-nominations>'
    //     }
    // ]

    class MainController {
        // hiddenPanels = [];
        // selected: IPanel;
        // visiblePanels = panels;
        constructor() {
            var vm = this;
            
        }
        
    }

    angular.module('angular-point-example')
        .controller('mainController', MainController);
}
