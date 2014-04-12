var rightButton = new steroids.buttons.NavigationBarButton(),
    skynetuuid = window.localStorage.getItem("skynetuuid"),
    skynettoken = window.localStorage.getItem("skynettoken");

if (skynetuuid && skynettoken) {
    rightButton.title = "Settings";
    rightButton.onTap = function () {
        webView = new steroids.views.WebView('/views/setting/index.html');
        steroids.layers.push(webView);
    };
} else {
    var newskynetuuid = getParam('uuid'),
        newskynettoken = getParam('token');

    if (newskynetuuid && newskynettoken) {
        window.localStorage.setItem("skynetuuid", newskynetuuid);
        window.localStorage.setItem("skynettoken", newskynettoken);
    }

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

function go_to_errors(){
    webView = new steroids.views.WebView("/views/setting/errors.html");
    steroids.layers.push(webView);
}
