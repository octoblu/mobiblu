window.rightButtonSet = false;

var newskynetuuid = getParam('uuid'),
    newskynettoken = getParam('token');

if (newskynetuuid && newskynettoken) {
    window.localStorage.setItem("skynetuuid", newskynetuuid);
    window.localStorage.setItem("skynettoken", newskynettoken);
    steroids.layers.popAll();
}

if(getParam('logout')){
    steroids.layers.popAll();
}

window.onload = function () {
    if(!window.rightButtonSet){
        var rightButton = new steroids.buttons.NavigationBarButton(),
            skynetuuid = window.localStorage.getItem("skynetuuid"),
            skynettoken = window.localStorage.getItem("skynettoken");
        if (skynetuuid && skynettoken) {
            rightButton.title = "Settings";
            rightButton.onTap = function () {
                console.log('On tap');
                webView = new steroids.views.WebView('/views/setting/index.html');
                steroids.layers.push(webView);
            };
        } else {
            rightButton.title = "Login";
            rightButton.onTap = function () {
                webView = new steroids.views.WebView("http://octoblu.com/login?referrer=" + encodeURIComponent("http://localhost/views/setting/index.html"));
                steroids.layers.push(webView);
            };
        }
        steroids.view.navigationBar.setButtons({
            right: [rightButton],
            overrideBackButton: false
        });
    }

    var element = document.getElementById('sensor-activity');
    var hammertime = Hammer(element).on("tap", function (event) {
        webView = new steroids.views.WebView("/views/setting/errors.html");
        steroids.layers.push(webView);
    });

    steroids.addons.urbanairship.enabled.then(function () {
        console.log("Ready, configured and listening for notifications!");
    }).error(function (error) {
        console.log("Could not enable Urban Airship: " + error.message);
    });

    steroids.addons.urbanairship.notifications.onValue(function(notification) {
        alert("Message: " + notification.message);
    });
};

function getParam(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    return (false);
}
