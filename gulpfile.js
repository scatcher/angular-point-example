'use strict';

/* jshint camelcase:false */
var gulp = require('gulp');
var projectDir = __dirname + '/';
var config = require('./gulp.config')(projectDir);
var moment = require('moment');
var replace = require('gulp-replace');
require('angular-point-tools')(projectDir, config);

var template = require('gulp-template');

gulp.task('add-version-info', ['build'], function () {
    /** Can't declare above because part of the build process is to
     * increment version so we need to get it after running */
    var pkg = require('./package');

    return gulp.src('dist/index.html')
        .pipe(template({ version: pkg.version, buildDate: moment().format('dddd, MMMM Do YYYY, h:mm:ss A') }))
        .pipe(gulp.dest('dist'));
});

// gulp.task('deploy', function () {
gulp.task('deploy', ['add-version-info'], function () {
    var pkg = require('./package');
    return gulp.src('dist/scripts/scripts.js')
        .pipe(replace('var APP_BUILD_DATE;', 'var APP_BUILD_DATE = new Date(' + new Date().getTime() + ');'))
        .pipe(replace('var APP_BUILD_NUMBER;', 'var APP_BUILD_NUMBER = "' + pkg.version + '"'))
        .pipe(gulp.dest('dist/scripts'));
});