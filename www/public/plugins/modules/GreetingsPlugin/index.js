(function (global) {
    'use strict';

    var api = global.octobluMobile.api;

    var name = 'GreetingsPlugin';

    var optionsSchema = {
        type: 'object',
        properties: {
            greetingPrefix: {
                type: 'string',
                required: true
            }
        }
    };

    function Plugin(messenger, options) {
        this.messenger = messenger;
        this.options = options;

        api.logActivity({
            type: name,
            html: 'Greetings plugin loaded'
        });

        return this;
    }

    Plugin.prototype.onEnable = function (cb) {
        api.logActivity({
            type: name,
            html: 'Greetings plugin enabled'
        });

        if (cb) {
            cb();
        }
    };

    Plugin.prototype.onDisable = function (cb) {
        api.logActivity({
            type: name,
            html: 'Greetings plugin disabled'
        });

        if (cb) {
            cb();
        }
    };

    Plugin.prototype.onInstall = function (cb) {
        api.logActivity({
            type: name,
            html: 'Greetings plugin installed'
        });

        if (cb) {
            cb();
        }
    };

    Plugin.prototype.destroy = function (cb) {
        api.logActivity({
            type: name,
            html: 'Greetings plugin uninstalled'
        });

        if (cb) {
            cb();
        }
    };

    global.octobluMobile.plugins[name] = {
        name: name, // Required
        Plugin: Plugin, // Required
        optionsSchema: optionsSchema // Optional
    };

})(window);
