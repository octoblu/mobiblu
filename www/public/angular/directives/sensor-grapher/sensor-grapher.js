angular.module('main')
    .directive('sensorGrapher', function ($rootScope, $interval) {
        return {
            restrict: 'AE',
            templateUrl: '/public/angular/directives/sensor-grapher/sensor-grapher.html',
            scope: {
                device: '='
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
                    };
                scope.graphWidth = $(document).width();
                scope.graphHeight = 120;

                scope.messageLines = messageLines;

                var smoothie = new SmoothieChart({
                    grid: { strokeStyle: '#657b83', fillStyle: '#002b36',
                        lineWidth: 1, millisPerLine: 250, verticalSections: 6 },
                    labels: { fillStyle: '#fdf6e3' }
                });

                smoothie.streamTo(element.find('canvas')[0]);

                function processEvent(event, data) {
                    var key = data.type || scope.device;
                    if(data.sensorData){
                        messages.push(data.sensorData);
                        key = data.sensorData.type;
                    }else{
                        messages.push(data);
                    }


                    if (!messageLines[key]) {
                        messageLines[key] = {
                            line: new TimeSeries(),
                            color: lineColors.pop()
                        };
                    }

                    smoothie.addTimeSeries(messageLines[key].line, { strokeStyle: messageLines[key].color, lineWidth: 3 });

                }

                if (scope.device) {
                    var eventName = 'sensor:' + scope.device;

                    $(document).on(eventName, processEvent);
                    $rootScope.$on(eventName, processEvent);
                }

                var intervalPromise = $interval(function () {
                    if (messages.length) {
                        _.each(_.keys(messageLines), function (key) {
                            if (typeof messages[0][key] === 'number') {
                                messageLines[key].line.append(new Date().getTime(), messages[0][key]);
                            } else {
                                messageLines[key].line.append(new Date().getTime(), messages.length);
                            }
                        });
                    }
                    messages = [];
                }, 1000);

                scope.$on('$destroy', function () {
                    $interval.cancel(intervalPromise);
                });
            }
        };
    });
