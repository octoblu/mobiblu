'use strict';

var homeApp = angular.module('main.home', ['HomeModel', 'hmTouchevents', 'SkynetModel', 'SensorModel']);

// Index: http://localhost/views/home/index.html

homeApp.controller('HomeCtrl', function ($scope, $filter, HomeRestangular, Skynet) {
    // Helper function for opening new webviews
    $scope.open = function (id) {
        var home = $filter('filter')($scope.homes.$$v, {
            home_id: id
        })[0];
        var url;
        if (home && home.url) {
            url = home.url;
        } else {
            url = 'views/home/show.html?id=' + id;
        }
        window.location = url;
    };

    Skynet.init(function () {});

    $scope.homes = HomeRestangular.all('home').getList();
    // Fetch all objects from the local JSON (see app/models/home.js)
});


// Show: http://localhost/views/home/show.html?id=<id>

homeApp.controller('ShowCtrl', function ($scope, $filter, HomeRestangular, Skynet, Sensors) {

    // Fetch all objects from the local JSON (see app/models/home.js)
    HomeRestangular.all('home').getList().then(function (homes) {
        // Then select the one based on the view's id query parameter
        $scope.home = $filter('filter')(homes, {
            home_id: steroids.view.params.id
        })[0];
    });

    Skynet.init(function () {
        $scope.startTracking = function (sensorType) {
            if (sensorType && typeof Sensors[sensorType] === 'function') {
                var sensorObj = Sensors[sensorType](3000);
                sensorObj.start(function (sensorData) {
                    var el = document.getElementById('sensorData');
                    if (el) {
                        var html = sensorObj.prettify(sensorData);
                        el.innerHTML = sensorObj.stream ? html + el.innerHTML : html;

                        Skynet.skynetSocket.emit('data', {
                            'uuid': Skynet.mobileuuid,
                            'token': Skynet.mobiletoken,
                            'sensorData': {
                                'type': sensorType,
                                'data': sensorData
                            }
                        }, function () {
                            el.innerHTML = html + '<strong>Skynet Updated</strong><hr>';
                        });
                    }
                },
                function (err) {
                    alert('Error: ' + err.code);
                });
            }
        };
    });


});
