/// <reference path="Scripts/jasmine/jasmine.js" />
describe("D.I.Y.js", function () {
    
    var testObj;
    var container;

    describe("Argument detection", function () {
        
        beforeEach(function () {

            // Create default container
            container = window.DIY.Container.New();
            spyOn(container, 'getDependency');

            // Dummy object
            testObj = {
                constructor: function (var1, var2) { }
            };
            
            // Inject dependencies
            testObj.constructor.DIY();
        });

        it("Should attempt to detect all arguments", function () {
            expect(container.getDependency).toHaveBeenCalledWith("var1");
            expect(container.getDependency).toHaveBeenCalledWith("var2");
        });
        
    });

    describe("Constructor bindings", function () {

        // Dummy data
        var simpleVar1 = "Hello";
        var simpleVar2 = "World";

        beforeEach(function () {
            
            // Dummy objects
            var object1 = {
                New: function () {
                    return simpleVar1;
                }
            };

            var object2 = {
                New: function () {
                    return simpleVar2;
                }
            };

            testObj = {
                constructor: function(var1, var2) {}
            };
            
            spyOn(testObj, "constructor").andCallThrough();
            
            // Create default container
            container = window.DIY.Container.New();

            // Setup some bindings
            container.bind("var1", object1.New);
            container.bind("var2", object2.New);

            // Inject dependencies
            testObj.constructor.DIY();
        });

        it("Should return the result of the constructor for each parameter", function () {
            expect(testObj.constructor.mostRecentCall.args[0]).toEqual(simpleVar1);
            expect(testObj.constructor.mostRecentCall.args[1]).toEqual(simpleVar2);
        });

    });

    describe("Singleton bindings", function () {

        // Dummy data
        var data1 = { Text: "Hello" };
        
        beforeEach(function () {
            
            // Dummy objects
            var object1 = {
                New: function () {
                    return data1;
                }
            };
            
            var instance = object1.New();

            testObj = {
                constructor: function (var3) {
                     // This will modify the instance variable if referenced correctly
                     var3.additionalProperty = 5;
                }
            };

            spyOn(testObj, "constructor").andCallThrough();

            // Create default container
            container = window.DIY.Container.New();

            // Setup some bindings
            container.bindSingleton("var3", instance);
            
            // Inject dependencies
            testObj.constructor.DIY();
        });

        it("Should return the bound instance", function () {
            expect(testObj.constructor.mostRecentCall.args[0]).toEqual(data1);
        });

        it("Should be a proper instance reference", function () {
            expect(data1.additionalProperty).toEqual(5);
        });

    });

    describe("Method bindings", function () {

        beforeEach(function () {
            
            // Dummy objects
            testObj = {
                constructor: function (var4) { }
            };

            spyOn(testObj, "constructor").andCallThrough();
            
            // Create default container
            container = window.DIY.Container.New();

            // Setup some bindings
            container.bindMethod("var4", function () {
                return { Text: "More" };
            });
            
            // Inject dependencies
            testObj.constructor.DIY();
        });

        it("Should return the result of the method", function () {
            expect(testObj.constructor.mostRecentCall.args[0]).toEqual({ Text: "More" });
        });

    });

});