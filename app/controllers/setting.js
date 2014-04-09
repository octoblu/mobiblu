var settingApp = angular.module('settingApp', ['hmTouchevents']);


// Index: http://localhost/views/setting/index.html

settingApp.controller('IndexCtrl', function ($scope) {

    // This will be populated with Restangular
    $scope.settings = [];

    // Helper function for opening new webviews
    $scope.open = function (id) {
        webView = new steroids.views.WebView("/views/setting/show.html?id=" + id);
        steroids.layers.push(webView);
    };

    // Helper function for loading setting data with spinner
    $scope.loadSettings = function () {
        $scope.loading = false;
    };

    $scope.skynetuuid = window.localStorage.getItem("skynetuuid");
    $scope.skynettoken = window.localStorage.getItem("skynettoken");

    // Get notified when an another webview modifies the data and reload
    window.addEventListener("message", function (event) {
        // reload data on message with reload status
        if (event.data.status === "reload") {}
    });


    // -- Native navigation

    // Set navigation bar..
    steroids.view.navigationBar.show("Setting");

    // ..and add a button to it
    var addButton = new steroids.buttons.NavigationBarButton();
    addButton.title = "Add";

    // ..set callback for tap action
    addButton.onTap = function () {
        var addView = new steroids.views.WebView("/views/setting/new.html");
        steroids.modal.show(addView);
    };

    // and finally put it to navigation bar
    steroids.view.navigationBar.setButtons({
        right: [addButton]
    });


});


// Show: http://localhost/views/setting/show.html?id=<id>

settingApp.controller('ShowCtrl', function ($scope) {

    // Helper function for loading setting data with spinner
    $scope.loadSetting = function () {
        $scope.loading = false;
    };

    // Save current setting id to localStorage (edit.html gets it from there)
    localStorage.setItem("currentSettingId", steroids.view.params.id);

    // When the data is modified in the edit.html, get notified and update (edit is on top of this view)
    window.addEventListener("message", function (event) {
        if (event.data.status === "reload") {
        }
    });

    // -- Native navigation
    steroids.view.navigationBar.show("Setting: " + steroids.view.params.id);

    var editButton = new steroids.buttons.NavigationBarButton();
    editButton.title = "Edit";

    editButton.onTap = function () {
        webView = new steroids.views.WebView("/views/setting/edit.html");
        steroids.modal.show(webView);
    };

    steroids.view.navigationBar.setButtons({
        right: [editButton]
    });


});


// New: http://localhost/views/setting/new.html

settingApp.controller('NewCtrl', function ($scope) {

    $scope.close = function () {
        steroids.modal.hide();
    };

    $scope.create = function (setting) {
        $scope.loading = false;
    };

    $scope.setting = {};

});


// Edit: http://localhost/views/setting/edit.html

settingApp.controller('EditCtrl', function ($scope) {

    var id = localStorage.getItem("currentSettingId");

    $scope.close = function () {
        steroids.modal.hide();
    };

    $scope.update = function (setting) {
        $scope.loading = false;
    };

    // Helper function for loading setting data with spinner
    $scope.loadSetting = function () {
        $scope.loading = false;
    };

    $scope.loadSetting();

});
