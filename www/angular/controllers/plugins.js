'use strict';

angular.module('main.plugins')
    .controller('PluginCtrl', function ($rootScope, $scope, $routeParams, $timeout, $location, OctobluRest, Utils, Subdevices, Plugins, PluginInstances) {

        $scope.init = function () {
            $rootScope.loading = false;
        };

        $scope.initSearch = function () {
            $rootScope.loading = true;

            $scope.results = [];
            $scope.allResults = [];

            Plugins.ready()
                .then(function(){
                    return Plugins.getPluginsList();
                })
                .then(handleSearchResults)
                .finally(function () {
                    $scope.getPlugins();
                });
        };

        $scope.results = [];
        $scope.allResults = [];

        var handleSearchResults = function (res) {

            $scope.results = $scope.results.concat(res.data || []);

            $scope.allResults = $scope.results;

            $rootScope.loading = false;
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

            for (var x in plugins) {
                var p = plugins[x];
                if (p.name === plugin.name) {
                    plugin = _.extend(p, plugin);
                    break;
                }
            }

            plugin.enabled = true;

            Plugins.download(plugin)
                .then(function (plugin) {
                    $rootScope.loading = false;
                    $scope.plugin = plugin;

                    $scope.addDevice();

                }, function (err) {
                    console.log('Error ' +  JSON.stringify(err));
                    $rootScope.loading = false;
                    $rootScope.redirectToCustomError('Unable to install that plugin. Missing required bundle.js file or a JavaScript error occurred.');
                });

        };

        $scope.redownload = function () {
            $rootScope.loading = false;

            Plugins.download($scope.plugin)
                .timeout(15 * 1000)
                .then(function (plugin) {
                    $timeout(function () {
                        $scope.plugin = plugin;
                        alert('Updated!');
                        window.location.reload();
                    }, 0);
                }, function (err) {
                    console.log('Error ', err);
                    $timeout(function () {
                        $rootScope.redirectToCustomError('Unable to install that plugin. Missing required bundle.js file or a JavaScript error occurred.');
                    }, 0);
                });

        };

        $scope.getPlugins = function () {
            $scope.plugins = Plugins.getPlugins();
            $scope.pluginNames = [];

            for (var x in $scope.plugins) {
                var plugin = $scope.plugins[x];
                $scope.pluginNames.push(plugin.name);
            }
        };

        $scope.getSubdevices = function () {
            Plugins.ready().then(function () {
                $scope.subdevices = Subdevices.retrieve();
                console.log('Subdevices :: ' + JSON.stringify($scope.subdevices));
            });
        };

        $scope.installed = function () {
            Plugins.ready().then(function () {
                $scope.getPlugins();
                $rootScope.loading = false;
            });
        };

        $scope.findOne = function (cb) {

            Plugins.ready().then(function () {
                console.log('Finding one :: ' + $routeParams.pluginName);
                $scope.getPlugins();

                var plugins = _.where($scope.plugins, { name : $routeParams.pluginName });

                if(plugins && plugins[0]){
                    console.log('Found one');
                    $scope.plugin = plugins[0];
                }else{
                    console.log('Cant find plugin :: ' + JSON.stringify($routeParams));
                    return;
                }

                if (!$scope.plugin.subdevices) {
                    $scope.plugin.subdevices = [];
                }
                console.log('Plugins::' + JSON.stringify($scope.plugin));

                $rootScope.loading = false;
                if (typeof cb === 'function') {
                    cb();
                }
            });
        };

        $scope.getSubdevicesName = function (name) {
            if (!$scope.subdevices) $scope.subdevices = Subdevices.retrieve();
            var number = 2;
            var found = false;
            for (var x in $scope.subdevices) {
                var device = $scope.subdevices[x];
                if (device.type === name) {
                    found = true;
                    if (device.name.match(/\s+\d*\s*$/)) {
                        var newNumber = device.name.replace(/.*\s+(\d+)\s*$/g, "$1");
                        newNumber = parseInt(newNumber);
                        if (newNumber && !isNaN(newNumber) && number <= newNumber) {
                            number = newNumber + 1;
                        }
                    }
                }
            }
            if (found) {
                return name.replace(/(\d+)\s*$/g, '') + ' ' + number.toString();
            } else {
                return name;
            }
        };

        $scope.addSubdevice = function (select) {
            var uuid = Utils.createID();
            var subdevice = {
                uuid: uuid,
                name: $scope.getSubdevicesName($scope.plugin.name),
                type: $scope.plugin.name,
                options: {

                }
            };
            $scope.plugin.subdevices.push(subdevice);
            if (select) $scope.selectSubdevice(subdevice);
            return uuid;
        };

        $scope.editDevice = function () {
            $scope.edit = !$scope.edit;
        };

        $scope.deleteDevice = function () {

            _.remove($scope.plugin.subdevices, { uuid : $scope.subdevice.uuid });

            PluginInstances.triggerDeviceEvent(
                $scope.subdevice,
                'destroy'
            ).then(function (err) {
                    if (err) console.log('Error deleting device', err);
                    $scope.subdevice = null;
                    $scope.writePlugin();
                    $timeout(function () {
                        $location.path('/plugins/' + $scope.plugin.name);
                    }, 0);
                }, $rootScope.redirectToError);
        };

        $scope.addDevice = function () {
            $scope.addSubdevice(true);
            $scope.writePlugin();
            $timeout(function(){
                $location.path('/plugins/device/' + $scope.subdevice.type + '/' + $scope.subdevice.uuid + '/1');
            }, 0);
        };

        $scope.goToDevice = function (subdevice) {
            console.log('Subdevice :: ' + JSON.stringify(subdevice));
            $location.path('/plugins/device/' + subdevice.type + '/' + subdevice.uuid + '/0');
        };

        $scope.loadSubdevice = function () {
            var uuid = $routeParams.deviceId;
            if(uuid && uuid.length){
                $scope.edit = !!parseInt($routeParams.configure);
                $scope.findOne(function () {

                    var subdevice = _.where($scope.plugin.subdevices, { uuid : uuid });

                    if(subdevice && subdevice[0]){
                        subdevice = subdevice[0];
                    }else{
                        $rootScope.redirectToCustomError('Device Not Found');
                    }
                    console.log('subdevice', JSON.stringify(subdevice), JSON.stringify(uuid));
                    $scope.selectSubdevice(subdevice);
                });
            }else{
                $rootScope.redirectToCustomError('Device Not Found');
            }
        };

        $scope.selectSubdevice = function (subdevice) {

            $scope.subdevice = subdevice;
            var options = subdevice.options || {};

            $scope.schemaEditor = {};

            console.log('subdevice ', JSON.stringify(subdevice));

            Plugins.triggerPluginEvent(
                $scope.plugin,
                'getDefaultOptions')
                .then(function (err, defaultOptions) {

                    if (!err && defaultOptions) {
                        options = _.extend(options, defaultOptions);
                    }
                    $scope.schema = $scope.plugin.optionsSchema;

                    console.log('Options ' + JSON.stringify(options));

                }, $rootScope.redirectToError);
        };

        $scope.savePlugin = function () {
            if($scope.schemaEditor && $scope.schemaEditor.getValue){
                $scope.subdevice.options = $scope.schemaEditor.getValue();
            }
            $scope.writePlugin();
        };

        $scope.writePlugin = function (init) {
            if(typeof init === 'undefined') init = false;

            if ($scope.subdevice) {
                var x = _.findIndex($scope.plugin.subdevices, { uuid : $scope.subdevice.uuid });
                if(~x){
                    $scope.plugin.subdevices[x] = $scope.subdevice;
                }else{
                    $scope.plugin.subdevices.push($scope.subdevice);
                }
            }

            Plugins.writePlugin($scope.plugin, init, true);
            if(!init){
                if($scope.subdevice){
                    console.log('Init subdevice', JSON.stringify($scope.subdevice));
                    Plugins.initDevice($scope.subdevice);
                }else{
                    Plugins.initPlugin($scope.plugin);
                }
            }

        };

        $scope.toggleEnabled = function () {
            $scope.plugin.enabled = !$scope.plugin.enabled;
            Plugins.triggerPluginEvent(
                $scope.plugin,
                $scope.plugin.enabled ? 'onEnable' : 'onDisable'
            ).then(function (err, data) {
                    if (err) return console.log('Error enabling or disabling plugin', err);
                    console.log('Data after enable or disable', JSON.stringify(data));
                }, $rootScope.redirectToError);
        };

        $scope.removePlugin = function () {
            Plugins.removePlugin(
                $scope.plugin
            ).then(function (err) {
                    if (err) console.log('Error removing plugin', err);
                    console.log('Removed plugin');
                    $timeout(function () {
                        $location.path('/plugins');
                    }, 0);
                }, $rootScope.redirectToError);
        };

        $scope.initDevice = function (subdevice) {
            Plugins.initDevice(subdevice);
            alert('Device Initialized!');
        };

        $scope.initPlugin = function (plugin) {
            Plugins.initPlugin(plugin);
            alert('Plugin Initialized!');
        };
    });