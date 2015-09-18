/// <reference path="../app.module.ts" />
module app {
    'use strict';

    export interface IUser extends ap.IUser{}

    export var User = {lookupId: '', lookupValue:''};

    angular
        .module('angular-point-example')
        .value('user', User);


}
