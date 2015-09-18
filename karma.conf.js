// Karma configuration
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function (config) {
    config.set({
        // base path, that will be used to resolve files and exclude
        //basePath: 'app/',

        // testing framework to use (jasmine/mocha/qunit/...)
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: [
            'app/bower_components/jquery/dist/jquery.js',
            'app/bower_components/angular/angular.js',
            'app/bower_components/angular-mocks/angular-mocks.js',

            'app/bower_components/angular-sanitize/angular-sanitize.js',

            //Angular UI
            'app/bower_components/angular-ui-router/release/angular-ui-router.js',
            'app/bower_components/angular-bootstrap/ui-bootstrap.js',

            //3rd Party (Non Angular)
            'app/bower_components/chance/chance.js',
            'app/bower_components/moment/moment.js',
            'app/bower_components/lodash/dist/lodash.js',
            'app/bower_components/lodash-deep/lodash-deep.js',
            'app/bower_components/spin.js/spin.js',
            'app/bower_components/highcharts-release/highcharts.js',

            //Angular Plugins
            'app/bower_components/firebase/firebase.js',
            'app/bower_components/angular-toastr/dist/angular-toastr.js',
            'app/bower_components/ng-table/ng-table.js',
            'app/bower_components/angularfire/angularfire.js',
            'app/bower_components/angular-spinner/angular-spinner.js',
            'app/bower_components/highcharts-ng/dist/highcharts-ng.js',

            'app/bower_components/angular-point/dist/angular-point.js',
            'app/bower_components/angular-point-modal/dist/apModalService.js',
            'app/bower_components/angular-point-offline-generator/dist/ap-offline-generator.js',
            'app/bower_components/angular-point-sync/dist/angular-point-sync.js',

            'app/scripts/app.mock.js',

            'app/scripts/**/*.js',
            'app/modules/**/*.js',

            'test/**/*.js'

        ],

        // list of files / patterns to exclude
        exclude: ['app/scripts/app.js'],

        // web server port
        port: 8080,

        // level of logging
        // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
        logLevel: config.LOG_WARN,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,


        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        //browsers: ['Chrome'],
        browsers: ['PhantomJS'],

        preprocessors: {
            'scripts{services, factories, models, directives}/**/*.js': ['coverage']
        },
        //coverageReporter: {
        //    type: "lcov",
        //    dir: "coverage/"
        //},
        //plugins: [
        //    'karma-coverage'
        //],
        //proxies: {
        //    '/dev/': 'dev/'
        //},

        urlRoot: '/base',

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: true,

        reporters: ['progress', 'coverage'],

        colors: true

    });
};
