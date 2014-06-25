'use strict';

document.addEventListener('deviceready', function(){
    //Fixing facebook bug with redirect
    if (window.location.hash === '#_=_') window.location.hash = '#!';

    //Then init the app
    angular.bootstrap(document, ['main']);

    steroids.on("ready", function() {
        console.log('Steroids ready');

        window.FSRoot = null;

        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
            window.FSRoot = fileSystem.root;
        }, null);

    });

}, false);
