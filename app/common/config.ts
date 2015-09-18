/// <reference path="app.module.ts" />
module app {
    'use strict';

    export interface IAPConfig extends ap.IAPConfig {
        buildNumber: string;
        buildDate: Date;
        defaultUrl: string;
        serverUrl: string;
    }

    function Config(apConfig: IAPConfig, toastrConfig, uiSelectConfig) {
        /** Set the default toast location */
        toastrConfig.positionClass = 'toast-bottom-right';

        /** Globally set ui-select theme */
        uiSelectConfig.theme = 'bootstrap';
        uiSelectConfig.resetSearchInput = true;
        
        /** UPDATE AND UNCOMMENT IF YOU'D LIKE TO USE FIREBASE TO SYNC DATA */ 
        // let FIREBASE_URL = 'https://MY-FIREBASE-URL.firebaseIO.com/';
        // apConfig.firebaseURL = apConfig.offline ? FIREBASE_URL + 'offline/' : FIREBASE_URL;

        apConfig.serverUrl = '//MY_SERVER_URL/';
        apConfig.defaultUrl = apConfig.serverUrl + 'SITE_COLLECTION/SITE/FOLDER';

        /** Prefix that when added to the account name evaluates to the full user login name (only used when needed)*/
        // apConfig.userLoginNamePrefix = 'i:0#.w|';

        //SET BY BUILD STEP AND AVAILABLE WITHIN APPLICATION
        var APP_BUILD_DATE;
        var APP_BUILD_NUMBER;

        apConfig.buildDate = APP_BUILD_DATE || new Date();
        apConfig.buildNumber = APP_BUILD_NUMBER || '1.23.45';

    }

    angular
        .module('angular-point-example')
        .config(Config);

}
