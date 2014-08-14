(function(global){
    'use strict';

    var defaults = {
        namespace : 'boost',
        configKey : 'config',
        users : {},
        sep : '_',
        user : 'default'
    };

    function strify(obj){
        // If String or number return
        if(typeof obj === 'string' || typeof obj === 'number') return obj;
        return JSON.stringify(obj);
    }

    function destrify(obj){
        var val;

        // If falsey return
        if(!obj) return obj;

        // If not JSON
        if(!obj.match(/^[\{\[](.|\n)*[\}\]]$/)) return obj;

        // Otherwise parse obj
        try{
            val = JSON.parse(obj);
        }catch(e){
            console.log('Error Parsing:', e);
        }

        return val;
    }

    function boost(config){
        var self = this;

        self.storage = global.localStorage;

        self.config = _.extend(defaults, config);

        var pre = self.getItem(self.config.configKey);

        if(pre){
            defaults = _.extend(defaults, pre);
        }

        self.config = _.extend(defaults, config);

        self.writeConfig();

        return self;
    };

    boost.prototype.processUsers = function(){
        var self = this;

        if(!self.config.users){
            self.config.users = {};
        }

        if(!self.config.users[self.config.user]){
            self.config.users[self.config.user] = [];
        }

        self.config.users[self.config.user] = _.uniq(self.config.users[self.config.user]);
    };

    boost.prototype.writeConfig = function(config){

        var self = this;

        if(config){
            self.config = _.extend(self.config, config);
        }

        self.processUsers();
0
        self.setItem(self.config.configKey, self.config);
    };

    // Format: namespace + separator + user + separator + key
    boost.prototype.getKey = function(key){
        if(!key) key = 'key';
        if(this.config.user){
            key = this.config.user + this.config.sep + key;
        }
        if(this.config.namespace){
            key = this.config.namespace + this.config.sep + key;
        }
        return key;
    };

    boost.prototype.setItem = function(key, val){
        val = strify(val);
        key = this.getKey(key);

        this.config.users[this.config.user].push(key);

        this.processUsers();

        this.storage.setItem(this.getKey(this.config.configKey), this.config);

        return this.storage.setItem(key, val);
    };

    boost.prototype.getItem = function(key){
        return destrify(this.storage.getItem(this.getKey(key)));
    };

    boost.prototype.removeItem = function(key){
        key = this.getKey(key);
        this.config.users[this.config.user] = _.without(this.config.users[this.config.user], key);
        this.writeConfig();
        return this.storage.removeItem(key);
    };

    boost.prototype.clear = function(){
        var self = this;
        _.each(self.config.users[self.config.user], function(key, i){
            self.storage.removeItem(key);
            if(self.config.users[self.config.user][i]){
                self.config.users[self.config.user].splice(i, 1);
            }
        });
    };

    global.boostStorage = boost;

})(window);