'use strict';

window.rightButtonSet = false;

function add_buttons(){
    var skynetuuid = window.localStorage.getItem('skynetuuid'),
        skynettoken = window.localStorage.getItem('skynettoken');

    if(false && !window.rightButtonSet){
        window.rightButtonSet = true;
        var rightButton = new steroids.buttons.NavigationBarButton();
        if (window.loggedin && skynetuuid && skynettoken) {
            rightButton.title = 'Settings';
            rightButton.onTap = function () {
                console.log('On tap settings');
                var webView = new steroids.views.WebView('/views/setting/index.html');
                steroids.layers.push(webView);
            };
        } else {
            rightButton.title = 'Login';
            rightButton.onTap = function () {
                console.log('On tap login');
                var webView = new steroids.views.WebView('http://app.octoblu.com/login?referrer=' + encodeURIComponent('http://localhost/login.html'));
                steroids.layers.push(webView);
            };
        }
        steroids.view.navigationBar.setButtons({
            right: [rightButton],
            overrideBackButton: false
        },
        {
            onSuccess: function() {
                console.log('Button set!');
            },
            onFailure: function() {
                console.log('Failed to set button.');
            }
        });
    }
}

function onPageLoad(){
    console.log('On Page Load');
    window.loggedin = !!window.localStorage.getItem('loggedin');

    add_buttons();
    /*
    var element = document.getElementById('sensor-activity');
    var hammertime = Hammer(element).on('tap', function (event) {
        webView = new steroids.views.WebView('/views/setting/errors.html');
        steroids.layers.push(webView);
    });
    */

    if(getParam('logout')){
        console.log('Logged out', getParam('logout'));
        window.loggedin = false;
        steroids.layers.popAll(null, {
            onFailure : function(){
                var webView = new steroids.views.WebView('/views/home/index.html');
                steroids.layers.pop(webView);
            }
        });
    }
}

$(document).ready(function () {
    onPageLoad();

    document.addEventListener('visibilitychange', onVisibilityChange, false);

    steroids.view.navigationBar.hide();

    function onVisibilityChange() {
        if(document.visibilityState === 'visible'){
            window.loggedin = !!window.localStorage.getItem('loggedin');
            window.rightButtonSet = false;
            add_buttons();
        }
    }

    steroids.addons.urbanairship.enabled.then(function () {
        console.log('Ready, configured and listening for notifications!');
    }).error(function (error) {
        console.log('Could not enable Urban Airship: ' + error.message);
    });
});

function getParam(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    return (false);
}
