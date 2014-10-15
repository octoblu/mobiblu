angular.module('main')
    .directive('schemaEditor', function () {
        return {
            restrict: 'AE',
            templateUrl: '/angular/directives/schema-editor/schema-editor.html',
            replace: true,
            scope: {
                schema: '=',
                model: '=',
                additionalProperties: '=',
                allowJsonEdit: '=',
                validate: '&',
                control: '='
            },
            link: function (scope, element, attrs) {
                var readOnlyKeys = ['name', 'type', 'subtype', 'uuid', 'token', 'resource', 'socketId', 'socketid',  '_id', 'owner', 'timestamp', 'online', 'channel', 'protocol',
                        'localhost', 'secure', 'eventCode', 'updateWhitelist', 'viewWhitelist', 'sendWhitelist', 'receiveWhitelist'],
                    originalDevice = scope.model, schema, editor;

                scope.$watch('schema', function (newSchema) {
                    console.log('schema is ' + JSON.stringify(scope.schema) + ' :: ' + JSON.stringify(originalDevice));
                    scope.editingDevice =  _.omit(angular.copy(originalDevice), readOnlyKeys);
                    schema = _.extend({ title: 'Options'}, scope.schema);

                    if (editor) {
                        editor.destroy();
                    }

                    editor = new JSONEditor(element[0],
                        {schema: schema,
                            no_additional_properties: !scope.additionalProperties,
                            theme: 'bootstrap3',
                            startval: scope.editingDevice,
                            disable_collapse: true,
                            required_by_default: true,
                            iconlib: 'fontawesome4',
                            disable_edit_json: !scope.allowJsonEdit
                        });

                    editor.on('change', function () {
                        if (editor.getValue()) {
                            angular.copy(editor.getValue(), scope.editingDevice);
                            scope.$apply();
                        }
                    });
                });

                if (scope.control) {
                    scope.control.validate = function () {
                        return editor.validate();
                    };

                    scope.control.getValue = function () {
                        return angular.extend({}, originalDevice, scope.editingDevice);
                    };
                }
            }
        }
    });
