/// <reference path="../../common/app.module.ts" />
module app.muster {
    'use strict';

    function MusterCardDirective() {
        return {
            bindToController: true,
            controller: MusterCardController,
            controllerAs: 'card',
            replace: true,
            scope: {
                musterSummary: '='
            },
            templateUrl: 'modules/muster/musterCardTemplate.html'
        };
    }

    class MusterCardController{
        accountedForTooltipText: string;
        musterSummary: MusterSummary;
        
        constructor() {
            let card = this;
            //Card based view doesn't have a icon to conditionally display muster notes so
            //append to status text if notes have been added
            if (card.musterSummary.muster && card.musterSummary.muster.notes) {
                card.accountedForTooltipText = `${card.musterSummary.accountedForTooltipText}<br><br>
                <strong>Notes:</strong> ${card.musterSummary.muster.notes}`;
            } else {
                //Default to standard text if a note isn't provided in muster record
                card.accountedForTooltipText = card.musterSummary.accountedForTooltipText;
            }
        } 
    }

    angular.module('angular-point-example')
        .directive('musterCard', MusterCardDirective);


}
