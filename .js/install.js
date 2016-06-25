/*
 * src/json2.js
 */

if (! ("JSON" in window && window.JSON)){JSON={}}(function(){function f(n){return n<10?"0"+n:n}if(typeof Date.prototype.toJSON!=="function"){Date.prototype.toJSON=function(key){return this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z"};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf()}}var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==="string"?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+string+'"'}function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==="object"&&typeof value.toJSON==="function"){value=value.toJSON(key)}if(typeof rep==="function"){value=rep.call(holder,key,value)}switch(typeof value){case"string":return quote(value);case"number":return isFinite(value)?String(value):"null";case"boolean":case"null":return String(value);case"object":if(!value){return"null"}gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==="[object Array]"){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||"null"}v=partial.length===0?"[]":gap?"[\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"]":"["+partial.join(",")+"]";gap=mind;return v}if(rep&&typeof rep==="object"){length=rep.length;for(i=0;i<length;i+=1){k=rep[i];if(typeof k==="string"){v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}else{for(k in value){if(Object.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}v=partial.length===0?"{}":gap?"{\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"}":"{"+partial.join(",")+"}";gap=mind;return v}}if(typeof JSON.stringify!=="function"){JSON.stringify=function(value,replacer,space){var i;gap="";indent="";if(typeof space==="number"){for(i=0;i<space;i+=1){indent+=" "}}else{if(typeof space==="string"){indent=space}}rep=replacer;if(replacer&&typeof replacer!=="function"&&(typeof replacer!=="object"||typeof replacer.length!=="number")){throw new Error("JSON.stringify")}return str("",{"":value})}}if(typeof JSON.parse!=="function"){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==="object"){for(k in value){if(Object.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v}else{delete value[k]}}}}return reviver.call(holder,key,value)}cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})}if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){j=eval("("+text+")");return typeof reviver==="function"?walk({"":j},""):j}throw new SyntaxError("JSON.parse")}}}());

/*
 * src/postmessage.js, packed by dean edwards' packer
 */
(function(h,$,j){if(!("console"in h)){var c=h.console={};c.log=c.warn=c.error=c.debug=function(){}}if(!$){$={fn:{},extend:function(){var a=arguments[0];for(var i=1,len=arguments.length;i<len;i++){var b=arguments[i];for(var c in b){a[c]=b[c]}}return a}}}$.fn.pm=function(){console.log("usage: \nto send:    $.pm(options)\nto receive: $.pm.bind(type, fn, [origin])");return this};$.pm=h.pm=function(a){n.send(a)};$.pm.bind=h.pm.bind=function(a,b,c,d){n.bind(a,b,c,d)};$.pm.unbind=h.pm.unbind=function(a,b){n.unbind(a,b)};$.pm.origin=h.pm.origin=null;$.pm.poll=h.pm.poll=200;var n={send:function(a){var o=$.extend({},n.defaults,a),target=o.target;if(!o.target){console.warn("postmessage target window required");return}if(!o.type){console.warn("postmessage type required");return}var b={data:o.data,type:o.type};if(o.success){b.callback=n._callback(o.success)}if(o.error){b.errback=n._callback(o.error)}if(("postMessage"in target)&&!o.hash){n._bind();target.postMessage(JSON.stringify(b),o.origin||'*')}else{n.hash._bind();n.hash.send(o,b)}},bind:function(a,b,c,d){if(("postMessage"in h)&&!d){n._bind()}else{n.hash._bind()}var l=n.data("listeners.postmessage");if(!l){l={};n.data("listeners.postmessage",l)}var e=l[a];if(!e){e=[];l[a]=e}e.push({fn:b,origin:c||$.pm.origin})},unbind:function(a,b){var l=n.data("listeners.postmessage");if(l){if(a){if(b){var c=l[a];if(c){var m=[];for(var i=0,len=c.length;i<len;i++){var o=c[i];if(o.fn!==b){m.push(o)}}l[a]=m}}else{delete l[a]}}else{l={}}}},data:function(k,v){if(v===j){return n._data[k]}n._data[k]=v;return v},_data:{},_CHARS:'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''),_random:function(){var r=[];for(var i=0;i<32;i++){r[i]=n._CHARS[0|Math.random()*32]};return r.join("")},_callback:function(a){var b=n.data("callbacks.postmessage");if(!b){b={};n.data("callbacks.postmessage",b)}var r=n._random();b[r]=a;return r},_bind:function(){if(!n.data("listening.postmessage")){if(h.addEventListener){h.addEventListener("message",n._dispatch,false)}else if(h.attachEvent){h.attachEvent("onmessage",n._dispatch)}n.data("listening.postmessage",1)}},_dispatch:function(e){try{var a=JSON.parse(e.data)}catch(ex){console.warn("postmessage data invalid json: ",ex);return}if(!a.type){console.warn("postmessage message type required");return}var b=n.data("callbacks.postmessage")||{},cb=b[a.type];if(cb){cb(a.data)}else{var l=n.data("listeners.postmessage")||{};var c=l[a.type]||[];for(var i=0,len=c.length;i<len;i++){var o=c[i];if(o.origin&&e.origin!==o.origin){console.warn("postmessage message origin mismatch",e.origin,o.origin);if(a.errback){var d={message:"postmessage origin mismatch",origin:[e.origin,o.origin]};n.send({target:e.source,data:d,type:a.errback})}continue}try{var r=o.fn(a.data);if(a.callback){n.send({target:e.source,data:r,type:a.callback})}}catch(ex){if(a.errback){n.send({target:e.source,data:ex,type:a.errback})}}}}}};n.hash={send:function(a,b){var c=a.target,target_url=a.url;if(!target_url){console.warn("postmessage target window url is required");return}target_url=n.hash._url(target_url);var d,source_url=n.hash._url(h.location.href);if(h==c.parent){d="parent"}else{try{for(var i=0,len=parent.frames.length;i<len;i++){var f=parent.frames[i];if(f==h){d=i;break}}}catch(ex){d=h.name}}if(d==null){console.warn("postmessage windows must be direct parent/child windows and the child must be available through the parent window.frames list");return}var e={"x-requested-with":"postmessage",source:{name:d,url:source_url},postmessage:b};var g="#x-postmessage-id="+n._random();c.location=target_url+g+encodeURIComponent(JSON.stringify(e))},_regex:/^\#x\-postmessage\-id\=(\w{32})/,_regex_len:"#x-postmessage-id=".length+32,_bind:function(){if(!n.data("polling.postmessage")){setInterval(function(){var a=""+h.location.hash,m=n.hash._regex.exec(a);if(m){var b=m[1];if(n.hash._last!==b){n.hash._last=b;n.hash._dispatch(a.substring(n.hash._regex_len))}}},$.pm.poll||200);n.data("polling.postmessage",1)}},_dispatch:function(a){if(!a){return}try{a=JSON.parse(decodeURIComponent(a));if(!(a['x-requested-with']==='postmessage'&&a.source&&a.source.name!=null&&a.source.url&&a.postmessage)){return}}catch(ex){return}var b=a.postmessage,cbs=n.data("callbacks.postmessage")||{},cb=cbs[b.type];if(cb){cb(b.data)}else{var c;if(a.source.name==="parent"){c=h.parent}else{c=h.frames[a.source.name]}var l=n.data("listeners.postmessage")||{};var d=l[b.type]||[];for(var i=0,len=d.length;i<len;i++){var o=d[i];if(o.origin){var e=/https?\:\/\/[^\/]*/.exec(a.source.url)[0];if(e!==o.origin){console.warn("postmessage message origin mismatch",e,o.origin);if(b.errback){var f={message:"postmessage origin mismatch",origin:[e,o.origin]};n.send({target:c,data:f,type:b.errback,hash:true,url:a.source.url})}continue}}try{var r=o.fn(b.data);if(b.callback){n.send({target:c,data:r,type:b.callback,hash:true,url:a.source.url})}}catch(ex){if(b.errback){n.send({target:c,data:ex,type:b.errback,hash:true,url:a.source.url})}}}}},_url:function(a){return(""+a).replace(/#.*$/,"")}};$.extend(n,{defaults:{target:null,url:null,type:null,data:null,success:null,error:null,origin:"*",hash:false}})})(this,typeof jQuery==="undefined"?null:jQuery);

/**
 * Ultimate pay class
 **/



if(!window.Playspan){
    var Playspan = {};
}

//if set the following to true, if you need to check if the server is up.
Playspan.doServerHealthCheck = false;

Playspan.extend = function(destination, source) {
    for (var property in source){
        if(source[property]!= undefined){ 
            destination[property] = source[property];
        }
    }
    return destination;
};

Playspan.observe = function(ele, evt, fn){
    if (ele.addEventListener) {
        ele.addEventListener(evt, fn, false);
    } 
    else{
        ele.attachEvent("on" + evt, fn);
    }
};

Playspan.ieVersion = (function() {
    // Returns the version of Internet Explorer or a -1
    // (indicating the use of another browser).
    var rv = -1; // Return value assumes failure.
    if (navigator.appName == 'Microsoft Internet Explorer')
    {
        var ua = navigator.userAgent;
        var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null){
            rv = parseFloat( RegExp.$1 );
        }
        
    }
    return rv;
})();









/* constructor */
var UPay = function(){

    var self = this;
    /* Some initialization */
    this.version = "1.1";  
    this.debug = false;  /* make it true to debug */

    this.avoidRequestCache = true;
    this.upLiveUrl = "https://www.ultimatepay.com/app/api/live/?";
    this.ultimatePay = false;
    //payment options related
    this.all_po = null;
    this.selected_pay = null;
    this.all_popups = [];
    //payment option to show 
    this.noPayOptsPerPage = 4;  
    this.allPayOptsIds = [];
    this.payPages = 0;
    this.currPayPage = 1;

    this.ieVersion = Playspan.ieVersion;

    this.parentUrl = escape('' + window.location.href);

    if(!window.ultimatePayParams){
        window.ultimatePayParams = {};
    }
    
    this.doPMBindings = function(){
        /* setup iframe listeners */    

        pm.bind('setURL', function(options){
            location.href = options.url;
        });
        
        pm.bind('doRemoveSpinner',function(){
            ulp.onIFload();
        });


        pm.bind('closeLB',function(options){
            self.closeBox(options);
        });

        pm.bind('openLB',function(options){


            try{  
                ultimatePayParams = self.mergeJsonObj(options.ultimatePayParams, ultimatePayParams, true);
                self.ultimatePay = true;
                if(options.upLiveUrl){
                    self.upLiveUrl = options.upLiveUrl;
                }


                if(!document.getElementById(self.lightboxDiv)){
                    var divbHTML = '<div id="'+ self.lightboxDiv + '" style="display:none;padding:10px;position:absolute;top: 50%;left: 50%;  margin-top:-212px;  margin-left: -351px;"></div>';
                    (document.getElementById(self.lightboxlauncherDiv)?document.getElementById(self.lightboxlauncherDiv).parentNode:document.body).appendChild(
                            (function(){
                                var el = document.createElement('div');
                                el.style.position = 'absolute';
                                el.style.width="100%";
                                el.style.top="0px";
                                el.innerHTML = divbHTML;
                                return (el.childNodes[0]);
                            })()
                    );
                } 
                if (options.options && options.options.source == 'LightboxLauncher'){
                    self.displayUltimatePay({source:options.options.source});
                } 
                else{
                    self.displayUltimatePay();
                }
                if (self.ieVersion==6 || self.ieVersion==7){
                	window.location.hash = '';    
                }


            }
            catch(e){console.log(e);}

        });


        pm.bind('doResize', function(dims){
            var cont = document.getElementById(self.lightboxDiv);
            var iframe = cont.getElementsByTagName('iframe')[0];
            cont.style.width = iframe.style.width = dims.width + 'px';
            cont.style.height = iframe.style.height = dims.height + 'px';

        });
        
        pm.bind('paymentSuccess', function(data){
        	self.fireEvent('paymentSuccess', data);
        	
        });
        
    }



};

UPay.prototype = {
        upParams    : {"method": "StartOrderFrontEnd", "display" : "Lightbox"},
        upConfirmParams : {"method":"GetConfirmation", "display" : "Lightbox"}, 
        pbcQueryString: "",
        lightboxDiv:'div_b',
        lightboxLauncherDiv:'div_ll',
        listeners:{},

        getVersion: function(){
            return(this.version);    
        },
        removeEl: function(el){
        	if(el && el.parentNode){
        		el.parentNode.removeChild(el);
        		return el;
        	}
        	return false;
        },
        closeBox: function(data){

            this.hide(this.lightboxDiv);
            this.html(this.lightboxDiv,''); 
            var dl = document.getElementById('DLFrameWrap');
            if (dl && dl.parentNode) {dl.parentNode.removeChild(dl);}

            this.fireEvent('closeLB', data);
        },
        displayUltimatePay: function(opts){
        	var self = this;
        	
        	var _displayUltimatePay = function(opts){
        		// calculate startTime of script
                cd = new Date();
                clickTime = cd.getTime();
                
                opts = opts||{};
                
                this.pbcQueryString = "";
                //todo - use arguments
                /**
                 * ..we have to reset these params
                 */
                

                this.upParams = {"method": "StartOrderFrontEnd", "display" : "Lightbox"};
                this.upParams = this.mergeJsonObj(ultimatePayParams, this.upParams, true);
                
                //click time add into params
                var clickTimeObj = {"clicktime":clickTime};
                this.upParams = this.mergeJsonObj(clickTimeObj, this.upParams, true);
                /**
                 * append parentUrl in the end
                 */
                var parentUrlObj = {"parenturl":this.parentUrl};
                this.upParams = this.mergeJsonObj(parentUrlObj, this.upParams, true);
                

                if(this.upParams.xdurl && this.upParams.xdurl.indexOf(':')>0){
                    this.upParams.xdurl = escape(this.upParams.xdurl);
                }

                this.preparePbcQueryString(this.upParams);
                
                          if(!this.ultimatePay){
                    this.displayIframe();     
                } else {
                    this.displayUltimatePayIframe();
                }
        		
        	};
        	
        	if(Playspan.doServerHealthCheck!=true){
        		_displayUltimatePay.apply(self, [opts]);
        		return;
        	}
        	
        	Playspan.serverHealth = false;
        	Playspan.serverHealthTimeout = false;
        	Playspan.server404 = false;
        	
        	(function(){
        		var testHealthScript = '//www.ultimatepay.com/shared/js/health.js?_=' + (new Date()).getTime();
        		var testHealthEl = document.createElement('script');
        		var lBdisplayed = false;
        		var ieCtr = 0;
        		
        		
        		var ifHealthy = function(){
        			
        			if (Playspan.serverHealth==true && Playspan.serverHealthTimeout==false && lBdisplayed==false ){
        				lBdisplayed=true;
    					_displayUltimatePay.apply(self, [opts]);
    				}
        		};
        		
        		if (Playspan.serverHealth==true && Playspan.serverHealthTimeout==false){
        			ifHealthy();
        			return;
        		}
        		
        		
        		testHealthEl.onreadystatechange=ifHealthy;
        		testHealthEl.onload = ifHealthy;
        		
        		testHealthEl.onerror = function(){
        			Playspan.serverHealthTimeout = true;
        			Playspan.server404 = true;
        			ifServerDown();
        		};
        		
        		
        		var ifServerDown = function(){
        			var elStr = '<div id="upayserverdown" style="font-family:Arial, Helvetica, sans-serif; padding:20px;width:600px;position:absolute;background-color:white;border:3px solid #cccccc;">'+
        			'    <div style="height:45px;clear:both">'+
        			 '   <img style="float:left" src="//static.pbc.com/shared/images/ultimatepay/logo-upay.png" border="0" alt="UltimatePay" />'+
        			 '<div id="closeserverhealthel" onclick="document.getElementById(\'upayserverdown\').parentNode.removeChild(document.getElementById(\'upayserverdown\'))" style="width:16px;height:16px;float:right;display:block;background-image:url(//static.pbc.com/shared/images/ultimatepay/icon_close.gif)"></div>'+
        			  '  </div>'+

'        			    <div style="padding-top:15px;">'+
 '       			    	<div style="float:left; position:absolute;"><img src="//static.pbc.com/shared/images/ultimatepay/icon-info.png" border="0" alt="Info" /></div>'+
  '      			        <div style="margin-left:40px;">	'+
   '     			            <div style="font-size:1.5em; color:#333;">Scheduled Maintenance</div>'+
    '    			        	<div style="font-size:.9em; padding-top:5px;">We\'re doing some maintenance on our servers right now. We\'ll be right back. Thank you!</div>'+
     '   			        </div>'+
      '  			    </div>'+
       ' 			</div>';
        			var el = document.createElement('div');
        			el.innerHTML = elStr;
        			var targetEl = el.childNodes[0];
        			targetEl.style.top = (document.body.scrollTop + 20) + 'px';
        			targetEl.style.left = ((document.body.offsetWidth - 620)/2) + 'px';
        			document.body.appendChild(targetEl);
        			
        		};
        		
        		setTimeout(function(){
        			if (Playspan.serverHealth!=true && Playspan.server404 == false){
        				Playspan.serverHealthTimeout = true;
        				ifServerDown();
        				
        			} 
        			
        			
        		}, 7000);//15 second timeout
        		
        		
        		document.body.appendChild(testHealthEl);
        		testHealthEl.src = testHealthScript;
        		
        	})();
        	
        	
        	
            



        },
          
        displayAutoUltimatePay: function(isPopupEnabled){  
            if(gup('token') != "" && isPopupEnabled){
                //....no popup for others
                if(gup('noLb') != 1){
                    /**
                     * ..we have to reset these params also
                     */
                    this.upConfirmParams = {"method":"GetConfirmation", "display" : "Lightbox", "token": gup("token"), "parenturl":this.parentUrl};
                    this.preparePbcQueryString(this.upConfirmParams);

                    this.displayUltimatePayIframe();
                }              

                return true;
            }  
            return false;     
        },

        displayIframe: function(){
            /**
             * var params = "&sn=UT04&userid=ps1_ABCDE&accountname=ps1_12345&mirror=MirrorValue&pkgid=030D&currency=USD&amount=9.95&amountdesc=Amount+Description+Goes+Here&sepamount=10.00&sepamountdesc=Separate+Item+Description+Goes+Here&fname=Test&lname=User&addr1=123+Bogus+St&city=Charlottesville&st=VA&zip=22901&country=US&phone1=%28434%29+984-0007&email=ps1%40paybycash.com&hash=83f9c675eb3e51d0fd20445d3f0f8eac&language=en";
             * ulp.upLiveUrl = 'https://www.ultimatepay.com/app/api/live/?method=StartOrderFrontEnd&display=UltimatePay'+params;  // live site
             * ulp.upLiveUrl = 'https://www.ultimatepay.com/app/api/test/?method=StartOrderFrontEnd&display=UltimatePay'+params; // test site  
             */
            var url = this.upLiveUrl+this.pbcQueryString;  
            
            
            var iframe = '<iframe name="up_payframe" width="770" height="426" style="background-color:#ffffff;" scrolling="no" frameborder="0" src="'+url + '"></iframe>'+this.getCloseButton();
            this.html('div_b', iframe);
            this.show('div_b');


            if(this.debug){
                alert(url);
            } 
        }, 
        displayUltimatePayIframe: function(){
            /**
             * var params = "&sn=UT04&userid=ps1_ABCDE&accountname=ps1_12345&mirror=MirrorValue&pkgid=030D&currency=USD&amount=9.95&amountdesc=Amount+Description+Goes+Here&sepamount=10.00&sepamountdesc=Separate+Item+Description+Goes+Here&fname=Test&lname=User&addr1=123+Bogus+St&city=Charlottesville&st=VA&zip=22901&country=US&phone1=%28434%29+984-0007&email=ps1%40paybycash.com&hash=83f9c675eb3e51d0fd20445d3f0f8eac&language=en";
             * ulp.upLiveUrl = 'https://www.ultimatepay.com/app/api/live/?method=StartOrderFrontEnd&display=UltimatePay'+params;  // live site
             * ulp.upLiveUrl = 'https://www.ultimatepay.com/app/api/test/?method=StartOrderFrontEnd&display=UltimatePay'+params; // test site  
             */
            var url = this.upLiveUrl+this.pbcQueryString;
            
             var spinnerImgUrl = 'https://static.pbc.com/shared/images/ultimatepay/ajax-loader.gif';
             var spinnerDiv = '<div id="spinnerdiv" style="opacity:0.6;filter:alpha(opacity = 60);position:absolute;top:0;left:0;width:729px;height:452px;background-color:#eeeeee;background-image:url('+ spinnerImgUrl+ ');background-position:center center;background-repeat:no-repeat"><div style="position:relative;text-align:center;top:190px;font-weight:bold;font-family:sans-serif;"></div></div>';
                


            /**
             * If selected test site then open in new window
             */
            if(this.upLiveUrl.match('/test/') != null){
                window.open(url,"TestSite"); 
                return;        
            }


            var iframeStr = '';

            var div;

            if(this.upParams.display==='Lightbox' || this.upParams.display.toLowerCase() === 'playstation3'){
                div = this.lightboxDiv;

                iframeStr = '<iframe id="up_payframe" onload="ulp.onIFload();" name="up_payframe" width="702" height="425" style="background-color:#ffffff;" scrolling="no" frameborder="0" src="' + url + '"></iframe>'+ spinnerDiv; //+ (this.ieVersion==7?this.getUltimatePayCloseButton():'');

            }
            else if(this.upParams.display==='LightboxLauncher'){
                div = this.lightboxLauncherDiv;
                iframeStr = '<iframe id="up_payframe_ll" name="up_payframe_ll" width="600" height="175" style="background-color:#ffffff;" scrolling="no" frameborder="0" src="' + url + '"></iframe>';
            }
            this.html(div, iframeStr);
            this.show(div);

            if(this.debug){
                alert(url);
            } 
        }, 
        onIFload:function(){
            var spinner = document.getElementById('spinnerdiv');
            if(spinner && spinner.parentNode) spinner.parentNode.removeChild(spinner);
            
        },

        getCloseButton: function(){
            var closeStr = '<div id="closeBtn" style="display:none;left:748px;position:absolute;top:15px;width:20px; padding-top: 12px; padding-right: 4px; width: 57px;">';
            closeStr += '<a style="vertical-align:middle;" onclick="ulp.closeBox();" href="javascript:void(0)"><img border="0" src="https://www.ultimatepay.com/shared/images/ultimatepay/icon_close.gif"/></a>';
            closeStr += '</div>';  
            return closeStr;
        },
        getUltimatePayCloseButton: function(){
            var closeStr = '<div id="closeBtn" style="display:block;left:676px;position:absolute;top:18px;width:20px; padding-top: 7px; padding-right: 0px; width: 57px;">';
            closeStr += '<a style="vertical-align:middle;" onclick="ulp.closeBox();" href="javascript:void(0)"><img border="0" src="https://www.ultimatepay.com/shared/images/ultimatepay/icon_close.gif"/></a>';
            closeStr += '</div>';  
            return closeStr;
        },
        parentLBOpen:function(upParamsObj, upLiveUrl, parentWindowUrl, options){
            pm({
                "target": window.parent,
                "type": 'openLB', 
                "data": {
                    "ultimatePayParams":upParamsObj,
                    "upLiveUrl" : upLiveUrl,
                    "options":options
                },
                "url":parentWindowUrl
            });

        },
        
        
        submitPaymentOption: function(id){
            var ele = this.getElement('payid'+id); 

            this.html('submitButton', '');
            var contentHtml = '<input type="hidden" name="chooseButton'+id+'" id="pay'+id+'" value="'+ele.value+'">';
            this.html('submitButton', contentHtml);   
        }, 

        /**
         * Payment options on choose page/more payment option page
         */
        initPaymentOptions:function(){
            var parent = document.getElementById('pay_buttons'); 
            var hNodes = parent.childNodes;  
            /**
             * Count the total number of pages      
             */
            for(var i=0;i<hNodes.length; i++) { 
                if(hNodes[i].className == 'pay_page'){
                    this.payPages++;   
                }
            }   
        },

        initPayOption:function(){
            var parent = document.getElementById('pay_methods'); 
            var hNodes = parent.childNodes;
            var cnt = 0; 
            for(var i=0;i<hNodes.length; i++) { 
                if(hNodes[i].className == 'pay_option'){
                    this.allPayOptsIds[cnt] = hNodes[i].id;
                    cnt++;   
                }
            }
            // calculating pages
            if(this.allPayOptsIds.length > 0){
                this.payPages = Math.ceil(this.allPayOptsIds.length / this.noPayOptsPerPage);  
            }
            //show first and hide others
            for(var i=0;i < this.allPayOptsIds.length; i++) { 
                var ele = document.getElementById(this.allPayOptsIds[i]);
                if(i < (this.currPayPage * this.noPayOptsPerPage) ) {
                    ele.className = 'pay_option show';  
                }else{
                    ele.className = 'pay_option hide';   
                }
            }


        },
        prevPaymentPage:function(){
            if( "1" == this.currPayPage){
                return; 
            }else{
                document.getElementById('page'+this.currPayPage).style.display = 'none';
                this.currPayPage--;
                document.getElementById('page'+this.currPayPage).style.display = '';
            }     
        },
        nextPaymentPage:function(){   
            if( this.payPages == this.currPayPage){
                return; 
            }else{
                document.getElementById('page'+this.currPayPage).style.display = 'none';
                this.currPayPage++;
                document.getElementById('page'+this.currPayPage).style.display = '';
            }     
        },

        preparePbcQueryString: function(upParams){
            for(var param in upParams){   
                if(this.pbcQueryString==""){
                    this.pbcQueryString += param+"="+upParams[param]; 
                }else{
                    this.pbcQueryString += "&"+param+"="+upParams[param]; 
                }
            }
            if(this.avoidRequestCache){
                if(this.pbcQueryString==""){ 
                    this.pbcQueryString += "no-cache="+new Date().getTime();  
                }else{
                    this.pbcQueryString += "&no-cache="+new Date().getTime();
                }   
            }
            if(this.debug){
                alert(this.pbcQueryString);
            } 
        },
        /**
         * Load more payment methods
         */
        onMethodSelect: function(id){
            this.selected_pay = id;

            this.submitPaymentOption(id);

        },


        /**
         * Common methods
         */   
        mergeJsonObj: function(src, dest, overwrite){
            for(var z in src){   
                if(!dest.hasOwnProperty(z) || overwrite){
                    dest[z] = src[z];  
                } 
            } 
            return dest; 
        },
        getElement: function(selector){
            this.elem = document;
            if ( typeof selector == "string" ){
                this.elem = document.getElementById(selector);
            }
            return this.elem;
        },  
        show: function(selector){
            this.getElement(selector).style.display = '';
        },
        hide: function(selector){
            this.getElement(selector).style.display = 'none';    
        },
        html: function (selector, content){
            this.getElement(selector).innerHTML = content;
        },
        timeOut: function(ms, selector){
            var _self = this;
            setTimeout(function (){
                _self.show(selector);
            }, ms);
        },
        on:function(evtName, fn){
            if(!this.listeners[evtName]){
                this.listeners[evtName] = [];
            }
            this.listeners[evtName].push(fn);


        },
        fireEvent:function(evtName, argsObj){
            if(!this.listeners[evtName]){
                this.listeners[evtName] = [];
            }
            for(var i=0;i<this.listeners[evtName].length;i++){
                this.listeners[evtName][i](argsObj);
            }

        },
        getFlashMovie:function (movieName) {   
            var isIE = navigator.appName.indexOf("Microsoft") != -1;   
            return (isIE) ? window[movieName] : document[movieName];  
        },
        elFromHtml:function(html){
            var wrap = document.createElement('div');
            wrap.innerHTML = html;
            return wrap.childNodes[0];
            
        },
        qs:{
            encode:function(o) {
                var str = [];
                for (var i in o) {
                    str.push(i + '=' + encodeURIComponent(o[i]));
                }
                return str.join('&');
            },
            decode:function(url) {

                var qs = url.split('?')[1];
                return this._decode(qs);

            },
            hashDecode:function(url) {
                var qs = url.split('#')[1];
                return this._decode(qs);

            },
            _decode:function(qs) {
                var result = {};
                if (qs) {
                    var nvpArr = qs.split('&');
                    for (var i = 0,j = nvpArr.length; i < j; i++) {
                        var nvp = nvpArr[i].split('=');
                        result[nvp[0]] = decodeURIComponent(nvp[1]);
                    }
                }
                return result;

            }
        },
        setParams:function(url){  //send in url generated by MTX api and automatically set ultimatePayParams
        	var base = url.split('?')[0] + '?';
        	var params = this.qs.decode(url);
        	
        	this.upLiveUrl = base;
        	for (var i in params){
        		ultimatePayParams[i] = params[i];
        	}
        }
};

var ulp = new UPay();




function gup( name )
{
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( window.location.href );
    if( results == null )
        return "";
    else
        return results[1];
}

function getFlashMovie(movieName) {   
    var isIE = navigator.appName.indexOf("Microsoft") != -1;   
    return (isIE) ? window[movieName] : document[movieName];  
}  

function ultimatepayPostProcess(data){
    //todo
}

function createCookie(name,value,days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name,"",-1);
}



Playspan.observe(window, 'load', function(){
    
    
    if(Playspan.XDReceiver===true || Playspan.XDReciever===true){        //spai: some people get spelling mistakes - PAY-554
        pm.bind('sendup', function(data){
            
            if(ulp.ieVersion==6 || ulp.ieVersion==7){   
                window.parent.parent.name = '$pm(' + JSON.stringify({type:data.type, data:data.data}) + ')';
            }
            else{
                pm({
                    target:window.parent.parent,
                    url:data.url, 
                    type:data.type,
                    data:data.data
                });	
            }
            
        });
    }
    else{
        //pm bind refactor to remove hash
        var pmListeners = {};
        var pmWindowName = window.name||'';
        var $pm = function(argsObj){
            var fns = pmListeners[argsObj.type];
            for (var i=0;i<fns.length;i++){
                fns[i].apply(this, [argsObj.data]);
            }
        };

        pm._oldBind = pm.bind;
        pm.bind = function(msg, fn){
            if(Playspan.ieVersion ==6 || Playspan.ieVersion==7){
                if (!pmListeners[msg]){
                    pmListeners[msg]=[];
                }
                pmListeners[msg].push(fn);
            }
            else{
                pm._oldBind.apply(pm, arguments);

            }
          
        };

        setInterval(function(){
            if(window.name.substring(0,4)==="$pm("){
                var pmsg = window.name;
                pmsg = pmsg.substr(4, pmsg.length-5);
                window.name = pmWindowName;
                $pm(JSON.parse(pmsg));
            }
            
            
        },200);
    }
    ulp.doPMBindings();
});

function closeps3(changeToken, serviceCode, token){
        var ulpPS = new UPay();
        var params = {changeToken:changeToken,serviceCode:serviceCode,token:token};
        ulpPS.closeBox(params);
    }

//do some quick preloading to prevent dns lookups for cdn stuff
(function(){
	var domains = ['https://upay-cdn0.playspan.com/','https://upay-cdn1.playspan.com/','https://upay-cdn2.playspan.com/'];
	Playspan.observe(window,'load',function(){
		for (var i=0;i<3;i++){
			(new Image()).src = domains[i]+ 'images/ultimatepay/blank.gif';
		}
	});
})();
