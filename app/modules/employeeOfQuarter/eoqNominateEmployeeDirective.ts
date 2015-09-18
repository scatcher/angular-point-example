module app.eoq {
    'use strict';

    let $timeout: ng.ITimeoutService, apUtilityService: ap.UtilityService

    function NominateEmployeeOfQuarter() {
        return {
            controller: NominateEmployeeOfQuarterController,
            controllerAs: 'panel',
            templateUrl: 'modules/employeeOfQuarter/eoqNominateEmployeeTemplate.html'
        }
    }

    class NominateEmployeeOfQuarterController {
        ready = false;
        personnel: 
        constructor(personnelModel: PersonnelModel) {

            var panel = this;
            //Expose Charge Guidance as a sorted array
            personnelModel.getPersonnel()
                .then((personnel) => {
                    panel.chargeGuidance = _.sortBy(personnel, 'fileName');
                    panel.ready = true;
                });
        }
    }

    angular
        .module('angular-point-example')
        .directive('nominateEmployeeOfQuarter', NominateEmployeeOfQuarter);
}
