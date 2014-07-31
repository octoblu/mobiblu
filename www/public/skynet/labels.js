var Q = Promise;

var defer = function () {
    var resolve, reject;
    var promise = new Promise(function () {
        resolve = arguments[0];
        reject = arguments[1];
    });
    return {
        resolve: resolve,
        reject: reject,
        promise: promise
    };
};

var self = {};

var loaded = false;

self.labels = {};

self.getLabels = function () {
    var deferred = defer();

    if (loaded) {
        deferred.resolve(self.labels);
    } else {
        $.getJSON('/data/labels.json')
            .success(function (data) {
                loaded = true;
                self.labels = data;
                deferred.resolve(data);
            })
            .error(deferred.reject);
    }

    return deferred.promise;
};

self.getLabel = function (lbl) {
    var deferred = defer();

    self.getLabels()
        .then(function () {
            var label = self.labels[lbl] || lbl;
            deferred.resolve(label);
        }, function(){
            deferred.resolve(lbl);
        });

    return deferred.promise;
};

module.exports = self;