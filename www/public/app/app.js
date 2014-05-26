angular.module('main', ['ngRoute', 'ui.route', 'main.system', 'main.home', 'main.sensors', 'main.messages', 'main.setting']);

angular.module('main.system', ['SkynetModel']);
angular.module('main.home', []);
angular.module('main.messages', []);
angular.module('main.setting', []);
angular.module('main.sensors', []);
