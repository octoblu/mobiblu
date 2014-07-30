String.prototype.toCamel = function(){
    return this.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
};
String.prototype.trim = function(){
    return this.replace(/^\s+|\s+$/g, "");
};
String.prototype.toDash = function(){
    return this.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
};
String.prototype.toUnderscore = function(){
    return this.replace(/([A-Z])/g, function($1){return "_"+$1.toLowerCase();});
};

(function(global){
    global.getParam = function (variable, url) {
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
    };

    global.createID = function(){
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    };
})(window);

