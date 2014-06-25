/*
 * Default Gruntfile for AppGyver Steroids
 * http://www.appgyver.com
 *
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-steroids');


    grunt.initConfig({
        browserify: {
            plugins: {
                src: ['./www/public/plugins/index.js'],
                dest: './www/public/plugins/bundles/index.js',
                options: {
                    bundleOptions: {
                        standalone : 'octobluMobile',
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');

    grunt.registerTask('default', ['steroids-make', 'steroids-compile-sass', 'browserify']);

};
