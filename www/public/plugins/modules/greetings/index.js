(function(plugins, api){
    'use strict';

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

    plugins[name] = {
        name : name,
        Plugin : Plugin
    };

})(
    // Octoblu Mobile Plugins
    window.octobluMobile.plugins,
    // Octoblu Mobile API
    window.octobluMobile.api
);
