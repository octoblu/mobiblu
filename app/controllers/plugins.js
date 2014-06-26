'use strict';

var pluginsApp = angular.module('main.plugins', ['hmTouchevents', 'SkynetModel']);

pluginsApp.controller('PluginCtrl', function ($rootScope, $scope, $routeParams, $location, OctobluRest) {

    if (/\#\!\/plugins\/*$/.test(window.location.href)) {
        $rootScope.$emit('togglebackbtn', false);
    } else {
        $rootScope.$emit('togglebackbtn', true);
    }

    $scope.init = function () {
        $rootScope.loading = false;
    };

    $scope.initSearch = function () {
        var deferred = $q.deferred;
        $rootScope.ready(function(){
            $rootScope.loading = true;

            $scope.getPlugins();
            OctobluRest.searchPlugins('skynet-mobile-plugin', handleSearchResults);
            OctobluRest.searchPlugins('skynet-plugin', handleSearchResults);
        });
    };

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
        $rootScope.loading = false;

        if (err) {
            return console.log('Error searching', err);
        }

        $scope.results = $scope.results.concat(res.results || []);
        $scope.allResults = $scope.results;
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
        $rootScope.loading = true;

        var entry,
            fileTransfer = new FileTransfer(),
            directories = ['plugins', plugin.name],
            uri = encodeURI(plugin.bundle);

        function end(){
            $rootScope.loading = false;
            console.log('Ending');
        }

        function onError(error) {
            console.log('Error ', error);
            $scope.$apply(function(){
                end();
                $rootScope.redirectToError("Unable to install that plugin");
            });
        }

        function gotFS() {
            entry.getDirectory(directories[0], {
                create: true,
                exclusive: false
            }, createPluginDir, onError);
        }

        function createPluginDir() {
            entry.getDirectory(directories.join('/'), {
                create: true,
                exclusive: false
            }, onGetDirectorySuccess, onError);
        }

        function onGetDirectorySuccess(dir) {
            console.log('Created dir ' + dir.name);
            var file = '/bundle.js';
            fileTransfer.download(
                uri,
                steroids.app.absoluteUserFilesPath + '/' + directories.join('/') + file,
                function (entry) {
                    console.log('download complete: ' + entry.toURL());
                    plugin._url = entry.toURL();
                    plugin._path = '/plugins/' + plugin.name + file;
                    $rootScope.loading = false;
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
        $rootScope.ready(function(){
            $scope.getPlugins();
            $rootScope.loading = false;

        });
    };

    $scope.findOne = function () {
        $rootScope.ready(function() {
            $scope.getPlugins();

            for (var x in $scope.plugins) {
                var plugin = $scope.plugins[x];
                if (plugin.name === $routeParams.pluginName) {
                    $scope.plugin = plugin;
                    break;
                }
            }

            if (!$scope.plugin.subdevices) {
                $scope.plugin.subdevices = [];
            }

            if (!$scope.plugin.subdevices.length) {
                $scope.addSubdevice();
            }
            $rootScope.loading = false;
        });
    };

    $scope.addSubdevice = function(){
        var subdevice = {
            _id : Math.random().toString(36).substring(7),
            name : '',
            type : $scope.plugin.name,
            options : {

            }
        };
        $scope.plugin.subdevices.push(subdevice);
        $scope.selectSubdevice(subdevice);
    };

    $scope.selectSubdevice = function(subdevice){
        $scope.subdevice = subdevice;
        var options = subdevice.options || {};

        window.octobluMobile.triggerPluginEvent(
            $scope.plugin,
            'getDefaultOptions',
            function(err, defaultOptions){

                if(!err && defaultOptions){
                    options = _.extend(options, defaultOptions);
                }

                console.log('Options' + JSON.stringify($scope.plugin.optionsSchema));

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

            $scope.plugin.options = null;

            $scope.subdevice.options = options;

            for(var x in $scope.plugin.subdevices){
                var device = $scope.plugin.subdevices[x];
                if(device._id === $scope.subdevice._id){
                    $scope.plugin.subdevices[x] = $scope.subdevice;
                    break;
                }
            }
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
