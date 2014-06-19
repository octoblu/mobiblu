'use strict';

var pluginsApp = angular.module('main.plugins', ['hmTouchevents', 'SkynetModel', 'SensorModel']);

pluginsApp.controller('PluginCtrl', function ($scope, $routeParams, $location, OctobluRest) {

    if (/\#\!\/plugins\/*$/.test(window.location.href)) {
        $(document).trigger('togglebackbtn', false);
    } else {
        $(document).trigger('togglebackbtn', true);
    }

    $scope.init = function () {

    };

    $scope.initSearch = function () {
        $scope.loading = true;

        $scope.getPlugins();

        OctobluRest.searchPlugins('skynet-plugin', handleSearchResults);
        OctobluRest.searchPlugins('skynet-mobile-plugin', handleSearchResults);
    };

    $scope.loading = false;

    $scope.results = [];
    $scope.allResults = [];

    // var addToResults = function (results) {
    //     if (!results || !results.length) return;
    //     for (var x in results) {
    //         var plugin = results[x];
    //         if (!~$scope.pluginNames.indexOf(plugin.name)) {
    //             $scope.results.push(plugin);
    //         }
    //     }
    //     $scope.allResults = $scope.results;
    // };

    var handleSearchResults = function (err, res) {
        $scope.loading = false;

        if (err) {
            return console.log('Error searching', err);
        }

        $scope.results = $scope.results.concat(res.results || []);
    };

    $scope.search = function () {
        $scope.results = $scope.allResults;
        var term = $scope.term;
        if (term && term.length) {
            var searchRegex = new RegExp(term, 'i');
            $scope.results = _.filter($scope.allResults, function(plugin){
                return searchRegex.test(plugin.name) || searchRegex.test(plugin.description);
            });
        }
    };

    $scope.installPlugin = function (plugin) {
        $scope.loading = true;

        var entry,
            fileTransfer = new FileTransfer(),
            // Removed Fixed After
            uri = encodeURI(plugin.bundle);

        function end(){
            $scope.loading = false;
            console.log('Ending');
        }

        function onError(error) {
            console.log('Error ', error);
            $scope.$apply(function(){
                end();
                $scope.errorMsg = error.toString();
            });
        }

        function gotFS() {
            entry.getDirectory('plugins', {
                create: true,
                exclusive: false
            }, createPluginDir, onError);
        }

        function createPluginDir() {
            entry.getDirectory('plugins/' + plugin.name, {
                create: true,
                exclusive: false
            }, onGetDirectorySuccess, onError);
        }

        function onGetDirectorySuccess(dir) {
            console.log('Created dir ' + dir.name);
            var file = '/bundle.js';
            fileTransfer.download(
                uri,
                    dir.fullPath + file,
                function (entry) {
                    console.log('download complete: ' + entry.toURL());
                    plugin._url = entry.toURL();
                    plugin._path = '/plugins/' + plugin.name + file;
                    $scope.loading = false;
                    window.octobluMobile.loadPlugin(plugin, function () {
                        console.log('Plugin loaded');
                        window.location.href = 'index.html#!/plugins/' + plugin.name;
                    });
                },
                onError,
                false
            );
        }

        try{
            if(window.FSRoot){
                entry = window.FSRoot;
                gotFS();
            }else{
                onError(new Error('Error no access to file system.'));
            }
        }catch(e) {
            onError(new Error('No Error Installing Plugin'));
        }

    };

    $scope.getPlugins = function () {
        $scope.plugins = window.octobluMobile.getPlugins();
        $scope.pluginNames = [];

        for (var x in $scope.plugins) {
            var plugin = $scope.plugins[x];
            $scope.pluginNames.push(plugin.name);
        }
    };

    $scope.installed = function () {
        $scope.getPlugins();
    };

    $scope.findOne = function () {
        $scope.getPlugins();

        for (var x in $scope.plugins) {
            var plugin = $scope.plugins[x];
            if (plugin.name === $routeParams.pluginName) {
                $scope.plugin = plugin;
                break;
            }
        }

        var options = $scope.plugin.options || {};

            window.octobluMobile.triggerPluginEvent(
                plugin,
                'getDefaultOptions',
                function(err, defaultOptions){

                    if(!err && defaultOptions){
                        options = _.extend(options, defaultOptions);
                    }

                    $('#options-editor').jsoneditor({
                        schema: $scope.plugin.optionsSchema,
                        theme: 'bootstrap3',
                        startval: options,
                        no_additional_properties: true,
                        iconlib: 'fontawesome4',
                        disable_collapse: true
                    });
                });


    };

    $scope.savePlugin = function () {
        var errors = $('#options-editor').jsoneditor('validate');
        if (errors.length) {
            alert(errors);
        } else {

            var options = $('#options-editor').jsoneditor('value');

            console.log('Options', JSON.stringify(options));

            $scope.plugin.options = options;
        }
        window.octobluMobile.writePlugin($scope.plugin);

        $('body').css('height', '100%');
    };

    $scope.toggleEnabled = function () {
        $scope.plugin.enabled = !$scope.plugin.enabled;
        window.octobluMobile.triggerPluginEvent(
            $scope.plugin,
            $scope.plugin.enabled ? 'onEnable' : 'onDisable',
            function (err, data) {
                if (err) return console.log('Error enabling or disabling plugin', err);
                console.log('Data after enable or disable', JSON.stringify(data));
            }
        );
    };

    $scope.removePlugin = function () {
        window.octobluMobile.removePlugin(
            $scope.plugin,
            function (err) {
                if (err) return console.log('Error removing plugin', err);
                console.log('Removed plugin');
                $location.path('/plugins');
            }
        );
    };
});
