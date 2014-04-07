var Compass = (function(){
    var watchID = null;

    // Start watching the compass
    function startWatch() {

        // Update compass every 3 seconds
        var options = { frequency: 3000 };

        watchID = navigator.compass.watchHeading(onSuccess, onError, options);
    }

    // Stop watching the compass
    function stopWatch() {
        if (watchID) {
            navigator.compass.clearWatch(watchID);
            watchID = null;
        }
    }

    // onSuccess: Get the current heading
    function onSuccess(heading) {
        var element = document.getElementById('heading');
        if(!element){
            return stopWatch();
        }
        element.innerHTML = 'Heading: ' + heading.magneticHeading;
    }

    // onError: Failed to get the heading
    function onError(compassError) {
        alert('Compass error: ' + compassError.code);
    }

    return {
        start : startWatch
    };
})();
