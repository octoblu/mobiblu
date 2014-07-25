angular.module('main.user')
    .service('Auth', function ($q, $http, $rootScope) {
        var currentUser = {},
            baseUrl = 'http://app.octoblu.com';

        //TODO: move me to the eventual root controller.
        function getProfileUrl(user) {

            if (user.local) {
                user.avatarUrl = 'http://avatars.io/email/' + user.local.email.toString();
            } else if (user.twitter) {

            } else if (user.facebook) {
                user.avatarUrl = 'https://graph.facebook.com/' + user.facebook.id.toString() + '/picture';
            } else if (user.google) {
                user.avatarUrl = 'https://plus.google.com/s2/photos/profile/' + user.google.id.toString() + '?sz=32';
            }
        }


        function getCurrentUser(force) {
            if (currentUser.id && !force) {
                var defer = $q.defer();
                defer.resolve(currentUser);
                return defer.promise;
            } else {
                var uuid = getParam('uuid'), token = getParam('token');
                if(!uuid && !token){
                    uuid = window.localStorage.getItem('skynetuuid');
                    token = window.localStorage.getItem('skynettoken');
                }
                var req = {
                    url: baseUrl + '/api/auth',
                    method: 'GET',
                    timeout: 5 * 1000
                };
                console.log('Set Data Creds in Auth', JSON.stringify([uuid, token]));
                if(uuid && token) {
                    req.headers = {
                        skynet_auth_uuid: uuid,
                        skynet_auth_token: token
                    };
                }
                return $http(req).then(function(result){
                        loginHandler(result);
                    }, function (err) {
                        logoutHandler(err);
                        throw err;
                    });
            }
        }

        function processCurrentUser(data) {
            angular.copy(data, currentUser);

            console.log('User', JSON.stringify(currentUser));
            var olduuid = window.localStorage.getItem('skynetuuid');
            if (olduuid &&
                currentUser.skynet.uuid !== olduuid) {

                window.localStorage.removeItem('mobileuuid');
                window.localStorage.removeItem('mobiletoken');
            }

            window.localStorage.setItem('skynetuuid', currentUser.skynet.uuid);
            window.localStorage.setItem('skynettoken', currentUser.skynet.token);

            window.localStorage.setItem('loggedin', true);

            window.Skynet.login(currentUser.skynet.uuid, currentUser.skynet.token);

            getProfileUrl(currentUser);

            return currentUser;
        }

        function loginHandler(result) {

            if (!result || result.status >= 400) {
                logoutHandler();
                if(result){
                    throw result.data;
                }else{
                    console.log('Result', JSON.stringify(result));
                    return {};
                }
            }

            return processCurrentUser(result.data);
        }

        function signupHandler(result) {
            if (result && !/^3\d{2}$/.test(result.status)) {
                logoutHandler();
                throw result.data;
            }

            return getCurrentUser().then(loginHandler);
        }

        function logoutHandler() {
            angular.copy({}, currentUser);

            window.localStorage.removeItem('skynetuuid');
            window.localStorage.removeItem('skynettoken');

            window.Skynet.logout();
        }

        return service = {
            acceptTerms: function () {
                return $http.put(baseUrl + '/api/auth/accept_terms',
                    { accept_terms: true },
                    function (response) {
                        if (response.status !== 204) {
                            throw response.data;
                        }
                    }).then(function () {
                        return service.getCurrentUser(true);
                    });
            },
            login: function (email, password) {
                return $http.post(baseUrl + '/api/auth', {
                    email: email,
                    password: password
                }).then(loginHandler, function (err) {
                    logoutHandler(err);
                    throw err;
                });
            },

            signup: function (email, password) {
                return $http.post(baseUrl + '/api/auth', {
                    email: email,
                    password: password
                }).then(signupHandler, function (err) {
                    logoutHandler(err);
                    throw err;
                });
            },

            logout: function () {
                return $http.delete(baseUrl + '/api/auth').then(logoutHandler, logoutHandler);
            },

            resetPassword: function (email) {
                return $http.post(baseUrl + '/api/reset', {email: email}).then(function (response) {
                    if (response.status !== 201) {
                        throw response.data;
                    }
                });
            },

            setPassword: function (resetToken, password) {
                return $http.put(baseUrl + '/api/reset/' + resetToken, {password: password}).then(function (response) {
                    if (response.status !== 204) {
                        throw response.data;
                    }
                });
            },

            updatePassword: function (oldPassword, newPassword) {
                return $http.put(baseUrl + '/api/auth/password', {oldPassword: oldPassword, newPassword: newPassword}).then(function (response) {
                    if (response.status !== 204) {
                        throw response.data;
                    }
                });
            },

            getCurrentUser: getCurrentUser
        };
    });