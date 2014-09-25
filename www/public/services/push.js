'use strict';

angular.module('main.skynet')
  .service('Push', function(Activity) {

    return function(app) {
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

          return new Promise(function(resolve, reject) {
            if (!pushID) {
              console.log('Push ID Invalid');
              return reject();
            }
            // If updated don't update again
            if (app.pushID && app.pushID === pushID) return resolve();

            // Set Push ID
            app.pushID = pushID;
            window.localStorage.setItem('pushID', app.pushID);

            // Update Meshblu with Push ID
            app.updateMobibluSetting({})
              .then(function() {
                Activity.logActivity({
                  type: 'push',
                  html: 'Device Updated with Push ID'
                });
                resolve();
              }, function() {
                Activity.logActivity({
                  type: 'push',
                  error: 'Push ID Updated Failed'
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

              if (pushID) {
                Activity.logActivity({
                  type: 'push',
                  html: 'Push ID Registered'
                });
                registerPushID(pushID).then(resolve, reject);
              } else {
                reject();
              }
            });
          });
        }

        function enable() {
          return new Promise(function(resolve) {
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
                .then(getPushID, error);
            })
            .finally(function() {
              started = true;
              done(app.pushID);
            });
        }

        function onRegistration(event) {
          if (event.error) {
            // Not Registered
            var msg = 'Urbanairship Registration Error';

            Activity.logActivity({
              type: 'push',
              error: event.error
            });

          } else {
            registerPushID(event.pushID).then(start);
          }
        }

        function handleIncomingPush(event) {
          if (!event.message) {
            console.log('Invalid Message');
            return;
          }
          console.log('Incoming push: ' + event.message);

          Activity.logActivity({
            type: 'push',
            html: '<strong>Received Push Notification</strong>: ' + event.message
          });

        }

        function onDeviceReady() {
          if (!push) return console.log('No Push Object');

          // IF AppGyver Urbanairship plugin
          if (typeof push.takeOff === 'function') push.takeOff();

          document.addEventListener('resume', function() {
            console.log('Push: Device resume!');

            push.resetBadge();
            push.getIncoming(handleIncomingPush);

            // Re-register for urbanairship events if they were removed in pause event
            document.addEventListener('urbanairship.registration', onRegistration, false);
            document.addEventListener('urbanairship.push', handleIncomingPush, false);
          }, false);

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

    };
  });