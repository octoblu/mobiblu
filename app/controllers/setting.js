var settingApp = angular.module('settingApp', ['SettingModel', 'hmTouchevents']);


// Index: http://localhost/views/setting/index.html

settingApp.controller('IndexCtrl', function ($scope, SettingRestangular) {

  // This will be populated with Restangular
  $scope.settings = [];

  // Helper function for opening new webviews
  $scope.open = function(id) {
    webView = new steroids.views.WebView("/views/setting/show.html?id="+id);
    steroids.layers.push(webView);
  };

  // Helper function for loading setting data with spinner
  $scope.loadSettings = function() {
    $scope.loading = true;

    settings.getList().then(function(data) {
      $scope.settings = data;
      $scope.loading = false;
    });

  };

  $scope.skynetuuid = Octoblu.getCookie('skynetuuid');
  $scope.skynettoken = Octoblu.getCookie('skynettoken');

  // Fetch all objects from the backend (see app/models/setting.js)
  var settings = SettingRestangular.all('setting');
  $scope.loadSettings();


  // Get notified when an another webview modifies the data and reload
  window.addEventListener("message", function(event) {
    // reload data on message with reload status
    if (event.data.status === "reload") {
      $scope.loadSettings();
    };
  });


  // -- Native navigation

  // Set navigation bar..
  steroids.view.navigationBar.show("Setting index");

  // ..and add a button to it
  var addButton = new steroids.buttons.NavigationBarButton();
  addButton.title = "Add";

  // ..set callback for tap action
  addButton.onTap = function() {
    var addView = new steroids.views.WebView("/views/setting/new.html");
    steroids.modal.show(addView);
  };

  // and finally put it to navigation bar
  steroids.view.navigationBar.setButtons({
    right: [addButton]
  });


});


// Show: http://localhost/views/setting/show.html?id=<id>

settingApp.controller('ShowCtrl', function ($scope, SettingRestangular) {

  // Helper function for loading setting data with spinner
  $scope.loadSetting = function() {
    $scope.loading = true;

     setting.get().then(function(data) {
       $scope.setting = data;
       $scope.loading = false;
    });

  };

  // Save current setting id to localStorage (edit.html gets it from there)
  localStorage.setItem("currentSettingId", steroids.view.params.id);

  var setting = SettingRestangular.one("setting", steroids.view.params.id);
  $scope.loadSetting()

  // When the data is modified in the edit.html, get notified and update (edit is on top of this view)
  window.addEventListener("message", function(event) {
    if (event.data.status === "reload") {
      $scope.loadSetting()
    };
  });

  // -- Native navigation
  steroids.view.navigationBar.show("Setting: " + steroids.view.params.id );

  var editButton = new steroids.buttons.NavigationBarButton();
  editButton.title = "Edit";

  editButton.onTap = function() {
    webView = new steroids.views.WebView("/views/setting/edit.html");
    steroids.modal.show(webView);
  }

  steroids.view.navigationBar.setButtons({
    right: [editButton]
  });


});


// New: http://localhost/views/setting/new.html

settingApp.controller('NewCtrl', function ($scope, SettingRestangular) {

  $scope.close = function() {
    steroids.modal.hide();
  };

  $scope.create = function(setting) {
    $scope.loading = true;

    SettingRestangular.all('setting').post(setting).then(function() {

      // Notify the index.html to reload
      var msg = { status: 'reload' };
      window.postMessage(msg, "*");

      $scope.close();
      $scope.loading = false;

    }, function() {
      $scope.loading = false;

      alert("Error when creating the object, is Restangular configured correctly, are the permissions set correctly?");

    });

  }

  $scope.setting = {};

});


// Edit: http://localhost/views/setting/edit.html

settingApp.controller('EditCtrl', function ($scope, SettingRestangular) {

  var id  = localStorage.getItem("currentSettingId"),
      setting = SettingRestangular.one("setting", id);

  $scope.close = function() {
    steroids.modal.hide();
  };

  $scope.update = function(setting) {
    $scope.loading = true;

    setting.put().then(function() {

      // Notify the show.html to reload data
      var msg = { status: "reload" };
      window.postMessage(msg, "*");

      $scope.close();
      $scope.loading = false;
    }, function() {
      $scope.loading = false;

      alert("Error when editing the object, is Restangular configured correctly, are the permissions set correctly?");
    });

  };

  // Helper function for loading setting data with spinner
  $scope.loadSetting = function() {
    $scope.loading = true;

    // Fetch a single object from the backend (see app/models/setting.js)
    setting.get().then(function(data) {
      $scope.setting = data;
      $scope.loading = false;
    });
  };

  $scope.loadSetting();

});
