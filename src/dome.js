	// fixing an IE Bug -- assume the worst browser we deal with is IE8
	//  IE8 doesn't support the Array method-- indexof, we will use it in removeClass
	if(typeof Array.prototype.indexOf !== "function"){
		Array.prototype.indexOf = function(item){
			for(var i = 0; i < this.length; i++){
				if(this[i] === item){
					return i;
				}
			}
			return -1;
		}
	}
window.dome = (function(){
	function Dome(els){
		for(var i = 0; i < els.length; i++){
			this[i] = els[i];
		}
		this.length = els.length;

	}
	// Utilities
	Dome.prototype.map = function(callback){
		var results = [], i = 0;
		for(; i < this.length; i++){
			/* By doing it this way,
			** the function will be called in the context of our Dome instance,
			** and it will receive two parameters: the current element, and the index number.
			**/
			results.push(callback.call(this,this[i], i));
		}
		return results;
	}
	Dome.prototype.forEach = function(callback){
		this.map(callback);
		return this;
	}
	Dome.prototype.mapOne = function(callback){
		var m = this.map(callback);
		return m.length > 1 ? m :  m[0];
	}
	// text and the HTML
	Dome.prototype.text = function(text){
		// if else statement to check for a value in text to see if we are setting or getting
		if(typeof text !== "undefined"){
			// set their innerText property to text
			return this.forEach(function(el){
				el.innerText = text;
			});
		}
		// getting:
		else{
			// we’ll return the elements’ innerText property
			return this.mapOne(function(el){
				return el.innerText;
			});
		}
	}
	// almost identifical to .text, 
	// except that this is using innerHTML property instead of innerText
	Dome.prototype.html = function(html){
		if(typeof html !== "undefined"){
			this.forEach(function(el){
				el.innerHTML = html;
			});
			return this;
		}
		else{
			return this.mapOne(function(el){
				return el.innerHTML;
			})
		}
	}
	// add and remove class, classes = string or array of class names
	Dome.prototype.addClass = function(classes){
		var className = "";
		if(typeof classes !== undefined){
			for(var i = 0; i < classes.length; i++){
				className += " " + classes[i];
			}
		}
		else{
			className = " " + classes;
		}
		return this.forEach(function(el){
			el.className += className;
		})
	}
	// remove class, only one class at a time
	Dome.prototype.removeClass = function(clazz){
		return this.forEach(function(el){
			var cs = el.className.split(" "), i;
			while((i = cs.indexOf(clazz)) > -1 ){
				cs = cs.slice(0,i).concat(cs.slice(++i));
			}
			el.className = cs.join(" ");
		});
	}
	// -----------------
	// adjusting attribute
	Dome.prototype.attr = function(attr, val){
		if(typeof val !== "undefined"){
			return this.forEach(function(el){
				el.setAttribute(attr, val);
			});
		}
		else{
			return this.mapOne(function(el){
				return el.getAttribute(attr);
			});
		}
	}
	// append and prepend
	// expect els to be a Dome object
	Dome.prototype.append = function(els){
		this.forEach(function(parEl, i){
			els.forEach(function(childEl){
				// if appending the els to more than one element
				// we need to clone them
				// but we dont want to clone the nodes the first time they are appended
				// only subsequent times
				if(i > 0){
					childEl = childEl.cloneNode(true);
				}
				parEl.appendChild(childEl);
			});
		});
	}
	/*
	if you sequentially prepend a list of elements to another element, 
	they’ll end up in reverse order. Since we can’t forEach backwards, 
	I’m going through the loop backwards with a for loop. 
	Again, we’ll clone the node if this isn’t the first parent we’re appending to.
	*/
	Dome.prototype.prepend = function(els){
		return this.forEach(function(parEl, i){
			for(var j = els.length - 1; j > -1; j--){
				//childEl = (i > 0) ? els[j].cloneNode(true) : els[j];
				var childEL;
				if(i > 0){
					childEL = els[j].cloneNode(true);
				}
				else{
					childEL = els[j];
				}
				// inertBefore(newElement, Element_That_You_Want_To_Insert_Before)
				parEl.insertBefore(childEL, parEl.firstChild);
			}
		});
	}
	// remove
	/*
	Just iterate through the nodes and call the removeChild method on each element’s parentNode. 
	The beauty here (all thanks to the DOM) is that this Dome object will still work fine
	*/
	Dome.prototype.remove = function(){
		return this.forEach(function(el){
			return el.parentNode.removeChild(el);
		});
	}
	// events
	// IE 8 uses the old IE events, so we will have to check for that.
	Dome.prototype.on = function(){
		// if addEventListener exist
		if(document.addEventListener){
			return function(evt, fn){
				return this.forEach(function(el){
					el.addEventListener(evt, fn, false);
				});
			}
		}
		else{
			// otherwise, we check for document.attachEvent or fall back to DOM 0 events
			return function(evt, fn){
				return this.forEach(function(el){
					el["on" + evt] = fn;
				});
			}
		}
	}
	// off function--unhook event handlers
	Dome.prototype.off = function(){
		if(document.removeEventListener){
			return function(evt, fn){
				return this.forEach(function(el){
					el.removeEventListener(evt, fn, false);
				});
			}
		}
		else if(document.detachEvent){
			return function(evt, fn){
				return this.forEach(function(el){
					el.detachEvent("on" + evt, fn);
				});
			}
		}
		else{
			return function(evt, fn){
				this.forEach(function(el){
					el["on" + evt] = null;
				});
			}
		}
	}
	// -----------------
	var dome = {
		get: function(selector){
			// We’re using document.querySelectorAll to simplify the finding of elements: of course, 
			// this does limit our browser support, but for this case, that’s okay.
			var els;
			// we have a single element and we’ll put that in an array
			if(typeof selector === "string"){
				els = document.querySelectorAll(selector);
			}
			// If selector is not a string, we’ll check for a length property
			// If it exists, we’ll know we have a NodeList;
			else if(selector.length){
				els = selector;
			}
			else{
				// we have a single element and we’ll put that in an array
				els = [selector];
			}
			return new Dome(els);
		},
		// create elements
		create: function(tagName, attrs){
			var el = new Dome([document.createElement(tagName)]);
			if(attrs){
				if(attrs.className){
					el.addClass(attrs.className);
					// keeps them from being applied as attributes 
					// when we loop over the rest of the keys in attrs
					delete attrs.className;
				}
			}
			if(attrs.text){
				el.text(attrs.text);
				delete attrs.text;
			}
			for(var key in attrs){
				if(attrs.hasOwnProperty(key)){
					el.attr(key, attrs[key]);
				}
			}
			return el;
		}
	};
	return dome;
}());