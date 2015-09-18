module app {
    'use strict';

    function EmployeeDirectoryPanel() {
        return {
            controller: EmployeeDirectoryPanelController,
            controllerAs: 'panel',
            scope: {},
            templateUrl: 'modules/main/directives/employeeDirectoryPanel.html'
        }
    }

    class EmployeeDirectoryPanelController {
        ready = false;
        constructor(private $filter: ng.IFilterService, private uiGridConstants, personnelModel: PersonnelModel) {
            var panel = this;
            //Get personnel
            personnelModel.getPersonnel()
                .then((personnel) => {
                    panel.personnelGrid.data = personnel.toArray();
                    panel.ready = true;
                });
        }
        personnelGrid = {
            data: undefined,
            enableFiltering: true,
            columnDefs: [
                {
                    field: 'fullName',
                    displayName: 'Person',
                    sort: {
                        direction: this.uiGridConstants.ASC,
                        priority: 1
                    }
                    // cellTemplate: '' +
                    // `<div class="ui-grid-cell-contents">
                    //         <a href ui-sref="rm.details({trackerId: row.entity.id })">
                    //             {{ grid.getCellValue(row, col) }}
                    //         </a>
                    // </div>`
                },
                { field: 'group.lookupValue', displayName: 'Group', width: 75 },
                { field: 'phone', displayName: 'Phone' },
                {
                    field: 'employeeType',
                    displayName: 'Type',
                    width: 50,
                    cellTemplate: '' +
                    `<div class="ui-grid-cell-contents" title="{{ grid.getCellValue(row, col) }}">
                        {{grid.getCellValue(row, col) === 'Government' ? 'Gov': 'Ctr'}}
                    </div>`
                }
            ]
        }
    }

    angular
        .module('angular-point-example')
        .directive('employeeDirectoryPanel', EmployeeDirectoryPanel);
}
