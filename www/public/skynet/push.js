var activity = require('./activity.js');

module.exports = function(app) {
    return new Promise(function(done, error) {
        var started = false;
        var push = window.PushNotification;

        function isEnabled() {
            return new Promise(function(resolve, reject) {
                push.isPushEnabled(function(status) {
                    console.log('Push Status: ' + JSON.stringify(status));
                    if (status || status === 'OK') {
                        resolve();
                    } else {
                        reject();
                    }
                });
            });
        }

        function registerPushID(pushID) {
            app.pushID = pushID;
            window.localStorage.setItem('pushID', app.pushID);

            return new Promise(function(resolve, reject) {
                app.updateDeviceSetting({})
                    .then(function() {
                        activity.logActivity({
                            type: 'push',
                            html: 'Push ID Registered'
                        });
                        resolve();
                    }, function() {
                        var msg = 'Push ID Updated Failed';
                        activity.logActivity({
                            type: 'push',
                            error: new Error(msg)
                        });
                        reject();
                    });
            });
        }

        function getPushID() {
            return new Promise(function(resolve, reject) {
                if (app.pushID) return resolve();
                push.getPushID(function(pushID) {
                    console.log('Push ID: ' + pushID);

                    activity.logActivity({
                        type: 'push',
                        html: 'Push ID: ' + JSON.stringify(pushID)
                    });

                    if (pushID) {
                        resolve(pushID);
                    } else {
                        reject();
                    }
                });
            });
        }

        function enable() {
            return new Promise(function(resolve, reject) {
                push.enablePush(resolve);
            });
        }

        function start() {
            if (started) return console.log('Starting Push Notifications Logic');

            console.log('Starting Push Flow');

            var a = push.notificationType.badge,
                b = push.notificationType.sound,
                c = push.notificationType.alert;

            push.registerForNotificationTypes(a | b | c);

            isEnabled()
                .then(getPushID, function() {
                    return enable()
                        .then(getPushID, function() {
                            activity.logActivity({
                                type: 'push',
                                error: 'Unable to get Push ID'
                            });
                        })
                        .then(registerPushID, function() {
                            activity.logActivity({
                                type: 'push',
                                error: 'Unable to register Push ID'
                            });
                        });
                })
                .finally(function() {
                    started = true;
                    done(app.pushID);
                }, error);
        }

        function onRegistration(event) {
            if (event.error) {
                // Not Registered
                var msg = 'Urbanairship Registration Error';

                activity.logActivity({
                    type: 'push',
                    error: event.error
                });

                deferred.reject(msg);

            } else {

                activity.logActivity({
                    type: 'push',
                    html: 'Push ID Registered: ' + event.pushID
                });

                // Registered
                app.pushID = event.pushID;
                window.localStorage.setItem('pushID', event.pushID);

                // Start Listen
                start();
            }
        }

        function handleIncomingPush(event) {
            if (!event.message) {
                console.log('Invalid Message');
                return;
            }
            console.log('Incoming push: ' + event.message);

            activity.logActivity({
                type: 'push',
                html: 'Received Push Notification: ' + event.message
            });

        }

        function onDeviceReady() {
            if (!push) return console.log('No Push Object');

            // IF AppGyver Urbanairship plugin
            if(typeof push.takeOff === 'function') push.takeOff();

            document.addEventListener('resume', function() {
                console.log('Push: Device resume!');

                push.resetBadge();
                push.getIncoming(handleIncomingPush);

                // Re-register for urbanairship events if they were removed in pause event
                document.addEventListener('urbanairship.registration', onRegistration, false);
                document.addEventListener('urbanairship.push', handleIncomingPush, false);
            }, false)

            document.addEventListener('pause', function() {
                console.log('Push: Device pause!');
                // Remove urbanairship events.  Important on android to not receive push in the background.
                document.removeEventListener('urbanairship.registration', onRegistration, false);
                document.removeEventListener('urbanairship.push', handleIncomingPush, false);
            }, false);

            document.addEventListener('urbanairship.registration', onRegistration, false);
            document.addEventListener('urbanairship.push', handleIncomingPush, false);
            push.getIncoming(handleIncomingPush);

            start();
        }

        document.addEventListener('deviceready', onDeviceReady, false);

    });

}