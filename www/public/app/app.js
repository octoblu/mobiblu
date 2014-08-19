'use strict';

angular.module('main', [
    'ngRoute',
    'ngSanitize',
    'ui.route',
    'leaflet-directive',
    'main.system',
    'main.user',
    'main.skynet',
    'main.octoblu',
    'main.labels',
    'main.home',
    'main.sensors',
    'main.plugins',
    'main.flows',
    'main.messages',
    'main.setting'
]);

angular.module('main.system', []);
angular.module('main.user', []);
angular.module('main.skynet', []);
angular.module('main.octoblu', []);
angular.module('main.labels', []);
angular.module('main.activity', []);
angular.module('main.home', []);
angular.module('main.messages', []);
angular.module('main.setting', []);
angular.module('main.sensors', []);
angular.module('main.plugins', []);
angular.module('main.flows', []);
