/*
 * Default Gruntfile for AppGyver Steroids
 * http://www.appgyver.com
 *
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    // grunt.initConfig({
    //     browserify: {
    //         plugins: {
    //             src: ['./www/public/plugins/index.js'],
    //             dest: './www/public/plugins/bundle.js',
    //             options: {
    //                 debug : true,
    //                 bundleOptions: {
    //                     standalone : 'octobluMobile'
    //                 }
    //             }
    //         },
    //         skynet: {
    //             src: ['./www/public/skynet/index.js'],
    //             dest: './www/public/skynet/bundle.js',
    //             options: {
    //                 debug : true,
    //                 bundleOptions: {
    //                     standalone : 'Skynet'
    //                 }
    //             }
    //         }
    //     }
    // });

    grunt.loadNpmTasks('grunt-steroids');

    //grunt.loadNpmTasks('grunt-browserify');

    grunt.registerTask('default', ['steroids-make', 'steroids-compile-sass']);

};
