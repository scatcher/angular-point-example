module app {
    'use strict';

    let $timeout: ng.ITimeoutService, apUtilityService: ap.UtilityService

    function ChargeGuidancePanel() {
        return {
            controller: ChargeGuidancePanelController,
            controllerAs: 'panel',
            scope: {},
            templateUrl: 'modules/main/directives/chargeGuidancePanel.tpl.html'
        }
    }

    class ChargeGuidancePanelController {
        chargeGuidance: ChargeGuidance[];
        ready = false;
        constructor(chargeGuidanceModel: ChargeGuidanceModel) {

            var panel = this;
            //Expose Charge Guidance as a sorted array
            chargeGuidanceModel.getChargeGuidance()
                .then((chargeGuidance) => {
                    panel.chargeGuidance = _.sortBy(chargeGuidance, 'fileName');
                    panel.ready = true;
                });
        }
    }

    angular
        .module('angular-point-example')
        .directive('chargeGuidancePanel', ChargeGuidancePanel);
}
