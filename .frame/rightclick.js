// imported from cc_framework
/**
 * 
 * Copyright 2007
 * 
 * Paulius Uza
 * http://www.uza.lt
 * 
 * Dan Florio
 * http://www.polygeek.com
 * 
 * Project website:
 * http://code.google.com/p/custom-context-menu/
 * 
 * --
 * RightClick for Flash Player. 
 * Version 0.6.2
 * Modified for MooTools
 * 
 */

var RightClick = new Class({
	
	Implements: [Events],
	
	FlashObjectID: null,
	FlashObject: null,
	FlashContainer: null,
	Cache: null,
	Callback: null,
	CallbackParams: null,
	
	log: function(data)
	{
		try
		{
			if(cc && cc.log) cc.log('RightClick: '+data);
		} catch(e){}
	},
	
	/**
	 *	Constructor
	 */ 
	initialize: function(options)
	{
		this.log('initialize');
		this.FlashObjectID = options.objectid;
		this.FlashContainerID = options.containerid;
		this.Cache = this.FlashObjectID;
		this.Callback = options.callback;
		if(options.callbackparams) this.CallbackParams = options.callbackparams;
		
		if(window.addEventListener)
		{
			this.log('Bind for gecko/webkit');
			//window.addEvent('mousedown', this.onGeckoMouse.bind(this));
			//window.addEvent('mousedown', this.bindGeckoMouse());
			window.addEventListener('mousedown', this.bindGeckoMouse(), true);
		}
		else
		{
			this.log('Bind for IE');
			$(this.FlashContainerID).onmouseup = function() { $(this.FlashContainerID).releaseCapture(); }
			document.oncontextmenu = function(){ if(window.event.srcElement.id == this.FlashObjectID) { return false; } else { this.Cache = "nan"; }}
			$(this.FlashContainerID).onmousedown = this.onIEMouse;
		}
	},
	
	/**
	 * GECKO / WEBKIT event overkill
	 * @param {Object} eventObject
	 */
	killEvents: function(eventObject)
	{
		this.log('killEvents');
		if(eventObject)
		{
			//eventObject = new Event(eventObject);
			eventObject.stopPropagation();
			eventObject.preventDefault();
			if(eventObject.preventCapture) eventObject.preventCapture();
		 	if(eventObject.preventBubble) eventObject.preventBubble();
		}
	},
	/**
	 * GECKO / WEBKIT call right click
	 * @param {Object} ev
	 */
	bindGeckoMouse: function(ev)
	{
		this.log('bindGeckoMouse');
		return function(ev)
		{
			this.log('onGeckoMouse');
			if(ev.button != 0)
			{
				this.killEvents(ev);
				if(ev.target.id == this.FlashObjectID && this.Cache == this.FlashObjectID)
				{
					this.call();
				}
				this.Cache = ev.target.id;
			}
		}.bind(this)
	},
	/**
	 * IE call right click
	 * @param {Object} ev
	 */
	onIEMouse: function()
	{
		this.log('onIEMouse');
		if(event.button > 1)
		{
			if(window.event.srcElement.id == this.FlashObjectID && this.Cache == this.FlashObjectID)
			{
				this.call(); 
			}
			$(this.FlashContainerID).setCapture();
			if(window.event.srcElement.id)
			{
				this.Cache = window.event.srcElement.id;
			}
		}
	},
	/**
	 * Main call to Flash External Interface
	 */
	call: function()
	{
		this.log('call');
		try
		{
			Swiff.remote($(this.FlashObjectID),this.callback,this.callbackParams);
		} catch(e){}
	}
});