'use strict';

angular.module('main.system')
  .service('Utils', function() {
    return {
        getParam : function (variable, url) {
            if(!url) url = window.location.href;
            if(!~url.indexOf('?')){
                return false;
            }
            var query = url.split('?')[1];
            var vars = query.split('&');
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split('=');
                if (pair[0] === variable) {
                    return decodeURIComponent(pair[1]);
                }
            }
            return false;
        },
        createID : function(){
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        },
        getIPAddress : function(){
            return new Promise(function(resolve, reject){
                steroids.device.getIPAddress({}, {
                    onSuccess: function(message) {
                        resolve(message.ipAddress);
                    },
                    onFailure : function(){
                        reject();
                    }
                });
            });
        }
    };

  });