document.addEventListener("deviceready", function () {
    angular.bootstrap(document, ['skynetApp']);
});

var skynetApp = angular.module('skynetApp', ['hmTouchevents']);

// Index: http://localhost/views/skynet/index.html
skynetApp.controller('IndexCtrl', function ($scope) {

    // Populated by $scope.loadSkynets
    $scope.skynets = [];

    // Helper function for opening new webviews
    $scope.open = function (id) {
        webView = new steroids.views.WebView("/views/skynet/show.html?id=" + id);
        steroids.layers.push(webView);
    };

    // Get notified when an another webview modifies the data and reload
    window.addEventListener("message", function (event) {
        // reload data on message with reload status
        if (event.data.status === "reload") {
        }
    });


    // -- Native navigation

    // Set up the navigation bar
    steroids.view.navigationBar.show("Skynet");

    // Define a button for adding a new skynet
    var addButton = new steroids.buttons.NavigationBarButton();
    addButton.title = "Add";

    // Set a callback for the button's tap action...
    addButton.onTap = function () {
        var addView = new steroids.views.WebView("/views/skynet/new.html");
        steroids.modal.show(addView);
    };

    // ...and finally show it on the navigation bar.
    steroids.view.navigationBar.setButtons({
        right: [addButton]
    });


});


// Show: http://localhost/views/skynet/show.html?id=<id>

skynetApp.controller('ShowCtrl', function ($scope) {

    // Save current skynet id to localStorage (edit.html gets it from there)
    localStorage.setItem("currentSkynetId", steroids.view.params.id);

    // -- Native navigation
    var editButton = new steroids.buttons.NavigationBarButton();
    editButton.title = "Edit";

    editButton.onTap = function () {
        webView = new steroids.views.WebView("/views/skynet/edit.html");
        steroids.modal.show(webView);
    };

    steroids.view.navigationBar.setButtons({
        right: [editButton]
    });


});


// New: http://localhost/views/skynet/new.html

skynetApp.controller('NewCtrl', function ($scope) {

    $scope.close = function () {
        steroids.modal.hide();
    };

    $scope.create = function (options) {
        $scope.loading = false;
    };

    $scope.skynet = {};

});


// Edit: http://localhost/views/skynet/edit.html

skynetApp.controller('EditCtrl', function ($scope) {

    $scope.close = function () {
        steroids.modal.hide();
    };

    $scope.update = function (options) {
        $scope.loading = false;
    };

});
