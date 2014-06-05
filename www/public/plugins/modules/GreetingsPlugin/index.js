(function(global){
    'use strict';

    var api = global.octobluMobile.api;

    console.log('Sweet', api);

    var name = 'GreetingsPlugin';

    function Plugin(messenger){
        this.messenger = messenger;

        api.logActivity({
            type : name,
            html : 'Greetings plugin loaded'
        });

        return this;
    }

    Plugin.prototype.onEnable = function(cb){
        api.logActivity({
            type : name,
            html : 'Greetings plugin enabled'
        });

        if(cb){
            cb();
        }
    };

    Plugin.prototype.onDisable = function(cb){
        api.logActivity({
            type : name,
            html : 'Greetings plugin disabled'
        });

        if(cb){
            cb();
        }
    };

    Plugin.prototype.construct = function(cb){
        api.logActivity({
            type : name,
            html : 'Greetings plugin installed'
        });

        if(cb){
            cb();
        }
    };

    Plugin.prototype.destroy = function(cb){
        api.logActivity({
            type : name,
            html : 'Greetings plugin uninstalled'
        });

        if(cb){
            cb();
        }
    };

    global.octobluMobile.plugins[name] = {
        name : name,
        Plugin : Plugin
    };

})(window);
