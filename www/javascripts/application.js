window.rightButtonSet = false;

function add_buttons(){
    var skynetuuid = window.localStorage.getItem("skynetuuid"),
        skynettoken = window.localStorage.getItem("skynettoken");

    if(!window.rightButtonSet){
        window.rightButtonSet = true;
        console.log('loggedin', window.loggedin);
        var rightButton = new steroids.buttons.NavigationBarButton();
        if (window.loggedin && skynetuuid && skynettoken) {
            rightButton.title = "Settings";
            rightButton.onTap = function () {
                console.log("On tap settings");
                webView = new steroids.views.WebView('/views/setting/index.html');
                steroids.layers.push(webView);
            };
        } else {
            rightButton.title = "Login";
            rightButton.onTap = function () {
                console.log("On tap login");
                webView = new steroids.views.WebView("http://octoblu.com/login?referrer=" + encodeURIComponent("http://localhost/login.html"));
                steroids.layers.push(webView);
            };
        }
        steroids.view.navigationBar.setButtons({
            right: [rightButton],
            overrideBackButton: false
        },
        {
            onSuccess: function() {
                console.log("Button set!");
            },
            onFailure: function() {
                console.log("Failed to set button.");
            }
        });
    }
}

function onPageLoad(){
    console.log('On Page Load');
    window.loggedin = !!window.localStorage.getItem("loggedin");

    add_buttons();

    var element = document.getElementById('sensor-activity');
    var hammertime = Hammer(element).on("tap", function (event) {
        webView = new steroids.views.WebView("/views/setting/errors.html");
        steroids.layers.push(webView);
    });

    if(getParam('logout')){
        console.log('Logged out', getParam('logout'));
        window.loggedin = false;
        steroids.layers.popAll(null, {
            onFailure : function(){
                webView = new steroids.views.WebView("/views/home/index.html");
                steroids.layers.pop(webView);
            }
        });
    }
}

$(document).ready(function () {
    onPageLoad();

    document.addEventListener("visibilitychange", onVisibilityChange, false);

    function onVisibilityChange() {
        if(document.visibilityState === 'visible'){
            window.loggedin = !!window.localStorage.getItem("loggedin");
            window.rightButtonSet = false;
            add_buttons();
        }
    }

    steroids.addons.urbanairship.enabled.then(function () {
        console.log("Ready, configured and listening for notifications!");
    }).error(function (error) {
        console.log("Could not enable Urban Airship: " + error.message);
    });

    steroids.addons.urbanairship.notifications.onValue(function(notification) {
        alert("Message: " + notification.message);
    });
});

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
