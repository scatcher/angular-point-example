'use strict';

describe('Controller: Main', function () {

    // load the controller's module
    beforeEach(module('OneApp'));

    var mainCtrl,
        scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        mainCtrl = $controller('mainCtrl', {
            $scope: scope
        });
    }));

//    it('should attach a list of awesomeThings to the scope', function () {
//        expect(scope.test).toBe(3);
//    });
});
