var rightButton = new steroids.buttons.NavigationBarButton();

rightButton.title = "Login"; // TODO determine if logged in and then display settings button
rightButton.onTap = function() {
    window.location.href="http://octoblu.com/login?referrer=" + encodeURIComponent("http://localhost/views/setting/index.html");
};

steroids.view.navigationBar.setButtons({
  right: [rightButton]
});
