module app {
    'use strict';

    let $timeout: ng.ITimeoutService, apUtilityService: ap.UtilityService

    interface IDateRangeObject {
        end: Date;
        start: Date;
    }

    function WorkforceAvailabilityPanel() {
        return {
            bindToController: true,
            controller: WorkforceAvailabilityPanelController,
            controllerAs: 'panel',
            scope: { startDate: '=?' },
            templateUrl: 'modules/metrics/workforceAvailabilityPanel.tpl.html'
        }
    }

    class WorkforceAvailabilityPanelController {
        currentDate: Date;
        dateRangeLabel: string;
        endDate: Date;
        getGovernmentPersonnelCount: ng.IPromise<number>;
        ready = false;
        startDate: Date;
        workforceAvailabilityChart: WorkforceAvailabilityChart;
        constructor($scope: ng.IScope, private personnelModel: PersonnelModel, private leaveModel: LeaveModel,
            private travelModel: TravelModel, private $q: ng.IQService,
            private $injector: ng.auto.IInjectorService) {

            var panel = this;
            this.updateDateRange();
            $timeout = $injector.get('$timeout');
            apUtilityService = $injector.get('apUtilityService');

            panel.getGovernmentPersonnelCount = personnelModel.getPersonnel()
                .then(function(result) {
                    var governmentPersonnel = _.filter<Person>(result, { 'employeeType': 'Government' });
                    return governmentPersonnel.length;
                })

            this.updateChart();
        }
        updateChart() {
            var panel = this;
            panel.ready = false;
            panel.$q.all([
                panel.travelModel.calendarLookup(panel.startDate, panel.endDate),
                panel.leaveModel.calendarLookup(panel.startDate, panel.endDate),
                //Make sure personnel are resolved so we can get an accurate gov count
                panel.getGovernmentPersonnelCount
            ]).then(function(results) {

                //TRAVEL
                let travelDates = _.map(results[0], (travel: Travel) => {
                    return { start: travel.start, end: travel.end };
                });

                //LEAVE
                let leaveDates = _.chain(results[1])
                    .filter((leave: Leave) => leave.allDay)
                    .map((leave: Leave) => {
                        return { start: leave.start, end: leave.end };
                    })
                    .value();

                //PERSONNEL COUNT
                let governmentPersonnelCount = results[2];

                panel.workforceAvailabilityChart = new WorkforceAvailabilityChart(panel.startDate, panel.endDate);
                panel.workforceAvailabilityChart.updateChartValue(leaveDates, travelDates, governmentPersonnelCount);

                panel.ready = true;

            });
        }
        updateDateRange(date = new Date()) {
            this.currentDate = date;
            this.startDate = moment(date).startOf('week').add(1, 'days').toDate();
            this.endDate = moment(date).endOf('week').subtract(1, 'days').toDate();
            this.dateRangeLabel = moment(this.startDate).format('MM/DD/YYYY');
            this.dateRangeLabel += ' - ';
            this.dateRangeLabel += moment(this.endDate).format('MM/DD/YYYY');
        }
        setLastWeek() {
            //take the current end date - 7 and then set start and end date again
            var updatedDate = moment(this.currentDate).subtract(1, 'week').toDate();
            this.updateDateRange(updatedDate);
            this.updateChart();
        }
        setNextWeek() {
            //take the current end date + 7 and then set start and end date again
            var updatedDate = moment(this.currentDate).add(1, 'week').toDate();
            this.updateDateRange(updatedDate);
            this.updateChart();
        }

    }

    class WorkforceAvailabilityChart {
        type = 'ColumnChart';
        bars = 'vertical';
        displayed = true;
        data = {
            cols: [
                { id: 'date', type: 'string', label: 'Date' },
                { id: 'available', type: 'number', label: 'Available' },
                { id: 'leave', type: 'number', label: 'Leave' },
                { id: 'travel', type: 'number', label: 'Travel' }
            ],
            rows: []
        };
        options = {
            animation: {
                duration: 1000,
                easing: 'inAndOut'
            },
            vAxis: { format: '#\'%\'' },
            max: 100,
            fontName: '"Arial"',
            fontSize: 10
        };
        constructor(private startDate: Date, private endDate: Date) {

            //bulid the rows to include each day in the range
            var addDay: number = 0;
            var currentDate: Date = moment(startDate).toDate();

            while (currentDate < moment(endDate).endOf('day').toDate()) {
                var row = [
                    { v: currentDate.toDateString() },
                    { v: 0, f: '' },
                    { v: 0, f: '' },
                    { v: 0, f: '' },
                    { v: currentDate }
                ];
                this.data.rows.push({ c: row });
                currentDate = moment(currentDate).add(1, 'd').toDate();
                addDay += 1;
            }
        }

        getRequestCount(weekday: Date, requestDates: IDateRangeObject[]): number {
            var count = 0;
            //Only create comparision moment once
            var weekDayNum = apUtilityService.yyyymmdd(weekday);
            _.each(requestDates, (requestDate: { start: Date, end: Date }) => {
                var start = apUtilityService.yyyymmdd(requestDate.start);
                var end = apUtilityService.yyyymmdd(requestDate.end);
                if (weekDayNum === start || weekDayNum === end || (start < weekDayNum &&  end > weekDayNum)) {
                    count++;
                }
            })
            return count;
        }

        updateChartValue(leaveDateRanges: IDateRangeObject[], travelDateRanges: IDateRangeObject[], totalPopulation: number) {
            //Process each row representing a weekday
            _.each(this.data.rows, (row) => {

                let leaveCount = this.getRequestCount(row.c[4].v, leaveDateRanges);
                let travelCount = this.getRequestCount(row.c[4].v, travelDateRanges);

                let percentAvailable = ((totalPopulation - (leaveCount + travelCount)) / totalPopulation) * 100;
                let percentLeave = (leaveCount / totalPopulation) * 100;
                let percentTravel = (travelCount / totalPopulation) * 100;

                row.c[1].v = percentAvailable;
                row.c[1].f = percentAvailable.toFixed(1).toString() + "%";
                row.c[2].v = percentLeave;
                row.c[2].f = percentLeave.toFixed(1).toString() + "%";
                row.c[3].v = percentTravel;
                row.c[3].f = percentTravel.toFixed(1).toString() + "%";
            });
        }
    }

    angular
        .module('angular-point-example')
        .directive('workforceAvailabilityPanel', WorkforceAvailabilityPanel);
}
