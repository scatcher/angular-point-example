/// <reference path="../../common/app.module.ts" />
module app {
    'use strict';
    var vm: UserFeedbackDialogController;

    class UserFeedbackDialogController {
        negotiatingWithServer = false;
        userFeedback: UserFeedback;
        constructor($scope, private $modalInstance, private toastr, $location, private userFeedbackModel) {

            vm = this;
            vm.userFeedback = userFeedbackModel.createEmptyItem({
                title: '',
                description: '',
                topic: $location.$$url
            });

        }
        cancel() {
            vm.$modalInstance.dismiss('cancel');
        }
        save() {
            vm.negotiatingWithServer = true;
            //Create new task request record
            vm.userFeedback.saveChanges()
                .then(() => {
                    vm.toastr.success("Thanks for the feedback!");
                    vm.$modalInstance.close();
                }, () => {
                    vm.toastr.error("There was a problem saving your feedback.");
                    vm.$modalInstance.close();
                })
        }
    }


    angular.module('angular-point-example')
        .controller('userFeedbackDialogController', UserFeedbackDialogController);

}
