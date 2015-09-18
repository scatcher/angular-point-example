module.exports = function (projectDir) {
    var app = projectDir + 'app/';
    var bowerDir = projectDir + 'bower_components/';
    var test = projectDir + 'test/';
    var tmp = projectDir + '.tmp/';

    var config = {
        tsWatchDebounce: 1000, //Delay a second after change before refreshing
        /** Optionally Override */
        //app: app,
        //test: test,
        //tmp:tmp,
        cdnjs: [
            bowerDir + "jquery/dist/jquery.js",
            bowerDir + "angular/angular.js",
            bowerDir + "jquery-ui/jquery-ui.js",
            bowerDir + "angular-sanitize/angular-sanitize.js",
            bowerDir + "angular-animate/angular-animate.js",
            bowerDir + "angular-resource/angular-resource.js",
            bowerDir + "angular-touch/angular-touch.js",
            bowerDir + "angular-messages/angular-messages.js"
        ],
        modules: [
            bowerDir + "angular-point/dist/angular-point.js",
            bowerDir + "angular-point-attachments/dist/angular-point-attachments.js",
            bowerDir + 'angular-point-discussion-thread/dist/angular-point-discussion-thread.js',
            bowerDir + 'angular-point-formly-templates/dist/angular-point-formly-templates.js',
            bowerDir + 'angular-point-modal/dist/angular-point-modal.js',
            bowerDir + "angular-point-group-manager/dist/angular-point-group-manager.js",
            bowerDir + 'angular-point-lookup-cache/dist/angular-point-lookup-cache.js',
            bowerDir + "angular-point-form-control/dist/apInputControl.js",
            bowerDir + 'angular-point-offline-generator/dist/angular-point-offline-generator.js',
            bowerDir + 'angular-point-sync/dist/angular-point-sync.js'
        ],
        vendorjs: [
            bowerDir + "moment/moment.js",
            bowerDir + "lodash/lodash.js",
            bowerDir + "lodash-deep/lodash-deep.js",
            bowerDir + "firebase/firebase.js",
            bowerDir + "angular-ui-router/release/angular-ui-router.js",
            bowerDir + "angular-bootstrap/ui-bootstrap-tpls.js",
            bowerDir + "angular-ui-select/dist/select.js",
            bowerDir + "angular-ui-date/src/date.js",
            bowerDir + "angular-ui-sortable/sortable.js",
            bowerDir + "angular-ui-calendar/src/calendar.js",
            bowerDir + "angular-ui-grid/ui-grid.js",
            bowerDir + 'api-check/dist/api-check.js',
            bowerDir + 'angular-formly/dist/formly.js',
            bowerDir + 'angular-formly-templates-bootstrap/dist/angular-formly-templates-bootstrap.js',
            bowerDir + "ng-table/dist/ng-table.js",
            bowerDir + "angularfire/dist/angularfire.js",
            bowerDir + "angular-toastr/dist/angular-toastr.js",
            bowerDir + "angular-toastr/dist/angular-toastr.tpls.min.js",
            bowerDir + "angular-loading-bar/build/loading-bar.js",
            bowerDir + "angular-filter/dist/angular-filter.js",
            bowerDir + "highcharts-release/highcharts.js",
            bowerDir + "highcharts-ng/dist/highcharts-ng.js",
            bowerDir + "angular-google-chart/ng-google-chart.js",
            bowerDir + "fullcalendar/dist/fullcalendar.js",
            bowerDir + "angular-elastic/elastic.js",
            bowerDir + 'stacktrace-js/dist/stacktrace.js',
            bowerDir + 'angular-drag-and-drop-lists/angular-drag-and-drop-lists.js'
        ],
        vendorcss: [
            bowerDir + "fullcalendar/dist/fullcalendar.css",
            bowerDir + "angular-ui-select/dist/select.css",
            bowerDir + "angular-ui-grid/ui-grid.css",
            bowerDir + "angular-toastr/dist/angular-toastr.css",
            bowerDir + "angular-loading-bar/build/loading-bar.css",
            bowerDir + "ng-table/dist/ng-table.css",
            bowerDir + "font-awesome/css/font-awesome.min.css",
            app + "styles/**/*bootstrap.css"
        ]
    };

    return config;
};
