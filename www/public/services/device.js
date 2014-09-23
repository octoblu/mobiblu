'use strict';
angular.module('main')
    .service('Device', function ($q, $http, $rootScope, Skynet, reservedProperties) {
        var myDevices = [];
        var skynetPromise = Skynet.ready();

        function addDevice(device) {
            myDevices.push(device);
            skynetPromise.then(function (skynetConnection) {
                skynetConnection.unsubscribe({uuid: device.uuid, token: device.token});
                skynetConnection.subscribe({uuid: device.uuid, token: device.token});
            });
        }

        skynetPromise.then(function (skynetConnection) {
            skynetConnection.on('message', function (message) {
                $rootScope.$broadcast('skynet:message:' + message.fromUuid, message);
                if (message.payload && _.has(message.payload, 'online')) {
                    var device = _.findWhere(myDevices, {uuid: message.fromUuid});
                    if (device) {
                        device.online = message.payload.online;
                    }
                }
            });
        });

        var service = {
            getDevices: function (force) {
                var defer = $q.defer();
                if (myDevices.length && !force) {
                    defer.resolve(myDevices);
                } else {
                    skynetPromise
                        .then(function (skynetConnection) {
                            skynetConnection.mydevices({}, function (result) {
                                myDevices.length = 0;
                                _.each(result.devices, function (device) {
                                    addDevice(device);
                                });

                                defer.resolve(myDevices);
                            });
                        });
                }
                return defer.promise;
            },

            getDeviceByUUID: function(uuid){
                return service.getDevices().then(function(devices){
                    return _.findWhere(devices, {uuid: uuid});
                });
            },

            refreshDevices: function(){
                return service.getDevices(true).then(function(){
                    return undefined;
                });
            },

            getGateways: function(){
                return service.getDevices().then(function(devices){
                    return _.where(devices, {type: 'gateway'});
                });
            },

            registerDevice: function (options) {
                var device = _.omit(options, reservedProperties),
                    defer = $q.defer();

                skynetPromise.then(function (skynetConnection) {
                    device.owner = Skynet.skynetuuid;

                    skynetConnection.register(device, function (result) {
                        myDevices.push(result);
                        defer.resolve(result);
                    });
                });
                return defer.promise;
            },

            claimDevice: function (options) {
                var deviceOptions = _.omit(options, reservedProperties);

                return skynetPromise.then(function(){
                    deviceOptions.owner = Skynet.skynetuuid;
                    return service.updateDevice(deviceOptions);
                })
                .then(function(){
                    return service.refreshDevices();
                })
                .then(function(){
                    return service.getDeviceByUUID(deviceOptions.uuid);
                });
            },

            updateDevice: function (options) {
                var device = _.omit(options, reservedProperties),
                    defer = $q.defer();

                skynetPromise.then(function (skynetConnection) {
                    skynetConnection.update(device, function () {
                        defer.resolve(device);
                    });
                });

                return defer.promise;
            },

            unregisterDevice: function (device) {
                var defer = $q.defer();

                skynetPromise.then(function (skynetConnection) {
                    skynetConnection.unregister(device, function (result) {
                        service.getDevices(true).then(function(devices){
                            defer.resolve(devices);
                        });
                    });
                });

                return defer.promise;
            },

            getUnclaimed: function (nodeType) {
                if(nodeType === 'gateway'){
                    return service.getUnclaimedGateways();
                }

                return service.getUnclaimedDevices();
            },

            getUnclaimedDevices: function () {
                return service.getUnclaimedNodes().then(function (devices) {
                    return _.filter(devices, function(device){
                        return (device.type !== 'gateway');
                    });
                });
            },

            getUnclaimedGateways: function () {
                return service.getUnclaimedNodes().then(function (devices) {
                    return _.where(devices, {type: 'gateway'});
                });
            },

            getUnclaimedNodes: function() {
                var defer = $q.defer();

                skynetPromise.then(function (skynetConnection) {
                    skynetConnection.devices({owner : null}, function (result) {
                        defer.resolve(_.where(result.devices, {online: true}));
                    });
                });

                return defer.promise;
            },

            gatewayConfig: function (options) {
                var defer = $q.defer();

                skynetPromise.then(function (skynetConnection) {
                    skynetConnection.gatewayConfig(options, function (result) {
                        defer.resolve(result);
                    });
                });

                return defer.promise;
            },

            createSubdevice: function (options) {
                return service.gatewayConfig(_.extend({ method: 'createSubdevice' },
                    _.omit(options, reservedProperties)));
            },

            updateSubdevice: function (options) {
                return service.gatewayConfig(_.extend({ method: 'updateSubdevice' },
                    _.omit(options, reservedProperties)));
            },

            deleteSubdevice: function (options) {
                return service.gatewayConfig(_.extend({ method: 'deleteSubdevice' },
                    _.omit(options, reservedProperties)));
            },

            addLogoUrl: function(data) {
                if (data && data.type) {
                    data.logo = 'https://s3-us-west-2.amazonaws.com/octoblu-icons/' + data.type.replace(':', '/') + '.svg';
                }
                return data;
            }
        };

        return service;
    });
