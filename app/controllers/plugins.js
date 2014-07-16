'use strict';

var pluginsApp = angular.module('main.plugins', ['hmTouchevents', 'SkynetModel']);

pluginsApp.controller('PluginCtrl', function ($rootScope, $scope, $routeParams, $timeout, $location, OctobluRest) {

    if (/\#\!\/plugins\/*$/.test(window.location.href)) {
        $rootScope.$emit('togglebackbtn', false);
    } else {
        $rootScope.$emit('togglebackbtn', true);
    }

    $scope.init = function () {
        $rootScope.loading = false;
    };

    $scope.initSearch = function () {
        $rootScope.loading = true;

        $scope.results = [];
        $scope.allResults = [];

        OctobluRest.searchPlugins('skynet-mobile-plugin')
            .then(handleSearchResults, $rootScope.redirectToError);

        OctobluRest.searchPlugins('skynet-plugin')
            .then(handleSearchResults, $rootScope.redirectToError);

        $rootScope.pluginReady(function () {

            $scope.getPlugins();

        });
    };

    $scope.results = [];
    $scope.allResults = [];

    var handleSearchResults = function (res) {
        $timeout(function(){
            var data = res.data;

            $scope.results = $scope.results.concat(data.results || []);

            $scope.allResults = $scope.results;

            $rootScope.loading = false;
        }, 0);
    };

    $scope.search = function () {
        $scope.results = $scope.allResults;
        var term = $scope.term;
        if (term && term.length) {
            var searchRegex = new RegExp(term, 'i');
            $scope.results = _.filter($scope.allResults, function (plugin) {
                return searchRegex.test(plugin.name) || searchRegex.test(plugin.description);
            });
        }
    };

    $scope.installPlugin = function (plugin) {
        $rootScope.loading = true;

        var plugins = $scope.getPlugins();

        for(var x in plugins){
            var p = plugins[x];
            if(p.name === plugin.name){
                plugin = _.extend(p, plugin);
                break;
            }
        }

        window.octobluMobile.download(plugin)
            .timeout(15 * 1000)
            .then(function(plugin){
                $rootScope.loading = false;
                $scope.plugin = plugin;
                var subdeviceID = $scope.addSubdevice();
                window.location = 'index.html#!/plugins/device/' + plugin.name + '/' + subdeviceID;
            }, function(err){
                console.log('Error ', err);
                $scope.$apply(function () {
                    $rootScope.loading = false;
                    $rootScope.redirectToCustomError('Unable to install that plugin. Missing required bundle.js file or a JavaScript error occurred.');
                });
            });

    };

    $scope.redownload = function () {
        $rootScope.loading = true;

        window.octobluMobile.download($scope.plugin)
            .timeout(15 * 1000)
            .then(function(plugin){
                $timeout(function(){
                    $rootScope.loading = false;
                    $scope.plugin = plugin;
                    window.location.reload();
                }, 0);
            }, function(err) {
                console.log('Error ', err);
                $timeout(function () {
                    $rootScope.loading = false;
                    $rootScope.redirectToCustomError('Unable to install that plugin. Missing required bundle.js file or a JavaScript error occurred.');
                }, 0);
            });

    };

    $scope.getPlugins = function () {
        $scope.plugins = window.octobluMobile.getPlugins();
        $scope.pluginNames = [];

        for (var x in $scope.plugins) {
            var plugin = $scope.plugins[x];
            $scope.pluginNames.push(plugin.name);
        }
    };

    $scope.getSubdevices = function () {
        $rootScope.pluginReady(function () {
            $scope.subdevices = window.octobluMobile.getSubdevices();
            console.log('Subdevices :: ' + JSON.stringify($scope.subdevices));
        });
    };

    $scope.installed = function () {
        $rootScope.pluginReady(function () {
            $scope.getPlugins();
            $rootScope.loading = false;
        });
    };

    $scope.findOne = function (cb) {
        $rootScope.pluginReady(function () {
            $scope.getPlugins();

            for (var x in $scope.plugins) {
                var plugin = $scope.plugins[x];
                if (plugin.name === $routeParams.pluginName) {
                    $scope.plugin = plugin;
                    break;
                }
            }

            if(!$scope.plugin){
                console.log('Cant find plugin :: ' + JSON.stringify($routeParams));
                return;
            }

            if (!$scope.plugin.subdevices) {
                $scope.plugin.subdevices = [];
            }

            $rootScope.loading = false;
            if(typeof cb === 'function'){
                cb();
            }
        });
    };

    $scope.getSubdevicesName = function(name){
        if(!$scope.subdevices) $scope.subdevices = window.octobluMobile.getSubdevices();
        var number = 2;
        var found = false;
        for (var x in $scope.subdevices) {
            var device = $scope.subdevices[x];
            if (device.type === name) {
                found = true;
                if(device.name.match(/\s+\d*\s*$/)){
                    var newNumber = device.name.replace(/.*\s+(\d+)\s*$/g, "$1");
                    newNumber = parseInt(newNumber);
                    if(newNumber && !isNaN(newNumber) && number <= newNumber){
                        number = newNumber + 1;
                    }
                }
            }
        }
        if(found){
            return name.replace(/(\d+)\s*$/g, '') + ' ' + number.toString();
        }else{
            return name;
        }
    };

    $scope.addSubdevice = function (select) {
        var id = Math.random().toString(36).slice(2);
        var subdevice = {
            _id: id,
            name: $scope.getSubdevicesName($scope.plugin.name),
            type: $scope.plugin.name,
            options: {

            }
        };
        $scope.plugin.subdevices.push(subdevice);
        if(select) $scope.selectSubdevice(subdevice);
        return id;
    };

    $scope.editDevice = function(){
        $scope.edit = !$scope.edit;
    };

    $scope.deleteDevice = function(){
        for (var x in $scope.plugin.subdevices) {
            var device = $scope.plugin.subdevices[x];
            if (device._id === $scope.subdevice._id) {
                $scope.plugin.subdevices.splice(x, 1);
                break;
            }
        }

        window.octobluMobile.triggerDeviceEvent(
            $scope.subdevice,
            'destroy'
        ).then(function (err, data) {
                if (err) console.log('Error deleting device', err);
                $scope.subdevice = null;
                $scope.writePlugin();
                $timeout(function () {
                    $location.path('/plugins/' + $scope.plugin.name);
                }, 0);
            }, $rootScope.redirectToError);
    };

    $scope.addDevice = function(){
        $scope.addSubdevice(true);
        $scope.writePlugin();
        $location.path('/plugins/device/' + $scope.subdevice.type + '/' + $scope.subdevice._id);
    };

    $scope.goToDevice = function(subdevice){
        console.log('Subdevice :: ' + JSON.stringify(subdevice));
        $location.path('/plugins/device/' + subdevice.type + '/' + subdevice._id);
    };

    $scope.loadSubdevice = function(){
        $scope.edit = true;
        $scope.findOne(function(){
            for(var x in $scope.plugin.subdevices) {
                var subdevice = $scope.plugin.subdevices[x];
                if (subdevice._id === $routeParams.deviceId) {
                    $scope.selectSubdevice(subdevice);
                    return;
                }
            }
        });
    };

    $scope.selectSubdevice = function (subdevice) {

        $scope.subdevice = subdevice;
        var options = subdevice.options || {};

        window.octobluMobile.triggerPluginEvent(
            $scope.plugin,
            'getDefaultOptions')
            .then(function (err, defaultOptions) {

                if (!err && defaultOptions) {
                    options = _.extend(options, defaultOptions);
                }

                if($scope.plugin.optionsSchema){
                    $('#options-editor').jsoneditor({
                        schema: $scope.plugin.optionsSchema,
                        theme: 'bootstrap3',
                        startval: options,
                        no_additional_properties: true,
                        iconlib: 'fontawesome4',
                        disable_collapse: true,
                        form_name_root : ''
                    });
                }

            }, $rootScope.redirectToError);
    };

    $scope.savePlugin = function () {
        var errors = [];
        if($scope.plugin.optionsSchema) {
            errors = $('#options-editor').jsoneditor('validate');
        }
        if (errors.length) {
            alert(errors);
        } else {
            var options = {};
            if($scope.plugin.optionsSchema){
               options = $('#options-editor').jsoneditor('value');
            }

            console.log('Options', JSON.stringify(options));

            $scope.plugin.options = null;

            $scope.subdevice.options = options;

            $scope.writePlugin();
        }
    };

    $scope.writePlugin = function(){
        if($scope.subdevice){
            for (var x in $scope.plugin.subdevices) {
                var device = $scope.plugin.subdevices[x];
                if (device._id === $scope.subdevice._id) {
                    $scope.plugin.subdevices[x] = $scope.subdevice;
                    break;
                }
            }
        }

        window.octobluMobile.writePlugin($scope.plugin, true, true);
    }

    $scope.toggleEnabled = function () {
        $scope.plugin.enabled = !$scope.plugin.enabled;
        window.octobluMobile.triggerPluginEvent(
            $scope.plugin,
            $scope.plugin.enabled ? 'onEnable' : 'onDisable'
        ).then(function (err, data) {
                if (err) return console.log('Error enabling or disabling plugin', err);
                console.log('Data after enable or disable', JSON.stringify(data));
            }, $rootScope.redirectToError);
    };

    $scope.removePlugin = function () {
        window.octobluMobile.removePlugin(
            $scope.plugin
        ).then(function (err) {
                if (err) console.log('Error removing plugin', err);
                console.log('Removed plugin');
                setTimeout(function(){
                    $scope.$apply(function(){
                        $location.path('/plugins');
                    });
                }, 0);
            }, $rootScope.redirectToError);
    };

    $scope.initDevice = function(subdevice){
        window.octobluMobile.initDevice(subdevice);
        alert('Device Initialized!');
    };

    $scope.initPlugin = function(plugin){
        window.octobluMobile.initPlugin(plugin);
        alert('Plugin Initialized!');
    };
});
