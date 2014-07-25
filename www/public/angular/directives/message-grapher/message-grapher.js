angular.module('main')
    .directive('messageGrapher', function ($rootScope, $interval) {
        return {
            restrict: 'AE',
            templateUrl: '/public/angular/directives/message-grapher/message-grapher.html',
            scope: {
                device: '=',
                activity: '='
            },
            link: function (scope, element) {
                var messages = [],
                    lineColors = [
                        '#b58900',
                        '#cb4b16',
                        '#dc322f',
                        '#d33682',
                        '#6c71c4',
                        '#268bd2',
                        '#2aa198',
                        '#859900'
                    ],
                    messageLines = {
                        message: {
                            line: new TimeSeries(),
                            color: lineColors.pop()
                        }
                    };

                scope.graphWidth = $(document).width();
                scope.graphHeight = 120;

                scope.messageLines = messageLines;

                var smoothie = new SmoothieChart({
                    grid: { strokeStyle: '#657b83', fillStyle: '#002b36',
                        lineWidth: 1, millisPerLine: 250, verticalSections: 6 },
                    labels: { fillStyle: '#fdf6e3' }
                });
                smoothie.addTimeSeries(messageLines.message.line, { strokeStyle: messageLines.message.color, lineWidth: 3 });
                smoothie.streamTo(element.find('canvas')[0]);
                var eventName = 'skynet:message';
                if (scope.device) {
                    eventName += ':' + scope.device;
                }
                $rootScope.$on(eventName, function (event, message) {
                    messages.push(message.payload);
                    if (scope.device) {
                        _.each(_.keys(message.payload), function (key) {
                            if ((typeof message.payload[key] === 'number') && !messageLines[key]) {
                                messageLines[key] = {
                                    line: new TimeSeries(),
                                    color: lineColors.pop()
                                };
                                smoothie.addTimeSeries(messageLines[key].line, { strokeStyle: messageLines[key].color, lineWidth: 3 });
                            }
                        });
                    }
                });

                if(!!scope.activity){
                    $(document).on('skynetactivity', function (event, message) {
                        var payload = message.error || message.html;
                        messages.push(payload);
                        var log = false;
                        if (scope.device &&
                            scope.device === message.type) {
                            log = true;
                        }else if(!scope.device){
                            log = true;
                        }
                        if(log){
                            var key = message.type;

                            if(!messageLines[key]){
                                messageLines[key] = {
                                    line: new TimeSeries(),
                                    color: lineColors.pop()
                                };
                            }

                            smoothie.addTimeSeries(messageLines[key].line, { strokeStyle: messageLines[key].color, lineWidth: 3 });
                        }

                    });
                }

                var intervalPromise = $interval(function () {
                    messageLines.message.line.append(new Date().getTime(), messages.length);
                    //console.log(messages.length);
                    if (messages.length) {
                        _.each(_.keys(messageLines), function (key) {
                            if (key !== 'message') {
                                if (typeof messages[0][key] === 'number') {
                                    messageLines[key].line.append(new Date().getTime(), messages[0][key]);
                                } else {
                                    messageLines[key].line.append(new Date().getTime(), 0);
                                }
                            }
                        });
                    }
                    messages = [];
                }, 1000);

                scope.$on('$destroy', function () {
                    $interval.cancel(intervalPromise);
                });
            }
        }
    });
