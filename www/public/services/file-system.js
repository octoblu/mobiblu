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

      var dest = FSRoot.toURL();

      if(!/\/$/.test(dest)){
        dest += '/';
      }
      dest += to;

      console.log('File Download to: ' + dest + ', from : ' + from);

      getFS()
        .then(function(){
          fileTransfer.download(
            encodeURI(from),
            dest,
            function(entry){
              console.log('Successful Download');
              deferred.resolve(entry);
            },
            function(err){
              console.log('Error Downloading: ' + JSON.stringify(err));
              deferred.reject(err);
            },
            false);
        }, deferred.reject);

      return deferred.promise;
    };

    return service;

  });