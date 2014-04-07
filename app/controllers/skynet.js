// Since we are using the Cordova SQLite plugin, initialize AngularJS only after deviceready
document.addEventListener("deviceready", function() {
  angular.bootstrap(document, ['skynetApp']);
});

var skynetApp = angular.module('skynetApp', ['SkynetModel', 'hmTouchevents']);

// Index: http://localhost/views/skynet/index.html
skynetApp.controller('IndexCtrl', function ($scope, Skynet) {

  // Populated by $scope.loadSkynets
  $scope.skynets = [];

  // Helper function for opening new webviews
  $scope.open = function(id) {
    webView = new steroids.views.WebView("/views/skynet/show.html?id="+id);
    steroids.layers.push(webView);
  };

  $scope.loadSkynets = function() {
    $scope.loading = true;

    persistence.clean();  // Clean persistence.js cache before making a query

    // Persistence.js query for all skynets in the database
    Skynet.all().list(function(skynets) {
      $scope.skynets = skynets;
      $scope.loading = false;
      $scope.$apply();
    });

  };

  // Fetch all objects from the backend (see app/models/skynet.js)
  $scope.loadSkynets();

  // Get notified when an another webview modifies the data and reload
  window.addEventListener("message", function(event) {
    // reload data on message with reload status
    if (event.data.status === "reload") {
      $scope.loadSkynets();
    };
  });


  // -- Native navigation

  // Set up the navigation bar
  steroids.view.navigationBar.show("Skynet index");

  // Define a button for adding a new skynet
  var addButton = new steroids.buttons.NavigationBarButton();
  addButton.title = "Add";

  // Set a callback for the button's tap action...
  addButton.onTap = function() {
    var addView = new steroids.views.WebView("/views/skynet/new.html");
    steroids.modal.show(addView);
  };

  // ...and finally show it on the navigation bar.
  steroids.view.navigationBar.setButtons({
    right: [addButton]
  });


});


// Show: http://localhost/views/skynet/show.html?id=<id>

skynetApp.controller('ShowCtrl', function ($scope, Skynet) {

  // Helper function for loading skynet data with spinner
  $scope.loadSkynet = function() {
    $scope.loading = true;

    persistence.clean(); // Clean persistence.js cache before making a query

    // Fetch a single object from the database
    Skynet.findBy(persistence, 'id', steroids.view.params.id, function(skynet) {
      $scope.skynet = skynet;
      $scope.loading = false;
      steroids.view.navigationBar.show(skynet.name);
      $scope.$apply();
    });

  };

  // Save current skynet id to localStorage (edit.html gets it from there)
  localStorage.setItem("currentSkynetId", steroids.view.params.id);

  var skynet = new Skynet()
  $scope.loadSkynet()

  // When the data is modified in the edit.html, get notified and update (edit will be on top of this view)
  window.addEventListener("message", function(event) {
    if (event.data.status === "reload") {
      $scope.loadSkynet();
    };
  });

  // -- Native navigation
  var editButton = new steroids.buttons.NavigationBarButton();
  editButton.title = "Edit";

  editButton.onTap = function() {
    webView = new steroids.views.WebView("/views/skynet/edit.html");
    steroids.modal.show(webView);
  }

  steroids.view.navigationBar.setButtons({
    right: [editButton]
  });


});


// New: http://localhost/views/skynet/new.html

skynetApp.controller('NewCtrl', function ($scope, Skynet) {

  $scope.close = function() {
    steroids.modal.hide();
  };

  $scope.create = function(options) {
    $scope.loading = true;

    var skynet = new Skynet(options);

    // Add the new object to the database and then persist it with persistence.flush()
    persistence.add(skynet);
    persistence.flush(function() {

      // Notify index.html to reload data
      var msg = { status: 'reload' };
      window.postMessage(msg, "*");

      $scope.close();
      $scope.loading = false;

    }, function() {
      $scope.loading = false;

      alert("Error when creating the object, is SQLite configured correctly?");

    });

  }

  $scope.skynet = {};

});


// Edit: http://localhost/views/skynet/edit.html

skynetApp.controller('EditCtrl', function ($scope, Skynet) {

  $scope.close = function() {
    steroids.modal.hide();
  };

  $scope.update = function(options) {
    $scope.loading = true;

    var skynet = new Skynet(options);

    // Update the database by adding the updated object, then persist the change with persistence.flush()
    persistence.add(skynet);
    persistence.flush(function() {

      window.setTimeout(function(){
        // Notify show.html below to reload data
        var msg = { status: "reload" };
        window.postMessage(msg, "*");
        $scope.close();
      }, 1000);

      $scope.loading = false;

    });

  };

  // Helper function for loading skynet data with spinner
  $scope.loadSkynet = function() {
    $scope.loading = true;

    var id  = localStorage.getItem("currentSkynetId");

    // Fetch a single object from the database
    Skynet.findBy(persistence, 'id', id, function(skynet) {
      $scope.skynet = skynet;
      $scope.loading = false;

      $scope.$apply();
    });
  };

  $scope.loadSkynet();

});