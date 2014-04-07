var Octoblu = (function(){

    var getCookie = function(name){
        // Escape regexp special characters (thanks kangax!)
        name = name.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');

        var regex = new RegExp('(?:^|;)\\s?' + name + '=(.*?)(?:;|$)','i'),
            match = document.cookie.match(regex);

        return match && match[1];
    };

    var obj = {};

    obj.getCookie = getCookie;

    obj.isAuthenticated = function(){
        var skynetuuid = getCookie('skynetuuid');
        return skynetuuid && skynetuuid.length;
    };

    obj.getUserData = function(cb){
        var skynetuuid = getCookie('skynetuuid');
        var skynettoken = getCookie('skynettoken');
        if(skynetuuid && skynettoken){
            $.get('http://octoblu.com/api/user_api/' + skynetuuid + '/' +  skynettoken)
            .success(function(data){
                if(data && data.user){
                    cb(data.user);
                    return;
                }
                cb(null);
                return;
            })
            .error(function(err){
                console.log(err);
                cb(null);
            });
        }
    };

    return obj;

}());
