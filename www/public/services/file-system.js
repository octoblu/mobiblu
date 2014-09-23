'use strict';

angular.module('main.system')
  .service('FileSystem', function($window, $q) {
    var FSRoot = null;

    function getFS(){
      var deferred = $q.defer();
      if(FSRoot){
        deferred.resolve();
      }else{
        $window.requestFileSystem($window.LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
          console.log('Got File System');
          FSRoot = fileSystem.root;
          deferred.resolve();
        }, function(err) {
          console.log('Error getting filesystem: ' + JSON.stringify(err));
          deferred.reject(err);
        });
      }

      return deferred.promise;
    }

    var service = {};

    service.download = function(from, to){
      var deferred = $q.defer();
      var fileTransfer = new $window.FileTransfer();
      console.log('File Download to: ' + to + ', from : ' + from);

      getFS()
        .then(function(){
          fileTransfer.download(
            encodeURI(from),
            FSRoot.toURL() + to,
            deferred.resolve,
            deferred.reject,
            false);
        }, deferred.reject);

      return deferred.promise;
    };

    return service;

  });