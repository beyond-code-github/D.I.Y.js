D.I.Y.js
========

D.I.Y.js is an approach to Dependency Injection in Javascript. The y stands for "whY would you want to do that?"

Basic use
---------

	// Set up the container
	var container = window.DIY.Container.New();

	// Bind your dependencies
	container.bind("manipulator", window.ArrayManipulator.Constructor);
	
	// Instantiate
	var instance = window.Arrayconsumer.Constructor.DIY();

Singletons
----------

	var singleton = window.MySingleton.Constructor();

	container.bindSingleton("mySingleton", singleton);
	
Dynamic Bindings
----------------

	var provideFlawedImplementation = false;

	container.bindMethod("dynamicObject", function() {
		if (provideFlawedImplementation) {
			return window.FlawedObject.Constructor();
		}
		else {
			return window.GoodObject.Constructor();
		}
		
		provideFlawedImplementation = !provideFlawedImplementation;
	});
	
Nested Dependencies
-------------------

	Yup.

Multiple Containers
-------------------

	var defaultContainer = window.DIY.Container.New();
	var anotherContainer = window.DIY.Container.New("another");
	
	defaultContainer.bind("dependency", window.SomeDependency.Constructor);
	anotherContainer.bind("dependency", window.SomeOtherDependency.Constructor);
	
	// With default container;
	var object1 = window.Object.Constructor.DIY();
	// With another container
	var object2 = window.Object.Constructor.DIY("another");

Suggested Object Structure
--------------------------

	// Define an object with a constructor
	(function (obj) {
		var privateArray = [];
		
		obj.Constructor = function() {
			var pushToArray = function (item) { privateArray.push(item); }
			var getFromArray = function (i) { return privateArray[i]; }

			var object = {};
			object.pushToArray = pushToArray;
			object.getFromArray = getFromArray;
			
			return object;
		};	
		
	})(window.ArrayManipulator = window.ArrayManipulator || {});

	// Define another object with first as a dependency
	(function (obj) {		
		var _manipulator;		
		obj.Constructor =  function(manipulator) {
			_manipulator = manipulator;

			var batchAdd = function(items) {
				for (var i=0; i<items.length; i++)	{ _manipulator.pushToArray(items[i]); }
			}
						
			var object = {};
			object.batchAdd = batchAdd;
			
			return object;
		};
		
	})(window.ArrayConsumer = window.ArrayConsumer || {});
