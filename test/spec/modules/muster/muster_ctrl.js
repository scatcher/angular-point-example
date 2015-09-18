'use strict';

describe('Controller: Muster', function () {

    // load the controller's module
    beforeEach(module('OneApp'));

    var musterCtrl,
        scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        musterCtrl = $controller('musterCtrl', {
            $scope: scope
        });
    }));

//    afterEach(function($rootScope){
//        rootScope.$apply();
//    });
//
    it('should resolve each of the queries', inject(function ($q, $timeout) {

        $timeout.flush();

        scope.ready.then(function(returnedArrays) {
            _.each(returnedArrays, function(resolvedPromise) {
                expect(resolvedPromise.length).toBeLessThan(1);
                window.console.log(returnedArrays);

            });
        });
    }));


    it('should have 3 user types', function () {
        expect(scope.userTypes.length).toBe(3);
    });
});
