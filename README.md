D.I.Y.js
========

D.I.Y.js is an approach to Dependency Injection in Javascript. The y stands for "whY would you want to do that?"

Basic use
=========

<pre><code>
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

			var batchAdd = function(items)
			{
				for (var i=0; i<items.length; i++)	{ _manipulator.pushToArray(items[i]); }
			}
			var getAllAsString = function()
			{
				var output;
				for (var i=0; i<items.length; i++) { 
					output = output + "<br/>" + _manipulator.getFromArray(0); 
				}
				return output;
			}
			
			var object = {};
			object.batchAdd = batchAdd;
			object.getAllAsString = getAllAsString;
			
			return object;
		};
	})(window.ArrayConsumer = window.ArrayConsumer || {});

	// Set up the container
	var container = window.DIY.Container.New();

	// Bind your dependencies
	container.bind("manipulator", window.ArrayManipulator.Constructor);
	
	// Instantiate
	var instance = window.Arrayconsumer.Constructor.DIY();
	
</pre></code>