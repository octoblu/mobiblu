var Geolocation = (function(){
    var watchID = null;

    function trackGeolocation(){
        var el = document.getElementById('geolocation');
        if(el){
            var options = { timeout: 30000 };
            watchID = navigator.geolocation.watchPosition(onSuccess, onError, options);
        }
    }

    function clearGeolocation(){
        if(watchID){
            navigator.geolocation.clearWatch(watchID);
            watchID = null;
        }
    }

    // onSuccess Geolocation
    //
    function onSuccess(position) {
        var el = document.getElementById('geolocation');
        if(!el){
            return clearGeolocation();
        }
        el.innerHTML = 'Latitude: '  + position.coords.latitude      + '<br />' +
                            'Longitude: ' + position.coords.longitude     + '<br />' +
                            '<hr />'      + el.innerHTML;
    }

    // onError Callback receives a PositionError object
    //
    function onError(error) {
        alert('code: '    + error.code    + '\n' +
              'message: ' + error.message + '\n');
    }

    return {
        start : trackGeolocation
    };

})();
