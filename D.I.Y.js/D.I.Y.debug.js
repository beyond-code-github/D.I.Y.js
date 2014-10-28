(function (diy) {
    // Enums
    var mappingTypes = {
        Singleton: 0,
        Instance: 1,
        Method: 2
    };

    // Private members
    var containers = {};

    var replaceMembers = function (mockType) {
        if (typeof mockType == "function") {
            var container = {
                func: mockType
            };

            spyOn(container, "func");
            return container.func;
        }

        if (typeof mockType == "object") {
            var objs = Object.getOwnPropertyNames(mockType);
            for (var i in objs) {
                spyOn(mockType, objs[i]);
            }
        }

        return mockType;
    }
    
    var extend = function (out) {
        out = out || {};

        for (var i = 1; i < arguments.length; i++) {
            if (!arguments[i])
                continue;

            for (var key in arguments[i]) {
                if (arguments[i].hasOwnProperty(key))
                    out[key] = arguments[i][key];
            }
        }

        return out;
    };

    // Static methods
    diy.getAllContainers = function () {
        return containers;
    };

    // Define container
    diy.Container = diy.Container || {};

    // Container constructor
    diy.Container.New = function (name) {
        // Argument exceptions
        if (name) {
            if (containers["name"]) {
                throw {
                    name: "DIYError",
                    message: "A container with the name '" + name + "' has already been created"
                };
            }
        }

        // Private fields
        var mappings = {};

        // Private methods
        var bind = function (key, constructor) {
            mappings[key] = { type: mappingTypes.Instance, data: constructor };
        };

        var bindSingleton = function (key, instance) {
            mappings[key] = { type: mappingTypes.Singleton, data: instance };
        };

        var bindMethod = function (key, method) {
            mappings[key] = { type: mappingTypes.Method, data: method };
        };

        // Public members
        var container = {};
        
        // Properties
        container.Name = name;

        // Methods
        container.bind = bind;
        container.bindSingleton = bindSingleton;
        container.bindMethod = bindMethod;

        container.reset = function () {
            mappings = {};
        };

        container.getDependency = function (key) {
            var mapping = mappings[key];
            if (!mapping) {
                throw {
                    name: "DIYError",
                    message: "A binding was not found for argument '" + key + "' in the specified container"
                };
            }

            switch (mapping.type) {
                case mappingTypes.Singleton:
                    return mapping.data;
                case mappingTypes.Instance:
                    return mapping.data.DIY(name);
                case mappingTypes.Method:
                    return mapping.data();
            }

            throw {
                name: "DIYError",
                message: "One or more bindings more incorrectly configured"
            };
        };

        container.getMock = function (key) {
            var mapping = mappings[key];

            if (!mapping) {
                throw {
                    name: "DIYError",
                    message: "A binding was not found for argument '" + key + "' in the specified container"
                };
            }

            var mockType;
            switch (mapping.type) {
                case mappingTypes.Singleton:
                    mockType = mapping.data;
                    break;
                case mappingTypes.Instance:
                    mockType = mockDependency(mapping.data);
                    break;
                case mappingTypes.Method:
                    mockType = mapping.data();
                    break;
            }

            return replaceMembers(mockType);
        };

        // Add container to global collection
        if (name) {
            containers[name] = container;
        } else {
            containers.default = container;
        }

        return container;
    };

    var mockDependency = function (dependency) {
        if (dependency.isSpy) {
            dependency = dependency.originalValue;
        }

        var args = extractParamNames(dependency);
        var len = args.length;

        var params = [];

        if (args.length > 1 || args[0].length > 0) {
            for (var i = params.length; i < len; i++) {
                params.push({});
            }
        }
        var context = {};
        context.protected = {};
        context.base = null;
        context.derivesFrom = function (constructor) {
            context.base = mockDependency(constructor);
        };
        context.dependsOn = function () {
            var args = [].slice.call(arguments);
            for (var index in args) {
                argument = args[index];
                context[argument] = {};
            }
        }

        if (typeof dependency.DerivesFrom == "function") {
            context.base = mockDependency(dependency.DerivesFrom);
        }

        // Invoke the constructor with correct dependencies
        return dependency.apply(context, params);
    };

    var getContainer = function (containerName) {
        var container;
        if (containerName) {
            container = containers[containerName];
            if (!container) {
                throw {
                    name: "DIYError",
                    message: "A container with the name '" + containerName + "' was not found, have you created one?"
                };
            }
        }
        else {
            container = containers.default;
            if (!container) {
                throw {
                    name: "DIYError",
                    message: "A default container was not found, have you created one?"
                };
            }
        }

        return container;
    };

    var extractParamNames = function (obj) {
        var string = obj.toString();
        var start = string.indexOf("(") + 1;
        var end = string.indexOf(")");

        var args = string.substring(start, end).split(",");
        return args;
    }

    // Extend function prototype for D.I in constructor functions
    Function.prototype.DIY = function (containerName, protectedMembers, extraParams) {
        var container = getContainer(containerName);

        // Make sure we can handle Jasmine spies
        var obj = this;
        if (obj.isSpy) {
            obj = obj.originalValue;
        }

        // Decode the function header and extract parameters
        var args = extractParamNames(obj);
        var len = args.length;

        var params = extraParams || [];

        // Determine all required dependencies
        if (args.length > 1 || args[0].length > 0) {
            for (var i = params.length; i < len; i++) {
                params.push(container.getDependency(args[i].trim()));
            }
        }

        // New style that will allow minification
        var context = {};
        context.protected = protectedMembers || {};
        context.base = null;
        context.derivesFrom = function (constructor) {
            context.base = constructor.DIY(containerName, context.protected);
            context = extend(context, context.protected);
        };
        
        context.dependsOn = function () {
            var args = [].slice.call(arguments);
            for (var index in args) {
                argument = args[index];
                context[argument] = container.getDependency(argument.trim());
            }
        }

        if (typeof this.DerivesFrom == "function") {
            context.base = this.DerivesFrom.DIY(containerName, context.protected);
        }

        // Invoke the constructor with correct dependencies
        return this.apply(context, params);
    };

    Function.prototype.AutoMock = function (containerName, extraParams) {
        var container = getContainer(containerName);

        var obj = this;
        if (obj.isSpy) {
            obj = obj.originalValue;
        }

        var args = extractParamNames(obj);
        var len = args.length;

        var params = extraParams || [];

        var mock = {
            dependencies: {}
        };

        if (args.length > 1 || args[0].length > 0) {
            for (var i = params.length; i < len; i++) {
                var name = args[i].trim();
                var dependencyMock = container.getMock(name);

                mock.dependencies[name] = dependencyMock;
                params.push(dependencyMock);
            }
        }

        // New style that will allow minification
        var base;
        var context = {};
        context.protected = {};
        context.base = null;
        context.derivesFrom = function (constructor) {
            base = constructor.AutoMock(containerName);
            context.base = base.obj;
        };
        context.dependsOn = function () {
            var args = [].slice.call(arguments);
            for (var index in args) {
                var name = args[index].trim();
                var dependencyMock = container.getMock(name);

                mock.dependencies[name] = dependencyMock;
                context[name] = dependencyMock;
            }
        }

        if (typeof this.DerivesFrom == "function") {
            base = this.DerivesFrom.AutoMock(containerName);
            context.base = base.obj;
        }

        // Invoke the constructor with correct dependencies
        mock.obj = this.apply(context, params);
        if (base) {
            mock.base = base;
        }

        return mock;
    };

    Function.prototype.Mock = function (containerName) {
        var mockType = mockDependency(this);
        return replaceMembers(mockType);
    }
})(window.DIY = window.DIY || {});