'use strict';

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '.',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'sinon-chai', 'chai-as-promised'],


    // list of files / patterns to load in the browser
    files: [
      'www/components/jquery/dist/jquery.min.js',
      'www/components/lodash/dist/lodash.min.js',
      'www/components/steroids-js/steroids.js',
      'www/javascripts/utils.js',
      'www/javascripts/promises.js',
      'www/javascripts/touchstart.js',
      'www/javascripts/boost-storage.js',
      'www/javascripts/mobiblu-storage.js',
      'www/vendor/skynet/skynet.js',
      'www/components/leaflet-dist/leaflet.js',
      'www/components/angular/angular.min.js',
      'www/components/angular-route/angular-route.js',
      'www/components/angular-sanitize/angular-sanitize.js',
      'www/components/angular-ui-utils/ui-utils.min.js',
      'www/vendor/smoothie/smoothie.js',
      'www/components/json-editor/dist/jsoneditor.min.js',
      'www/public/skynet/bundle.js',
      'www/public/app/*.js',
      'www/public/angular/**/*.js',
      'www/public/models/*.js',
      'www/public/controllers/*.js',
      'www/public/plugins/bundle.js',
      'www/public/plugins/init.js',
      'www/components/angular-mocks/angular-mocks.js',
      'test/unit/**/*-spec.js'
    ],


    // list of files to exclude
    exclude: [
      'www/public/**/init.js'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'www/public/angular/**/*.html': 'ng-html2js'
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots', 'growl'],

    // web server port
    port: 9876,

    cordovaSettings: {
      platforms: ['android', 'ios'],
      plugins: [
        'org.apache.cordova.console',
        'org.apache.cordova.device',
        'org.apache.cordova.geolocation',
        'org.apache.cordova.splashscreen',
        'org.apache.cordova.network-information',
        'org.apache.cordova.inappbrowser',
        'org.apache.cordova.file'
      ]
    },

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Cordova'],
    // browsers: ['Chrome'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};