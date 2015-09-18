module app.eoq {
    'use strict';

    function MyNominations() {
        return {
            controller: MyNominationsController,
            controllerAs: 'panel',
            scope: {},
            templateUrl: 'modules/employeeOfQuarter/eoqMyNominationsTemplate.html'
        }
    }

    class MyNominationsController {
        
        myNominations: ap.IndexedCache<EmployeeOfQuarterNomination>;
        ready = false;
        userHasNominated = false;
        constructor(employeeOfQuarterModel: EmployeeOfQuarterModel) {

            var panel = this;
            //Expose Charge Guidance as a sorted array
            employeeOfQuarterModel.executeQuery<EmployeeOfQuarterNomination>('createdByCurrentUser')
                .then((myNominations) => {
                    panel.myNominations = myNominations;
                    panel.ready = true;
                    panel.userHasNominated = myNominations.count() > 0;
                });
        }
    }

    angular
        .module('angular-point-example')
        .directive('myEmployeeOfQuarterNominations', MyNominations);
}
