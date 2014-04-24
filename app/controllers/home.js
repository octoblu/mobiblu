var homeApp = angular.module('homeApp', ['HomeModel', 'hmTouchevents', 'SkynetModel', 'SensorModel']);


// Index: http://localhost/views/home/index.html

homeApp.controller('IndexCtrl', function ($scope, $filter, HomeRestangular, Skynet, Sensors) {

    // Helper function for opening new webviews
    $scope.open = function (id) {
        var home = $filter('filter')($scope.homes.$$v, {
            home_id: id
        })[0];
        if(home && home.url){
            url = home.url;
        }else{
            url = "views/home/show.html?id=" + id;
        }
        webView = new steroids.views.WebView(url);
        steroids.layers.push(webView);
    };

    Skynet.init(function () {});

    // Fetch all objects from the local JSON (see app/models/home.js)
    $scope.homes = HomeRestangular.all('home').getList();

    steroids.view.navigationBar.show("Home");

});


// Show: http://localhost/views/home/show.html?id=<id>

homeApp.controller('ShowCtrl', function ($scope, $filter, HomeRestangular, Skynet, Sensors) {

    // Fetch all objects from the local JSON (see app/models/home.js)
    HomeRestangular.all('home').getList().then(function (homes) {
        // Then select the one based on the view's id query parameter
        $scope.home = $filter('filter')(homes, {
            home_id: steroids.view.params.id
        })[0];
        steroids.view.navigationBar.show($scope.home.name);
    });

    Skynet.init(function () {});

    $scope.startTracking = function (sensorType) {
        if (sensorType && typeof Sensors[sensorType] === 'function') {
            var sensorObj = Sensors[sensorType]();
            sensorObj.start(function (sensorData) {
                    var el = document.getElementById('sensorData');
                    if (el) {
                        var html = sensorObj.prettify(sensorData);
                        el.innerHTML = sensorObj.stream ? html + el.innerHTML : html;
                    }
                },
                function (err) {
                    alert('Error: ' + err.code);
                });
        }
    };

});
