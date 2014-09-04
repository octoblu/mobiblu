(function(global){
	'use strict';

	global.mobibluStorage = new window.boostStorage({
	    namespace : 'mobiblu',
	});

	var skynetuuid = global.localStorage.getItem('skynetuuid');
	if(skynetuuid){
	 	global.mobibluStorage.writeConfig({
	      user: skynetuuid
	  });
	}

})(window);

