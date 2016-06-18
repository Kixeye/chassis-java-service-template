// imported from cc_framework
// Call a function or class method from inside Flash
function callFunc(func,args)
{
    //console.log([func,args]);
    if(func.indexOf('.') > -1)
    {
        func = func.split('.');
        var handle = window[func[0]];
        var base = handle;
        for(var i=1;i<func.length;i++) handle = handle[func[i]];
        handle.apply(base,args);
    }
    else window[func].apply(window[func],args);
}

// Deprecated streamPublish function
function sendFeed(ident,name,caption,image,targetid,actiontext,flash,ref)
{
    return cc.streamPublish(ident,name,caption,image,targetid,actiontext,flash,null,ref);
}

var CCFramework = new Class({

    Implements: [Options, Events],

    options: {
        bookmarked: null,
        liked: null,
        friends: null,
        appfriends: null,
        userdata: null,
        uid: null,
        signed_request: null,
        access_token: null
    },

    friendSwfInjected: false,

    initialize: function(options,nocanvas)
    {
        if(options) {
            this.setOptions(options);
            //console.log('ADT: ' + JSON.stringify(options));
        }
        this.user = new Hash(this.options.user);
        if(options.userdata)
        {
            this.iaSendData = false;
            this.addToUser(options.userdata);
        }
        this.fbid = this.user.fbid;
//		this.logEvent('CANVAS.FRAMEWORK.INIT');
        this.initPage(nocanvas);

        this.logLoadEvent('ccinit');

        if(this.user.kxid === null)
        {
            window.addEvent('KXPready', function() {
                if(typeof KXP != "undefined" && typeof KXP.kixigned_request != "undefined")
                {
                    new Request({
                        'url':this.options.localurl+'backend/registerkxp'
                    }).send('kixigned_request='+KXP.kixigned_request+'&'+this.options.fbdata);
                }
            }.bind(this));
        }
    },

    addToUser: function(data)
    {
        this.user.extend(data);
    },

    initPage: function(nocanvas)
    {
        if(this.options.integ == 'kg') this.getKgApi(function(api){});
        if(this.options.integ == 'fbg') this.initFbg();
        if(this.options.integ == 'kxp') this.initKxp();
        if(!nocanvas) this.setCanvasHeight.delay(1000,this);
    },

    initFbg: function(attempt)
    {
        this.setAccessToken(true);
        this.fireCcfReady();
    },

    initKxp: function()
    {
        this.fireCcfReady();

        var params = this.options.fbdata.parseQueryString();

        var feed_args = {
            type: 'notif-playing',
            toid: 'friends',
            message: ' began playing Battle Pirates.',
            headers: JSON.encode({}),
            'kixigned_request': params['signed_request']
        };

        new Request({url:'/live/sendmsg',data:feed_args}).send();
    },

    fireCcfReady: function()
    {
        if(typeOf(window.cc) != 'null') window.fireEvent('ccfready');
        else this.fireCcfReady.delay(500,this);
    },

    accessToken: null,
    setAccessToken: function(use_server_token)
    {
        if(use_server_token === true)
        {
            var params = this.options.fbdata.parseQueryString();
            return (this.accessToken = (params['access_token'] || null));
        }
        return (this.accessToken = FB.getAccessToken());
    },

    getAccessToken: function()
    {
        return this.accessToken;
    },

    // DEPRECATED - Removing once BP is migrated away
    logEvent: function(event,loadtime)
    {
        if (typeof(loadtime) == 'undefined')
            loadtime = new Date().getTime() - this.options.canvas_init_time;

        if (this.options.logurl !== '' && this.options.logsessionid !== '')
        {
            logvars =  'ts=0&logsession=' + this.options.logsessionid + '&key=' + event + '&userid=' + this.options.user.id + '&loadtime=' + loadtime;
            logvars += '&h=' + this.options.log_h + '&hn=' + this.options.log_hn;
            new Request.JSONP({
                'url': this.options.logurl + 'debug/recordloadjs?' + logvars,
                onSuccess: function(data)
                {
                    //console.log('[logEvent] ' + this.options.logsessionid + ' - ' + event);
                }.bind(this)
            }).send();
        }
    },

    logBrowserData: function(player_type, player_version)
    {
        var props = {
            'tag': 'canvasload',
            'browser': Browser.name,
            'version': Browser.version,
            'os': Browser.Platform.name,
            'device': player_type,
            'device_ver': player_version,
            'screen_res': window.screen.availWidth + "x" + window.screen.availHeight
        };

        this.logGenericEvent(props);
        this.sendEventDT(props);
    },

    logFailedGameLoad: function()
    {
        var props = {
            'tag': 'load',
            'stage': 0
        };

        this.logGenericEvent(props);
        this.sendEventDT(props);
    },

    logNavClick: function(action)
    {
        var current_location = window.location.href;
        var last_slash_pos = current_location.lastIndexOf('/');
        var screen_name = current_location.substring(last_slash_pos);

        var props = {
            'component_name':'topnav',
            'component_type':'button',
            'tag':'misc',
            'action':action,
            'screen_name': screen_name
        };
        this.logGenericEvent(props);
        this.sendEventDT(props);
    },

    // sendEventDT is meant to be called from JavaScript with the ctx parameter being the tags
    // dictionary of the old-style event.
    // This function wraps that old event in a Deep Thought header and passes it to sendBatchDT
    // as a batch, which is a Deep Thought requirement.
    sendEventDT: function(ctx)
    {
        //console.log('ADT: ' + JSON.stringify(ctx));

        if (this.options.enable_deep_thought != true)
            return;

        var kGameId = "WC";

        // wrap these legacy events in custom "wc_" events in Deep Thought format.
        var event = new Object;
        event['type'] = 'wc_' + ctx['tag'];
        event['client_utc'] = new Date().getTime();
        event['ctx'] = ctx;

        var batchInfo =
        {
            'batch_id': uuidCompact(),
            'source': 'client'
        };

        var userInfo =
        {
            'game_user_id': this.options.userid
        };

        var header =
        {
            'api_version': 3,
            'type': 'game',
            'game_id' : kGameId,
            'user_info' : userInfo
        };

        var batch =
        {
            'batch_info': batchInfo,
            'header': header
        };

        batch['events'] = new Array(event);

        //console.log('ADT: ' + JSON.stringify(batch));

        // now that we have a batch, send it.
        this.sendBatchDT(batch);
    },

    // sendBatchDT is intended to be called with a premade batch of events from both ActionScript
    // and JavaScript.
    // The reason this function exists is to add additional config info that is only available
    // in JavaScript and not ActionScript, and to avoid the hidden cross-site scripting
    // security checks in ActionScript.
    sendBatchDT : function(batch, ignoreSplit)
    {
        // the batch must have a header to be valid, we're going to add some info to it.
        var header = batch['header'];

        // events sent from JavaScript may have incomplete headers.
        if (header['user_info'] == null)
        {
            header['user_info'] = new Object;
        }

        if (header['hw_info'] == null)
        {
            header['hw_info'] = new Object;
        }

        if(this.options.kx_logger_env)
        {
            // add the English identifier for the environment, like "dev" or "prod".
            header['env'] = this.options.kx_logger_env;
        }

        // add the unique code for all events going out during this game session.
        header['session_id'] = this.options.logsessionid;

        if (this.options.user.kxid)
        {
            // if the user has a KIXEYE Live id, add it in under user_info.
            var userInfo = header['user_info'];
            userInfo['kxl_id'] = this.options.user.kxid.toString();
        }

        if (this.options.user.fbid)
        {
            var userInfo = header['user_info'];
            userInfo['fb_id'] = this.options.user.fbid.toString();
        }

        if (this.options.integ)
        {
            // platform is an id string like fbg for Facebook.
            var hardwareInfo = header['hw_info'];
            hardwareInfo['platform'] = this.options.integ;
        }

        // this is not secure but events from the client are not trusted anyway, and
        // hiding these in a language like JavaScript is easily defeated.
        var kDeepThoughtKey = this.options.deep_thought_client_key;
        var kDeepThoughtToken = this.options.deep_thought_client_secret;
        var kDeepThoughtRequestPathRoot = this.options.deep_thought_client_request_path;
        var kGameId = this.options.deep_thought_game_id;
        var kDeepThoughtCompleteRequestPath = kDeepThoughtRequestPathRoot + kGameId;

        var batchString = JSON.stringify(batch);
        console.log('ADT: ' + batchString);

        var batchStringMD5 = CryptoJS.MD5(batchString);

        var batchMessage;
        batchMessage = 'POST';
        batchMessage += '\n';
        batchMessage += kDeepThoughtCompleteRequestPath;
        batchMessage += '\n';
        batchMessage += batchStringMD5;

        var signature = CryptoJS.HmacMD5(batchMessage, kDeepThoughtKey);
        var authorizationHeader = "kxae_id_";
        authorizationHeader += kDeepThoughtToken;
        authorizationHeader += " : ";
        authorizationHeader += signature;

        // now send the batch out as a POST to the backend.
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST","https://" + this.options.deep_thought_request_host + kDeepThoughtCompleteRequestPath, true);
        xmlhttp.setRequestHeader("Authorization", authorizationHeader);
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=utf-8");
        xmlhttp.send(batchString);
        xmlhttp.onreadystatechange = function()
        {
            // 4: request finished and response is ready
            if (xmlhttp.readyState == 4)
            {
                console.log('ADT: Analytics event completed with http code:' + xmlhttp.status);
            }
            /*else
             {
             console.log('ADT: Analytics event processing with ready code: ' + xmlhttp.readyState);
             }*/
        }
    },

    logGenericEvent: function(props, ignoreSplit)
    {
        try
        {
            if(this.options.kx_logger_url === '' || this.options.kx_logger_key === '') return false;
            if(this.options.logsessionid === '' && !ignoreSplit) return false;

            var defaultProps = {
                'p': this.options.integ,
                'g': this.options.game.toUpperCase(),
                'key': this.options.kx_logger_key,
                's': this.options.user.fbid ? this.options.user.fbid : '0',
                'u': this.options.userid,
                'k': this.options.user.kxid ? this.options.user.kxid : '',
                'x': this.options.logsessionid,
                'app': this.options.appname,
                't': (new Date().getTime() / 1000),
                'type': 'image'
            };

            if(this.options.hasOwnProperty("userlevel") && this.options.userlevel > 0)
            {
                defaultProps['l'] = this.options.userlevel;
            }

            if(this.options.kx_logger_env)
            {
                defaultProps['env'] = this.options.kx_logger_env;
            }

            props = Object.merge(defaultProps,props);
            props = Object.toQueryString(props);
            this.callUrl(this.options.kx_logger_url + '?' + props);
        } catch(e){}
    },

    logExtendedEvent: function(props)
    {
        var log_url =  this.options.localurl + 'v2/log.php';
        try
        {
            var defaultProps = {
                'p': this.options.integ,
                'g': this.options.game.toUpperCase(),
                'key': this.options.kx_logger_key,
                's': this.options.user.fbid ? this.options.user.fbid : '0',
                'u': this.options.userid,
                'k': this.options.user.kxid ? this.options.user.kxid : '',
                'x': this.options.logsessionid,
                'app': this.options.appname,
                't': (new Date().getTime() / 1000),
                'type': 'image'
            };

            if(this.options.hasOwnProperty("userlevel") && this.options.userlevel > 0)
            {
                defaultProps['l'] = this.options.userlevel;
            }

            if(this.options.kx_logger_env)
            {
                defaultProps['env'] = this.options.kx_logger_env;
            }

            props = Object.merge(defaultProps,props);
            props = Object.toQueryString(props);
            this.callUrl(log_url + '?' + props);
        } catch(e){}
    },

    // Record the load event.  loadtime: duration
    logLoadEvent: function(event,loadtime)
    {
        try
        {
            // values:  "install" or "load"
            var st = (this.options.kx_logger_st) ? this.options.kx_logger_st : 'load';
            var t = new Date().getTime();

            if (typeof(loadtime) == 'undefined')
                loadtime = t - this.options.canvas_init_time;


            var props = {
                't': (new Date().getTime() / 1000),
                'tag':st,
                'stage': event,
                'loadtime': loadtime,
                'u': this.options.userid
            };

            if(this.options.logsessionid) props['loadid'] = this.options.logsessionid;

            this.logGenericEvent(props);
            this.sendEventDT(props);
        } catch(e){}
    },

    // Record the load event.  loadtime: duration
    // This endpoint is specifically for client logging to diagnose a loading problem
    // with an extra parameter duplicate of logLoadEvent with extra params and with an extra endpoint to
    // potentially send to centralized logging as well

    logLoadEventEx: function(event, extra, loadtime)
    {
        try
        {
            // values:  "install" or "load"
            var st = (this.options.kx_logger_st) ? this.options.kx_logger_st : 'load';
            var t = new Date().getTime();

            if (typeof(loadtime) == 'undefined')
                loadtime = t - this.options.canvas_init_time;


            var defaultProps = {
                't': (new Date().getTime() / 1000),
                'tag':st,
                'stage': event,
                'loadtime': loadtime,
                'u': this.options.userid
            };

            var props = Object.merge(defaultProps,extra);

            if(this.options.logsessionid) props['loadid'] = this.options.logsessionid;

            this.logGenericEvent(props);  // Send to bi logging
            this.logExtendedEvent(props); // Send to Centralized Logging
        } catch(e){}
    },


    logFlashCapabilities: function(flashProps)
    {
        var t = new Date().getTime();
        //check the cookie

        var last_log_ts = JSON.parse(Cookie.read('flashcap'));
        if(last_log_ts)
        {
            if(last_log_ts[this.options.userid] && (t - last_log_ts[this.options.userid] < 24*60*60)){
                return;

            }
        }
        //t: unix time stamp
        //u: required user id
        //l: user level
        try
        {
            //browser
            //browser_version
            //os
            //flash_version
            //screen_resolution: 1024x768
            //screen_dpi
            var props = {
                'browser' : BrowserDetect.browser,
                'browser_version' : BrowserDetect.version,
                'os' : BrowserDetect.OS,
                'u': this.options.userid,
                't': t,
                'l': this.options.userlevel,
                'window_size': window.innerWidth+'x'+window.innerHeight,
                'tag':'canvasload',
                'ipaddr': this.options.ipaddr
            };
            props = Object.merge(flashProps,props);
            if(this.options.integ=='fbg'){
                this.getFriends(function(data)
                {
                    if(data!==null){
                        props.frnd_cnt = data.length;
                        //calculate the standard deviation of friend fb ids in javascript
                        var friend_list = [];
                        for (var key in data)
                        {
                            var friend_id = data[key];
                            if(!isNaN(friend_id) && friend_id.toString().length>=14)
                            {
                                friend_list.push(friend_id);
                            }
                        }

                        props.frnd_stdev = friend_list.stdDeviation();

                    }
                    this.getAppFriends(function(data2)
                    {
                        if(data2!==null){
                            props.a_frnd_cnt = data2.length;
                            props.a_frnd_list = data2.join();
                        }
                        this.sendEventDT(props);
                        this.logGenericEvent(props);
                    }.bind(this));
                }.bind(this));
            } else {
                this.sendEventDT(props);
                this.logGenericEvent(props);
            }
            this.sendSignedRequest();

            //store cookie
            if(!last_log_ts)
                last_log_ts = {};
            last_log_ts[this.options.userid] = t;
            Cookie.write('flashcap',JSON.stringify(last_log_ts));
        } catch(e){
        }
    },

    sendSignedRequest: function()
    {
        var params = this.options.fbdata.parseQueryString();
        var props = {
            'game': this.options.game.toUpperCase(),
            'signed_request': params['signed_request']
        };

        props = Object.toQueryString(props);
        this.callUrl(this.options.kx_biapp_url + '?' + props);
    },

    getCanvasLoadTime: function()
    {
        this.logEvent('CANVAS.DOMREADY', this.options.canvas_load_time);
//		this.sendToSwf('canvasLoadTimeCallback',JSON.encode({'canvas_load_time':this.options.canvas_load_time}));
    },

    kgApi: null,
    kgApiLoadingState: 0,
    gkgActive: false,
    gkgCallbacks: null,
    getKgApi: function()
    {
        if(this.kgApi !== null)
        {
            return this.kgApi;
        }
        if (this.kgApiLoadingState === 0)
        {
            kongregateAPI.loadAPI(function(){
                cc.kgApi = kongregateAPI.getAPI();
                cc.kgApiLoadingState = 2;
                cc.kg_onPurchaseResult({success:1});
            });
            this.kgApiLoadingState = 1;
            return true;
        }
        else if (this.kgApiLoadingState == 1)
        {

        }
        return true;
    },
    shinyDialog: null,
    giveKgTopupPopup: function(url)
    {
        var loadingBg = '';
        if(!this.shinyDialog)
        {
            this.shinyDialog = new Element('div',{'class':'shinydialog','styles':{'position':'absolute','top':10,'left':((this.options.game_width-724)/2).round(),'width':724,'height':467,'overflow':'visible','background':'url(\''+this.options.cdnurl+'images/feeddialog/outside3.png\') no-repeat','padding':'10px 0 0 11px','z-index':9}});
            this.shinyDialog.adopt(
                new Element('div',{styles:{'background-image':'url('+loadingBg+')','position':'absolute','top':'12px','left':'14px','width':'697px','height':'446px'}}),
                new Element('div',{
                    'id':'shiny-dialog',
                    'styles': {'position':'absolute','top':'12px','left':'14px','width':'697px','height':'446px'}
                }),
                new Element('img',{src:this.options.cdnurl+'images/close2.png',styles:{width:33,height:33,cursor:'pointer',position:'absolute',top:0,right:18}}).addEvent('click',function(){ this.kgHideShinyDialog(); }.bind(this))
            );

            $('content').grab(this.shinyDialog);

            new Request({
                url:this.options.localurl+'canvas/kgtopupiframe?'+this.options.fbdata,
                evalScripts: true,
                onSuccess: function(data)
                {
                    $('shiny-dialog').set('html',data);
                }.bind(this)
            }).send();
        }
    },
    kgHideShinyDialog: function()
    {
        if(this.shinyDialog)
        {
            this.shinyDialog.dispose().empty();
            this.shinyDialog = null;
        }
    },
    buyKgItem: function(item)
    {
        var cartItems = [];
        cartItems.push(item);
        this.kg_showTopup(cartItems);
    },

    setCanvasHeight: function()
    {
        if(this.options.integ == 'kg') return true;
        var height = document.getScrollSize().y + 10;
        if(this.options.integ == 'fb')
        {
            FB.Bootstrap.requireFeatures(["CanvasUtil","Api","Connect"], function() {
                FB.CanvasClient.setCanvasHeight(height+'px');
            });
        }
        if(this.options.integ == 'fbg')
        {
            FB.Canvas.setSize();
        }
    },

    loadFlashVars: function(callback)
    {
        var fvars = this.options.jflashvars;
        this.sendToSwf(callback, jQuery.param(fvars));
    },

    showFlashGiftsPopup: function(){
        this.sendToSwf("showGiftsPopup", {});
    },

    loadGame: function(el,args)
    {
        // Set local variables
        var localurl    = this.options.localurl;
        var fvars       = this.options.jflashvars;
        var loadflag    = this.options.loadflag;
        fvars.gameversion = args.gameversion;
        fvars.softversion = args.softversion;
        // Facebook API calls
        function authenticateFbUser() {

            FB.getAuthResponse(function(response) {
                if (response.status === 'connected') {
                    // Set fvars for FWK endpoint
                    fvars.fbid              = response.authResponse.userID;
                    fvars.access_token      = response.authResponse.accessToken;
                    fvars.signed_request    = response.authResponse.signedRequest;
                } else {
                    FB.login();
                    window.location.reload(true);
                }
            });

            // Ensure facebook api call is finished
            if (!fvars.fbid) {
                console.log("FB id not set");  //TODO:  check for race conditions and set retry limit to 3
            }
        }

        function setNewFvars(authvars) {

            // Call FWK endpoint
            var api_vars;
            api_vars = jQuery.parseJSON(getFbCredentials(authvars.access_token, authvars.signed_request, authvars.userid));

            // Set fvars for Game Load
            fvars.userid            = api_vars.uid;
            fvars.access_token      = api_vars.token;
            fvars.signed_request    = api_vars.sig;

        }

        function getFbCredentials(access, request, uid) {

            // Setup data for MooTools HTTP Request
            var http_data = 'tkn='+access+'&sig='+request+'&signed_request='+request+'&uid='+uid+'&loadflag='+loadflag;
            console.log("http data: " + http_data);

            var request = new Request({
                url: localurl+'backend/usercredentials',
                method: 'get',
                async: false,
                data: http_data,
                timeout: 1000,
                onRequest: function(){
                    console.log('Request sent, please wait.');
                },
                onSuccess: function(){
                    console.log('Request received successfully.');
                },
                onFailure: function(){
                    console.log('Request failed, please try again.');
                },
                onTimeout: function(){
                    console.log('Request timeout, please try again.');
                }
            }).send();

            return request.response.text;
        }

        el = $(el);
        if(!el) return false;

        // Authenticate Facebook User.  WC-20233
        if (loadflag != 1 && this.options.integ !== 'kxp') {

            // TODO:  Unset fvars.
            // fvars.userid = null; fvars.access_token = null; fvars.signed_request = null;

            // Authenticate user
            authenticateFbUser();
            setNewFvars(fvars);
        }

        var loadername, loaderversion, filename;

        if(args.loaderversion > 0)
        {
            loadername = 'gameloader';
            loaderversion = args.loaderversion;
            filename = args.gameurl + loadername + '-v' + loaderversion + '.swf';
        }
        else
        {
            loadername = 'game';
            loaderversion = args.gameversion;
            filename = args.gameurl + loadername + '-v' + loaderversion + '.v' + fvars.softversion + '.swf';
        }

        //console.log('ADT:' + filename);
        //console.log('ADT:' + args.gameurl);

        var wmode = 'transparent';
        if (this.options.wmode) wmode = this.options.wmode;

        swfobject.embedSWF(
            filename,
            'game',
            args.game_width,
            args.game_height,
            "10.0.0",
            "",
            fvars,
            {'allowfullscreen':true,'allowscriptaccess':'always','wmode':wmode,'allowFullScreenInteractive':true},
            {'id':'gameswf'},
            function(){
                this.setGameSwf($('gameswf'));
                this.logLoadEvent('loaderstart');

                if (this.options.game == 'gp')
                {
                    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
                        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
                        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
                    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

                    ga('create', 'UA-42097153-1', 'facebook.com');
                    ga('send', 'pageview');
                }
            }.bind(this)
        );

        return true;
    },

    loadGameUnity: function(el,args)
    {
        el = $(el);
        if(!el) return false;
        var fvars = this.options.jflashvars;
        fvars.gameversion = args.gameversion;
        fvars.softversion = args.softversion;

        var loadername, loaderversion, filename;

        if(args.loaderversion > 0)
        {
            loadername = 'gameloader';
            loaderversion = args.loaderversion;
            filename = args.gameurl + 'webplayer/gameClient/' + loadername + '-v' + loaderversion + '.unity3d';
        }
        else
        {
            loadername = 'game';
            loaderversion = args.gameversion;
            filename = args.gameurl + 'webplayer/gameClient/' + loadername + '-v' + loaderversion + '.v' + fvars.softversion + '.unity3d';
        }

        //filename += "?" + jQuery.param(fvars);

        //unityObject.embedUnity('game', filename, args.game_width, args.game_height, null, null, function(obj) { cc.setGameSwf(obj.ref); });

        var config = {
            width: args.game_width,
            height: args.game_height,
            params: {}
        };
        config.params["disableContextMenu"] = true;
        var u = new UnityObject2(config);
        this.u = u;

        u.observeProgress(function (progress) {
            switch(progress.pluginStatus) {
                case "broken":
                case "missing":
                    //TODO: load the game in flash
                    //var swf_ver = swfobject.getFlashPlayerVersion();
                    //cc.logBrowserData("flash", swf_ver.major + "." + swf_ver.minor + "." + swf_ver.release);

                    //TODO: when the game can be loaded in flash, this should be moved to if the flash also refuses to load
                    var props = {
                        'tag'   : 'load',
                        'stage' : 0
                    };
                    cc.logGenericEvent(props);
                    cc.sendEventDT(props);

                    if (typeof showUnsupported == 'function') showUnsupported();
                    break;
                case "installed":
                    if (typeof hideUnsupported == 'function') hideUnsupported();
                    break;
                case "first":
                    var unity = u.getUnity();
                    cc.setGameSwf(unity);
                    cc.logBrowserData("unity", unity.GetPluginVersion());
                    break;
            }
        });
        u.initPlugin(el, filename);

        return true;
    },

    expectedIaResults: null,
    receivedIaResults: 0,
    defaultIaResults: {userdata:0,friends:0,appfriends:0,bookmarked:0,liked:0},
    iaResults: {},
    iaCallback: null,
    iaVersion: 0,
    iaSendData: true,
    iaAttemptNo: 1,
    inited: false,
    initApplication: function(version,callback)
    {
        this.iaResults = this.defaultIaResults;

        if(!$defined(version)) return false;
        this.logLoadEvent('initstart');
        this.iaVersion = version;
        if(callback) this.iaCallback = callback;
        if(this.receivedIaResults > 0 || !this.iaSendData) return this.sendIaResults();

        if(this.options.integ == 'kg') this.kg_gatherIaResults();
        else if(this.options.integ == 'kxp') this.kxp_gatherIaResults();
        else this.gatherIaResults();
    },

    noInit: function()
    {
        this.inited = true;
    },

    gatherIaResults: function(force)
    {
        if(!force) force = false;

        this.expectedIaResults = 6;
        this.getFriends(function(data){ this.iaResult('friends',data); }.bind(this),force);
        this.getAppFriends(function(data){ this.iaResult('appfriends',data); }.bind(this),force);
        this.getUserData(function(data){ this.iaResult('userdata',data); }.bind(this),force);
        this.getBookmarked(function(data){ this.iaResult('bookmarked',data); }.bind(this),force);
        this.getLiked(function(data){ this.iaResult('liked',data); }.bind(this),force);
        this.getAppRequests(function(data){ this.iaResult('apprequests',data); }.bind(this),force);
    },

    vx_gatherIaResults: function()
    {
        this.expectedIaResults = 2;
        this.vx_getFriends(function(data){ this.iaResult('friends',data); }.bind(this));
        this.vx_getUserData(function(data){ this.iaResult('userdata',data); }.bind(this));
    },

    kg_gatherIaResults: function()
    {
        //this.expectedIaResults = 1;
        //this.kg_getFriends(function(data){ this.iaResult('friends',data); }.bind(this));
        //this.kg_getAppFriends(function(data){ this.iaResult('appfriends',data); }.bind(this));
        //this.kg_getUserData(function(data){ this.iaResult('userdata',data); }.bind(this));
        this.iaSendData = false;
        this.sendIaResults();
    },

    kxp_gatherIaResults: function()
    {
        this.expectedIaResults = 1;
        //this.iaResult('userdata', encodeURIComponent(this.options.fbdata));
        //We are url encoding entire data before senind as param to initapplication framework endpoint. So this url encoding above is not needed and erroneous.
        this.iaResult('userdata', this.options.fbdata);
        // sendIaResults was getting invoked twice for KXL. Commenting out this one!
        //this.sendIaResults();
    },

    iaResult: function(name,data)
    {
        this.iaResults[name] = data;

        if(name == 'userdata' && this.debugData !== null)
        {
            this.iaResults['error'] = this.debugData;
        }

        this.receivedIaResults++;
        if(this.expectedIaResults == this.receivedIaResults)
        {
            try{
                // If userdata is empty, retry, but only on facebook
                if(!this.iaResults.userdata.uid && this.options.integ == "fbg")
                {
                    if(this.iaAttemptNo == 5)
                    {
                        this.iaResults.error = 'Userdata could not be retrieved after 5 attempts';
                        this.sendIaResults();
                    }
                    else
                    {
                        this.iaResults = this.defaultIaResults;
                        this.receivedIaResults = 0;

                        // Delay retry to allow for temporary network issues
                        (function(){
                            this.iaAttemptNo++;
                            this.gatherIaResults(true);
                        }.bind(this)).delay((this.iaAttemptNo*1500),this); // Increase interval with each retry
                    }
                }
                else this.sendIaResults();
            }
            catch(e){ this.sendIaResults(); }
        }
    },

    sendIaResults: function()
    {
        this.setTabs();
        new Request({
            'url':this.options.localurl+'backend/initapplication',
            onSuccess: function(data)
            {
                this.logLoadEvent('initend');
                this.inited = true;

                try {
                    window.initAllianceDialog();
                }
                catch(err) {
                    //ignore
                }
                if(this.iaVersion == 'reload')
                {
                    this.reloadParent();
                }
                else
                {
                    if(this.iaCallback)
                    {
                        if($type(this.iaCallback) == 'function') this.iaCallback();
                        else this.sendToSwf(this.iaCallback,data);
                    }
                    else if (this.options.game == 'wc' && this.options.opt_showleaderboard) {
                        setTimeout(
                            function() {
                                this.showLeaderboard();
                            }.bind(this),
                            this.options.opt_showleaderboard
                        );
                    }
                    else
                    {
                        this.giftRedir();
                    }
                    this.injectFriendsSwf();

                    if (this.options.game != 'wc')
                    {
                        try{ this.recordUserInfo(); } catch(e){}
                    }
                }
            }.bind(this)
        }).send('version='+this.iaVersion+(this.iaSendData?'&data='+encodeURIComponent(JSON.encode(this.iaResults)):'')+'&returninfo='+(this.iaCallback?1:0)+'&'+this.options.fbdata);


    },

    injectFriendsSwf: function()
    {
        if (this.friendSwfInjected === true) return true;
        this.friendSwfInjected = true;
        if(this.options.fswfversion === 0) return false;
        if(this.options.fswfversion === 0) return false;

        if(this.options.integ != 'kxp')
        {
            if(!$('friends')) return false;

            if (this.options.game == 'gp')
            {
                friend_swf = this.options.assetsurl + 'friendsbar.swf'
            }
            else
            {
                friend_swf = this.options.cdnurl+'flash/friends.v'+this.options.fswfversion+'.swf'
            }

            swfobject.embedSWF(friend_swf, 'friends', this.options.game_width, this.options.fswf_height, "10.0.0", "", this.options.jflashvarsf, {'allowfullscreen':false,'allowscriptaccess':'always','wmode':'transparent'}, {'id':'friendsswf'});
        }

        this.setCanvasHeight.delay(500,this);

        return true;
    },

    giftRedir: function()
    {
        if(this.options.integ != 'fbg' || !this.options.giftredir || $type(this.options.appfriends) != 'array') return false;
        var af = this.options.appfriends;
        if(af.length < 5) this.showFeedDialog('invite');
        else if (Math.round(Math.random()) && this.options.game == 'wc') this.showFeedDialog('invite');
        else this.showFeedDialog(this.options.giftredir);
    },

    getFriends: function(callback,force)
    {
        if(force) this.options.friends = null;

        if(this.options.friends !== null)
        {
            if($defined(callback) && $type(callback) == 'function') callback(this.options.friends);
            return this.options.friends;
        }
        if (this.options.integ == 'fbg')
        {
            FB.api('/me/friends?access_token='+this.getAccessToken(), function(res) {
                var data = [];
                if($type(res.data) == 'array')
                {
                    var tmp = $A(res.data);
                    tmp.each(function(v){ data.push(parseInt(v.id,10)); });
                }
                this.options.friends = data;
                if($defined(callback) && $type(callback) == 'function') callback(data);
            }.bind(this));
        }
    },

    getAppRequests: function(callback,force)
    {
        FB.api('/me/apprequests?access_token='+this.getAccessToken(), function(res){
            var data = [];
            if($type(res.data) == 'array') data = res.data;
            if($defined(callback) && $type(callback) == 'function') callback(data);
        });
    },

    getAppFriends: function(callback,force)
    {
        if(force) this.options.appfriends = null;

        if(this.options.appfriends !== null)
        {
            if($defined(callback) && $type(callback) == 'function') callback(this.options.appfriends);
            return this.options.appfriends;
        }
        if (this.options.integ == 'fbg')
        {
            FB.api('/me/friends?access_token='+this.getAccessToken(), function(res) {
                var data = [];
                if($type(res.data) == 'array')
                {
                    var tmp = $A(res.data);
                    tmp.each(function(v){ data.push(parseInt(v.id,10)); });
                }
                this.options.appfriends = data;
                if($defined(callback) && $type(callback) == 'function') callback(data);
            }.bind(this));
        }
    },

    sendAppActions: function(action,object,object_param)
    {
        if (this.options.integ !== 'fbg') return;

        var send_obj = {
            access_token : this.getAccessToken(),
            no_feed_story: 1
        };
        send_obj[object] = this.options.fbog_localurl + 'fbog/' + object + '?' + object + '=' +  object_param;
        new Request.JSON({
            'url':this.options.localurl + 'backend/adduserfbactions',
            onSuccess: function(data)
            {
                if(data.success==1)
                {
                    FB.api('/me/'+this.options.appname + ':' +  action, 'post',
                        send_obj);
                }
            }.bind(this)
        }).send('userid=' + this.options.userid + '&action=' + object +'&'+this.options.fbdata);
    },

    debugData: null,
    getUserData: function(callback,force)
    {
        if(force) this.options.userdata = null;

        if(this.options.userdata !== null)
        {
            if($defined(callback) && $type(callback) == 'function') callback(this.options.userdata);
            return this.options.userdata;
        }
        if (this.options.integ == 'fbg')
        {
            var info_fields = ['id','email','first_name','last_name','link','gender','currency'];
            //if(this.options.local_currency == 1) info_fields.push("currency");
            FB.api('/me/?fields=' + info_fields.join(","), function(res){
                var data = res;
                data.birthday_date = "";
                data.profile_url = data.link;
                data.pic = data.profile_url + "/picture?type=square"
                data.pic_square = data.profile_url + "/picture?type=square"
                data.uid = data.id;
                data.sex = data.gender;
                data.location = "";
                this.options.userdata = data;
                this.addToUser(data);
                if($defined(callback) && $type(callback) == 'function') callback(data);
            }.bind(this));
        }
    },

    getBookmarked: function(callback,force)
    {
        if(force) this.options.bookmarked = null;

        if(this.options.bookmarked !== null)
        {
            if($defined(callback) && $type(callback) == 'function') callback(this.options.bookmarked);
            return this.options.bookmarked;
        }
        if (this.options.integ == 'fbg')
        {
            var data = 0;
            this.options.bookmarked = data;
            if($defined(callback) && $type(callback) == 'function') callback(data);
        }
    },

    getLiked: function(callback,force)
    {
        if(force) this.options.liked = null;

        if(this.options.liked !== null)
        {
            if($defined(callback) && $type(callback) == 'function') callback(this.options.liked);
            return this.options.liked;
        }
        if (this.options.integ == 'fbg')
        {
            var data = 0;
            this.options.liked = data;
            if($defined(callback) && $type(callback) == 'function') callback(data);
        }
    },

    setTabs: function()
    {
        proto = 'http';
        if (window.location.href.indexOf('https:') > -1)
        {
            proto = 'https';
        }

        if(this.options.integ != 'fbg' || !$('mmenu')) return false;
        if(!this.options.liked)
        {
            $('mmenu').innerHTML += '<li><a id="menu-like" href="' + this.options.fanpageurl + '" class="wimg" target="_blank">Like <img src="'+this.options.cdnurl+'images/like.png" style="position: absolute; right: 4px; top: 1px;" /></a></li>';
        }
    },

    gameswf: null,
    setGameSwf: function(swf)
    {
        this.gameswf = swf;
    },
    getGameSwf: function()
    {
        return this.gameswf;
    },
    sendToSwf: function(callback,params)
    {
        if(this.options.game_type == "unity")
        {
            //unity can only take a single string as a parameter...
            if(typeof(params) == "object")
            {
                params = JSON.encode(params);
            }
            else if(typeof(params) != "string")
            {
                params = String(params);
            }
            this.getGameSwf().SendMessage("GameClientManager", callback, params);
        }
        else
        {
            Swiff.remote(this.getGameSwf(),callback,params);
        }
    },

    checkFlashVersion: function(version)
    {
        if(!Browser.Plugins.Flash.version || Browser.Plugins.Flash.version < version) return false;
        return true;
    },

    redirect: function(to)
    {
        window.top.location = to;
    },

    setCounter: function(to)
    {
        return false;
    },

    platformBuyCredits: function(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info)
    {
        if(this.options.integ == 'fbg')
        {
            return this.fbcBuyCredits(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info);
        }
        else if (this.options.integ == 'kxp')
        {
            if(typeof (this.options.payment_provider) !== 'undefined')
            {
                if (this.options.payment_provider==2)
                    return this.upayBuyCredits(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info);
                else if (this.options.payment_provider==3)
                    return this.paypalBuyCredits(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info);
                else if (this.options.payment_provider==4)
                    return this.KXLBuyCredits(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info);
            }
            return this.upayBuyCredits(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info);
        }
    },

    fbCredits: null,
    getFbCredits: function()
    {
        if(this.fbCredits !== null) return this.fbCredits;
        return (this.fbCredits = new FBCredits());
    },

    buyFbCredits: function(ncp,callback)
    {
        fbc = this.getFbCredits();
        return fbc.buyFbCredits(ncp,callback);
    },

    fbcGetBalance: function()
    {
        //console.log('fbcGetBalance');
        fbc = this.getFbCredits();
        return fbc.getBalance(this.options.app_id,this.options.userdata.fbid,this.options.fb_access_token);
    },

    fbcBuyCredits: function(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info)
    {

        fbc = this.getFbCredits();
        if(cc.options.localcurrencypayments != undefined && cc.options.localcurrencypayments == 1) {
            return fbc.buyCreditsLocalCurrency(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info);
        }

        return fbc.buyCredits(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info);
    },

    fbcBuyItem: function(itemid,flash)
    {
        fbc = this.getFbCredits();
        return fbc.buyItem(itemid,flash,this.options.fbdata,this.options.integ);
    },

    upayCredits : null,

    getUpayCredits: function() {
        if (this.upayCredits !== null) return this.upayCredits;
        return (this.upayCredits = new UPayCredits());
    },

    upayBuyCredits: function(blockid, flash, viewid, clicked, giftids, special, variable_cost_params, item_info)
    {
        upc = this.getUpayCredits();
        return upc.buyCredits(blockid, flash, viewid, clicked, giftids, special, variable_cost_params, item_info);
    },

    upayCompletePayment: function()
    {
        upc = this.getUpayCredits();
        upc.completePayment();
    },

    KXLBuyComplete: false,
    KXLBuyCredits: function(blockid, flash, viewid, clicked, giftids, special, variable_cost_params, item_info)
    {
        this.KXLBuyComplete = false;

        var order_info = {
            blockid : blockid,
            viewid : (viewid ? viewid : 0),
            clicked : (clicked ? clicked : 0),
            giftids : (giftids ? giftids : ''),
            special : (special ? special : ''),
            variable_cost_params : (Object.getLength(variable_cost_params) > 0 ? variable_cost_params : []),
            item_info : (Object.getLength(item_info) > 0 ? item_info : [])
        };

        KXP.frameSendAndReceive('kxlBuyCredits', order_info, function(error, response) {
            cc.KXLBuyCreditsComplete(response);
        } );

        KXP.frameOn('kxlPopupClose', function(error) {
            cc.KXLClose();
        } );
    },

    KXLBuyCreditsComplete: function(response)
    {
        this.KXLBuyComplete = true;
        if (response.status == 'success' && this.getGameSwf())
        {
            this.getCreditBalance(function(data) {
                if (this.flashParam)
                {
                    this.sendToSwf(this.flashParam, {'status':'settled'});
                }
                this.sendToSwf('updateCredits',JSON.encode(data));
            }.bind(this), true);
        }
    },

    KXLClose: function()
    {
        if (this.KXLBuyComplete)
        {
            this.hideTopup();
        }
    },

    paypalFlashParam : null,
    paypalBuyCredits: function(blockid, flash, viewid, clicked, giftids, special, variable_cost_params, item_info)
    {
        this.embeddedPPFlow = new PAYPAL.apps.DGFlow({expType: "instant"});

        var paypalRequestData = {
            blockid : blockid,
            viewid : (viewid ? viewid : 0),
            clicked : (clicked ? clicked : 0),
            giftids : (giftids ? giftids : ''),
            special : (special ? special : ''),
            variable_cost_params : (variable_cost_params ? variable_cost_params : []),
            item_info : (item_info ? item_info : [])
        };
        this.paypalFlashParam = flash;

        this.embeddedPPFlow.startFlow(this.options.localurl + "backend/passtopaypal?data="+JSON.encode(paypalRequestData)+'&'+this.options.fbdata);
    },

    paypalUpdateCredits: function()
    {
        if(this.getGameSwf())
        {
            this.getCreditBalance(function(data){
                if(this.paypalFlashParam)
                {
                    cc.sendToSwf(this.paypalFlashParam, {'status':'settled'});
                }
                cc.sendToSwf('updateCredits',JSON.encode(data));
            }, true);
        }
    },

    ncp: function(method,callback)
    {
        switch(method)
        {
            case 'checkEligibility':
                new Request.JSON({
                    'url':this.options.localurl+'backend/ncp',
                    onSuccess: function(data){
                        if(this.options.game == 'wc')
                        {
                            this.sendToSwf(callback,data.eligible);
                        }
                        else
                        {
                            this.sendToSwf(callback,(data.eligible==1?'1':'0'));
                        }
                        if(data.eligible == 1)
                        {
                            this.logGenericEvent({tag:'ncp',action:'view'},true);
                            this.sendEventDT({tag:'ncp',action:'view'});
                        }
                        else if(data.eligible == 2)
                        {
                            this.logGenericEvent({tag:'ncp',action:'noview'},true);
                            this.sendEventDT({tag:'ncp',action:'noview'});
                        }
                    }.bind(this)
                }).send('method='+method+'&'+this.options.fbdata);
                break;

            case 'showPaymentDialog':
                new Request({
                    'url':this.options.localurl+'backend/ncp',
                    onSuccess: function(){
                        this.buyFbCredits(true,function(data){
                            if(data.credits_sale_status == 'settled')
                            {
                                this.sendToSwf(callback,'1');
                                if(this.options.game == 'bm') this.showTopup();
                                this.logGenericEvent({tag:'ncp',action:'buy'},true);
                                this.sendEventDT({tag:'ncp',action:'buy'});
                            }
                            else this.sendToSwf(callback,'0');
                        }.bind(this));
                        this.logGenericEvent({tag:'ncp',action:'click'},true);
                        this.sendEventDT({tag:'ncp',action:'click'});
                    }.bind(this)
                }).send('method='+method+'&'+this.options.fbdata);
                break;

            case 'userCancelled': case 'itemGiven':
            new Request({
                'url':this.options.localurl+'backend/ncp'
            }).send('method='+method+'&'+this.options.fbdata);
            break;
        }
    },

    clientCallWithCallback: function(callback, function_name, optionalparams)
    {
        switch(function_name)
        {
            case 'playnow':
            case 'ncp':
                cc[function_name](optionalparams['method'], callback);
                break;
            case 'initApplication':
                cc[function_name](optionalparams['version'], callback);
                break;
            case 'showFeedDialog':
                cc[function_name](optionalparams['type'], callback);
                break;
            case 'showTopup':
                optionalparams["callback"] = callback;
                cc[function_name](optionalparams);
                break;
            default:
                break;
        }
    },

    clientLoadCompleteCallback: function()
    {
        this.kxp_callFrameEmit('clientLoadComplete');
        if(typeof this.options.onLoadPopup === 'object')
        {
            switch(this.options.onLoadPopup.type)
            {
                case 'giftedgold':
                    var firstGift = this.options.onLoadPopup.data;
                    cc.showGiftReceivedDialog(firstGift.giftid, firstGift.fromid, firstGift.credits);
                    break;
                case 'usersurvey':
                    var survey = this.options.onLoadPopup.data;
                    cc.checkAndShowUserSurvey(survey.id);
                    break;
                default:
                    break;
            }
        }
    },

    playnow: function(method,callback)
    {
        // set the permissions we're asking for
        var perms = '';
        var step;
        switch(method)
        {
            case 'permRequest1':
                step = 1;
                perms = cc.options.authperms;
                break;

            case 'permRequest2':
                step = 2;
                perms = 'email';
                break;

            default:
                return;
        }

        FB.login(function(response) {
            var data = {};
            if (response.authResponse) {
                FB.api('/me?fields=email', function(response) {
                    data = response;
                    data.birthday_date = '';
                    console.log('Good to see you, ' + response.name + '.');
                });
                data.step = step;
                data.click = 'allow';
                //console.log(data);

                // if we already have the permissions, the dialog stays
                // open. this will ensure it closes.
                jQuery('.fb_dialog_close_icon').click();

                cc.sendToSwf(callback, data);
            } else {
                data.step = step;
                data.click = 'skip';
                //console.log(data);
                cc.sendToSwf(callback, data);
            }
        }.bind(this), {scope: perms})

    },


    reqNewPerm: false,
    cogFeed: function(action, obj, custom)
    {
        new Request.JSON({
            'url': this.options.localurl+'cog/send',
            onSuccess: function(data)
            {
                if (data.error)
                {
                    var code = (typeof(data.error.code) == 'undefined' ? 0 : data.error.code);
                    if (code === 1)
                    {
                        FB.login(function(response)
                        {
                            if (response.perms && response.perms == "publish_actions")
                            {
                                cc.cogFeed(action, obj, custom);
                            }
                        }, {perms:'publish_actions'});
                    }
                }
            }
        }).send(this.options.fbdata+'&action='+action+'&object='+obj+'&custom='+(typeof(custom) != 'string' ? JSON.encode(custom) : custom));
    },
    fdMask: null,

    feedDialog: null,
    fdCallback: null,
    showingFD: false,
    showFeedDialog: function(type,callback)
    {
        if(!this.inited) return false;

        try {
            if(alliances) {
                alliances.hideAlliancesDialog();
            }
        }
        catch(err) {
            //ignore
        }

        if(!this.inited) return false;
        if(this.showingFD) return false;
        if(this.giftsPopupContainer) return false;
        this.showingFD = true;


        if(this.options.integ == 'kg') return this.kg_showFeedDialog(type,callback);
        if(this.options.integ == 'kxp' && type == 'invite') return this.kxp_showFeedDialog(type,callback);

        if(callback) this.fdCallback = callback;

        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("opened");
        }

        if(!this.feedDialog)
        {
            this.feedDialog = new Element('div',{
                'class': 'feeddialog',
                'styles': {
                    //'left': (($('content').getSize().x-(this.options.game=='wc'?640:724))/2).round()
                    'left': '50%',
                    'margin-left':((this.options.game == 'wc' || this.options.game == 'gp') ? '-320px' : '-362px')
                }
            });

            this.fdMask = new Element('div',{
                'class': 'fd-mask',
                'styles': {
                    'opacity': 0.4
                }
            });
        }

        // If it is in the short invite flow A/B, skip this part
        // else, create the frame for the feeddialog box
        if(this.options.short_invite_flow != 1 || type != 'invite')
        {
            if(this.options.game=='bp'){
                this.feedDialog.grab(
                    new Element('div',{
                        'alt': 'X',
                        'class': 'fd-close'
                    }).addEvent('click',function()
                        {
                            this.hideFeedDialog();
                        }.bind(this)).addEvent('mouseover',function()
                        {
                            this.set('styles',{
                                backgroundPosition:'-16px 32px'
                            });
                        }).addEvent('mouseout',function()
                        {
                            this.set('styles',{
                                backgroundPosition:'-16px 0px'
                            });
                        })
                );
            }
            else if (this.options.game == 'gp')
            {
                this.feedDialog.grab(
                    new Element('div', {
                        'class': 'fd-close'
                    }).addEvent('click', function() {
                            this.hideFeedDialog();
                        }.bind(this))
                );
            }
            else
            {
                this.feedDialog.grab(
                    new Element('img',
                        {
                            'src': this.options.assetsurl+'images/feeddialog/close-button.png',
                            'alt': 'X',
                            'class': 'fd-close'
                        }).addEvent('click',function()
                        {
                            this.hideFeedDialog();
                        }.bind(this))
                );
            }

            this.feedDialog.adopt(
                new Element('div',{
                    'id':'feed-content-wrapper',
                    'class': 'fd-wrapper'
                }),
                new Element('div',{
                    'id':'feed-content',
                    'class': 'fd-content'
                })
            );

            $('content').grab(this.feedDialog);
            $('content').grab(this.fdMask);
        }

        new Request.HTML({
            url: this.options.localurl+'canvas/requestdialog?type='+type+'&'+this.options.fbdata,
            update: $('feed-content')
        }).send();
    },

    giftsPopupContainer: null,
    showGiftsDialog: function(type,callback)
    {
        if(!this.inited) return false;
        if(this.showingFD) return false;
        if(this.giftsPopupContainer) return false;

        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("opened");
        }

        (function($) {
            if(!this.giftsPopupContainer) {
                this.giftsPopupContainer = $('<div />');
                this.giftsPopupContainer.css(
                    {
                        'position':'absolute',
                        'top':'0px',
                        'left':'0px',
                        'width':this.options.game_width,
                        'height':this.options.game_height,
                        'overflow':'visible',
                        'z-index':'1337'
                    });
            }

            post_str = "";
            $.post(this.options.localurl+'canvas/requestdialog?type='+type+'&'+this.options.fbdata, post_str, function(data)
            {
                this.giftsPopupContainer.html(data);
            }.bind(this));

            $('#content').append(this.giftsPopupContainer);

        }.bind(this))(jQuery);
    },

    hideGiftsDialog: function()
    {
        if(this.giftsPopupContainer) {
            if (typeof(this.giftsPopupContainer.remove) == 'function') // handle jQuery object
            {
                this.giftsPopupContainer.html('').remove();
            }
            else
            {
                this.giftsPopupContainer.dispose().empty();
            }
        }

        this.giftsPopupContainer = null;

        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("closed");
        }
    },

    hideFeedDialog: function(result,type,ku,recipients,splitid)
    {
        if(!this.showingFD) return false;
        if (typeof(this.feedDialog.remove) == 'function') // handle jQuery object
        {
            this.feedDialog.set('html', '').remove();
            this.fdMask.set('html', '').remove();
        }
        else
        {
            this.feedDialog.dispose().empty();
            this.fdMask.dispose();
        }
        this.showingFD = false;
        if(this.fdCallback)
        {
            this.sendToSwf(this.fdCallback,JSON.encode({"success":(result?1:0)}));
            this.fdCallback = null;
        }
        //if($defined(type) && $defined(ku) && $defined(recipients) && $defined(splitid)) this.recordFeed(type,ku,recipients,splitid);

        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("closed");
        }
    },

    switchFeedDialog: function(type,callback)
    {
        this.hideFeedDialog();
        this.showFeedDialog(type,callback);
    },

    vx_showInvite: function(callback)
    {
        this.viximo.Container.friends_invite({
            success: function(){
                this.showingFD = false;
                if($defined(callback)) this.sendToSwf(callback,JSON.encode({"success":1}));
            }.bind(this),
            close: function(){
                this.showingFD = false;
                if($defined(callback)) this.sendToSwf(callback,JSON.encode({"success":0}));
            }.bind(this),
            title: 'Invite 12 Friends',
            content: 'Play Backyard Monsters with me and I will help make your base as awesome as mine.',
            type: 'awesome',
            acceptlabel: 'Play'
        });
    },

    kg_showFeedDialog: function(type,callback)
    {
        if(callback) this.fdCallback = callback;
        if(!this.feedDialog)
        {
            this.fdMask = new Element('div',{'class': 'fd-mask','styles':{'opacity': 0.4}});
            this.feedDialog = new Element('div',{'class':'feeddialog','styles':{'position':'absolute','top':10,'left':((this.options.game_width-724)/2).round(),'width':724,'height':467,'overflow':'visible','background':'url(\''+this.options.cdnurl+'images/feeddialog/outside3.png\') no-repeat','padding':'10px 0 0 11px'}});
        }
        this.feedDialog.adopt(
            new Element('img',{src:this.options.cdnurl+'images/close2.png',styles:{width:33,height:33,cursor:'pointer',position:'absolute',top:0,right:18,'z-index':9}}).addEvent('click',function(){ this.hideFeedDialog(); }.bind(this)),
            new Element('div',{styles:{'background-color':'#DBB47C','position':'absolute','top':25,'left':30,'width':665,'height':416,'z-index':1}}),
            new Element('iframe',{
                'src': this.options.localurl+'canvas/feeddialog?type='+type+'&'+this.options.fbdata,
                'class': 'fd-container',
                'styles': {'width':665,'min-height':420,'border':0,'background-color':'transparent','z-index':2,'position':'absolute','top':25,'left':30},
                'scrolling': 'no',
                'frameborder': 0
            })
        );
        $('content').grab(this.feedDialog);
        $('content').grab(this.fdMask);
    },

    kxp_showFeedDialog: function(type,callback)
    {
        var self = this;

        if(type == 'invite')
        {
            self.showingFD = false;

            var data = {
                'from_app' : self.options.app_id
            };
            KXP.frameSendAndReceive('sendinvite',data);

            KXP.frameOn('invitesent', function(error,res)
            {
                self.showingFD = false;
                var props = {
                    'tag':'invite_send',
                    'action':'send',
                    'category':'communication',
                    'user_install_type':'secondary_direct',
                    'gift_type':'',
                    'recipient_count':res.kxids.length,
                    'ids':res.kxids.join(','),
                    'link_location':'invitafriend',
                    'unique_id':''
                };

                this.logGenericEvent(props);
                this.sendEventDT(props);
            }.bind(this));
        }
    },

    kg_statsUpdate: function(stats)
    {
        for (var stat in stats)
        {
            this.getKgApi().stats.submit(stat,stats[stat]);
        }
    },

    /**
     * @function cc.fbNewRequest
     * @param {message} arg1  The message to be included in the request
     * @param {filters} arg2  Can be one of four options: all, app_users,
     * app_non_users or a custom filter. An application can suggest custom
     * filters as dictionaries with a name key and a user_ids key, which
     * respectively have values that are a string and a list of user ids. name
     * is the name of the custom filter that will show in the selector. user_ids
     * is the list of friends to include, in the order they are to appear. (More
     * info here: http://fbdevwiki.com/wiki/FB.ui)
     * @param {callbacks} arg3 (Optional) Contains one or both object indexes
     * of: success or fail that contain functions for what to do when this
     * function returns
     * @param {trackData} arg4  Contains a tracking string
     * @param {exclude_ids} arg5  A list of fbids to not display in the friend
     * selector
     **/
    fbNewRequest: function(message,filters,callbacks,trackData,excludeIds)
    {
        if (typeof(filters) != 'string' && typeof(filters) != 'object') return false; // Invalid filter type(s)
        if (!FB) return false; // FB JS SDK not initilized.

        FB.ui({
                method: 'apprequests',
                message: message,
                filters: filters,
                data: trackData,
                exclude_ids: excludeIds
            },
            function(response)
            {
                if (!callbacks) return;

                if (response && response.request_ids)
                {
                    if (typeof(callbacks.success) == 'function')
                    {
                        callbacks.success(response.request_ids);
                    }
                }
                else if(response && response.request && response.to)
                {
                    if (typeof(callbacks.success) == 'function')
                    {
                        callbacks.success(response.request,response.to);
                    }
                }
                else
                {
                    if (typeof(callbacks.fail) == 'function')
                    {
                        callbacks.fail(response);
                    }
                }
            });

        return true;
    },

    streamPublish: function(ident,name,caption,image,targetid,actiontext,flash,callback,ref)
    {
        if(!ident || !name || !image) return false;

        var user = this.user;
        var ku = this.uniqueRef();

        var trkurl = this.options.baseurl+'track?fid='+user.id+'&from=stream-'+ident+'&ku='+ku+'&st1='+ident;
        var action_links = [{'href':trkurl,'text':(actiontext?actiontext:'Play now!')}];

        if(this.options.integ == 'kg')
        {
            caption = caption.replace(/#fname#/g,this.options.jflashvars.fb_kongregate_username).replace(/#lname#/g,'');

            if (caption === '' || caption === null)
            {
                caption = name.replace(/#fname#/g,this.options.jflashvars.fb_kongregate_username).replace(/#lname#/g,'');
            }
        }

        name = name.replace(/#fname#/g,user.first_name).replace(/#lname#/g,user.last_name);
        caption = caption.replace(/#fname#/g,user.first_name).replace(/#lname#/g,user.last_name);

        var media = null;
        if(flash) media = [{'type':'flash','imgsrc':this.options.cdnurl+'images/feed/'+image,'swfsrc':this.options.cdnurl+'flash/feed/'+flash,'width':87,'height':87,'expanded_width':450,'expanded_height':200}];
        else media = [{'type':'image','src':this.options.assetsurl+'images/feeddialog/'+image,'href':trkurl}];

        var attachment = {
            'name':name,
            'href':trkurl,
            'caption':caption,
            'media':media
        };

        var feed_args = {};
        if(this.options.integ == 'fbg')
        {

            feed_args = {
                method: 'feed',
                name: name,
                link: trkurl,
                picture: media[0].src,
                caption: caption,
                description: ' ',//weird. without description it's working fine in live.
                message: '',
                to: targetid
            };

            FB.ui(feed_args,
                function(response)
                {
                    if(response && response.post_id)
                    {
                        new Request({url:this.options.localurl+'backend/recordsendfeed'}).send('ident='+ident+'&spid='+ku+'&name='+name+'&'+this.options.fbdata);
                        this.recordKontagent('pst',{tu:'stream',u:ku,st1:ident});
                        if(callback) callback(true);
                    }
                    else if(callback) callback(false);
                }.bind(this)
            );
        }
        else if(this.options.integ == 'fb')
        {
            FB.Connect.streamPublish('', attachment, action_links, (targetid?targetid:null), 'Write something...', function(postid,exception,data){
                if(postid !== null && postid != 'null')
                {
                    new Request({url:this.options.localurl+'backend/recordsendfeed'}).send('ident='+ident+'&name='+name+'&'+this.options.fbdata);
                    this.recordKontagent('pst',{tu:'stream',u:ku,st1:ident});
                    if(callback) callback(true);
                }
                else if(callback) callback(false);
            }.bind(this));
        }
        else if(this.options.integ == 'kxp')
        {
            if (!targetid)
            {
                targetid = 'friends';
            }

            var params = this.options.fbdata.parseQueryString();

            feed_args = {
                type: 'brag',
                toid: targetid,
                message: '',
                headers: JSON.encode({
                    name: name,
                    picture: media[0].src,
                    caption: caption
                }),
                'kixigned_request': params['signed_request']
            };

            new Request({url:'/live/sendmsg',data:feed_args}).send();
        }
        else if(this.options.integ == 'kg')
        {
            this.getKgApi().services.showShoutBox(caption);
        }
    },

    vx_streamPublish: function(ident,name,caption,image,targetid,actiontext,flash)
    {
        this.viximo.Container.streamPublish({
            'type': 'activity',
            'message': name,
            'attachment': {
                'caption': '',
                'description': caption,
                'media': {
                    'type': 'image',
                    'src': this.options.assetsurl+'images/feeddialog/'+image
                }
            },
            'action_links': [{
                'text': 'Play Now!'
            }],
            'complete': function(){  }
        });
    },

    vx_sendGiftMessage: function(name,caption,image,targets,hidefd)
    {
        this.viximo.Container.streamPublish({
            'target': targets,
            'type': 'message',
            'message': name,
            'attachment': {
                'caption': '',
                'description': caption,
                'media': {
                    'type': 'image',
                    'src': this.options.cdnurl+'images/feed/'+image
                }
            },
            'action_links': [{
                'text': 'Play Now!'
            }],
            'complete': function(){  }
        });
        if(hidefd) this.hideFeedDialog(true);
    },

    noPayments: function()
    {
        alert("Facebook Credit spending is disabled on the Preview Server");
        return false;
    },

    showTopup: function(params)
    {
        if(this.options.game == 'wc' && this.options.preview_server == 1)
        {
            return this.noPayments();
        }

        try {
            alliances.hideAlliancesDialog();
        }
        catch(err) {
            //ignore
        }

        if(!params) params = {};

        this.kxp_callFrameEmit('topupShown', params);
        if(this.options.integ == 'kg') return this.kg_showTopup();
        else if(this.options.integ == 'fbg') return this.fb_showTopup(params);
        else if(this.options.integ == 'kxp') return this.fb_showTopup(params);
        else this.navTo('topup');
    },

    hideTopup: function()
    {
        if(this.options.integ == 'fbg') return this.fb_hideTopup({});
        else if(this.options.integ == 'kxp') return this.kxp_hideTopup({});
    },

    showGiftGoldConfirmDialog: function(userids, blockid, msg)
    {
        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("opened");
        }

        (function($) {
            if(!this.fbTopupContainer) {
                this.fbTopupContainer = $('<div />');
                this.fbTopupContainer.css(
                    {
                        'position':'absolute',
                        'top':'0px',
                        'left':'0px',
                        'width':this.options.game_width,
                        'height':this.options.game_height,
                        'overflow':'visible',
                        'z-index':'1337'
                    });
            }

            post_str = "";
            post_str += "blockid="+blockid+"&";
            post_str += "userids="+userids.join()+"&";
            post_str += "msg="+encodeURIComponent(msg)+"&";
            post_str += this.options.fbdata;

            $.post(this.options.localurl+'canvas/giftgoldconfirm', post_str, function(data)
            {
                this.fbTopupContainer.html(data);
            }.bind(this));
            $('#content').append(this.fbTopupContainer);
        }.bind(this))(jQuery);
    },

    showFriendSelectGiftGoldDialog: function(blockid, userids, msg)
    {
        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("opened");
        }

        (function($) {
            if(!this.fbTopupContainer) {
                this.fbTopupContainer = $('<div />');
                this.fbTopupContainer.css(
                    {
                        'position':'absolute',
                        'top':'0px',
                        'left':'0px',
                        'width':this.options.game_width,
                        'height':this.options.game_height,
                        'overflow':'visible',
                        'z-index':'1337'
                    });
            }

            post_str = "";
            post_str += "blockid="+blockid+"&";
            post_str += "selected_userids="+userids+"&";
            post_str += "msg="+encodeURIComponent(msg)+"&";
            post_str += this.options.fbdata;

            $.post(this.options.localurl+'canvas/giftgoldfriendselect', post_str, function(data)
            {
                this.fbTopupContainer.html(data);
            }.bind(this));

            $('#content').append(this.fbTopupContainer);

        }.bind(this))(jQuery);
    },

    showGiftReceivedDialog: function(giftid, senderid, credits)
    {
        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("opened");
        }

        if(!cc.fbTopupContainer)
        {
            cc.fbTopupContainer = jQuery('<div />');
            cc.fbTopupContainer.css(
                {
                    'position':'absolute',
                    'top':'0px',
                    'left':'0px',
                    'width':cc.options.game_width,
                    'height':cc.options.game_height,
                    'overflow':'visible',
                    'z-index':'1337'
                });

            post_str = "";
            post_str += "giftid="+giftid+"&";
            post_str += "senderid="+senderid+"&";
            post_str += "credits="+credits+"&";
            post_str += cc.options.fbdata;

            jQuery.post(cc.options.localurl+'canvas/giftedgoldreceived', post_str, function(data)
            {
                cc.fbTopupContainer.html(data);
            }.bind(cc));
            jQuery('#content').append(cc.fbTopupContainer);
        }
    },

    userSurveyContainer: null,
    userSurveyShowing: false,
    checkAndShowUserSurvey: function(survey_id) {
        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("opened");
        }
        if(!this.userSurveyContainer)
        {
            this.userSurveyContainer = jQuery('<div />');
            this.userSurveyContainer.css(
                {
                    'position':'absolute',
                    'top':'0px',
                    'left':'0px',
                    'width':cc.options.game_width,
                    'height':cc.options.game_height,
                    'overflow':'visible',
                    'z-index':'1337'
                });

            post_str = "";
            post_str += "survey_id="+survey_id+"&";
            post_str += this.options.fbdata;

            jQuery.post(this.options.localurl+'canvas/usersurvey', post_str, function(data)
            {
                this.userSurveyContainer.html(data);
                this.userSurveyShowing = true;
            }.bind(cc));
            jQuery('#content').append(this.userSurveyContainer);
        }
    },

    hideUserSurvey: function ()
    {
        if(this.userSurveyContainer) {
            if (typeof(this.userSurveyContainer.remove) == 'function') // handle jQuery object
            {
                this.userSurveyContainer.html('').remove();
            }
            else
            {
                this.userSurveyContainer.dispose().empty();
            }
        }

        this.userSurveyContainer = null;
        this.userSurveyShowing = false;

        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("closed");
        }
    },

    hideGiftGoldDialog: function()
    {
        if(this.fbTopupContainer) {
            if (typeof(this.fbTopupContainer.remove) == 'function') // handle jQuery object
            {
                this.fbTopupContainer.html('').remove();
            }
            else
            {
                this.fbTopupContainer.dispose().empty();
            }
        }

        this.fbTopupShowing = false;
        this.fbTopupContainer = false;

        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("closed");
        }
    },

    getTopupCallback: function()
    {
        if($defined(this[this.options.integ+'TopupCallback'])) return this[this.options.integ+'TopupCallback'];
    },

    fbTopupContainer: null,
    fbTopupShowing: false,
    fbTopupCallback: null,
    fbIsDGP: null,
    dgpSuccess: 0,
    fb_showTopup: function(params)
    {
        if(this.fbTopupShowing) return false;
        this.fbTopupShowing = true;

        if(params.callback) this.fbTopupCallback = params.callback;
        if(params.dgp == 1 && !params.credits_deficient) this.fbIsDGP = 1;

        if(params.type == 'offers') this.fb_showTopupOffers(params);
        else if(params.type == 'daily') this.fb_showTopupDaily(params);
        else this.fb_showTopupFbc(params);
    },

    fb_showTopupFbc: function(params)
    {
        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("opened");
        }

        var pu;
        if(params.special == 'gift') {
            pu = {
                height:368,
                width:488,
                background:'url(\''+this.options.cdnurl+'images/topup/promotion/giftbg.png\') no-repeat'
            };
        }
        else {
            pu = {
                height:331,
                width:484,
                background:'url(\''+this.options.cdnurl+'images/topup/popupbg5.png\') no-repeat'
            };
        }

        (function($) {
            if(!this.fbTopupContainer) {
                this.fbTopupContainer = $('<div />');
                this.fbTopupContainer.css(
                    {
                        'position':'absolute',
                        'top':'0px',
                        'left':'0px',
                        'width':this.options.game_width,
                        'height':this.options.game_height,
                        'overflow':'visible',
                        'z-index':'1337'
                    });
            }

            if(this.options.game == 'bm'){
                this.fbTopupContainer.append('<div />');

                var innerContainer = this.fbTopupContainer.children('div:last');

                innerContainer.addClass('topup-popup').css({
                    'position':'relative',
                    'margin-top':'10px',
                    'margin-left':'auto',
                    'margin-right':'auto',
                    'width':pu.width,
                    'height':pu.height,
                    'overflow':'visible',
                    'background':pu.background,
                    'padding':'10px 0 0 11px'
                });

                innerContainer.append('<a />');
                innerContainer.children('a:last').attr(
                    {
                        'href':'javascript:void(0);'
                    }).css(
                    {
                        width:25,
                        height:25,
                        cursor:'pointer',
                        display:'block',
                        position:'absolute',
                        top:0,
                        right:18,
                        border:0,
                        'z-index':11
                    }).click(function()
                    {
                        this.hideTopup();
                    }.bind(this));

                innerContainer.append('<div />');
                innerContainer.children('div:last').attr({'id':'topup-popup-content'}).css(
                    {
                        height: 195,
                        left: 33,
                        position: 'absolute',
                        top: 60,
                        width: 420,
                        'z-index': 10
                    });
            }

            post_str = "";
            if(params.gift_only == 1) post_str += "gift_only=1&";
            if(params.special) post_str += "special="+params.special+"&";

            if(params.credits_deficient > 0) post_str += "credits_deficient="+params.credits_deficient+"&";
            else if(params.dgp == 1) post_str += "dgp="+params.dgp+"&";

            if(params.item_info)
            {
                if(typeof(params.item_info)=='string')
                {
                    post_str += "item_info="+params.item_info+"&";
                }
                else
                {
                    post_str += "item_info="+JSON.encode(params.item_info)+"&";
                }
            }
            if(params.header_copy) post_str += "header_copy="+params.header_copy+"&";
            if(params.purchase_guid) post_str += "purchase_guid="+params.purchase_guid+"&";
            post_str += this.options.fbdata;

            $.post(this.options.localurl+'canvas/topuppopup', post_str, function(data)
            {
                if(this.options.game=='bm'){
                    $('#topup-popup-content').html(data);
                } else {
                    this.fbTopupContainer.html(data);
                }
            }.bind(this));

            /*
             $.get(this.options.localurl+'canvas/topuppopup?&'+this.options.fbdata, function(data)
             {
             $('#topup-popup-content').html(data);
             }.bind(this));
             */

            $('#content').append(this.fbTopupContainer);
        }.bind(this))(jQuery);
    },

    fb_showTopupOffers: function(params)
    {
        TRIALPAY.fb.show_overlay(this.options.app_id,
            'fbdirect',
            { currency_url: this.options.localurl+'payments/facebook/tpinfo',
                tp_vendor_id: this.options.tp_vendor_id,
                callback_url: this.options.localurl+'payments/facebook/trialpay',
                sid: this.options.tpid,
                zIndex: 2000,
                onClose: this.hideTopup.bind(this,{'showTopup':true,'params':params})
            });
    },

    fb_showTopupDaily: function(params)
    {
        TRIALPAY.fb.show_overlay(this.options.app_id,
            'fbpayments',
            { currency_url: this.options.localurl+'payments/facebook/tpinfo',
                tp_vendor_id: this.options.tp_vendor_id,
                callback_url: this.options.localurl+'payments/facebook/trialpay',
                dealspot:1,
                sid: this.options.tpid,
                onClose: this.hideTopup.bind(this,{'showTopup':true,'params':params})
            });
    },

    fb_hideTopup: function(params)
    {
        if(this.fbTopupContainer) {
            if (typeof(this.fbTopupContainer.remove) == 'function') // handle jQuery object
            {
                this.fbTopupContainer.html('').remove();
            }
            else
            {
                this.fbTopupContainer.dispose().empty();
            }
        }

        this.fbTopupShowing = false;

        if(params.showTopup)
        {
            params.params.type = 'fbc';
            this.fb_showTopup(params);
        }
        else if(this.fbTopupCallback)
        {
            if(this.fbIsDGP == 1)
            {
                this.sendToSwf(this.fbTopupCallback, this.dgpSuccess);
            }
            else if(!params.skip_cancelled)
            {
                this.sendToSwf(this.fbTopupCallback,JSON.encode({'status':'canceled'}));
            }
            else
            {
                this.sendToSwf(this.fbTopupCallback,JSON.encode({'status':'processing'}));
            }
        }

        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("closed");
        }
    },

    kxp_hideTopup: function(params)
    {
        if (this.upayCredits !== null)
        {
            // If we're closing the topup and the upay box is open, close it
            this.upayCredits.closeLightbox({"forceCloseLB" : true});

            // If the payment was completed already, skip the cancel call
            if (this.upayCredits.paymentSuccessful)
            {
                params.skip_cancelled = true;
            }
        }
        this.fb_hideTopup(params);
    },

    kxp_callFrameEmit: function(eventName, paramsObject)
    {
        if (typeof KXP !== 'undefined')
        {
            KXP.frameEmit(eventName,paramsObject);
        }
    },

    vx_showTopup: function()
    {
        this.viximo.Container.currency_makeTransfer({
            success: function(data){
                //this.sendToSwf('callbackshiny',JSON.encode({credits:data.amount}));
                location.reload();
            }.bind(this),
            close: function(){}
        });
    },

    topupPopup: null,

    kg_showTopup: function(cartArray)
    {
        if (!cartArray) { this.giveKgTopupPopup(); return; }
        this.getKgApi().mtx.purchaseItems(cartArray, cc.kg_onPurchaseResult.bind(this));

    },

    kg_onPurchaseResult: function(result)
    {
        if (result.success)
        {
            new Request.JSON({
                url: this.options.localurl+'backend/redeemKgItems',
                onSuccess: function(data)
                {
                    this.kgHideShinyDialog();

                    if($type(data) != 'object')
                    {

                    }
                    else if(data.error)
                    {

                    }
                    else if(data.credits)
                    {
                        var updateCredits = function(){
                            cc.sendToSwf('updateCredits',JSON.encode(data));
                        };
                        setTimeout(updateCredits,7500);
                    }
                }.bind(this)
            }).send(this.options.fbdata);
        }
    },

    topupFunds: function()
    {
        this.hideTopup();
        this.showTopup();
        this.showBuyCoins();
    },
    vx_getFriends: function(callback)
    {
        this.viximo.API.friends_get(function(data){
            var out = [];
            if($type(data) == 'array' || data.length > 0)
            {
                data.each(function(v){ out.push(v); });
            }
            this.options.friends = out;
            callback(out);
        }.bind(this));
    },
    vx_getUserData: function(callback)
    {
        this.viximo.API.users_getCurrentUser(function(data){
            if($type(data) != 'object') data = {};
            else data.first_name = data.name.split(' ')[0];
            this.options.userdata = data;
            this.addToUser(data);
            if($type(callback) == 'function') callback(data);
        }.bind(this));
    },
    //http://www.kongregate.com/api/user_info.json?username=Casualcollective&friends=true
    kg_getUserName: function(callback)
    {
        this.getKgApi().services.getUsername();
    },
    kg_getUserData: function(callback)
    {
        new Request.JSONP({'url':'http://www.kongregate.com/api/user_info.jsonp?user_id='+this.fbid+'&friends=true',
            onSuccess: function(data)
            {

            }.bind(this)
        }).send();
    },

    navTo: function(page,absolute)
    {
        window.top.location = (absolute?'':this.options.baseurl)+page;
    },

    reloadParent: function()
    {
        var dest = this.options.baseurl;
        var loc = location.href.replace(/\/$/,'').replace('http://','').replace('https://','');
        if(loc.indexOf('/') > -1)
        {
            loc = location.href.split('/');
            loc = loc[loc.length-1];
            dest += loc;
        }
        window.top.location = dest;
    },

    showRating: function()
    {
        this.navTo('https://www.facebook.com/apps/application.php?id='+this.options.app_id+'&v=app_6261817190',true);
    },

    showSrOverlay: function(callback)
    {
        adk.interstitial.prototype.displayModal('content','oydikdq.72572890927',this.fbid,true,null,function(){
            if(callback)
            {
                this.sendToSwf(callback);
            }
        }.bind(this));
    },

    showEvent: function(id)
    {
        this.navTo('https://www.facebook.com/event.php?eid='+(id?id:142016142510717),true);
    },

    uniqueRef: function()
    {
        return (this.fbid+(new Date().getTime())).toString().toMD5().substr(0,16);
    },

    // kixeye internal logging.
    // no t param as we record server time and not client time
    // called from flash client during install
    recordKxLogger: function(props)
    {
        var params = '';
        if($type(props) == 'object')
        {
            var rprops = new Hash(props);
            rprops.extend({
                s: this.fbid
            });
            params = rprops.toQueryString();
        }

        this.callUrl(this.options.kx_logger_url+'?key='+this.options.kx_logger_key+'&'+params);
    },

    recordKontagent: function(type,props)
    {
        // only bym is recording w/ kontagent
        if(this.options.kontagent_enabled !== true)
        {
            return;
        }

        var params = '';
        if($type(props) == 'object')
        {
            var rprops = new Hash(props);
            rprops.extend({
                s: this.fbid,
                t: parseInt(new Date().getTime()/1000,10)
            });
            params = rprops.toQueryString();
        }
        this.callUrl(this.options.kontagent_url+'api/v'+this.options.kontagent_api_version+'/'+this.options.kontagent_api_key+'/'+type+'/'+(params?'?'+params:''));
    },

    recordEvent: function(name,props)
    {
        var rprops = {};
        if($type(props) == 'object')
        {
            rprops = {
                n: name
            };
            if(props.level) rprops.l = props.level;
            if(props.value) rprops.v = props.value;
            if(props.n1) rprops.n1 = props.n1;
            if(props.n2) rprops.n2 = props.n2;
            if(props.n3) rprops.n3 = props.n3;
            if(props.n4) rprops.n4 = props.n4;
            if(props.n5) rprops.n5 = props.n5;
            if(props.st1) rprops.st1 = props.st1;
            if(props.st2) rprops.st2 = props.st2;
            if(props.st3) rprops.st3 = props.st3;
            if(props.json) rprops.json = props.json;
        }
        this.recordKontagent('evt',rprops);
    },

    recordFeed: function(type,ku,recipients,splitid)
    {
        var r = '';
        recipients.each(function(v){ r += ','+v; });
        r = r.substr(1);
        var props = {r:r,u:ku};
        if(type == 'gift') props.st1 = 'gift';
        if(type == 'invite') props.st1 = splitid;
        this.recordKontagent((type=='invite'?'ins':'nts'),props);
    },

    callUrl: function(src)
    {
        return this.callUrlImg(src); // Use image injection
        //try
        //{
        //	new Request.JSONP({
        //		'url': src,
        //		callbackKey: 'jsoncallback'
        //	}).send();
        //} catch(e){}
    },

    callUrlAjax: function(src){
        try{
            new Request({url: src}).send();
        } catch(e){}
    },

    callUrlImg: function(src)
    {
        var img = new Image();
        img.src = src;
        (function(){ try { img.destroy(); } catch(e) {} }).delay(60000);
    },

    recordUserInfo: function()
    {
        var userdata = this.getUserData();
        var friends = this.getAppFriends();
        var props = {};

        if($type(friends) == 'array') props.f = friends.length;
        if($type(userdata) == 'object')
        {
            var sex = userdata.sex.toLowerCase();
            if(sex == 'female' || sex == 'f') props.g = 'female';
            else props.g = 'male';

            var bday = userdata.birthday_date;
            if(bday && bday != 'null' && (bday.length-bday.replace('/','').length) == 2)
            {
                var year = bday.substr(-4,4);
                props.b = year;
            }
        }

        this.recordKontagent('cpu',props);
    },

    openingBase: false,
    openBase: function(baseid)
    {
        if(this.options.game == 'bm')
        {
            if(this.openingBase) return false;
            this.openingBase = true;

            new Request.JSON({url:this.options.localurl+'backend/locatebase',
                onSuccess: function(data)
                {
                    if(data.baseid || data.userid || data.userid === 0)
                    {
                        this.sendToSwf('openbase',JSON.encode(data));
                    }
                }.bind(this),
                onComplete: function()
                {
                    (function(){ this.openingBase = false; }.bind(this)).delay(2000);
                }.bind(this)
            }).send('userid='+baseid+'&'+this.options.fbdata);
        }
        else this.sendToSwf('openbase',baseid);
    },
    openLeaderBase: function(userid, baseid)
    {
        if(this.options.game == 'bm' || this.options.game == 'wc')
        {
            new Request.JSON({url:this.options.localurl+'backend/locatebase',
                onSuccess: function(data)
                {
                    if(data.baseid || data.userid || data.userid === 0)
                    {
                        data.viewleader = 1;
                        this.sendToSwf('openbase',JSON.encode(data));
                    }
                }.bind(this)
            }).send('userid='+userid+'&'+this.options.fbdata);
        }
        else {
            this.sendToSwf('openbase',baseid);
        }
    },

    adminTakeover: function(x,y)
    {
        $('adminTakeoverX').set('disabled',true);
        $('adminTakeoverY').set('disabled',true);
        $('adminTakeoverSubmit').set('disabled',true).set('text','Taking...');
        new Request.JSON({url:this.options.localurl+'worldmapv2/pilferoutpost',
            onSuccess: function(data)
            {
                $('adminTakeoverX').set('disabled',false).set('value','');
                $('adminTakeoverY').set('disabled',false).set('value','');
                $('adminTakeoverSubmit').set('disabled',false).set('text','Take');
            }.bind(this)
        }).send('x='+x+'&y='+y+'&'+this.options.fbdata);
    },

    getCreditBalance: function(callback,returnHashedData)
    {
        if(!callback) return false;
        new Request.JSON({
            url: this.options.localurl+'backend/getcreditbalance',
            onSuccess: function(data){
                if(returnHashedData) callback(data);
                else
                {
                    var credits = false;
                    if(data.credits) credits = data.credits;
                    callback(credits);
                }
            }.bind(this)
        }).send(this.options.fbdata);
    },

    pad: function(num, count)
    {
        var lenDiff = count - String(num).length;
        var padding = "";

        if (lenDiff > 0)
            while (lenDiff--)
                padding += "0";

        return padding + num;
    },

    getPmsPixels: function(action, additionalPostData)
    {
        if (typeof pmsurl === 'undefined')
        {
            return;
        }
        if(pmsurl === "")
        {
            return;
        }

        var post_data = 'game='+this.options.game+'&user_fbid='+this.options.user.fbid+'&user_tpid='+this.user.tpid+'&userid='+this.options.user.id+'&event_type='+action+'&from_string='+this.options.fromstr;
        if (additionalPostData != "") {
            post_data += "&"+additionalPostData;
        }

        var myRequest = new Request.JSONP({
            url: pmsurl+"pms/getpixels?" + post_data,
            callbackKey: 'jsoncallback',
            onComplete: function(data)
            {
                for(i = 0; i < data.length; i++)
                {
                    cc.callUrl(data[i]);
                }
            }
        }).send();
    },

    postBuyPixels: function(amount)
    {
        var date = new Date(cc.options.installts*1000);
        var year = date.getFullYear();
        var month = this.pad((date.getMonth()+1),2);
        var day = this.pad(date.getDate(),2);

        // the amount in USD post Facebook tax
        amountUSD = (amount.amount * 0.1) * 0.7;

        var apsource = cc.options.fromstr.substr(0,6);
        if (apsource == "fbbpap")
        {
            this.callUrl("https://fbads.adparlor.com/Engagement/action.php?id=311&adid=545&vars=7djDxM/P1uDV4OfKs7SxjdbV1ObN4ebE3NXXz9jPwtjg1OTE58XK0Nni1Ky6vp7X3tnWwtbkwNrb5OTYs5aO1tfVtOfOqcuqzA==&subid="+amount.amount+"&action_date="+year+"-"+month+"-"+day);
        }
        if (apsource == "fbbpsp")
        {
            if(this.options.adid!=-1)
                this.callUrl("http://bp-pixel.socialcash.com/100560/pixel.ssps?spruce_adid="+this.options.adid+"&spruce_sid="+this.user.tpid+"&amt="+amount.amount+"&spruce_pixelid=2");
        }
        if (apsource == "fbwcsp")
        {
            if(this.options.adid!=-1)
                this.callUrl("http://bp-pixel.socialcash.com/100571/pixel.ssps?spruce_adid="+this.options.adid+"&spruce_sid="+this.user.tpid+"&spruce_pixel_value="+amount.amount+"&spruce_pixelid=2");
        }
        if (apsource == "fbwcad")
        {
            if(this.options.adid!=-1)
                this.callUrl("http://s.inst.adotomi.com/cb/8-10023588_10-3.6334a?ifcontext="+this.options.adid+"&order_id="+this.user.tpid+"&amount="+amountUSD+"&currency=USD");
        }
        if (this.options.fromstr.substr(0,8) == "fbwcdqna")
        {
            this.callUrl("https://adsimilis.go2jump.org/GL1UY");
        }
    },

    postTutorialPixels: function()
    {
        this.getPmsPixels("Tutorial", "");

        var apsource = cc.options.fromstr.substr(0,6);
        if (apsource == "fbbpsp")
        {
            if(this.options.adid!=-1)
                this.callUrl("http://bp-pixel.socialcash.com/100560/pixel.ssps?spruce_adid="+this.options.adid+"&spruce_sid="+this.user.tpid+"&spruce_pixelid=1");
        }
        if (apsource == "fbwcsp")
        {
            if(this.options.adid!=-1)
                this.callUrl("http://bp-pixel.socialcash.com/100571/pixel.ssps?spruce_adid="+this.options.adid+"&spruce_sid="+this.user.tpid+"&spruce_pixelid=1");
        }
        if (apsource == "fbwcad")
        {
            if(this.options.adid!=-1)
                this.callUrl("http://s.inst.adotomi.com/cb/8-10023586_10-3.01c7e?ifcontext="+this.options.adid+"&order_id="+this.user.tpid);
        }
        if (this.options.fromstr.substr(0,8) == "fbwcdqna")
        {
            this.callUrl("https://adsimilis.go2jump.org/GL1Uk");
        }
    },

    checkTopupGift: function()
    {
        new Request({
            url: this.options.localurl+'backend/checktopupgift',
            onSuccess: function(data)
            {
                var obj = JSON.decode(data);
                if(obj.error === 0) this.sendToSwf('purchaseReceive',data);
                else this.checkTopupGift.delay(30000,this);
            }.bind(this)
        }).send(this.options.fbdata);
    },

    startPromoTimer: function(params)
    {
        new Request.JSON({
            url: this.options.localurl+'backend/startpromotimer',
            onSuccess: function(data)
            {
                if(data.endtime) this.sendToSwf(params.callback,JSON.encode(data));
            }.bind(this)
        }).send(this.options.fbdata);
    },

    recordStats: function(event)
    {
        this.logLoadEvent(event);
        //try{
        //	var flashver = FlashDetect.major + '.' + FlashDetect.minor;
        //	new Request({
        //		url: this.options.localurl+'backend/recordstats'
        //	}).send(this.options.fbdata+'&event='+event+'&loadid='+loadid+'&flashver='+flashver);
        //} catch(e){}
    },

    log: function(data)
    {
        try{
            if(window.console) console.log(data);
        } catch(e){}
    },

    alDialog: false,
    alView: null,
    showAttackLog: function(view)
    {
        if(!this.inited) return false;
        return this.sendToSwf('showAttackLog');
    },

    lbDialog: false,
    lbShowingID: false,
    showLeaderboard: function(tabid)
    {

        // Append the tabid to the URL, if it exists
        if (! tabid) {
            tabid = 0;
        }

        tabid = { 'tabid': tabid };

        if(!this.inited) return false;
        if(!this.lbDialog)
        {
            var bgimage = 'background.png';
            if(this.options.game == 'wc')
            {
                bgimage = 'background_v2.png';
            }

            this.lbDialog = new ccfDialog({
                'url': this.options.localurl+'backend/getleaderboard',
                'querystring': tabid,
                'props': {
                    'contentWrapper': {
                        'styles': {
                            'background-image': 'url(\''+this.options.cdnurl+'images/leaderboard/'+bgimage+'\')'
                        }
                    }
                },
                'cachecontent': true,
                'cachetimeout': 20,
                'stylesuffix': 'lb'
            });

            if (this.options.game == 'wc' || this.options.game=='bp')
            {
                this.lbDialog.reInit({
                    'showSpinner': true,
                    'remainCentered': true
                });
            }

            this.lbDialog.show();
        }
        else if(this.lbDialog.showing)
        {
            this.lbDialog.loadUrl(this.options.localurl+'backend/getleaderboard', tabid);
        }
        else
        {
            this.lbDialog.reInit({
                'url': this.options.localurl+'backend/getleaderboard',
                'querystring': tabid
            });
            this.lbDialog.show();
        }
    },

    hsDialog: false,
    showHelpScreen: function()
    {
        if(!this.inited) return false;
        if(!this.hsDialog)
        {
            this.hsDialog = new ccfDialog({
                'url': this.options.localurl+'canvas/gethelpscreen',
                'props': {
                    'contentWrapper': {
                        'styles': {
                            'background-image': 'url(\''+this.options.cdnurl+'images/helpscreen_bgv2.png\')'
                        }
                    }
                },
                'cachecontent': true,
                'cachetimeout': 20,
                'stylesuffix': 'hs',
                'onHide': function(){ cc.hsDialog = false; }
            });

            this.hsDialog.show();
        }
    },

    reloadingCSS: false,
    reloadCSS: function()
    {
        if(this.reloadingCSS) return false;
        this.reloadingCSS = true;

        var url = $('style-default').get('href').replace(/v[0-9]+\./,'v'+Math.round(Math.random()*100000)+'.');
        $$('head')[0].grab(
            newel = new Element('link',{
                'rel': 'stylesheet',
                'type': 'text/css',
                'href': url
            })
        );

        (function(){
            $('style-default').destroy();
            newel.set('id','style-default');
            this.reloadingCSS = false;
        }.bind(this)).delay(5000);
    },

    preventMouseWheelCallback: function(e) {
        e = e || window.event;
        if (e.preventDefault)
            e.preventDefault();
        e.returnValue = false;
    },

    disableMouseWheel: function()
    {
        if (window.addEventListener)
        {
            window.addEventListener('DOMMouseScroll', this.preventMouseWheelCallback, false);
        }
        window.onmousewheel = document.onmousewheel = this.preventMouseWheelCallback;
    },

    enableMouseWheel: function()
    {
        if (window.removeEventListener) {
            window.removeEventListener('DOMMouseScroll', this.preventMouseWheelCallback, false);
        }
        window.onmousewheel = document.onmousewheel = document.onkeydown = null;
    },

    getUserSubscriptions: function()
    {
        new Request.JSON({
            url: this.options.localurl+'backend/fbusersubscriptions/getusersubscriptions',
            onSuccess: function(data)
            {
                this.sendToSwf('getUserSubscriptions', JSON.encode(data));
            }.bind(this)
            // TODO: have client send in id
        }).send('id=2&'+this.options.fbdata);
    },

    showSubscriptionDialog: function(id)
    {
        // check to make sure we don't have an existing subscription
        new Request.JSON({
            url: this.options.localurl+'backend/fbusersubscriptions/check',
            onSuccess: function(data)
            {

                if (data.error) {
                    console.log(data.error);
                }
                else if (data.subscriptions && data.subscriptions.length === 0)
                {

                    var obj = {
                        method:  'pay',
                        action:  'create_subscription',
                        product: this.options.localurl.replace('https', 'http') + 'backend/fbsubscriptions?id=' + id
                    };

                    // successful pay dialog callback
                    var js_callback = function(res)
                    {
                        if (res && res.status && res.status == "active")
                        {
                            this.subscriptionCallback('new', id, res.subscription_id, 'showSubscriptionDialog');
                        }

                    }.bind(this);

                    // show the fb pay dialog
                    FB.ui(obj, js_callback);
                }
                else
                {
                    var status  = data.subscriptions.status;
                    var fbsubid = data.subscriptions.fb_subscriptionid;

                    if (status == "active") this.cancelSubscriptionDialog(fbsubid);
                    else if (status == "pending_cancel") this.reactivateSubscriptionDialog(fbsubid);
                }

            }.bind(this)
        }).send('id='+id+'&'+this.options.fbdata);
    },

    subscriptionCallback: function(type, id, fb_subscriptionid, swf_cb /* optional callback to the swf */)
    {
        var js_callback = function(data)
        {
            if (typeof swf_cb != 'undefined')
            {
                //this.sendToSwf(swf_cb, JSON.encode(data));
                // vvvvvvvvvvvv
                // TODO: Remove this reload when client figures out why they can't receive the callback
                this.reloadParent();
                // ^^^^^^^^^^^^
            }
        }.bind(this);

        // successful payment, so pre register one
        new Request.JSON({
            url: this.options.localurl+'backend/fbusersubscriptions/' + type,
            onSuccess: js_callback
        }).send('id='+id+"&fb_subscriptionid="+fb_subscriptionid+"&"+this.options.fbdata);
    },

    cancelSubscriptionDialog: function(id)
    {
        if (!id) id = prompt("Enter a subscription id:");
        if (!id) return;

        var obj = {
            method:		  'pay',
            action:		  'cancel_subscription',
            subscription_id: id
        };

        var js_callback = function(res)
        {
            if (res && res.status && res.status == "active")
            {
                this.subscriptionCallback('cancel', 0, res.subscription_id, 'cancelSubscriptionDialog');
            }
        }.bind(this);

        FB.ui(obj, js_callback);
    },

    reactivateSubscriptionDialog: function(id)
    {
        if (!id) id = prompt("Enter a subscription id:");
        if (!id) return;

        var obj = {
            method:		  'pay',
            action:		  'reactivate_subscription',
            subscription_id: id
        };

        var js_callback = function(res)
        {
            if (res && res.status && res.status == "active")
            {
                this.subscriptionCallback('reactivate', 0, res.subscription_id, 'reactivateSubscriptionDialog');
            }
        }.bind(this);

        FB.ui(obj, js_callback);
    },

    changeSubscriptionPayDate: function(id)
    {
        if (!id) id = prompt("Enter a subscription id:");
        if (!id) return;

        new Request.JSON({
            url: this.options.localurl+'backend/fbusersubscriptions/changedate',
            onSuccess: function(data)
            {
                this.sendToSwf('changeSubscriptionPayDate', JSON.encode(data));
            }.bind(this)
        }).send('id='+id+'&'+this.options.fbdata);
    },

    changeSubscriptionPayType: function(id)
    {
        if (!id) id = prompt("Enter a subscription id:");
        if (!id) return;

        var obj = {
            method:         'pay',
            action:         'modify_subscription',
            subscription_id: id
        };

        var js_callback = function(res)
        {
            this.sendToSwf('changeSubscriptionPayType', JSON.encode(res));
        }.bind(this);

        FB.ui(obj, js_callback);
    },

    redeemFBGiftCard: function () {
        var url = cc.options.localurl + 'payments/facebook/initgiftcard';
        var myRequest = new Request.JSON({
            url: url,
        }).send();

        FB.ui({method: 'pay', action: 'redeem'}, function (data) {
            if (data.status == 'completed') {
                var myRequest = new Request.JSON({
                    url: localurl + "payments/facebook/giftcard",
                    onSuccess: function (data) {
                        cc.getCreditBalance(function (data) {
                            cc.sendToSwf(cc.fbTopupCallback, JSON.encode({'status': 'settled'}));
                            cc.sendToSwf('updateCredits', JSON.encode(data));
                        }, true);
                    }
                }).send(cc.options.fbdata + "&" + Object.toQueryString(data));
                cc.fb_hideTopup({"skip_cancelled": true});
            }
        });
    },

    processFlashHiding: function(state)
    {
        if(state == "closed")
        {
            return this.processHideGame(state, "");
        }

        var exportedImage;
        if(this.options.game_type == "unity")
        {
            this.getGameSwf().SendMessage("GameClientManager", "Screenshot", "cc.unityScreenshotCallback");
            return;
        }
        else
        {
            if (this.getGameSwf() && typeof(this.getGameSwf().exportScreenshot) == 'function')
            {
                exportedImage = this.getGameSwf().exportScreenshot();
                this.processHideGame(state, 'data:image/jpeg;base64,' + exportedImage);
            }
            else
            {
                this.processHideGame(state, "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAAAAACH5BAAAAAAALAAAAAABAAEAAAICTAEAOw==");
            }
        }
    },

    hideGameLock: 0,
    processHideGame: function(state, exportedImage)
    {
        if (state == "opened")
        {
            ++this.hideGameLock;
            if (this.hideGameLock > 1)
            {
                return;
            }
            var size = $('flashContent').getSize();

            $('screenshotObject').width  = size.x;
            $('screenshotObject').height = size.y - 2;
            $('screenshotObject').src = exportedImage;

            $('flashContent').style.top = '-10000px';
            $('imageContent').style.top = '';
        }
        else if (state == "closed")
        {
            --this.hideGameLock;
            if (this.hideGameLock > 0)
            {
                return;
            }
            $('flashContent').setStyle('top', '');
            $('imageContent').style.top = '-10000px';
        }
    },

    unityScreenshotCallback: function(exportedImage)
    {
        this.processHideGame("opened", 'data:image/png;base64,' + exportedImage);
    },

    startSessionPolling: function()
    {
        var timeout = 180; // 3 mins in seconds

        var props = {};
        if (!this.sessionPollHandle || this.sessionPollHandle === 0)
        {
            this.recordSessionTime = new Date().getTime();
            this.sessionPollHandle = setInterval(function() { cc.startSessionPolling(); }, timeout * 1000);

            props = {
                't'     : (new Date().getTime() / 1000),
                'tag'   : 'session',
                'stage' : 'sessionstart',
                'x'  : this.options.logsessionid
            };
            this.logGenericEvent(props);
            this.sendEventDT(props);
        }
        else
        {
            var now = new Date().getTime();
            var diff = now - this.recordSessionTime;
            this.recordSessionTime = new Date().getTime();

            props = {
                't'      : (new Date().getTime() / 1000),
                'tag'    : 'session',
                'stage'  : 'sessioninpro',
                'x'   : this.options.logsessionid,
                'status' : 1
            };
            this.logGenericEvent(props);
            this.sendEventDT(props);
        }
    },

    stopSessionPolling: function()
    {
        if (this.sessionPollHandle > 0)
        {
            clearInterval(this.sessionPollHandle);

            var now = new Date().getTime();
            var diff = now - this.recordSessionTime;

            var props = {
                't'      : (new Date().getTime() / 1000),
                'tag'    : 'session',
                'stage'  : 'sessioninpro',
                'x'   : this.options.logsessionid,
                'status' : 0
            };
            this.logGenericEvent(props);
            this.sendEventDT(props);

            this.sessionPollHandle = 0;
            this.recordSessionTime = false;
        }
    },

    getKXPData: function()
    {
        var data = {
            kixigned_request: "",
            kxid:             ""
        };

        if (typeof KXP !== 'undefined')
        {
            data.kixigned_request = KXP.kixigned_request;
            data.kxid = KXP.kxid;
        }

        return data;
    },

    getSurvey: function()
    {
        new Request.JSON({
            'url':this.options.localurl+'survey/getsurvey',
            onSuccess: function(data)
            {
                if(data.error)
                {
                    return;
                }

                jQuery(".kx-survey").html(
                    'Help make Battle Pirates better! Fill out <a href="'+data.link+'" target="_blank">this survey</a>!'
                );
            }
        }).send('surveyData='+this.options.survey_data);
    }
});

var KxLogger = new Class({

    Implements: [Options],

    options: {},

    initialize: function(options)
    {
        if(options) this.setOptions(options);
    },

    logGeneric: function(props, ignoreSplit)
    {
        try
        {
            if(this.options.kx_logger_url === '' || this.options.kx_logger_key === '') return false;
            if(this.options.logsessionid === '' && !ignoreSplit) return false;

            var defaultProps = {
                'p': this.options.integ,
                'g': this.options.game.toUpperCase(),
                'key': this.options.kx_logger_key,
                's': this.options.user.fbid ? this.options.user.fbid : '0',
                'u': this.options.userid,
                'k': this.options.user.kxid ? this.options.user.kxid : '',
                'x': this.options.logsessionid,
                'app': this.options.appname,
                't': (new Date().getTime() / 1000),
                'type': 'image'
            };

            if(this.options.hasOwnProperty("userlevel") && this.options.userlevel > 0)
            {
                defaultProps['l'] = this.options.userlevel;
            }

            if(this.options.kx_logger_env)
            {
                defaultProps['env'] = this.options.kx_logger_env;
            }

            props = Object.merge(defaultProps,props);
            props = Object.toQueryString(props);
            this.callUrlImg(this.options.kx_logger_url + '?' + props);
        }
        catch(e){}
        return true;
    },

    callUrlImg: function(src)
    {
        var img = new Image();
        img.src = src;
        (function(){ try { img.destroy(); } catch(e) {} }).delay(60000);//Remove the image tag after
    }
});

function dump(arr,level) {
    var dumped_text = "";
    if(!level) level = 0;

    //The padding given at the beginning of the line.
    var level_padding = "";
    for(var j=0;j<level+1;j++) level_padding += "    ";

    if(typeof(arr) == 'object') { //Array/Hashes/Objects
        for(var item in arr) {
            var value = arr[item];

            if(typeof(value) == 'object') { //If it is an array,
                dumped_text += level_padding + "'" + item + "' ...\n";
                dumped_text += dump(value,level+1);
            } else {
                dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
            }
        }
    } else { //Stings/Chars/Numbers etc.
        dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
    }
    return dumped_text;
}

function isNumber(n)
{
    return !isNaN(parseFloat(n)) && isFinite(n);
}

var UPayCredits = new Class({
    paymentInProgress : false,
    paymentSuccessful : false,
    flashParam : null,
    initialize : function()
    {
        var self = this;
        ulp.on('closeLB', function(data){
            // If we're force closing the LB, don't close the topup
            if (!data.forceCloseLB)
            {
                if (self.paymentSuccessful)
                {
                    cc.kxp_hideTopup({"skip_cancelled":true});
                }
                else
                {
                    cc.kxp_hideTopup({});
                }
            }

            ultimatepayPostProcess(data);
            self.completePayment(data);
        });
        ulp.on('paymentSuccess', function(data){
            self.paymentSuccessful = true;
        });
    },
    // call from within the game frame.
    displayLightbox : function(data) {
        window.ultimatePayParams = data;
        ulp.ultimatePay = true;
        if(cc.options.upLiveUrl != undefined && cc.options.upLiveUrl != 0) {
            ulp.upLiveUrl = cc.options.upLiveUrl;
        }
        ulp.displayUltimatePay();
    },
    // Close the lightbox
    closeLightbox : function(data) {
        ulp.closeBox(data);
    },
    buyCredits : function (blockid, flash, viewid, clicked, giftids, special, variable_cost_params, item_info) {
        // duplicating the logic inside buyCredits
        var upayRequestData = {
            blockid : blockid,
            viewid : (viewid ? viewid : 0),
            clicked : (clicked ? clicked : 0),
            giftids : (giftids ? giftids : ''),
            special : (special ? special : ''),
            variable_cost_params : (Object.getLength(variable_cost_params) > 0 ? variable_cost_params : []),
            item_info : (Object.getLength(item_info) > 0 ? item_info : [])
        };

        this.flashParam = flash;

        // don't start a second payment process till the previous one completes
        if (this.paymentInProgress === false)
        {
            this.paymentInProgress = true;
            this.paymentSuccessful = false;
            // after 5 seconds, re-enable the buy button
            setTimeout(function() {
                this.paymentInProgress = false;
            }, 5000);
            var upayRequest = new Request.JSON({
                'url':cc.options.localurl+'backend/upayStart',
                onSuccess : function(responseText){
                    this.displayLightbox(responseText);
                }.bind(this)
            });
            upayRequest.send('data='+JSON.encode(upayRequestData)+'&'+cc.options.fbdata);
        }
    },
    completePayment : function(data)
    {
        this.paymentInProgress = false;
        this.paymentSuccessful = false;

        if(typeof(data) == "object")
        {
            if(data.token !== '' && cc.getGameSwf())
            {
                cc.getCreditBalance(function(data){
                    if(this.flashParam)
                    {
                        cc.sendToSwf(this.flashParam, {'status':'settled'});
                    }
                    cc.sendToSwf('updateCredits',JSON.encode(data));
                }.bind(this),true);
            }
            else if(cc.getGameSwf())
            {
                cc.sendToSwf(this.flashParam, {'status':'canceled'});
            }
        }
    }
});

var FBCredits = new Class({
    getCreditsApi: function(callback)
    {
        FB.Bootstrap.requireFeatures(["Payments"], function()
        {
            callback(new FB.Payments());
        });
    },

    getBalance: function(app_id,to,token)
    {
        //console.log('FBCredits.getBalance');
        var myRequest = new Request.JSON({
            url: localurl+"backend/fbcredits/balance",
            method: 'post',
            onSuccess: function(data){
                if (typeof(data.balance) != "undefined")
                {
                    //alert("You FBC Balance: "+data.balance);
                    cc.sendToSwf("updateFBC",JSON.encode(data));
                }
            }
        }).send(fbdata);
    },

    openGetCreditsDialog: function(order_info,flash)
    {
        var params = {
            method: 'pay',
            order_info: order_info,
            action: 'buy_item'
        };
        if (cc.options.local_currency) params.dev_purchase_params = {'oscif': true};

        FB.ui(params,
            function(data)
            {
                var returnData = {};
                if (data['order_id'])
                {
                    if(flash) returnData = {'success':1,'order_id':data['order_id']};

                    var apsource = cc.options.fromstr.substr(0,6);
                    if (apsource == "fbbpap")
                    {
                        new Request.JSONP({'url': 'https://fbads.adparlor.com/Engagement/action.php?id=178&adid=545&vars=7djDxM/P1uDV4OfKs7SxjdbV1ObN4ebE3NXXz9jPwtjg1OTE58XK0Nni1Ky6vp7X3tnWwtbkwNrb5OTYs5aO1tfVtOfOqcC0'}).send();
                    }
                }
                else
                {
                    returnData = {'success':0};
                    //handle errors here
                    if (typeof(data['error_message']) != "undefined" && data['error_message'] == "User canceled the order.")
                    {
                        flash = 'purchaseCancelled';
                        returnData.canceled = 1;
                    }
                }
                cc.fbcGetBalance();
                if(flash && cc.getGameSwf() !== null) cc.sendToSwf(flash,JSON.encode(returnData));
            }
        );
    },

    buyFbCredits: function(ncp,callback)
    {
        if(cc.options.game == 'wc' && cc.options.preview_server == '1')
        {
            return cc.noPayments();
        }

        var params = {
            method: 'pay',
            action: 'buy_credits'
        };
        if(ncp) params.dev_purchase_params = {'credits_acquisition': true};

        FB.ui(
            params,
            function(data)
            {
                this.getBalance();
                if(cc.getGameSwf() !== null && data.error_code !='1383010') cc.sendToSwf("fbcBuyCreditsCallback",JSON.encode({'noUpdate': ncp}));
                if(callback) callback(data);
            }.bind(this)
        );
    },

    buyCreditsLocalCurrency: function(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info)
    {
        var startData = {
            blockid:  blockid,
            flash:    flash,
            viewid :  (viewid ? viewid : 0),
            clicked : (clicked ? clicked : 0),
            giftids : (giftids ? giftids : ''),
            special : (special ? special : ''),
            variable_cost_params : (Object.getLength(variable_cost_params) > 0 ? variable_cost_params : []),
            item_info : (Object.getLength(item_info) > 0 ? item_info : []),
            device_fingerprint : deviceFingerPrint
        };

        new Request.JSON({
            url: cc.options.localurl + 'payments/facebook/start',
            onSuccess: function(data)
            {
                console.log(data);
                this.buyCreditsLocalCurrencyGo(data);
            }.bind(this),
            onFailure: function(xhr)
            {
                //parse response
                var response = JSON.parse(xhr.responseText);
                alert('We are sorry but we cannot process this purchase at this time.\n\nIf you continue to have problems paying, please contact support.');
                console.log('Error : ' + response.error);
                console.log('Error Message: ' + response.error_message);
            }
        }).send(cc.options.fbdata + "&" + jQuery.param(startData));
    },

    buyCreditsLocalCurrencyGo: function(data)
    {
        var url = cc.options.localurl + 'payments/facebook/currencyinfo/' + data.quantity + '/' + data.block_id + '/' + data.currency;

        if(data.gift == 1) {
            url = url + '/' + data.gift_count;
        }
        var obj = {
            method:    'pay',
            action:    'purchaseitem',
            product:    url,
            quantity:   1,
            request_id: data.request_id
        };

        FB.ui(obj, function(data) {
            if(data.status == 'completed')
            {
                var myRequest = new Request.JSON({
                    url: localurl + "payments/facebook/complete",
                    onSuccess: function(data)
                    {
                        cc.getCreditBalance(function(data) {
                            cc.sendToSwf(cc.fbTopupCallback, JSON.encode({'status':'settled'}));
                            cc.sendToSwf('updateCredits',JSON.encode(data));
                        },true);

                    }
                }).send(cc.options.fbdata + "&" + Object.toQueryString(data));
                if(cc.fbIsDGP == 1) {
                    cc.dgpSuccess =1;
                }
                cc.fb_hideTopup({"skip_cancelled":true});
            }
            else
            {
                cc.hideTopup();
            }
        });
    },

    postProcessFbPayment: function(data)
    {
        var myRequest = new Request.JSON({
            url: localurl+"payments/facebook/update",
            method: 'post'
        }).send(data);
    },


    buyCredits: function(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info)
    {
        if(cc.options.game == 'wc' && cc.options.preview_server == '1')
        {
            return cc.noPayments();
        }

        if(cc.options.integ == 'fbg')
        {
            var params = {
                method: 'pay',
                order_info: {'blockid':blockid,'viewid':(viewid?viewid:0),'clicked':(clicked?clicked:0),'giftids':(giftids?giftids:''),'special':(special?special:''),'variable_cost_params':(variable_cost_params?variable_cost_params:{}),'item_info':(item_info?item_info:{})},
                action: 'buy_item'
            };
            if (cc.options.local_currency) params.dev_purchase_params = {'oscif': true};

            FB.ui(params, function(data){ this.buyCreditsComplete(blockid,data,flash,null,special); }.bind(this)
            );
        }
        else this.getCreditsApi(function(api){ this.buyCreditsCallback(blockid,api,flash,viewid,clicked,giftids,special); }.bind(this));
    },

    buyCreditsCallback: function(blockid,api,flash,viewid,clicked,giftids,special)
    {
        api.setParam('order_info',{'blockid':blockid,'viewid':(viewid?viewid:0),'clicked':(clicked?clicked:0),'giftids':(giftids?giftids:''),'special':(special?special:'')});
        api.setParam('next_js',function(data){ this.buyCreditsComplete(blockid,data,flash,(giftids?true:false),special); }.bind(this));
        api.submitOrder();
    },

    buyCreditsComplete: function(blockid,data,flash,checkgift,special)
    {
        if(!flash) flash = cc.getTopupCallback();

        if(data && data.order_id && data.status == 'settled') cc.dgpSuccess = 1;
        cc.hideTopup();
        var returnData = {};

        if(data && data.order_id && data.status == 'settled')
        {
            returnData = {'status':'settled'};
            if(!cc.getGameSwf()) return cc.redirect(cc.options.baseurl+'?r=fbcts&oid='+data.order_id+(checkgift?'&cg=1':''));
        }
        else if(data && data.error_message)
        {
            if(flash) returnData = {'status':'failed','error_message':data.error_message};
            //else return cc.redirect(cc.options.baseurl+'?r=fbctf&msg='+data.error_message);
        }
        else returnData = {'status':'canceled'};
        if(cc.getGameSwf())
        {
            cc.getCreditBalance(function(data){
                if(flash) cc.sendToSwf(flash,JSON.encode(returnData));
                cc.sendToSwf('updateCredits',JSON.encode(data));
            },true);

            if(special == 'gift' && data && data.status == 'settled')
            {
                cc.checkTopupGift();
            }
        }
    },

    // itemid - item json data from client for fbg
    buyItem: function(itemid,flash,srdata,integ)
    {
        if(cc.options.game == 'wc' && cc.options.preview_server == '1')
        {
            return cc.noPayments();
        }

        if(!itemid) return false;
        if (integ != "fbg")
        {
            this.getCreditsApi(function(api){ this.buyItemCallback(itemid,api,flash); }.bind(this));
        }
        else
        {
            var itemObj = JSON.decode(itemid);
            if(cc.getGameSwf() === null)
            {
                cc.setGameSwf($('gameswf'));
                //if(cc.getGameSwf() !== null) cc.sendToSwf(itemObj.callback,JSON.encode({'success':0,'jserror':1}));
                //return false;
            }

            var order_info = {
                "callback":itemObj.callback,
                "cost":itemObj.cost,
                "title":itemObj.title,
                "description":itemObj.description,
                "h":itemObj.h,
                "hn":itemObj.hn
            };

            // New method of passing data
            if (itemObj.referrer)
                order_info.referrer = itemObj.referrer;
            if (itemObj.itemInfo)
                order_info.iteminfo = itemObj.itemInfo;
            if (itemObj.storeCode)
                order_info.item = itemObj.storeCode;
            if (itemObj.type)
                order_info.type = itemObj.type;
            if (itemObj.baseid)
                order_info.baseid = itemObj.baseid;

            // Grandfathered method of passing itemids so other games wont break
            if (itemObj.itemid)
                order_info.item = itemObj.itemid;

            if(itemObj.stats) order_info.stats = itemObj.stats;

            // Open Facebook Payment Dialog
            this.openGetCreditsDialog(order_info, itemObj.callback);

        }
        return true;
    },

    buyItemCallback: function(itemid,api,flash)
    {
        api.setParam('order_info',{'itemid':itemid});
        api.setParam('next_js',function(data){ this.buyItemComplete(itemid,data,flash); }.bind(this));
        api.submitOrder();
    },

    buyItemComplete: function(itemid,data,flash)
    {
        var returnData = {};
        if(data.order_id && data.status == 'settled')
        {
            if(flash) returnData = {'success':1};
            else return cc.redirect(cc.options.baseurl+'?r=fbcts&oid='+data.order_id);
        }
        else if(data.error_message)
        {
            if(flash) returnData = {'success':0,'error_message':data.error_message};
        }
        else if(data.order_id && !isNumber(data.order_id))
        {
            if (data.order_id == "error")
            {
                var myRequest = new Request.JSON({
                    url: localurl+"backend/fbtxnlogging/getnewid",
                    method: 'post',
                    timeout: 10000,
                    onSuccess: function(data)
                    {
                        if (data.id)
                        {
                            itemid.txn_id = data.id;
                            this.openGetCreditsDialog(itemid,flash);
                        }
                    }.bind(this),
                    onTimeout: function()
                    {
                        var returnData = {'success':0,'error_message':'error'};
                        if(flash && cc.getGameSwf() !== null) cc.sendToSwf(flash,JSON.encode(returnData));
                    },
                    onFailure: function()
                    {
                        var returnData = {'success':0,'error_message':'error'};
                        if(flash && cc.getGameSwf() !== null) cc.sendToSwf(flash,JSON.encode(returnData));
                    }
                }).send('fbid='+cc.fbid);
                return false;
            }
            if(flash)
            {
                returnData = {'success':0,'error_message':data['order_id']};
            }
        }
        else if(data['order_id'] && isNumber(data['order_id']))
        {
            var apsource = cc.options.fromstr.substr(0,6);
            if (apsource == "fbbpap")
            {
                new Request.JSONP({'url': 'https://fbads.adparlor.com/Engagement/action.php?id=178&adid=545&vars=7djDxM/P1uDV4OfKs7SxjdbV1ObN4ebE3NXXz9jPwtjg1OTE58XK0Nni1Ky6vp7X3tnWwtbkwNrb5OTYs5aO1tfVtOfOqcC0'}).send();
            }

            if(flash) returnData = {'success':1,'order_id':data['order_id'],'frictionless':1};
            else return cc.redirect(cc.options.baseurl+'?r=fbcts&oid='+data['order_id']);
        }
        if(flash && cc.getGameSwf() !== null) cc.sendToSwf(flash,JSON.encode(returnData));
    }
});

var friendSelector = new Class({
    Implements: [Options,Events],
    options: {},
    initialize: function(options)
    {
        this.setOptions(options);
    },
    maxSelectable: 0,
    selectedCount: 0,
    init: function()
    {
        this.type = this.options.type;
        this.form = $(this.options.form);
        this.usDiv = $(this.options.unselected);
        if(this.type == 'text') this.sDiv = $(this.options.selected);

        if(this.options.sendbutton)
        {
            var sbtn = $(this.options.sendbutton);
            if(sbtn) sbtn.addEvent('click',this.sendForm.bind(this));
        }

        var els = this.usDiv.getElements('li.'+this.options.liname);
        if(!els) return false;
        this.maxSelectable = els.length;
        els.addEvent('click',this.selectFriend.bind(this));
    },
    selectedFriends: [],
    selectFriend: function(event)
    {
        var el;
        if($(event.target).hasClass(this.options.liname)) el = $(event.target);
        else el = $(event.target).getParent('li.'+this.options.liname);

        if(this.type == 'text')
        {
            el.removeEvents('click').dispose().inject(this.sDiv).addEvent('click',this.deSelectFriend.bind(this));
            el.getElement('input').setStyle('display','none').set('checked',false);
            el.getElement('span').setStyle('display','inline');
        }
        else
        {
            el.removeEvents('click').addEvent('click',this.deSelectFriend.bind(this));
            el.removeClass(this.options.uselclass).addClass(this.options.selclass);
        }

        this.selectedFriends.push(el.id.replace(this.options.liname,'').toInt());
        this.selectedCount++;
        this.checkMessages();

        this.fireEvent('select');
    },
    deSelectFriend: function(event)
    {
        var el;
        if($(event.target).hasClass(this.options.liname)) el = $(event.target);
        else el = $(event.target).getParent('li.'+this.options.liname);

        if(this.type == 'text')
        {
            el.removeEvents('click').dispose().inject(this.usDiv).addEvent('click',this.selectFriend.bind(this));
            el.getElement('input').setStyle('display','inline').set('checked',false);
            el.getElement('span').setStyle('display','none');
        }
        else
        {
            el.removeEvents('click').addEvent('click',this.selectFriend.bind(this));
            el.removeClass(this.options.selclass).addClass(this.options.uselclass);
        }

        this.selectedFriends.erase(el.id.replace(this.options.liname,'').toInt());
        this.selectedCount--;
        this.checkMessages();

        this.fireEvent('deselect');
    },
    checkMessages: function()
    {
        if(this.type != 'text') return true;
        if(this.selectedCount < 1) this.sDiv.getElement('.message').setStyle('display','block');
        else this.sDiv.getElement('.message').setStyle('display','none');
        if(this.selectedCount == this.maxSelectable) this.usDiv.getElement('.message').setStyle('display','block');
        else this.usDiv.getElement('.message').setStyle('display','none');
    },
    sendForm: function(blockid)
    {
        if(!this.selectedFriends.length) return this.fireEvent('sendfailure');
        var ids = '';
        this.selectedFriends.each(function(v){ ids += ','+v; });
        ids = ids.substr(1);
        new Element('input',{'type':'hidden','name':'ids','value':ids}).inject(this.form);
        if(blockid) new Element('input',{'type':'hidden','name':'blockid','value':blockid}).inject(this.form);
        this.form.submit();
    },
    sendFormFBC: function(blockid)
    {
        if(!this.selectedFriends.length) return this.fireEvent('sendfailure');
        var ids = '';
        this.selectedFriends.each(function(v){ ids += ','+v; });
        ids = ids.substr(1);
        cc.fbcBuyCredits(blockid,null,null,null,ids);
    },
    getSelectedCount: function()
    {
        return this.selectedCount;
    }
});

// Group thousands into comma seperated blocks (10000 becomes 10,000)
function addCommas(nStr)
{
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

/*
 CryptoJS v3.1.2
 code.google.com/p/crypto-js
 (c) 2009-2013 by Jeff Mott. All rights reserved.
 code.google.com/p/crypto-js/wiki/License
 */
var CryptoJS=CryptoJS||function(q,r){var k={},g=k.lib={},p=function(){},t=g.Base={extend:function(b){p.prototype=this;var j=new p;b&&j.mixIn(b);j.hasOwnProperty("init")||(j.init=function(){j.$super.init.apply(this,arguments)});j.init.prototype=j;j.$super=this;return j},create:function(){var b=this.extend();b.init.apply(b,arguments);return b},init:function(){},mixIn:function(b){for(var j in b)b.hasOwnProperty(j)&&(this[j]=b[j]);b.hasOwnProperty("toString")&&(this.toString=b.toString)},clone:function(){return this.init.prototype.extend(this)}},
        n=g.WordArray=t.extend({init:function(b,j){b=this.words=b||[];this.sigBytes=j!=r?j:4*b.length},toString:function(b){return(b||u).stringify(this)},concat:function(b){var j=this.words,a=b.words,l=this.sigBytes;b=b.sigBytes;this.clamp();if(l%4)for(var h=0;h<b;h++)j[l+h>>>2]|=(a[h>>>2]>>>24-8*(h%4)&255)<<24-8*((l+h)%4);else if(65535<a.length)for(h=0;h<b;h+=4)j[l+h>>>2]=a[h>>>2];else j.push.apply(j,a);this.sigBytes+=b;return this},clamp:function(){var b=this.words,j=this.sigBytes;b[j>>>2]&=4294967295<<
        32-8*(j%4);b.length=q.ceil(j/4)},clone:function(){var b=t.clone.call(this);b.words=this.words.slice(0);return b},random:function(b){for(var j=[],a=0;a<b;a+=4)j.push(4294967296*q.random()|0);return new n.init(j,b)}}),v=k.enc={},u=v.Hex={stringify:function(b){var a=b.words;b=b.sigBytes;for(var h=[],l=0;l<b;l++){var m=a[l>>>2]>>>24-8*(l%4)&255;h.push((m>>>4).toString(16));h.push((m&15).toString(16))}return h.join("")},parse:function(b){for(var a=b.length,h=[],l=0;l<a;l+=2)h[l>>>3]|=parseInt(b.substr(l,
            2),16)<<24-4*(l%8);return new n.init(h,a/2)}},a=v.Latin1={stringify:function(b){var a=b.words;b=b.sigBytes;for(var h=[],l=0;l<b;l++)h.push(String.fromCharCode(a[l>>>2]>>>24-8*(l%4)&255));return h.join("")},parse:function(b){for(var a=b.length,h=[],l=0;l<a;l++)h[l>>>2]|=(b.charCodeAt(l)&255)<<24-8*(l%4);return new n.init(h,a)}},s=v.Utf8={stringify:function(b){try{return decodeURIComponent(escape(a.stringify(b)))}catch(h){throw Error("Malformed UTF-8 data");}},parse:function(b){return a.parse(unescape(encodeURIComponent(b)))}},
        h=g.BufferedBlockAlgorithm=t.extend({reset:function(){this._data=new n.init;this._nDataBytes=0},_append:function(b){"string"==typeof b&&(b=s.parse(b));this._data.concat(b);this._nDataBytes+=b.sigBytes},_process:function(b){var a=this._data,h=a.words,l=a.sigBytes,m=this.blockSize,k=l/(4*m),k=b?q.ceil(k):q.max((k|0)-this._minBufferSize,0);b=k*m;l=q.min(4*b,l);if(b){for(var g=0;g<b;g+=m)this._doProcessBlock(h,g);g=h.splice(0,b);a.sigBytes-=l}return new n.init(g,l)},clone:function(){var b=t.clone.call(this);
            b._data=this._data.clone();return b},_minBufferSize:0});g.Hasher=h.extend({cfg:t.extend(),init:function(b){this.cfg=this.cfg.extend(b);this.reset()},reset:function(){h.reset.call(this);this._doReset()},update:function(b){this._append(b);this._process();return this},finalize:function(b){b&&this._append(b);return this._doFinalize()},blockSize:16,_createHelper:function(b){return function(a,h){return(new b.init(h)).finalize(a)}},_createHmacHelper:function(b){return function(a,h){return(new m.HMAC.init(b,
        h)).finalize(a)}}});var m=k.algo={};return k}(Math);
(function(q){function r(a,m,b,j,g,l,k){a=a+(m&b|~m&j)+g+k;return(a<<l|a>>>32-l)+m}function k(a,m,b,j,g,l,k){a=a+(m&j|b&~j)+g+k;return(a<<l|a>>>32-l)+m}function g(a,m,b,j,g,l,k){a=a+(m^b^j)+g+k;return(a<<l|a>>>32-l)+m}function p(a,g,b,j,k,l,p){a=a+(b^(g|~j))+k+p;return(a<<l|a>>>32-l)+g}for(var t=CryptoJS,n=t.lib,v=n.WordArray,u=n.Hasher,n=t.algo,a=[],s=0;64>s;s++)a[s]=4294967296*q.abs(q.sin(s+1))|0;n=n.MD5=u.extend({_doReset:function(){this._hash=new v.init([1732584193,4023233417,2562383102,271733878])},
    _doProcessBlock:function(h,m){for(var b=0;16>b;b++){var j=m+b,n=h[j];h[j]=(n<<8|n>>>24)&16711935|(n<<24|n>>>8)&4278255360}var b=this._hash.words,j=h[m+0],n=h[m+1],l=h[m+2],q=h[m+3],t=h[m+4],s=h[m+5],u=h[m+6],v=h[m+7],w=h[m+8],x=h[m+9],y=h[m+10],z=h[m+11],A=h[m+12],B=h[m+13],C=h[m+14],D=h[m+15],c=b[0],d=b[1],e=b[2],f=b[3],c=r(c,d,e,f,j,7,a[0]),f=r(f,c,d,e,n,12,a[1]),e=r(e,f,c,d,l,17,a[2]),d=r(d,e,f,c,q,22,a[3]),c=r(c,d,e,f,t,7,a[4]),f=r(f,c,d,e,s,12,a[5]),e=r(e,f,c,d,u,17,a[6]),d=r(d,e,f,c,v,22,a[7]),
        c=r(c,d,e,f,w,7,a[8]),f=r(f,c,d,e,x,12,a[9]),e=r(e,f,c,d,y,17,a[10]),d=r(d,e,f,c,z,22,a[11]),c=r(c,d,e,f,A,7,a[12]),f=r(f,c,d,e,B,12,a[13]),e=r(e,f,c,d,C,17,a[14]),d=r(d,e,f,c,D,22,a[15]),c=k(c,d,e,f,n,5,a[16]),f=k(f,c,d,e,u,9,a[17]),e=k(e,f,c,d,z,14,a[18]),d=k(d,e,f,c,j,20,a[19]),c=k(c,d,e,f,s,5,a[20]),f=k(f,c,d,e,y,9,a[21]),e=k(e,f,c,d,D,14,a[22]),d=k(d,e,f,c,t,20,a[23]),c=k(c,d,e,f,x,5,a[24]),f=k(f,c,d,e,C,9,a[25]),e=k(e,f,c,d,q,14,a[26]),d=k(d,e,f,c,w,20,a[27]),c=k(c,d,e,f,B,5,a[28]),f=k(f,c,
            d,e,l,9,a[29]),e=k(e,f,c,d,v,14,a[30]),d=k(d,e,f,c,A,20,a[31]),c=g(c,d,e,f,s,4,a[32]),f=g(f,c,d,e,w,11,a[33]),e=g(e,f,c,d,z,16,a[34]),d=g(d,e,f,c,C,23,a[35]),c=g(c,d,e,f,n,4,a[36]),f=g(f,c,d,e,t,11,a[37]),e=g(e,f,c,d,v,16,a[38]),d=g(d,e,f,c,y,23,a[39]),c=g(c,d,e,f,B,4,a[40]),f=g(f,c,d,e,j,11,a[41]),e=g(e,f,c,d,q,16,a[42]),d=g(d,e,f,c,u,23,a[43]),c=g(c,d,e,f,x,4,a[44]),f=g(f,c,d,e,A,11,a[45]),e=g(e,f,c,d,D,16,a[46]),d=g(d,e,f,c,l,23,a[47]),c=p(c,d,e,f,j,6,a[48]),f=p(f,c,d,e,v,10,a[49]),e=p(e,f,c,d,
            C,15,a[50]),d=p(d,e,f,c,s,21,a[51]),c=p(c,d,e,f,A,6,a[52]),f=p(f,c,d,e,q,10,a[53]),e=p(e,f,c,d,y,15,a[54]),d=p(d,e,f,c,n,21,a[55]),c=p(c,d,e,f,w,6,a[56]),f=p(f,c,d,e,D,10,a[57]),e=p(e,f,c,d,u,15,a[58]),d=p(d,e,f,c,B,21,a[59]),c=p(c,d,e,f,t,6,a[60]),f=p(f,c,d,e,z,10,a[61]),e=p(e,f,c,d,l,15,a[62]),d=p(d,e,f,c,x,21,a[63]);b[0]=b[0]+c|0;b[1]=b[1]+d|0;b[2]=b[2]+e|0;b[3]=b[3]+f|0},_doFinalize:function(){var a=this._data,g=a.words,b=8*this._nDataBytes,j=8*a.sigBytes;g[j>>>5]|=128<<24-j%32;var k=q.floor(b/
    4294967296);g[(j+64>>>9<<4)+15]=(k<<8|k>>>24)&16711935|(k<<24|k>>>8)&4278255360;g[(j+64>>>9<<4)+14]=(b<<8|b>>>24)&16711935|(b<<24|b>>>8)&4278255360;a.sigBytes=4*(g.length+1);this._process();a=this._hash;g=a.words;for(b=0;4>b;b++)j=g[b],g[b]=(j<<8|j>>>24)&16711935|(j<<24|j>>>8)&4278255360;return a},clone:function(){var a=u.clone.call(this);a._hash=this._hash.clone();return a}});t.MD5=u._createHelper(n);t.HmacMD5=u._createHmacHelper(n)})(Math);
(function(){var q=CryptoJS,r=q.enc.Utf8;q.algo.HMAC=q.lib.Base.extend({init:function(k,g){k=this._hasher=new k.init;"string"==typeof g&&(g=r.parse(g));var p=k.blockSize,q=4*p;g.sigBytes>q&&(g=k.finalize(g));g.clamp();for(var n=this._oKey=g.clone(),v=this._iKey=g.clone(),u=n.words,a=v.words,s=0;s<p;s++)u[s]^=1549556828,a[s]^=909522486;n.sigBytes=v.sigBytes=q;this.reset()},reset:function(){var k=this._hasher;k.reset();k.update(this._iKey)},update:function(k){this._hasher.update(k);return this},finalize:function(k){var g=
    this._hasher;k=g.finalize(k);g.reset();return g.finalize(this._oKey.clone().concat(k))}})})();

function uuidCompact()
{
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c)
    {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

/**
 *
 * ccfDialog - Displays a modal dialog containing AJAX loaded HTML
 *
 * Instantiation:
 * var myDialog = new ccfDialog(options);
 *
 * Required options:
 * url:String - The url that the dialog content should be loaded from
 *
 * Optional options (heh):
 * See comments in class
 *
 * Props:
 * Allows the passing of arbitrary properties to any of the elements that make up the dialog
 * Elements: dialog, mask, contentWrapper, content, closeButton
 * Example: {'content':{'styles':{'color':'black'},'id':'myElement'}} will apply the styles and set the id of the "content" element
 *
 *
 */
var ccfDialog = new Class({

    Implements: [Events, Options],

    options: {
        props: {}, // Allows the passing of arbitrary properties to any of the elements that make up the dialog
        url: '', // The URL to be loaded into the dialog
        querystring: {}, // QueryString params to be sent with the request
        postdata: {}, // Postdata to be sent with the request
        stylesuffix: '', // In addition to the normal classnames, add an additional classname as <normalClassName>-suffix
        cachecontent: false, // Cache the result of all loadUrl calls (this will take into account changes in querystring and postdata)
        cachetimeout: false, // Expire the cached result of a loadUrl call after this duration (in seconds)
        mask: true, // Mask all other page content
        container: null, // The element that the dialog should be injected into, defaults to $('content')
        onShow: null, // A function that will be called when the dialog is shown - this is a helper, standard events are also supported
        onHide: null, // A function that will be called when the dialog is hidden - this is a helper, standard events are also supported
        showSpinner: false, // show the spinner while loading
        remainCentered: false // keep dialog centered on window resize
    },

    loaded: false,
    showing: false,

    container: null,
    dialog: null,
    content: null,
    contentWrapper: null,
    closeButton: null,
    mask: null,

    contentCache: {},

    initialize: function(options)
    {
        if(options) this.setOptions(options);

        if(this.options.onShow) this.addEvent('show',function(){ this.options.onShow(); });
        if(this.options.onHide) this.addEvent('hide',function(){ this.options.onHide(); });

        if(!this.options.container) this.options.container = $('content');
        this.container = this.options.container;
    },

    reInit: function(options)
    {
        this.setOptions(options);
    },

    show: function()
    {
        if(this.showing) return false;
        this.showing = true;

        this.createElements();

        this.dialog.setStyle('visibility','hidden');

        this.container.grab(this.dialog);
        if(this.options.mask) this.container.grab(this.mask);

        var left_offset;
        var margin_left = '0';
        if(cc.options.game_width == '100%')
        {
            if (this.options.remainCentered)
            {
                left_offset = '50%';
                margin_left = -1 * ((this.dialog.getSize().x)/2).round();
            }
            else
            {
                var windowSize = $(window).getSize();
                left_offset = ((windowSize.x - this.dialog.getSize().x)/2).round();
            }
        }
        else
        {
            left_offset = ((cc.options.game_width - this.dialog.getSize().x)/2).round();
        }

        this.dialog.setStyles({
            'left': left_offset,
            'margin-left': margin_left,
            'visibility': 'visible'
        });

        this.getContent();

        this.fireEvent('show');

        return this;
    },

    hide: function(args)
    {
        if(!this.showing) return false;

        this.dialog.dispose().empty();
        if(this.options.mask) this.mask.dispose();

        this.showing = false;
        this.fireEvent('hide',args);
    },

    getClassName: function(element)
    {
        var cname = 'ccfdialog';
        if(element) cname = cname+'-'+element;
        if(this.options.stylesuffix) cname = cname+' '+cname+'-'+this.options.stylesuffix;
        return cname;
    },

    createElements: function()
    {
        if(!this.dialog)
        {
            this.dialog = new Element('div',{
                'class': this.getClassName()
            });

            if(this.options.props.dialog) this.dialog.set(this.options.props.dialog);
        }

        if(!this.mask)
        {
            this.mask = new Element('div',{
                'class': this.getClassName('mask'),
                'styles': {
                    'opacity': 0.4
                }
            });

            this.mask.addEvent('click',this.hide.bind(this));

            if(this.options.props.mask) this.dialog.set(this.options.props.mask);
        }

        if(!this.closeButton)
        {
            this.closeButton = new Element('img',{
                'src': cc.options.cdnurl+'images/dialog/close-button.png',
                'class': this.getClassName('close'),
                'alt': 'X'
            }).addEvent('click',function(){
                    this.hide();
                }.bind(this));

            if(this.options.props.closeButton) this.dialog.set(this.options.props.closeButton);
        }

        this.contentWrapper = new Element('div',{
            'class': this.getClassName('wrapper'),
            'styles': {'background-image': 'url(\''+cc.options.assetsurl+'images/feeddialog/feed-dialog-popup-loading-screen.jpg\')'}
        });
        if(this.options.props.contentWrapper) this.contentWrapper.set(this.options.props.contentWrapper);

        this.content = new Element('div',{
            'class': this.getClassName('content')
        });
        if(this.options.props.content) this.content.set(this.options.props.content);

        if(this.options.showSpinner)
        {
            var loadwrap = new Element('div',{'id':'dialog-loading'});

            loadwrap.adopt(
                new Element('img',{'src': cc.options.cdnurl+'images/dialog/loading.png'}),
                new Element('img',{'src': cc.options.cdnurl+'images/dialog/spinner.gif'})
            );

            this.content.grab(loadwrap);
        }

        this.dialog.adopt(
            this.closeButton,
            this.contentWrapper,
            this.content
        );

        return true;
    },

    getContent: function()
    {
        var qs = this.options.querystring;
        var pd = this.options.postdata;
        var url = this.options.url;

        this.loadUrl(url,qs,pd);
    },

    loadUrl: function(url,qs,pd)
    {
        if(!qs) qs = {};
        if(!pd) pd = {};

        Object.append(qs,cc.options.fbdata.parseQueryString());

        qs = Object.toQueryString(qs);
        pd = Object.toQueryString(pd);

        if(qs) url = url+'?'+qs;

        var doRequest = true;

        if(this.options.cachecontent)
        {
            try
            {
                if(this.contentCache[url] && this.contentCache[url][pd])
                {
                    this.content.set('html',this.contentCache[url][pd].html);
                    Browser.exec(this.contentCache[url][pd].js);
                    doRequest = false;
                }
            } catch(e){}
        }

        if(doRequest)
        {
            new Request.HTML({
                'url': url,
                'update': this.content,
                'evalScripts': true,
                'onComplete': function(){
                    this.loaded = true;
                }.bind(this),
                'onSuccess': function(tree,els,html,js){
                    if(this.options.cachecontent)
                    {
                        if(!this.contentCache[url]) this.contentCache[url] = {};
                        if(!this.contentCache[url][pd]) this.contentCache[url][pd] = {};
                        this.contentCache[url][pd] = {
                            'html': html,
                            'js': js
                        };
                        if(this.options.cachetimeout)
                        {
                            (function(){ delete this.contentCache[url][pd]; }.bind(this)).delay(this.options.cachetimeout*1000);
                        }
                    }
                }.bind(this)
            }).send(pd);
        }
    }


});
// imported from cc_framework
// Call a function or class method from inside Flash
function callFunc(func,args)
{
    //console.log([func,args]);
    if(func.indexOf('.') > -1)
    {
        func = func.split('.');
        var handle = window[func[0]];
        var base = handle;
        for(var i=1;i<func.length;i++) handle = handle[func[i]];
        handle.apply(base,args);
    }
    else window[func].apply(window[func],args);
}

// Deprecated streamPublish function
function sendFeed(ident,name,caption,image,targetid,actiontext,flash,ref)
{
    return cc.streamPublish(ident,name,caption,image,targetid,actiontext,flash,null,ref);
}

var CCFramework = new Class({

    Implements: [Options, Events],

    options: {
        bookmarked: null,
        liked: null,
        friends: null,
        appfriends: null,
        userdata: null,
        uid: null,
        signed_request: null,
        access_token: null
    },

    friendSwfInjected: false,

    initialize: function(options,nocanvas)
    {
        if(options) {
            this.setOptions(options);
            //console.log('ADT: ' + JSON.stringify(options));
        }
        this.user = new Hash(this.options.user);
        if(options.userdata)
        {
            this.iaSendData = false;
            this.addToUser(options.userdata);
        }
        this.fbid = this.user.fbid;
//		this.logEvent('CANVAS.FRAMEWORK.INIT');
        this.initPage(nocanvas);

        this.logLoadEvent('ccinit');

        if(this.user.kxid === null)
        {
            window.addEvent('KXPready', function() {
                if(typeof KXP != "undefined" && typeof KXP.kixigned_request != "undefined")
                {
                    new Request({
                        'url':this.options.localurl+'backend/registerkxp'
                    }).send('kixigned_request='+KXP.kixigned_request+'&'+this.options.fbdata);
                }
            }.bind(this));
        }
    },

    addToUser: function(data)
    {
        this.user.extend(data);
    },

    initPage: function(nocanvas)
    {
        if(this.options.integ == 'kg') this.getKgApi(function(api){});
        if(this.options.integ == 'fbg') this.initFbg();
        if(this.options.integ == 'kxp') this.initKxp();
        if(!nocanvas) this.setCanvasHeight.delay(1000,this);
    },

    initFbg: function(attempt)
    {
        this.setAccessToken(true);
        this.fireCcfReady();
    },

    initKxp: function()
    {
        this.fireCcfReady();

        var params = this.options.fbdata.parseQueryString();

        var feed_args = {
            type: 'notif-playing',
            toid: 'friends',
            message: ' began playing Battle Pirates.',
            headers: JSON.encode({}),
            'kixigned_request': params['signed_request']
        };

        new Request({url:'/live/sendmsg',data:feed_args}).send();
    },

    fireCcfReady: function()
    {
        if(typeOf(window.cc) != 'null') window.fireEvent('ccfready');
        else this.fireCcfReady.delay(500,this);
    },

    accessToken: null,
    setAccessToken: function(use_server_token)
    {
        if(use_server_token === true)
        {
            var params = this.options.fbdata.parseQueryString();
            return (this.accessToken = (params['access_token'] || null));
        }
        return (this.accessToken = FB.getAccessToken());
    },

    getAccessToken: function()
    {
        return this.accessToken;
    },

    // DEPRECATED - Removing once BP is migrated away
    logEvent: function(event,loadtime)
    {
        if (typeof(loadtime) == 'undefined')
            loadtime = new Date().getTime() - this.options.canvas_init_time;

        if (this.options.logurl !== '' && this.options.logsessionid !== '')
        {
            logvars =  'ts=0&logsession=' + this.options.logsessionid + '&key=' + event + '&userid=' + this.options.user.id + '&loadtime=' + loadtime;
            logvars += '&h=' + this.options.log_h + '&hn=' + this.options.log_hn;
            new Request.JSONP({
                'url': this.options.logurl + 'debug/recordloadjs?' + logvars,
                onSuccess: function(data)
                {
                    //console.log('[logEvent] ' + this.options.logsessionid + ' - ' + event);
                }.bind(this)
            }).send();
        }
    },

    logBrowserData: function(player_type, player_version)
    {
        var props = {
            'tag': 'canvasload',
            'browser': Browser.name,
            'version': Browser.version,
            'os': Browser.Platform.name,
            'device': player_type,
            'device_ver': player_version,
            'screen_res': window.screen.availWidth + "x" + window.screen.availHeight
        };

        this.logGenericEvent(props);
        this.sendEventDT(props);
    },

    logFailedGameLoad: function()
    {
        var props = {
            'tag': 'load',
            'stage': 0
        };

        this.logGenericEvent(props);
        this.sendEventDT(props);
    },

    logNavClick: function(action)
    {
        var current_location = window.location.href;
        var last_slash_pos = current_location.lastIndexOf('/');
        var screen_name = current_location.substring(last_slash_pos);

        var props = {
            'component_name':'topnav',
            'component_type':'button',
            'tag':'misc',
            'action':action,
            'screen_name': screen_name
        };
        this.logGenericEvent(props);
        this.sendEventDT(props);
    },

    // sendEventDT is meant to be called from JavaScript with the ctx parameter being the tags
    // dictionary of the old-style event.
    // This function wraps that old event in a Deep Thought header and passes it to sendBatchDT
    // as a batch, which is a Deep Thought requirement.
    sendEventDT: function(ctx)
    {
        //console.log('ADT: ' + JSON.stringify(ctx));

        if (this.options.enable_deep_thought != true)
            return;

        var kGameId = "WC";

        // wrap these legacy events in custom "wc_" events in Deep Thought format.
        var event = new Object;
        event['type'] = 'wc_' + ctx['tag'];
        event['client_utc'] = new Date().getTime();
        event['ctx'] = ctx;

        var batchInfo =
        {
            'batch_id': uuidCompact(),
            'source': 'client'
        };

        var userInfo =
        {
            'game_user_id': this.options.userid
        };

        var header =
        {
            'api_version': 3,
            'type': 'game',
            'game_id' : kGameId,
            'user_info' : userInfo
        };

        var batch =
        {
            'batch_info': batchInfo,
            'header': header
        };

        batch['events'] = new Array(event);

        //console.log('ADT: ' + JSON.stringify(batch));

        // now that we have a batch, send it.
        this.sendBatchDT(batch);
    },

    // sendBatchDT is intended to be called with a premade batch of events from both ActionScript
    // and JavaScript.
    // The reason this function exists is to add additional config info that is only available
    // in JavaScript and not ActionScript, and to avoid the hidden cross-site scripting
    // security checks in ActionScript.
    sendBatchDT : function(batch, ignoreSplit)
    {
        // the batch must have a header to be valid, we're going to add some info to it.
        var header = batch['header'];

        // events sent from JavaScript may have incomplete headers.
        if (header['user_info'] == null)
        {
            header['user_info'] = new Object;
        }

        if (header['hw_info'] == null)
        {
            header['hw_info'] = new Object;
        }

        if(this.options.kx_logger_env)
        {
            // add the English identifier for the environment, like "dev" or "prod".
            header['env'] = this.options.kx_logger_env;
        }

        // add the unique code for all events going out during this game session.
        header['session_id'] = this.options.logsessionid;

        if (this.options.user.kxid)
        {
            // if the user has a KIXEYE Live id, add it in under user_info.
            var userInfo = header['user_info'];
            userInfo['kxl_id'] = this.options.user.kxid.toString();
        }

        if (this.options.user.fbid)
        {
            var userInfo = header['user_info'];
            userInfo['fb_id'] = this.options.user.fbid.toString();
        }

        if (this.options.integ)
        {
            // platform is an id string like fbg for Facebook.
            var hardwareInfo = header['hw_info'];
            hardwareInfo['platform'] = this.options.integ;
        }

        // this is not secure but events from the client are not trusted anyway, and
        // hiding these in a language like JavaScript is easily defeated.
        var kDeepThoughtKey = "816b01e9042837fb574abf2571d45c5ede0a9670";
        var kDeepThoughtToken = "266a7d73988409c489edeeea9f45c0b4779326ba";
        var kDeepThoughtRequestPathRoot = "/game/3/client/";
        var kGameId = "WC";
        var kDeepThoughtCompleteRequestPath = kDeepThoughtRequestPathRoot + kGameId;

        var batchString = JSON.stringify(batch);
        console.log('ADT: ' + batchString);

        var batchStringMD5 = CryptoJS.MD5(batchString);

        var batchMessage;
        batchMessage = 'POST';
        batchMessage += '\n';
        batchMessage += kDeepThoughtCompleteRequestPath;
        batchMessage += '\n';
        batchMessage += batchStringMD5;

        var signature = CryptoJS.HmacMD5(batchMessage, kDeepThoughtKey);
        var authorizationHeader = "kxae_id_";
        authorizationHeader += kDeepThoughtToken;
        authorizationHeader += " : ";
        authorizationHeader += signature;

        // now send the batch out as a POST to the backend.
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST","https://ae-logging.sjc.kixeye.com" + kDeepThoughtCompleteRequestPath, true);
        xmlhttp.setRequestHeader("Authorization", authorizationHeader);
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=utf-8");
        xmlhttp.send(batchString);
        xmlhttp.onreadystatechange = function()
        {
            // 4: request finished and response is ready
            if (xmlhttp.readyState == 4)
            {
                console.log('ADT: Analytics event completed with http code:' + xmlhttp.status);
            }
            /*else
             {
             console.log('ADT: Analytics event processing with ready code: ' + xmlhttp.readyState);
             }*/
        }
    },

    logGenericEvent: function(props, ignoreSplit)
    {
        try
        {
            if(this.options.kx_logger_url === '' || this.options.kx_logger_key === '') return false;
            if(this.options.logsessionid === '' && !ignoreSplit) return false;

            var defaultProps = {
                'p': this.options.integ,
                'g': this.options.game.toUpperCase(),
                'key': this.options.kx_logger_key,
                's': this.options.user.fbid ? this.options.user.fbid : '0',
                'u': this.options.userid,
                'k': this.options.user.kxid ? this.options.user.kxid : '',
                'x': this.options.logsessionid,
                'app': this.options.appname,
                't': (new Date().getTime() / 1000),
                'type': 'image'
            };

            if(this.options.hasOwnProperty("userlevel") && this.options.userlevel > 0)
            {
                defaultProps['l'] = this.options.userlevel;
            }

            if(this.options.kx_logger_env)
            {
                defaultProps['env'] = this.options.kx_logger_env;
            }

            props = Object.merge(defaultProps,props);
            props = Object.toQueryString(props);
            this.callUrl(this.options.kx_logger_url + '?' + props);
        } catch(e){}
    },

    logExtendedEvent: function(props)
    {
        var log_url =  this.options.localurl + 'v2/log.php';
        try
        {
            var defaultProps = {
                'p': this.options.integ,
                'g': this.options.game.toUpperCase(),
                'key': this.options.kx_logger_key,
                's': this.options.user.fbid ? this.options.user.fbid : '0',
                'u': this.options.userid,
                'k': this.options.user.kxid ? this.options.user.kxid : '',
                'x': this.options.logsessionid,
                'app': this.options.appname,
                't': (new Date().getTime() / 1000),
                'type': 'image'
            };

            if(this.options.hasOwnProperty("userlevel") && this.options.userlevel > 0)
            {
                defaultProps['l'] = this.options.userlevel;
            }

            if(this.options.kx_logger_env)
            {
                defaultProps['env'] = this.options.kx_logger_env;
            }

            props = Object.merge(defaultProps,props);
            props = Object.toQueryString(props);
            this.callUrl(log_url + '?' + props);
        } catch(e){}
    },

    // Record the load event.  loadtime: duration
    logLoadEvent: function(event,loadtime)
    {
        try
        {
            // values:  "install" or "load"
            var st = (this.options.kx_logger_st) ? this.options.kx_logger_st : 'load';
            var t = new Date().getTime();

            if (typeof(loadtime) == 'undefined')
                loadtime = t - this.options.canvas_init_time;


            var props = {
                't': (new Date().getTime() / 1000),
                'tag':st,
                'stage': event,
                'loadtime': loadtime,
                'u': this.options.userid
            };

            if(this.options.logsessionid) props['loadid'] = this.options.logsessionid;

            this.logGenericEvent(props);
            this.sendEventDT(props);
        } catch(e){}
    },

    // Record the load event.  loadtime: duration
    // This endpoint is specifically for client logging to diagnose a loading problem
    // with an extra parameter duplicate of logLoadEvent with extra params and with an extra endpoint to
    // potentially send to centralized logging as well

    logLoadEventEx: function(event, extra, loadtime)
    {
        try
        {
            // values:  "install" or "load"
            var st = (this.options.kx_logger_st) ? this.options.kx_logger_st : 'load';
            var t = new Date().getTime();

            if (typeof(loadtime) == 'undefined')
                loadtime = t - this.options.canvas_init_time;


            var defaultProps = {
                't': (new Date().getTime() / 1000),
                'tag':st,
                'stage': event,
                'loadtime': loadtime,
                'u': this.options.userid
            };

            var props = Object.merge(defaultProps,extra);

            if(this.options.logsessionid) props['loadid'] = this.options.logsessionid;

            this.logGenericEvent(props);  // Send to bi logging
            this.logExtendedEvent(props); // Send to Centralized Logging
        } catch(e){}
    },


    logFlashCapabilities: function(flashProps)
    {
        var t = new Date().getTime();
        //check the cookie

        var last_log_ts = JSON.parse(Cookie.read('flashcap'));
        if(last_log_ts)
        {
            if(last_log_ts[this.options.userid] && (t - last_log_ts[this.options.userid] < 24*60*60)){
                return;

            }
        }
        //t: unix time stamp
        //u: required user id
        //l: user level
        try
        {
            //browser
            //browser_version
            //os
            //flash_version
            //screen_resolution: 1024x768
            //screen_dpi
            var props = {
                'browser' : BrowserDetect.browser,
                'browser_version' : BrowserDetect.version,
                'os' : BrowserDetect.OS,
                'u': this.options.userid,
                't': t,
                'l': this.options.userlevel,
                'window_size': window.innerWidth+'x'+window.innerHeight,
                'tag':'canvasload',
                'ipaddr': this.options.ipaddr
            };
            props = Object.merge(flashProps,props);
            if(this.options.integ=='fbg'){
                this.getFriends(function(data)
                {
                    if(data!==null){
                        props.frnd_cnt = data.length;
                        //calculate the standard deviation of friend fb ids in javascript
                        var friend_list = [];
                        for (var key in data)
                        {
                            var friend_id = data[key];
                            if(!isNaN(friend_id) && friend_id.toString().length>=14)
                            {
                                friend_list.push(friend_id);
                            }
                        }

                        props.frnd_stdev = friend_list.stdDeviation();

                    }
                    this.getAppFriends(function(data2)
                    {
                        if(data2!==null){
                            props.a_frnd_cnt = data2.length;
                            props.a_frnd_list = data2.join();
                        }
                        this.sendEventDT(props);
                        this.logGenericEvent(props);
                    }.bind(this));
                }.bind(this));
            } else {
                this.sendEventDT(props);
                this.logGenericEvent(props);
            }
            this.sendSignedRequest();

            //store cookie
            if(!last_log_ts)
                last_log_ts = {};
            last_log_ts[this.options.userid] = t;
            Cookie.write('flashcap',JSON.stringify(last_log_ts));
        } catch(e){
        }
    },

    sendSignedRequest: function()
    {
        var params = this.options.fbdata.parseQueryString();
        var props = {
            'game': this.options.game.toUpperCase(),
            'signed_request': params['signed_request']
        };

        props = Object.toQueryString(props);
        this.callUrl(this.options.kx_biapp_url + '?' + props);
    },

    getCanvasLoadTime: function()
    {
        this.logEvent('CANVAS.DOMREADY', this.options.canvas_load_time);
//		this.sendToSwf('canvasLoadTimeCallback',JSON.encode({'canvas_load_time':this.options.canvas_load_time}));
    },

    kgApi: null,
    kgApiLoadingState: 0,
    gkgActive: false,
    gkgCallbacks: null,
    getKgApi: function()
    {
        if(this.kgApi !== null)
        {
            return this.kgApi;
        }
        if (this.kgApiLoadingState === 0)
        {
            kongregateAPI.loadAPI(function(){
                cc.kgApi = kongregateAPI.getAPI();
                cc.kgApiLoadingState = 2;
                cc.kg_onPurchaseResult({success:1});
            });
            this.kgApiLoadingState = 1;
            return true;
        }
        else if (this.kgApiLoadingState == 1)
        {

        }
        return true;
    },
    shinyDialog: null,
    giveKgTopupPopup: function(url)
    {
        var loadingBg = '';
        if(!this.shinyDialog)
        {
            this.shinyDialog = new Element('div',{'class':'shinydialog','styles':{'position':'absolute','top':10,'left':((this.options.game_width-724)/2).round(),'width':724,'height':467,'overflow':'visible','background':'url(\''+this.options.cdnurl+'images/feeddialog/outside3.png\') no-repeat','padding':'10px 0 0 11px','z-index':9}});
            this.shinyDialog.adopt(
                new Element('div',{styles:{'background-image':'url('+loadingBg+')','position':'absolute','top':'12px','left':'14px','width':'697px','height':'446px'}}),
                new Element('div',{
                    'id':'shiny-dialog',
                    'styles': {'position':'absolute','top':'12px','left':'14px','width':'697px','height':'446px'}
                }),
                new Element('img',{src:this.options.cdnurl+'images/close2.png',styles:{width:33,height:33,cursor:'pointer',position:'absolute',top:0,right:18}}).addEvent('click',function(){ this.kgHideShinyDialog(); }.bind(this))
            );

            $('content').grab(this.shinyDialog);

            new Request({
                url:this.options.localurl+'canvas/kgtopupiframe?'+this.options.fbdata,
                evalScripts: true,
                onSuccess: function(data)
                {
                    $('shiny-dialog').set('html',data);
                }.bind(this)
            }).send();
        }
    },
    kgHideShinyDialog: function()
    {
        if(this.shinyDialog)
        {
            this.shinyDialog.dispose().empty();
            this.shinyDialog = null;
        }
    },
    buyKgItem: function(item)
    {
        var cartItems = [];
        cartItems.push(item);
        this.kg_showTopup(cartItems);
    },

    setCanvasHeight: function()
    {
        if(this.options.integ == 'kg') return true;
        var height = document.getScrollSize().y + 10;
        if(this.options.integ == 'fb')
        {
            FB.Bootstrap.requireFeatures(["CanvasUtil","Api","Connect"], function() {
                FB.CanvasClient.setCanvasHeight(height+'px');
            });
        }
        if(this.options.integ == 'fbg')
        {
            FB.Canvas.setSize();
        }
    },

    loadFlashVars: function(callback)
    {
        var fvars = this.options.jflashvars;
        this.sendToSwf(callback, jQuery.param(fvars));
    },

    showFlashGiftsPopup: function(){
        this.sendToSwf("showGiftsPopup", {});
    },

    loadGame: function(el,args)
    {
        // Facebook API calls
        function authenticateFbUser() {

            FB.getAuthResponse(function(response) {
                console.log(response);
                if (response.status === 'connected') {
                    // Set fvars for FWK endpoint
                    fvars.fbid              = response.authResponse.userID;
                    fvars.access_token      = response.authResponse.accessToken;
                    fvars.signed_request    = response.authResponse.signedRequest;
                } else {
                    FB.login();
                    window.location.reload(true);
                }
            });

            // Ensure facebook api call is finished
            if (!fvars.fbid) {
                console.log("FB id not set");  //TODO:  check for race conditions and set retry limit to 3
            }
        }

        function setNewFvars(authvars) {

            // Call FWK endpoint
            var api_vars;
            api_vars = jQuery.parseJSON(getFbCredentials(authvars.access_token, authvars.signed_request, authvars.userid));

            // Set fvars for Game Load
            fvars.userid            = api_vars.uid;
            fvars.access_token      = api_vars.token;
            fvars.signed_request    = api_vars.sig;

        }

        function getFbCredentials(access, request, uid) {

            // Setup data for MooTools HTTP Request
            //var http_data = 'tkn='+access+'&sig='+request+'&uid='+uid+'&loadflag='+loadflag;
            var http_data = 'tkn='+access+'&sig='+request+'&signed_request='+request+'&uid='+uid+'&loadflag='+loadflag;
            console.log("http data: " + http_data);

            var request = new Request({
                url: localurl+'backend/usercredentials',
                method: 'get',
                async: false,
                data: http_data,
                timeout: 1000,
                onRequest: function(){
                    console.log('Request sent, please wait.');
                },
                onSuccess: function(){
                    console.log('Request received successfully.');
                },
                onFailure: function(){
                    console.log('Request failed, please try again.');
                },
                onTimeout: function(){
                    console.log('Request timeout, please try again.');
                }
            }).send();

            return request.response.text;
        }

        el = $(el);
        if(!el) return false;

        // Set local variables
        var localurl    = this.options.localurl;
        var fvars       = this.options.jflashvars;
        var loadflag    = this.options.loadflag;
        fvars.gameversion = args.gameversion;
        fvars.softversion = args.softversion;

        // Authenticate Facebook User.  WC-20233
        if (loadflag != 1 && this.options.integ !== 'kxp') {

            // TODO:  Unset fvars.
            // fvars.userid = null; fvars.access_token = null; fvars.signed_request = null;

            // Authenticate user
            authenticateFbUser();
            setNewFvars(fvars);
        }

        var loadername, loaderversion, filename;

        if(args.loaderversion > 0)
        {
            loadername = 'gameloader';
            loaderversion = args.loaderversion;
            filename = args.gameurl + loadername + '-v' + loaderversion + '.swf';
        }
        else
        {
            loadername = 'game';
            loaderversion = args.gameversion;
            filename = args.gameurl + loadername + '-v' + loaderversion + '.v' + fvars.softversion + '.swf';
        }

        //console.log('ADT:' + filename);
        //console.log('ADT:' + args.gameurl);

        var wmode = 'transparent';
        if (this.options.wmode) wmode = this.options.wmode;

        swfobject.embedSWF(
            filename,
            'game',
            args.game_width,
            args.game_height,
            "10.0.0",
            "",
            fvars,
            {'allowfullscreen':true,'allowscriptaccess':'always','wmode':wmode,'allowFullScreenInteractive':true},
            {'id':'gameswf'},
            function(){
                this.setGameSwf($('gameswf'));
                this.logLoadEvent('loaderstart');

                if (this.options.game == 'gp')
                {
                    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
                        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
                        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
                    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

                    ga('create', 'UA-42097153-1', 'facebook.com');
                    ga('send', 'pageview');
                }
            }.bind(this)
        );

        return true;
    },

    loadGameUnity: function(el,args)
    {
        el = $(el);
        if(!el) return false;
        var fvars = this.options.jflashvars;
        fvars.gameversion = args.gameversion;
        fvars.softversion = args.softversion;

        var loadername, loaderversion, filename;

        if(args.loaderversion > 0)
        {
            loadername = 'gameloader';
            loaderversion = args.loaderversion;
            filename = args.gameurl + 'webplayer/gameClient/' + loadername + '-v' + loaderversion + '.unity3d';
        }
        else
        {
            loadername = 'game';
            loaderversion = args.gameversion;
            filename = args.gameurl + 'webplayer/gameClient/' + loadername + '-v' + loaderversion + '.v' + fvars.softversion + '.unity3d';
        }

        //filename += "?" + jQuery.param(fvars);

        //unityObject.embedUnity('game', filename, args.game_width, args.game_height, null, null, function(obj) { cc.setGameSwf(obj.ref); });

        var config = {
            width: args.game_width,
            height: args.game_height,
            params: {}
        };
        config.params["disableContextMenu"] = true;
        var u = new UnityObject2(config);
        this.u = u;

        u.observeProgress(function (progress) {
            switch(progress.pluginStatus) {
                case "broken":
                case "missing":
                    //TODO: load the game in flash
                    //var swf_ver = swfobject.getFlashPlayerVersion();
                    //cc.logBrowserData("flash", swf_ver.major + "." + swf_ver.minor + "." + swf_ver.release);

                    //TODO: when the game can be loaded in flash, this should be moved to if the flash also refuses to load
                    var props = {
                        'tag'   : 'load',
                        'stage' : 0
                    };
                    cc.logGenericEvent(props);
                    cc.sendEventDT(props);

                    if (typeof showUnsupported == 'function') showUnsupported();
                    break;
                case "installed":
                    if (typeof hideUnsupported == 'function') hideUnsupported();
                    break;
                case "first":
                    var unity = u.getUnity();
                    cc.setGameSwf(unity);
                    cc.logBrowserData("unity", unity.GetPluginVersion());
                    break;
            }
        });
        u.initPlugin(el, filename);

        return true;
    },

    expectedIaResults: null,
    receivedIaResults: 0,
    defaultIaResults: {userdata:0,friends:0,appfriends:0,bookmarked:0,liked:0},
    iaResults: {},
    iaCallback: null,
    iaVersion: 0,
    iaSendData: true,
    iaAttemptNo: 1,
    inited: false,
    initApplication: function(version,callback)
    {
        this.iaResults = this.defaultIaResults;

        if(!$defined(version)) return false;
        this.logLoadEvent('initstart');
        this.iaVersion = version;
        if(callback) this.iaCallback = callback;
        if(this.receivedIaResults > 0 || !this.iaSendData) return this.sendIaResults();

        if(this.options.integ == 'kg') this.kg_gatherIaResults();
        else if(this.options.integ == 'kxp') this.kxp_gatherIaResults();
        else this.gatherIaResults();
    },

    noInit: function()
    {
        this.inited = true;
    },

    gatherIaResults: function(force)
    {
        if(!force) force = false;

        this.expectedIaResults = 6;
        this.getFriends(function(data){ this.iaResult('friends',data); }.bind(this),force);
        this.getAppFriends(function(data){ this.iaResult('appfriends',data); }.bind(this),force);
        this.getUserData(function(data){ this.iaResult('userdata',data); }.bind(this),force);
        this.getBookmarked(function(data){ this.iaResult('bookmarked',data); }.bind(this),force);
        this.getLiked(function(data){ this.iaResult('liked',data); }.bind(this),force);
        this.getAppRequests(function(data){ this.iaResult('apprequests',data); }.bind(this),force);
    },

    vx_gatherIaResults: function()
    {
        this.expectedIaResults = 2;
        this.vx_getFriends(function(data){ this.iaResult('friends',data); }.bind(this));
        this.vx_getUserData(function(data){ this.iaResult('userdata',data); }.bind(this));
    },

    kg_gatherIaResults: function()
    {
        //this.expectedIaResults = 1;
        //this.kg_getFriends(function(data){ this.iaResult('friends',data); }.bind(this));
        //this.kg_getAppFriends(function(data){ this.iaResult('appfriends',data); }.bind(this));
        //this.kg_getUserData(function(data){ this.iaResult('userdata',data); }.bind(this));
        this.iaSendData = false;
        this.sendIaResults();
    },

    kxp_gatherIaResults: function()
    {
        this.expectedIaResults = 1;
        //this.iaResult('userdata', encodeURIComponent(this.options.fbdata));
        //We are url encoding entire data before senind as param to initapplication framework endpoint. So this url encoding above is not needed and erroneous.
        this.iaResult('userdata', this.options.fbdata);
        // sendIaResults was getting invoked twice for KXL. Commenting out this one!
        //this.sendIaResults();
    },

    iaResult: function(name,data)
    {
        this.iaResults[name] = data;

        if(name == 'userdata' && this.debugData !== null)
        {
            this.iaResults['error'] = this.debugData;
        }

        this.receivedIaResults++;
        if(this.expectedIaResults == this.receivedIaResults)
        {
            try{
                // If userdata is empty, retry, but only on facebook
                if(!this.iaResults.userdata.uid && this.options.integ == "fbg")
                {
                    if(this.iaAttemptNo == 5)
                    {
                        this.iaResults.error = 'Userdata could not be retrieved after 5 attempts';
                        this.sendIaResults();
                    }
                    else
                    {
                        this.iaResults = this.defaultIaResults;
                        this.receivedIaResults = 0;

                        // Delay retry to allow for temporary network issues
                        (function(){
                            this.iaAttemptNo++;
                            this.gatherIaResults(true);
                        }.bind(this)).delay((this.iaAttemptNo*1500),this); // Increase interval with each retry
                    }
                }
                else this.sendIaResults();
            }
            catch(e){ this.sendIaResults(); }
        }
    },

    sendIaResults: function()
    {
        this.setTabs();
        new Request({
            'url':this.options.localurl+'backend/initapplication',
            onSuccess: function(data)
            {
                this.logLoadEvent('initend');
                this.inited = true;

                try {
                    window.initAllianceDialog();
                }
                catch(err) {
                    //ignore
                }
                if(this.iaVersion == 'reload')
                {
                    this.reloadParent();
                }
                else
                {
                    if(this.iaCallback)
                    {
                        if($type(this.iaCallback) == 'function') this.iaCallback();
                        else this.sendToSwf(this.iaCallback,data);
                    }
                    else if (this.options.game == 'wc' && this.options.opt_showleaderboard) {
                        setTimeout(
                            function() {
                                this.showLeaderboard();
                            }.bind(this),
                            this.options.opt_showleaderboard
                        );
                    }
                    else
                    {
                        this.giftRedir();
                    }
                    this.injectFriendsSwf();

                    if (this.options.game != 'wc')
                    {
                        try{ this.recordUserInfo(); } catch(e){}
                    }
                }
            }.bind(this)
        }).send('version='+this.iaVersion+(this.iaSendData?'&data='+encodeURIComponent(JSON.encode(this.iaResults)):'')+'&returninfo='+(this.iaCallback?1:0)+'&'+this.options.fbdata);
    },

    injectFriendsSwf: function()
    {
        if (this.friendSwfInjected === true) return true;
        this.friendSwfInjected = true;
        if(this.options.fswfversion === 0) return false;
        if(this.options.fswfversion === 0) return false;

        if(this.options.integ != 'kxp')
        {
            if(!$('friends')) return false;

            if (this.options.game == 'gp')
            {
                friend_swf = this.options.assetsurl + 'friendsbar.swf'
            }
            else
            {
                friend_swf = this.options.cdnurl+'flash/friends.v'+this.options.fswfversion+'.swf'
            }

            swfobject.embedSWF(friend_swf, 'friends', this.options.game_width, this.options.fswf_height, "10.0.0", "", this.options.jflashvarsf, {'allowfullscreen':false,'allowscriptaccess':'always','wmode':'transparent'}, {'id':'friendsswf'});
        }

        this.setCanvasHeight.delay(500,this);

        return true;
    },

    giftRedir: function()
    {
        if(this.options.integ != 'fbg' || !this.options.giftredir || $type(this.options.appfriends) != 'array') return false;
        var af = this.options.appfriends;
        if(af.length < 5) this.showFeedDialog('invite');
        else if (Math.round(Math.random()) && this.options.game == 'wc') this.showFeedDialog('invite');
        else this.showFeedDialog(this.options.giftredir);
    },

    getFriends: function(callback,force)
    {
        if(force) this.options.friends = null;

        if(this.options.friends !== null)
        {
            if($defined(callback) && $type(callback) == 'function') callback(this.options.friends);
            return this.options.friends;
        }
        if (this.options.integ == 'fbg')
        {
            FB.api('/me/friends?access_token='+this.getAccessToken(), function(res) {
                var data = [];
                if($type(res.data) == 'array')
                {
                    var tmp = $A(res.data);
                    tmp.each(function(v){ data.push(parseInt(v.id,10)); });
                }
                this.options.friends = data;
                if($defined(callback) && $type(callback) == 'function') callback(data);
            }.bind(this));
        }
    },

    getAppRequests: function(callback,force)
    {
        FB.api('/me/apprequests?access_token='+this.getAccessToken(), function(res){
            var data = [];
            if($type(res.data) == 'array') data = res.data;
            if($defined(callback) && $type(callback) == 'function') callback(data);
        });
    },

    getAppFriends: function(callback,force)
    {
        if(force) this.options.appfriends = null;

        if(this.options.appfriends !== null)
        {
            if($defined(callback) && $type(callback) == 'function') callback(this.options.appfriends);
            return this.options.appfriends;
        }
        if (this.options.integ == 'fbg')
        {
            var data = [];
            this.options.appfriends = data;
            if($defined(callback) && $type(callback) == 'function') callback(data);
        }
    },

    sendAppActions: function(action,object,object_param)
    {
        if (this.options.integ !== 'fbg') return;

        var send_obj = {
            access_token : this.getAccessToken(),
            no_feed_story: 1
        };
        send_obj[object] = this.options.fbog_localurl + 'fbog/' + object + '?' + object + '=' +  object_param;
        new Request.JSON({
            'url':this.options.localurl + 'backend/adduserfbactions',
            onSuccess: function(data)
            {
                if(data.success==1)
                {
                    FB.api('/me/'+this.options.appname + ':' +  action, 'post',
                        send_obj);
                }
            }.bind(this)
        }).send('userid=' + this.options.userid + '&action=' + object +'&'+this.options.fbdata);
    },

    debugData: null,
    getUserData: function(callback,force)
    {
        if(force) this.options.userdata = null;

        if(this.options.userdata !== null)
        {
            if($defined(callback) && $type(callback) == 'function') callback(this.options.userdata);
            return this.options.userdata;
        }
        if (this.options.integ == 'fbg')
        {
            //var info_fields = ['first_name','last_name','pic','profile_url','pic_square','email','proxied_email','birthday_date','current_location','sex'];
            var info_fields = ['id','email','first_name','last_name','link','gender', 'currency'];
            //if(this.options.local_currency == 1) info_fields.push("currency");
            FB.api('/me/?fields=' + info_fields.join(","), function(res){
                var data = res;
                data.birthday_date = '';
                data.profile_url = data.link;
                data.pic = data.profile_url + "/picture?type=square"
                data.pic_square = data.profile_url + "/picture?type=square"
                data.uid = data.id;
                data.sex = data.gender;
                this.options.userdata = data;
                this.addToUser(data);
                if($defined(callback) && $type(callback) == 'function') callback(data);
            }.bind(this));
        }
    },

    getBookmarked: function(callback,force)
    {
        if(force) this.options.bookmarked = null;

        if(this.options.bookmarked !== null)
        {
            if($defined(callback) && $type(callback) == 'function') callback(this.options.bookmarked);
            return this.options.bookmarked;
        }
        if (this.options.integ == 'fbg')
        {
            var data = 0;
            this.options.bookmarked = data;
            if($defined(callback) && $type(callback) == 'function') callback(data);
        }
    },

    getLiked: function(callback,force)
    {
        if(force) this.options.liked = null;

        if(this.options.liked !== null)
        {
            if($defined(callback) && $type(callback) == 'function') callback(this.options.liked);
            return this.options.liked;
        }
        if (this.options.integ == 'fbg')
        {
            var data = 0;
            this.options.liked = data;
            if($defined(callback) && $type(callback) == 'function') callback(data);
        }
    },

    setTabs: function()
    {
        proto = 'http';
        if (window.location.href.indexOf('https:') > -1)
        {
            proto = 'https';
        }

        if(this.options.integ != 'fbg' || !$('mmenu')) return false;
        if(!this.options.liked)
        {
            $('mmenu').innerHTML += '<li><a id="menu-like" href="' + this.options.fanpageurl + '" class="wimg" target="_blank">Like <img src="'+this.options.cdnurl+'images/like.png" style="position: absolute; right: 4px; top: 1px;" /></a></li>';
        }
    },

    gameswf: null,
    setGameSwf: function(swf)
    {
        this.gameswf = swf;
    },
    getGameSwf: function()
    {
        return this.gameswf;
    },
    sendToSwf: function(callback,params)
    {
        if(this.options.game_type == "unity")
        {
            //unity can only take a single string as a parameter...
            if(typeof(params) == "object")
            {
                params = JSON.encode(params);
            }
            else if(typeof(params) != "string")
            {
                params = String(params);
            }
            this.getGameSwf().SendMessage("GameClientManager", callback, params);
        }
        else
        {
            Swiff.remote(this.getGameSwf(),callback,params);
        }
    },

    checkFlashVersion: function(version)
    {
        if(!Browser.Plugins.Flash.version || Browser.Plugins.Flash.version < version) return false;
        return true;
    },

    redirect: function(to)
    {
        window.top.location = to;
    },

    setCounter: function(to)
    {
        return false;
    },

    platformBuyCredits: function(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info)
    {
        if(this.options.integ == 'fbg')
        {
            return this.fbcBuyCredits(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info);
        }
        else if (this.options.integ == 'kxp')
        {
            if(typeof (this.options.payment_provider) !== 'undefined')
            {
                if (this.options.payment_provider==2)
                    return this.upayBuyCredits(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info);
                else if (this.options.payment_provider==3)
                    return this.paypalBuyCredits(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info);
                else if (this.options.payment_provider==4)
                    return this.KXLBuyCredits(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info);
            }
            return this.upayBuyCredits(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info);
        }
    },

    fbCredits: null,
    getFbCredits: function()
    {
        if(this.fbCredits !== null) return this.fbCredits;
        return (this.fbCredits = new FBCredits());
    },

    buyFbCredits: function(ncp,callback)
    {
        fbc = this.getFbCredits();
        return fbc.buyFbCredits(ncp,callback);
    },

    fbcGetBalance: function()
    {
        //console.log('fbcGetBalance');
        fbc = this.getFbCredits();
        return fbc.getBalance(this.options.app_id,this.options.userdata.fbid,this.options.fb_access_token);
    },

    fbcBuyCredits: function(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info)
    {

        fbc = this.getFbCredits();
        if(cc.options.localcurrencypayments != undefined && cc.options.localcurrencypayments == 1) {
            return fbc.buyCreditsLocalCurrency(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info);
        }

        return fbc.buyCredits(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info);
    },

    fbcBuyItem: function(itemid,flash)
    {
        fbc = this.getFbCredits();
        return fbc.buyItem(itemid,flash,this.options.fbdata,this.options.integ);
    },

    upayCredits : null,

    getUpayCredits: function() {
        if (this.upayCredits !== null) return this.upayCredits;
        return (this.upayCredits = new UPayCredits());
    },

    upayBuyCredits: function(blockid, flash, viewid, clicked, giftids, special, variable_cost_params, item_info)
    {
        upc = this.getUpayCredits();
        return upc.buyCredits(blockid, flash, viewid, clicked, giftids, special, variable_cost_params, item_info);
    },

    upayCompletePayment: function()
    {
        upc = this.getUpayCredits();
        upc.completePayment();
    },

    KXLBuyComplete: false,
    KXLBuyCredits: function(blockid, flash, viewid, clicked, giftids, special, variable_cost_params, item_info)
    {
        this.KXLBuyComplete = false;

        var order_info = {
            blockid : blockid,
            viewid : (viewid ? viewid : 0),
            clicked : (clicked ? clicked : 0),
            giftids : (giftids ? giftids : ''),
            special : (special ? special : ''),
            variable_cost_params : (Object.getLength(variable_cost_params) > 0 ? variable_cost_params : []),
            item_info : (Object.getLength(item_info) > 0 ? item_info : [])
        };

        KXP.frameSendAndReceive('kxlBuyCredits', order_info, function(error, response) {
            cc.KXLBuyCreditsComplete(response);
        } );

        KXP.frameOn('kxlPopupClose', function(error) {
            cc.KXLClose();
        } );
    },

    KXLBuyCreditsComplete: function(response)
    {
        this.KXLBuyComplete = true;
        if (response.status == 'success' && this.getGameSwf())
        {
            this.getCreditBalance(function(data) {
                if (this.flashParam)
                {
                    this.sendToSwf(this.flashParam, {'status':'settled'});
                }
                this.sendToSwf('updateCredits',JSON.encode(data));
            }.bind(this), true);
        }
    },

    KXLClose: function()
    {
        if (this.KXLBuyComplete)
        {
            this.hideTopup();
        }
    },

    paypalFlashParam : null,
    paypalBuyCredits: function(blockid, flash, viewid, clicked, giftids, special, variable_cost_params, item_info)
    {
        this.embeddedPPFlow = new PAYPAL.apps.DGFlow({expType: "instant"});

        var paypalRequestData = {
            blockid : blockid,
            viewid : (viewid ? viewid : 0),
            clicked : (clicked ? clicked : 0),
            giftids : (giftids ? giftids : ''),
            special : (special ? special : ''),
            variable_cost_params : (variable_cost_params ? variable_cost_params : []),
            item_info : (item_info ? item_info : [])
        };
        this.paypalFlashParam = flash;

        this.embeddedPPFlow.startFlow(this.options.localurl + "backend/passtopaypal?data="+JSON.encode(paypalRequestData)+'&'+this.options.fbdata);
    },

    paypalUpdateCredits: function()
    {
        if(this.getGameSwf())
        {
            this.getCreditBalance(function(data){
                if(this.paypalFlashParam)
                {
                    cc.sendToSwf(this.paypalFlashParam, {'status':'settled'});
                }
                cc.sendToSwf('updateCredits',JSON.encode(data));
            }, true);
        }
    },

    ncp: function(method,callback)
    {
        switch(method)
        {
            case 'checkEligibility':
                new Request.JSON({
                    'url':this.options.localurl+'backend/ncp',
                    onSuccess: function(data){
                        if(this.options.game == 'wc')
                        {
                            this.sendToSwf(callback,data.eligible);
                        }
                        else
                        {
                            this.sendToSwf(callback,(data.eligible==1?'1':'0'));
                        }
                        if(data.eligible == 1)
                        {
                            this.logGenericEvent({tag:'ncp',action:'view'},true);
                            this.sendEventDT({tag:'ncp',action:'view'});
                        }
                        else if(data.eligible == 2)
                        {
                            this.logGenericEvent({tag:'ncp',action:'noview'},true);
                            this.sendEventDT({tag:'ncp',action:'noview'});
                        }
                    }.bind(this)
                }).send('method='+method+'&'+this.options.fbdata);
                break;

            case 'showPaymentDialog':
                new Request({
                    'url':this.options.localurl+'backend/ncp',
                    onSuccess: function(){
                        this.buyFbCredits(true,function(data){
                            if(data.credits_sale_status == 'settled')
                            {
                                this.sendToSwf(callback,'1');
                                if(this.options.game == 'bm') this.showTopup();
                                this.logGenericEvent({tag:'ncp',action:'buy'},true);
                                this.sendEventDT({tag:'ncp',action:'buy'});
                            }
                            else this.sendToSwf(callback,'0');
                        }.bind(this));
                        this.logGenericEvent({tag:'ncp',action:'click'},true);
                        this.sendEventDT({tag:'ncp',action:'click'});
                    }.bind(this)
                }).send('method='+method+'&'+this.options.fbdata);
                break;

            case 'userCancelled': case 'itemGiven':
            new Request({
                'url':this.options.localurl+'backend/ncp'
            }).send('method='+method+'&'+this.options.fbdata);
            break;
        }
    },

    clientCallWithCallback: function(callback, function_name, optionalparams)
    {
        switch(function_name)
        {
            case 'playnow':
            case 'ncp':
                cc[function_name](optionalparams['method'], callback);
                break;
            case 'initApplication':
                cc[function_name](optionalparams['version'], callback);
                break;
            case 'showFeedDialog':
                cc[function_name](optionalparams['type'], callback);
                break;
            case 'showTopup':
                optionalparams["callback"] = callback;
                cc[function_name](optionalparams);
                break;
            default:
                break;
        }
    },

    clientLoadCompleteCallback: function()
    {
        this.kxp_callFrameEmit('clientLoadComplete');
        if(typeof this.options.onLoadPopup === 'object')
        {
            switch(this.options.onLoadPopup.type)
            {
                case 'giftedgold':
                    var firstGift = this.options.onLoadPopup.data;
                    cc.showGiftReceivedDialog(firstGift.giftid, firstGift.fromid, firstGift.credits);
                    break;
                case 'usersurvey':
                    var survey = this.options.onLoadPopup.data;
                    cc.checkAndShowUserSurvey(survey.id);
                    break;
                default:
                    break;
            }
        }
    },

    playnow: function(method,callback)
    {
        // set the permissions we're asking for
        var perms = '';
        var step;
        switch(method)
        {
            case 'permRequest1':
                step = 1;
                perms = cc.options.authperms;
                break;

            case 'permRequest2':
                step = 2;
                perms = 'email';
                break;

            default:
                return;
        }

        FB.login(function(response) {
            var data = {};
            if (response.authResponse) {
                FB.api('/me?fields=email,name,link', function(response) {
                    data = response;
                    data.birthday_date = "";
                    data.pic = data.link + "/picture?type=square"
                    console.log('Good to see you, ' + response.name + '.');
                });
                data.step = step;
                data.click = 'allow';
                //console.log(data);

                // if we already have the permissions, the dialog stays
                // open. this will ensure it closes.
                jQuery('.fb_dialog_close_icon').click();

                cc.sendToSwf(callback, data);
            } else {
                data.step = step;
                data.click = 'skip';
                //console.log(data);
                cc.sendToSwf(callback, data);
            }
        }.bind(this), {scope: perms})

    },

    reqNewPerm: false,
    cogFeed: function(action, obj, custom)
    {
        new Request.JSON({
            'url': this.options.localurl+'cog/send',
            onSuccess: function(data)
            {
                if (data.error)
                {
                    var code = (typeof(data.error.code) == 'undefined' ? 0 : data.error.code);
                    if (code === 1)
                    {
                        FB.login(function(response)
                        {
                            if (response)
                            {
                                cc.cogFeed(action, obj, custom);
                            }
                        }, {scope:'publish_actions'});
                    }
                }
            }
        }).send(this.options.fbdata+'&action='+action+'&object='+obj+'&custom='+(typeof(custom) != 'string' ? JSON.encode(custom) : custom));
    },
    fdMask: null,

    feedDialog: null,
    fdCallback: null,
    showingFD: false,
    showFeedDialog: function(type,callback)
    {
        if(!this.inited) return false;

        try {
            if(alliances) {
                alliances.hideAlliancesDialog();
            }
        }
        catch(err) {
            //ignore
        }

        if(!this.inited) return false;
        if(this.showingFD) return false;
        if(this.giftsPopupContainer) return false;
        this.showingFD = true;


        if(this.options.integ == 'kg') return this.kg_showFeedDialog(type,callback);
        if(this.options.integ == 'kxp' && type == 'invite') return this.kxp_showFeedDialog(type,callback);

        if(callback) this.fdCallback = callback;

        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("opened");
        }

        if(!this.feedDialog)
        {
            this.feedDialog = new Element('div',{
                'class': 'feeddialog',
                'styles': {
                    //'left': (($('content').getSize().x-(this.options.game=='wc'?640:724))/2).round()
                    'left': '50%',
                    'margin-left':((this.options.game == 'wc' || this.options.game == 'gp') ? '-320px' : '-362px')
                }
            });

            this.fdMask = new Element('div',{
                'class': 'fd-mask',
                'styles': {
                    'opacity': 0.4
                }
            });
        }

        // If it is in the short invite flow A/B, skip this part
        // else, create the frame for the feeddialog box
        if(this.options.short_invite_flow != 1 || type != 'invite')
        {
            if(this.options.game=='bp'){
                this.feedDialog.grab(
                    new Element('div',{
                        'alt': 'X',
                        'class': 'fd-close'
                    }).addEvent('click',function()
                        {
                            this.hideFeedDialog();
                        }.bind(this)).addEvent('mouseover',function()
                        {
                            this.set('styles',{
                                backgroundPosition:'-16px 32px'
                            });
                        }).addEvent('mouseout',function()
                        {
                            this.set('styles',{
                                backgroundPosition:'-16px 0px'
                            });
                        })
                );
            }
            else if (this.options.game == 'gp')
            {
                this.feedDialog.grab(
                    new Element('div', {
                        'class': 'fd-close'
                    }).addEvent('click', function() {
                            this.hideFeedDialog();
                        }.bind(this))
                );
            }
            else
            {
                this.feedDialog.grab(
                    new Element('img',
                        {
                            'src': this.options.assetsurl+'images/feeddialog/close-button.png',
                            'alt': 'X',
                            'class': 'fd-close'
                        }).addEvent('click',function()
                        {
                            this.hideFeedDialog();
                        }.bind(this))
                );
            }

            this.feedDialog.adopt(
                new Element('div',{
                    'id':'feed-content-wrapper',
                    'class': 'fd-wrapper'
                }),
                new Element('div',{
                    'id':'feed-content',
                    'class': 'fd-content'
                })
            );

            $('content').grab(this.feedDialog);
            $('content').grab(this.fdMask);
        }

        new Request.HTML({
            url: this.options.localurl+'canvas/requestdialog?type='+type+'&'+this.options.fbdata,
            update: $('feed-content')
        }).send();
    },
    checkPermissionAndInvite: function() {
        if(cc.options.declinedpermissions == '') {
            cc.showFeedDialog('invite');
        } else {
            FB.login(function (response) {
                if (response.status === 'connected') {
                    cc.options.declinedpermissions = '';
                    cc.showFeedDialog('invite');
                }
            }, {scope: cc.options.declinedpermissions, auth_type: 'rerequest'});
        }
    },

    giftsPopupContainer: null,
    showGiftsDialog: function(type,callback)
    {
        if(!this.inited) return false;
        if(this.showingFD) return false;
        if(this.giftsPopupContainer) return false;

        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("opened");
        }

        (function($) {
            if(!this.giftsPopupContainer) {
                this.giftsPopupContainer = $('<div />');
                this.giftsPopupContainer.css(
                    {
                        'position':'absolute',
                        'top':'0px',
                        'left':'0px',
                        'width':this.options.game_width,
                        'height':this.options.game_height,
                        'overflow':'visible',
                        'z-index':'1337'
                    });
            }

            post_str = "";
            $.post(this.options.localurl+'canvas/requestdialog?type='+type+'&'+this.options.fbdata, post_str, function(data)
            {
                this.giftsPopupContainer.html(data);
            }.bind(this));

            $('#content').append(this.giftsPopupContainer);

        }.bind(this))(jQuery);
    },

    hideGiftsDialog: function()
    {
        if(this.giftsPopupContainer) {
            if (typeof(this.giftsPopupContainer.remove) == 'function') // handle jQuery object
            {
                this.giftsPopupContainer.html('').remove();
            }
            else
            {
                this.giftsPopupContainer.dispose().empty();
            }
        }

        this.giftsPopupContainer = null;

        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("closed");
        }
    },

    hideFeedDialog: function(result,type,ku,recipients,splitid)
    {
        if(!this.showingFD) return false;
        if (typeof(this.feedDialog.remove) == 'function') // handle jQuery object
        {
            this.feedDialog.set('html', '').remove();
            this.fdMask.set('html', '').remove();
        }
        else
        {
            this.feedDialog.dispose().empty();
            this.fdMask.dispose();
        }
        this.showingFD = false;
        if(this.fdCallback)
        {
            this.sendToSwf(this.fdCallback,JSON.encode({"success":(result?1:0)}));
            this.fdCallback = null;
        }
        //if($defined(type) && $defined(ku) && $defined(recipients) && $defined(splitid)) this.recordFeed(type,ku,recipients,splitid);

        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("closed");
        }
    },

    switchFeedDialog: function(type,callback)
    {
        this.hideFeedDialog();
        this.showFeedDialog(type,callback);
    },

    vx_showInvite: function(callback)
    {
        this.viximo.Container.friends_invite({
            success: function(){
                this.showingFD = false;
                if($defined(callback)) this.sendToSwf(callback,JSON.encode({"success":1}));
            }.bind(this),
            close: function(){
                this.showingFD = false;
                if($defined(callback)) this.sendToSwf(callback,JSON.encode({"success":0}));
            }.bind(this),
            title: 'Invite 12 Friends',
            content: 'Play Backyard Monsters with me and I will help make your base as awesome as mine.',
            type: 'awesome',
            acceptlabel: 'Play'
        });
    },

    kg_showFeedDialog: function(type,callback)
    {
        if(callback) this.fdCallback = callback;
        if(!this.feedDialog)
        {
            this.fdMask = new Element('div',{'class': 'fd-mask','styles':{'opacity': 0.4}});
            this.feedDialog = new Element('div',{'class':'feeddialog','styles':{'position':'absolute','top':10,'left':((this.options.game_width-724)/2).round(),'width':724,'height':467,'overflow':'visible','background':'url(\''+this.options.cdnurl+'images/feeddialog/outside3.png\') no-repeat','padding':'10px 0 0 11px'}});
        }
        this.feedDialog.adopt(
            new Element('img',{src:this.options.cdnurl+'images/close2.png',styles:{width:33,height:33,cursor:'pointer',position:'absolute',top:0,right:18,'z-index':9}}).addEvent('click',function(){ this.hideFeedDialog(); }.bind(this)),
            new Element('div',{styles:{'background-color':'#DBB47C','position':'absolute','top':25,'left':30,'width':665,'height':416,'z-index':1}}),
            new Element('iframe',{
                'src': this.options.localurl+'canvas/feeddialog?type='+type+'&'+this.options.fbdata,
                'class': 'fd-container',
                'styles': {'width':665,'min-height':420,'border':0,'background-color':'transparent','z-index':2,'position':'absolute','top':25,'left':30},
                'scrolling': 'no',
                'frameborder': 0
            })
        );
        $('content').grab(this.feedDialog);
        $('content').grab(this.fdMask);
    },

    kxp_showFeedDialog: function(type,callback)
    {
        var self = this;

        if(type == 'invite')
        {
            self.showingFD = false;

            var data = {
                'from_app' : self.options.app_id
            };
            KXP.frameSendAndReceive('sendinvite',data);

            KXP.frameOn('invitesent', function(error,res)
            {
                self.showingFD = false;
                var props = {
                    'tag':'invite_send',
                    'action':'send',
                    'category':'communication',
                    'user_install_type':'secondary_direct',
                    'gift_type':'',
                    'recipient_count':res.kxids.length,
                    'ids':res.kxids.join(','),
                    'link_location':'invitafriend',
                    'unique_id':''
                };

                this.logGenericEvent(props);
                this.sendEventDT(props);
            }.bind(this));
        }
    },

    kg_statsUpdate: function(stats)
    {
        for (var stat in stats)
        {
            this.getKgApi().stats.submit(stat,stats[stat]);
        }
    },

    /**
     * @function cc.fbNewRequest
     * @param {message} arg1  The message to be included in the request
     * @param {filters} arg2  Can be one of four options: all, app_users,
     * app_non_users or a custom filter. An application can suggest custom
     * filters as dictionaries with a name key and a user_ids key, which
     * respectively have values that are a string and a list of user ids. name
     * is the name of the custom filter that will show in the selector. user_ids
     * is the list of friends to include, in the order they are to appear. (More
     * info here: http://fbdevwiki.com/wiki/FB.ui)
     * @param {callbacks} arg3 (Optional) Contains one or both object indexes
     * of: success or fail that contain functions for what to do when this
     * function returns
     * @param {trackData} arg4  Contains a tracking string
     * @param {exclude_ids} arg5  A list of fbids to not display in the friend
     * selector
     **/
    fbNewRequest: function(message,filters,callbacks,trackData,excludeIds)
    {
        if (typeof(filters) != 'string' && typeof(filters) != 'object') return false; // Invalid filter type(s)
        if (!FB) return false; // FB JS SDK not initilized.

        FB.ui({
                method: 'apprequests',
                message: message,
                filters: filters,
                data: trackData,
                exclude_ids: excludeIds
            },
            function(response)
            {
                if (!callbacks) return;

                if (response && response.request_ids)
                {
                    if (typeof(callbacks.success) == 'function')
                    {
                        callbacks.success(response.request_ids);
                    }
                }
                else if(response && response.request && response.to)
                {
                    if (typeof(callbacks.success) == 'function')
                    {
                        callbacks.success(response.request,response.to);
                    }
                }
                else
                {
                    if (typeof(callbacks.fail) == 'function')
                    {
                        callbacks.fail(response);
                    }
                }
            });

        return true;
    },

    streamPublish: function(ident,name,caption,image,targetid,actiontext,flash,callback,ref)
    {
        if(!ident || !name || !image) return false;

        var user = this.user;
        var ku = this.uniqueRef();

        var trkurl = this.options.baseurl+'track?fid='+user.id+'&from=stream-'+ident+'&ku='+ku+'&st1='+ident;
        var action_links = [{'href':trkurl,'text':(actiontext?actiontext:'Play now!')}];

        if(this.options.integ == 'kg')
        {
            caption = caption.replace(/#fname#/g,this.options.jflashvars.fb_kongregate_username).replace(/#lname#/g,'');

            if (caption === '' || caption === null)
            {
                caption = name.replace(/#fname#/g,this.options.jflashvars.fb_kongregate_username).replace(/#lname#/g,'');
            }
        }

        name = name.replace(/#fname#/g,user.first_name).replace(/#lname#/g,user.last_name);
        caption = caption.replace(/#fname#/g,user.first_name).replace(/#lname#/g,user.last_name);

        var media = null;
        if(flash) media = [{'type':'flash','imgsrc':this.options.cdnurl+'images/feed/'+image,'swfsrc':this.options.cdnurl+'flash/feed/'+flash,'width':87,'height':87,'expanded_width':450,'expanded_height':200}];
        else media = [{'type':'image','src':this.options.assetsurl+'images/feeddialog/'+image,'href':trkurl}];

        var attachment = {
            'name':name,
            'href':trkurl,
            'caption':caption,
            'media':media
        };

        var feed_args = {};
        if(this.options.integ == 'fbg')
        {

            feed_args = {
                method: 'feed',
                name: name,
                link: trkurl,
                picture: media[0].src,
                caption: caption,
                description: ' ',//weird. without description it's working fine in live.
                message: '',
                to: targetid
            };

            FB.ui(feed_args,
                function(response)
                {
                    if(response && response.post_id)
                    {
                        new Request({url:this.options.localurl+'backend/recordsendfeed'}).send('ident='+ident+'&spid='+ku+'&name='+name+'&'+this.options.fbdata);
                        this.recordKontagent('pst',{tu:'stream',u:ku,st1:ident});
                        if(callback) callback(true);
                    }
                    else if(callback) callback(false);
                }.bind(this)
            );
        }
        else if(this.options.integ == 'kxp')
        {
            if (!targetid)
            {
                targetid = 'friends';
            }

            var params = this.options.fbdata.parseQueryString();

            feed_args = {
                type: 'brag',
                toid: targetid,
                message: '',
                headers: JSON.encode({
                    name: name,
                    picture: media[0].src,
                    caption: caption
                }),
                'kixigned_request': params['signed_request']
            };

            new Request({url:'/live/sendmsg',data:feed_args}).send();
        }
        else if(this.options.integ == 'kg')
        {
            this.getKgApi().services.showShoutBox(caption);
        }
    },

    vx_streamPublish: function(ident,name,caption,image,targetid,actiontext,flash)
    {
        this.viximo.Container.streamPublish({
            'type': 'activity',
            'message': name,
            'attachment': {
                'caption': '',
                'description': caption,
                'media': {
                    'type': 'image',
                    'src': this.options.assetsurl+'images/feeddialog/'+image
                }
            },
            'action_links': [{
                'text': 'Play Now!'
            }],
            'complete': function(){  }
        });
    },

    vx_sendGiftMessage: function(name,caption,image,targets,hidefd)
    {
        this.viximo.Container.streamPublish({
            'target': targets,
            'type': 'message',
            'message': name,
            'attachment': {
                'caption': '',
                'description': caption,
                'media': {
                    'type': 'image',
                    'src': this.options.cdnurl+'images/feed/'+image
                }
            },
            'action_links': [{
                'text': 'Play Now!'
            }],
            'complete': function(){  }
        });
        if(hidefd) this.hideFeedDialog(true);
    },



    noPayments: function()
    {
        alert("Facebook Credit spending is disabled on the Preview Server");
        return false;
    },

    showTopup: function(params)
    {
        if(this.options.game == 'wc' && this.options.preview_server == 1)
        {
            return this.noPayments();
        }

        try {
            alliances.hideAlliancesDialog();
        }
        catch(err) {
            //ignore
        }

        if(!params) params = {};

        this.kxp_callFrameEmit('topupShown', params);
        if(this.options.integ == 'kg') return this.kg_showTopup();
        else if(this.options.integ == 'fbg') return this.fb_showTopup(params);
        else if(this.options.integ == 'kxp') return this.fb_showTopup(params);
        else this.navTo('topup');
    },

    hideTopup: function()
    {
        if(this.options.integ == 'fbg') return this.fb_hideTopup({});
        else if(this.options.integ == 'kxp') return this.kxp_hideTopup({});
    },

    showGiftGoldConfirmDialog: function(userids, blockid, msg)
    {
        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("opened");
        }

        (function($) {
            if(!this.fbTopupContainer) {
                this.fbTopupContainer = $('<div />');
                this.fbTopupContainer.css(
                    {
                        'position':'absolute',
                        'top':'0px',
                        'left':'0px',
                        'width':this.options.game_width,
                        'height':this.options.game_height,
                        'overflow':'visible',
                        'z-index':'1337'
                    });
            }

            post_str = "";
            post_str += "blockid="+blockid+"&";
            post_str += "userids="+userids.join()+"&";
            post_str += "msg="+encodeURIComponent(msg)+"&";
            post_str += this.options.fbdata;

            $.post(this.options.localurl+'canvas/giftgoldconfirm', post_str, function(data)
            {
                this.fbTopupContainer.html(data);
            }.bind(this));
            $('#content').append(this.fbTopupContainer);
        }.bind(this))(jQuery);
    },

    showFriendSelectGiftGoldDialog: function(blockid, userids, msg)
    {
        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("opened");
        }

        (function($) {
            if(!this.fbTopupContainer) {
                this.fbTopupContainer = $('<div />');
                this.fbTopupContainer.css(
                    {
                        'position':'absolute',
                        'top':'0px',
                        'left':'0px',
                        'width':this.options.game_width,
                        'height':this.options.game_height,
                        'overflow':'visible',
                        'z-index':'1337'
                    });
            }

            post_str = "";
            post_str += "blockid="+blockid+"&";
            post_str += "selected_userids="+userids+"&";
            post_str += "msg="+encodeURIComponent(msg)+"&";
            post_str += this.options.fbdata;

            $.post(this.options.localurl+'canvas/giftgoldfriendselect', post_str, function(data)
            {
                this.fbTopupContainer.html(data);
            }.bind(this));

            $('#content').append(this.fbTopupContainer);

        }.bind(this))(jQuery);
    },

    showGiftReceivedDialog: function(giftid, senderid, credits)
    {
        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("opened");
        }

        if(!cc.fbTopupContainer)
        {
            cc.fbTopupContainer = jQuery('<div />');
            cc.fbTopupContainer.css(
                {
                    'position':'absolute',
                    'top':'0px',
                    'left':'0px',
                    'width':cc.options.game_width,
                    'height':cc.options.game_height,
                    'overflow':'visible',
                    'z-index':'1337'
                });

            post_str = "";
            post_str += "giftid="+giftid+"&";
            post_str += "senderid="+senderid+"&";
            post_str += "credits="+credits+"&";
            post_str += cc.options.fbdata;

            jQuery.post(cc.options.localurl+'canvas/giftedgoldreceived', post_str, function(data)
            {
                cc.fbTopupContainer.html(data);
            }.bind(cc));
            jQuery('#content').append(cc.fbTopupContainer);
        }
    },

    userSurveyContainer: null,
    userSurveyShowing: false,
    checkAndShowUserSurvey: function(survey_id) {
        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("opened");
        }
        if(!this.userSurveyContainer)
        {
            this.userSurveyContainer = jQuery('<div />');
            this.userSurveyContainer.css(
                {
                    'position':'absolute',
                    'top':'0px',
                    'left':'0px',
                    'width':cc.options.game_width,
                    'height':cc.options.game_height,
                    'overflow':'visible',
                    'z-index':'1337'
                });

            post_str = "";
            post_str += "survey_id="+survey_id+"&";
            post_str += this.options.fbdata;

            jQuery.post(this.options.localurl+'canvas/usersurvey', post_str, function(data)
            {
                this.userSurveyContainer.html(data);
                this.userSurveyShowing = true;
            }.bind(cc));
            jQuery('#content').append(this.userSurveyContainer);
        }
    },

    hideUserSurvey: function ()
    {
        if(this.userSurveyContainer) {
            if (typeof(this.userSurveyContainer.remove) == 'function') // handle jQuery object
            {
                this.userSurveyContainer.html('').remove();
            }
            else
            {
                this.userSurveyContainer.dispose().empty();
            }
        }

        this.userSurveyContainer = null;
        this.userSurveyShowing = false;

        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("closed");
        }
    },

    hideGiftGoldDialog: function()
    {
        if(this.fbTopupContainer) {
            if (typeof(this.fbTopupContainer.remove) == 'function') // handle jQuery object
            {
                this.fbTopupContainer.html('').remove();
            }
            else
            {
                this.fbTopupContainer.dispose().empty();
            }
        }

        this.fbTopupShowing = false;
        this.fbTopupContainer = false;

        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("closed");
        }
    },

    getTopupCallback: function()
    {
        if($defined(this[this.options.integ+'TopupCallback'])) return this[this.options.integ+'TopupCallback'];
    },

    fbTopupContainer: null,
    fbTopupShowing: false,
    fbTopupCallback: null,
    fbIsDGP: null,
    dgpSuccess: 0,
    fb_showTopup: function(params)
    {
        if(this.fbTopupShowing) return false;
        this.fbTopupShowing = true;

        if(params.callback) this.fbTopupCallback = params.callback;
        if(params.dgp == 1 && !params.credits_deficient) this.fbIsDGP = 1;

        if(params.type == 'offers') this.fb_showTopupOffers(params);
        else if(params.type == 'daily') this.fb_showTopupDaily(params);
        else this.fb_showTopupFbc(params);
    },

    fb_showTopupFbc: function(params)
    {
        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("opened");
        }

        var pu;
        if(params.special == 'gift') {
            pu = {
                height:368,
                width:488,
                background:'url(\''+this.options.cdnurl+'images/topup/promotion/giftbg.png\') no-repeat'
            };
        }
        else {
            pu = {
                height:331,
                width:484,
                background:'url(\''+this.options.cdnurl+'images/topup/popupbg5.png\') no-repeat'
            };
        }

        (function($) {
            if(!this.fbTopupContainer) {
                this.fbTopupContainer = $('<div />');
                this.fbTopupContainer.css(
                    {
                        'position':'absolute',
                        'top':'0px',
                        'left':'0px',
                        'width':this.options.game_width,
                        'height':this.options.game_height,
                        'overflow':'visible',
                        'z-index':'1337'
                    });
            }

            if(this.options.game == 'bm'){
                this.fbTopupContainer.append('<div />');

                var innerContainer = this.fbTopupContainer.children('div:last');

                innerContainer.addClass('topup-popup').css({
                    'position':'relative',
                    'margin-top':'10px',
                    'margin-left':'auto',
                    'margin-right':'auto',
                    'width':pu.width,
                    'height':pu.height,
                    'overflow':'visible',
                    'background':pu.background,
                    'padding':'10px 0 0 11px'
                });

                innerContainer.append('<a />');
                innerContainer.children('a:last').attr(
                    {
                        'href':'javascript:void(0);'
                    }).css(
                    {
                        width:25,
                        height:25,
                        cursor:'pointer',
                        display:'block',
                        position:'absolute',
                        top:0,
                        right:18,
                        border:0,
                        'z-index':11
                    }).click(function()
                    {
                        this.hideTopup();
                    }.bind(this));

                innerContainer.append('<div />');
                innerContainer.children('div:last').attr({'id':'topup-popup-content'}).css(
                    {
                        height: 195,
                        left: 33,
                        position: 'absolute',
                        top: 60,
                        width: 420,
                        'z-index': 10
                    });
            }

            post_str = "";
            if(params.gift_only == 1) post_str += "gift_only=1&";
            if(params.special) post_str += "special="+params.special+"&";

            if(params.credits_deficient > 0) post_str += "credits_deficient="+params.credits_deficient+"&";
            else if(params.dgp == 1) post_str += "dgp="+params.dgp+"&";

            if(params.item_info)
            {
                if(typeof(params.item_info)=='string')
                {
                    post_str += "item_info="+params.item_info+"&";
                }
                else
                {
                    post_str += "item_info="+JSON.encode(params.item_info)+"&";
                }
            }
            if(params.header_copy) post_str += "header_copy="+params.header_copy+"&";
            if(params.purchase_guid) post_str += "purchase_guid="+params.purchase_guid+"&";
            post_str += this.options.fbdata;

            $.post(this.options.localurl+'canvas/topuppopup', post_str, function(data)
            {
                if(this.options.game=='bm'){
                    $('#topup-popup-content').html(data);
                } else {
                    this.fbTopupContainer.html(data);
                }
            }.bind(this));

            /*
             $.get(this.options.localurl+'canvas/topuppopup?&'+this.options.fbdata, function(data)
             {
             $('#topup-popup-content').html(data);
             }.bind(this));
             */

            $('#content').append(this.fbTopupContainer);
        }.bind(this))(jQuery);
    },

    fb_showTopupOffers: function(params)
    {
        TRIALPAY.fb.show_overlay(this.options.app_id,
            'fbdirect',
            { currency_url: this.options.localurl+'payments/facebook/tpinfo',
                tp_vendor_id: this.options.tp_vendor_id,
                callback_url: this.options.localurl+'payments/facebook/trialpay',
                sid: this.options.tpid,
                zIndex: 2000,
                onClose: this.hideTopup.bind(this,{'showTopup':true,'params':params})
            });
    },

    fb_showTopupDaily: function(params)
    {
        TRIALPAY.fb.show_overlay(this.options.app_id,
            'fbpayments',
            { currency_url: this.options.localurl+'payments/facebook/tpinfo',
                tp_vendor_id: this.options.tp_vendor_id,
                callback_url: this.options.localurl+'payments/facebook/trialpay',
                dealspot:1,
                sid: this.options.tpid,
                onClose: this.hideTopup.bind(this,{'showTopup':true,'params':params})
            });
    },

    fb_hideTopup: function(params)
    {
        if(this.fbTopupContainer) {
            if (typeof(this.fbTopupContainer.remove) == 'function') // handle jQuery object
            {
                this.fbTopupContainer.html('').remove();
            }
            else
            {
                this.fbTopupContainer.dispose().empty();
            }
        }

        this.fbTopupShowing = false;

        if(params.showTopup)
        {
            params.params.type = 'fbc';
            this.fb_showTopup(params);
        }
        else if(this.fbTopupCallback)
        {
            if(this.fbIsDGP == 1)
            {
                this.sendToSwf(this.fbTopupCallback, this.dgpSuccess);
            }
            else if(!params.skip_cancelled)
            {
                this.sendToSwf(this.fbTopupCallback,JSON.encode({'status':'canceled'}));
            }
            else
            {
                this.sendToSwf(this.fbTopupCallback,JSON.encode({'status':'processing'}));
            }
        }

        if(this.options.hide_game_wmode)
        {
            this.processFlashHiding("closed");
        }
    },

    kxp_hideTopup: function(params)
    {
        if (this.upayCredits !== null)
        {
            // If we're closing the topup and the upay box is open, close it
            this.upayCredits.closeLightbox({"forceCloseLB" : true});

            // If the payment was completed already, skip the cancel call
            if (this.upayCredits.paymentSuccessful)
            {
                params.skip_cancelled = true;
            }
        }
        this.fb_hideTopup(params);
    },

    kxp_callFrameEmit: function(eventName, paramsObject)
    {
        if (typeof KXP !== 'undefined')
        {
            KXP.frameEmit(eventName,paramsObject);
        }
    },

    vx_showTopup: function()
    {
        this.viximo.Container.currency_makeTransfer({
            success: function(data){
                //this.sendToSwf('callbackshiny',JSON.encode({credits:data.amount}));
                location.reload();
            }.bind(this),
            close: function(){}
        });
    },

    topupPopup: null,

    kg_showTopup: function(cartArray)
    {
        if (!cartArray) { this.giveKgTopupPopup(); return; }
        this.getKgApi().mtx.purchaseItems(cartArray, cc.kg_onPurchaseResult.bind(this));

    },

    kg_onPurchaseResult: function(result)
    {
        if (result.success)
        {
            new Request.JSON({
                url: this.options.localurl+'backend/redeemKgItems',
                onSuccess: function(data)
                {
                    this.kgHideShinyDialog();

                    if($type(data) != 'object')
                    {

                    }
                    else if(data.error)
                    {

                    }
                    else if(data.credits)
                    {
                        var updateCredits = function(){
                            cc.sendToSwf('updateCredits',JSON.encode(data));
                        };
                        setTimeout(updateCredits,7500);
                    }
                }.bind(this)
            }).send(this.options.fbdata);
        }
    },

    topupFunds: function()
    {
        this.hideTopup();
        this.showTopup();
        this.showBuyCoins();
    },
    vx_getFriends: function(callback)
    {
        this.viximo.API.friends_get(function(data){
            var out = [];
            if($type(data) == 'array' || data.length > 0)
            {
                data.each(function(v){ out.push(v); });
            }
            this.options.friends = out;
            callback(out);
        }.bind(this));
    },
    vx_getUserData: function(callback)
    {
        this.viximo.API.users_getCurrentUser(function(data){
            if($type(data) != 'object') data = {};
            else data.first_name = data.name.split(' ')[0];
            this.options.userdata = data;
            this.addToUser(data);
            if($type(callback) == 'function') callback(data);
        }.bind(this));
    },
    //http://www.kongregate.com/api/user_info.json?username=Casualcollective&friends=true
    kg_getUserName: function(callback)
    {
        this.getKgApi().services.getUsername();
    },
    kg_getUserData: function(callback)
    {
        new Request.JSONP({'url':'http://www.kongregate.com/api/user_info.jsonp?user_id='+this.fbid+'&friends=true',
            onSuccess: function(data)
            {

            }.bind(this)
        }).send();
    },

    navTo: function(page,absolute)
    {
        window.top.location = (absolute?'':this.options.baseurl)+page;
    },

    reloadParent: function()
    {
        var dest = this.options.baseurl;
        var loc = location.href.replace(/\/$/,'').replace('http://','').replace('https://','');
        if(loc.indexOf('/') > -1)
        {
            loc = location.href.split('/');
            loc = loc[loc.length-1];
            dest += loc;
        }
        window.top.location = dest;
    },

    showRating: function()
    {
        this.navTo('https://www.facebook.com/apps/application.php?id='+this.options.app_id+'&v=app_6261817190',true);
    },

    showSrOverlay: function(callback)
    {
        adk.interstitial.prototype.displayModal('content','oydikdq.72572890927',this.fbid,true,null,function(){
            if(callback)
            {
                this.sendToSwf(callback);
            }
        }.bind(this));
    },

    showEvent: function(id)
    {
        this.navTo('https://www.facebook.com/event.php?eid='+(id?id:142016142510717),true);
    },

    uniqueRef: function()
    {
        return (this.fbid+(new Date().getTime())).toString().toMD5().substr(0,16);
    },

    // kixeye internal logging.
    // no t param as we record server time and not client time
    // called from flash client during install
    recordKxLogger: function(props)
    {
        var params = '';
        if($type(props) == 'object')
        {
            var rprops = new Hash(props);
            rprops.extend({
                s: this.fbid
            });
            params = rprops.toQueryString();
        }

        this.callUrl(this.options.kx_logger_url+'?key='+this.options.kx_logger_key+'&'+params);
    },

    recordKontagent: function(type,props)
    {
        // only bym is recording w/ kontagent
        if(this.options.kontagent_enabled !== true)
        {
            return;
        }

        var params = '';
        if($type(props) == 'object')
        {
            var rprops = new Hash(props);
            rprops.extend({
                s: this.fbid,
                t: parseInt(new Date().getTime()/1000,10)
            });
            params = rprops.toQueryString();
        }
        this.callUrl(this.options.kontagent_url+'api/v'+this.options.kontagent_api_version+'/'+this.options.kontagent_api_key+'/'+type+'/'+(params?'?'+params:''));
    },

    recordEvent: function(name,props)
    {
        var rprops = {};
        if($type(props) == 'object')
        {
            rprops = {
                n: name
            };
            if(props.level) rprops.l = props.level;
            if(props.value) rprops.v = props.value;
            if(props.n1) rprops.n1 = props.n1;
            if(props.n2) rprops.n2 = props.n2;
            if(props.n3) rprops.n3 = props.n3;
            if(props.n4) rprops.n4 = props.n4;
            if(props.n5) rprops.n5 = props.n5;
            if(props.st1) rprops.st1 = props.st1;
            if(props.st2) rprops.st2 = props.st2;
            if(props.st3) rprops.st3 = props.st3;
            if(props.json) rprops.json = props.json;
        }
        this.recordKontagent('evt',rprops);
    },

    recordFeed: function(type,ku,recipients,splitid)
    {
        var r = '';
        recipients.each(function(v){ r += ','+v; });
        r = r.substr(1);
        var props = {r:r,u:ku};
        if(type == 'gift') props.st1 = 'gift';
        if(type == 'invite') props.st1 = splitid;
        this.recordKontagent((type=='invite'?'ins':'nts'),props);
    },

    callUrl: function(src)
    {
        return this.callUrlImg(src); // Use image injection
        //try
        //{
        //	new Request.JSONP({
        //		'url': src,
        //		callbackKey: 'jsoncallback'
        //	}).send();
        //} catch(e){}
    },

    callUrlAjax: function(src){
        try{
            new Request({url: src}).send();
        } catch(e){}
    },

    callUrlImg: function(src)
    {
        var img = new Image();
        img.src = src;
        (function(){ try { img.destroy(); } catch(e) {} }).delay(60000);
    },

    recordUserInfo: function()
    {
        var userdata = this.getUserData();
        var friends = this.getAppFriends();
        var props = {};

        if($type(friends) == 'array') props.f = friends.length;
        if($type(userdata) == 'object')
        {
            var sex = userdata.sex.toLowerCase();
            if(sex == 'female' || sex == 'f') props.g = 'female';
            else props.g = 'male';

            var bday = userdata.birthday_date;
            if(bday && bday != 'null' && (bday.length-bday.replace('/','').length) == 2)
            {
                var year = bday.substr(-4,4);
                props.b = year;
            }
        }

        this.recordKontagent('cpu',props);
    },

    openingBase: false,
    openBase: function(baseid)
    {
        if(this.options.game == 'bm')
        {
            if(this.openingBase) return false;
            this.openingBase = true;

            new Request.JSON({url:this.options.localurl+'backend/locatebase',
                onSuccess: function(data)
                {
                    if(data.baseid || data.userid || data.userid === 0)
                    {
                        this.sendToSwf('openbase',JSON.encode(data));
                    }
                }.bind(this),
                onComplete: function()
                {
                    (function(){ this.openingBase = false; }.bind(this)).delay(2000);
                }.bind(this)
            }).send('userid='+baseid+'&'+this.options.fbdata);
        }
        else this.sendToSwf('openbase',baseid);
    },
    openLeaderBase: function(userid, baseid)
    {
        if(this.options.game == 'bm' || this.options.game == 'wc')
        {
            new Request.JSON({url:this.options.localurl+'backend/locatebase',
                onSuccess: function(data)
                {
                    if(data.baseid || data.userid || data.userid === 0)
                    {
                        data.viewleader = 1;
                        this.sendToSwf('openbase',JSON.encode(data));
                    }
                }.bind(this)
            }).send('userid='+userid+'&'+this.options.fbdata);
        }
        else {
            this.sendToSwf('openbase',baseid);
        }
    },

    adminTakeover: function(x,y)
    {
        $('adminTakeoverX').set('disabled',true);
        $('adminTakeoverY').set('disabled',true);
        $('adminTakeoverSubmit').set('disabled',true).set('text','Taking...');
        new Request.JSON({url:this.options.localurl+'worldmapv2/pilferoutpost',
            onSuccess: function(data)
            {
                $('adminTakeoverX').set('disabled',false).set('value','');
                $('adminTakeoverY').set('disabled',false).set('value','');
                $('adminTakeoverSubmit').set('disabled',false).set('text','Take');
            }.bind(this)
        }).send('x='+x+'&y='+y+'&'+this.options.fbdata);
    },

    getCreditBalance: function(callback,returnHashedData)
    {
        if(!callback) return false;
        new Request.JSON({
            url: this.options.localurl+'backend/getcreditbalance',
            onSuccess: function(data){
                if(returnHashedData) callback(data);
                else
                {
                    var credits = false;
                    if(data.credits) credits = data.credits;
                    callback(credits);
                }
            }.bind(this)
        }).send(this.options.fbdata);
    },

    pad: function(num, count)
    {
        var lenDiff = count - String(num).length;
        var padding = "";

        if (lenDiff > 0)
            while (lenDiff--)
                padding += "0";

        return padding + num;
    },

    getPmsPixels: function(action, additionalPostData)
    {
        if (typeof pmsurl === 'undefined')
        {
            return;
        }
        if(pmsurl === "")
        {
            return;
        }

        var post_data = 'game='+this.options.game+'&user_fbid='+this.options.user.fbid+'&user_tpid='+this.user.tpid+'&userid='+this.options.user.id+'&event_type='+action+'&from_string='+this.options.fromstr;
        if (additionalPostData != "") {
            post_data += "&"+additionalPostData;
        }

        var myRequest = new Request.JSONP({
            url: pmsurl+"pms/getpixels?" + post_data,
            callbackKey: 'jsoncallback',
            onComplete: function(data)
            {
                for(i = 0; i < data.length; i++)
                {
                    cc.callUrl(data[i]);
                }
            }
        }).send();
    },

    postBuyPixels: function(amount)
    {
        var date = new Date(cc.options.installts*1000);
        var year = date.getFullYear();
        var month = this.pad((date.getMonth()+1),2);
        var day = this.pad(date.getDate(),2);

        // the amount in USD post Facebook tax
        amountUSD = (amount.amount * 0.1) * 0.7;

        var apsource = cc.options.fromstr.substr(0,6);
        if (apsource == "fbbpap")
        {
            this.callUrl("https://fbads.adparlor.com/Engagement/action.php?id=311&adid=545&vars=7djDxM/P1uDV4OfKs7SxjdbV1ObN4ebE3NXXz9jPwtjg1OTE58XK0Nni1Ky6vp7X3tnWwtbkwNrb5OTYs5aO1tfVtOfOqcuqzA==&subid="+amount.amount+"&action_date="+year+"-"+month+"-"+day);
        }
        if (apsource == "fbbpsp")
        {
            if(this.options.adid!=-1)
                this.callUrl("http://bp-pixel.socialcash.com/100560/pixel.ssps?spruce_adid="+this.options.adid+"&spruce_sid="+this.user.tpid+"&amt="+amount.amount+"&spruce_pixelid=2");
        }
        if (apsource == "fbwcsp")
        {
            if(this.options.adid!=-1)
                this.callUrl("http://bp-pixel.socialcash.com/100571/pixel.ssps?spruce_adid="+this.options.adid+"&spruce_sid="+this.user.tpid+"&spruce_pixel_value="+amount.amount+"&spruce_pixelid=2");
        }
        if (apsource == "fbwcad")
        {
            if(this.options.adid!=-1)
                this.callUrl("http://s.inst.adotomi.com/cb/8-10023588_10-3.6334a?ifcontext="+this.options.adid+"&order_id="+this.user.tpid+"&amount="+amountUSD+"&currency=USD");
        }
        if (this.options.fromstr.substr(0,8) == "fbwcdqna")
        {
            this.callUrl("https://adsimilis.go2jump.org/GL1UY");
        }
    },

    postTutorialPixels: function()
    {
        this.getPmsPixels("Tutorial", "");

        var apsource = cc.options.fromstr.substr(0,6);
        if (apsource == "fbbpsp")
        {
            if(this.options.adid!=-1)
                this.callUrl("http://bp-pixel.socialcash.com/100560/pixel.ssps?spruce_adid="+this.options.adid+"&spruce_sid="+this.user.tpid+"&spruce_pixelid=1");
        }
        if (apsource == "fbwcsp")
        {
            if(this.options.adid!=-1)
                this.callUrl("http://bp-pixel.socialcash.com/100571/pixel.ssps?spruce_adid="+this.options.adid+"&spruce_sid="+this.user.tpid+"&spruce_pixelid=1");
        }
        if (apsource == "fbwcad")
        {
            if(this.options.adid!=-1)
                this.callUrl("http://s.inst.adotomi.com/cb/8-10023586_10-3.01c7e?ifcontext="+this.options.adid+"&order_id="+this.user.tpid);
        }
        if (this.options.fromstr.substr(0,8) == "fbwcdqna")
        {
            this.callUrl("https://adsimilis.go2jump.org/GL1Uk");
        }
    },

    checkTopupGift: function()
    {
        new Request({
            url: this.options.localurl+'backend/checktopupgift',
            onSuccess: function(data)
            {
                var obj = JSON.decode(data);
                if(obj.error === 0) this.sendToSwf('purchaseReceive',data);
                else this.checkTopupGift.delay(30000,this);
            }.bind(this)
        }).send(this.options.fbdata);
    },

    startPromoTimer: function(params)
    {
        new Request.JSON({
            url: this.options.localurl+'backend/startpromotimer',
            onSuccess: function(data)
            {
                if(data.endtime) this.sendToSwf(params.callback,JSON.encode(data));
            }.bind(this)
        }).send(this.options.fbdata);
    },

    recordStats: function(event)
    {
        this.logLoadEvent(event);
        //try{
        //	var flashver = FlashDetect.major + '.' + FlashDetect.minor;
        //	new Request({
        //		url: this.options.localurl+'backend/recordstats'
        //	}).send(this.options.fbdata+'&event='+event+'&loadid='+loadid+'&flashver='+flashver);
        //} catch(e){}
    },

    log: function(data)
    {
        try{
            if(window.console) console.log(data);
        } catch(e){}
    },

    alDialog: false,
    alView: null,
    showAttackLog: function(view)
    {
        if(!this.inited) return false;
        return this.sendToSwf('showAttackLog');
    },

    lbDialog: false,
    lbShowingID: false,
    showLeaderboard: function(tabid)
    {

        // Append the tabid to the URL, if it exists
        if (! tabid) {
            tabid = 0;
        }

        tabid = { 'tabid': tabid };

        if(!this.inited) return false;
        if(!this.lbDialog)
        {
            var bgimage = 'background.png';
            if(this.options.game == 'wc')
            {
                bgimage = 'background_v2.png';
            }

            this.lbDialog = new ccfDialog({
                'url': this.options.localurl+'backend/getleaderboard',
                'querystring': tabid,
                'props': {
                    'contentWrapper': {
                        'styles': {
                            'background-image': 'url(\''+this.options.cdnurl+'images/leaderboard/'+bgimage+'\')'
                        }
                    }
                },
                'cachecontent': true,
                'cachetimeout': 20,
                'stylesuffix': 'lb'
            });

            if (this.options.game == 'wc' || this.options.game=='bp')
            {
                this.lbDialog.reInit({
                    'showSpinner': true,
                    'remainCentered': true
                });
            }

            this.lbDialog.show();
        }
        else if(this.lbDialog.showing)
        {
            this.lbDialog.loadUrl(this.options.localurl+'backend/getleaderboard', tabid);
        }
        else
        {
            this.lbDialog.reInit({
                'url': this.options.localurl+'backend/getleaderboard',
                'querystring': tabid
            });
            this.lbDialog.show();
        }
    },

    hsDialog: false,
    showHelpScreen: function()
    {
        if(!this.inited) return false;
        if(!this.hsDialog)
        {
            this.hsDialog = new ccfDialog({
                'url': this.options.localurl+'canvas/gethelpscreen',
                'props': {
                    'contentWrapper': {
                        'styles': {
                            'background-image': 'url(\''+this.options.cdnurl+'images/helpscreen_bgv2.png\')'
                        }
                    }
                },
                'cachecontent': true,
                'cachetimeout': 20,
                'stylesuffix': 'hs',
                'onHide': function(){ cc.hsDialog = false; }
            });

            this.hsDialog.show();
        }
    },

    reloadingCSS: false,
    reloadCSS: function()
    {
        if(this.reloadingCSS) return false;
        this.reloadingCSS = true;

        var url = $('style-default').get('href').replace(/v[0-9]+\./,'v'+Math.round(Math.random()*100000)+'.');
        $$('head')[0].grab(
            newel = new Element('link',{
                'rel': 'stylesheet',
                'type': 'text/css',
                'href': url
            })
        );

        (function(){
            $('style-default').destroy();
            newel.set('id','style-default');
            this.reloadingCSS = false;
        }.bind(this)).delay(5000);
    },

    preventMouseWheelCallback: function(e) {
        e = e || window.event;
        if (e.preventDefault)
            e.preventDefault();
        e.returnValue = false;
    },

    disableMouseWheel: function()
    {
        if (window.addEventListener)
        {
            window.addEventListener('DOMMouseScroll', this.preventMouseWheelCallback, false);
        }
        window.onmousewheel = document.onmousewheel = this.preventMouseWheelCallback;
    },

    enableMouseWheel: function()
    {
        if (window.removeEventListener) {
            window.removeEventListener('DOMMouseScroll', this.preventMouseWheelCallback, false);
        }
        window.onmousewheel = document.onmousewheel = document.onkeydown = null;
    },

    getUserSubscriptions: function()
    {
        new Request.JSON({
            url: this.options.localurl+'backend/fbusersubscriptions/getusersubscriptions',
            onSuccess: function(data)
            {
                this.sendToSwf('getUserSubscriptions', JSON.encode(data));
            }.bind(this)
            // TODO: have client send in id
        }).send('id=2&'+this.options.fbdata);
    },

    showSubscriptionDialog: function(id)
    {
        // check to make sure we don't have an existing subscription
        new Request.JSON({
            url: this.options.localurl+'backend/fbusersubscriptions/check',
            onSuccess: function(data)
            {

                if (data.error) {
                    console.log(data.error);
                }
                else if (data.subscriptions && data.subscriptions.length === 0)
                {

                    var obj = {
                        method:  'pay',
                        action:  'create_subscription',
                        product: this.options.localurl.replace('https', 'http') + 'backend/fbsubscriptions?id=' + id
                    };

                    // successful pay dialog callback
                    var js_callback = function(res)
                    {
                        if (res && res.status && res.status == "active")
                        {
                            this.subscriptionCallback('new', id, res.subscription_id, 'showSubscriptionDialog');
                        }

                    }.bind(this);

                    // show the fb pay dialog
                    FB.ui(obj, js_callback);
                }
                else
                {
                    var status  = data.subscriptions.status;
                    var fbsubid = data.subscriptions.fb_subscriptionid;

                    if (status == "active") this.cancelSubscriptionDialog(fbsubid);
                    else if (status == "pending_cancel") this.reactivateSubscriptionDialog(fbsubid);
                }

            }.bind(this)
        }).send('id='+id+'&'+this.options.fbdata);
    },

    subscriptionCallback: function(type, id, fb_subscriptionid, swf_cb /* optional callback to the swf */)
    {
        var js_callback = function(data)
        {
            if (typeof swf_cb != 'undefined')
            {
                //this.sendToSwf(swf_cb, JSON.encode(data));
                // vvvvvvvvvvvv
                // TODO: Remove this reload when client figures out why they can't receive the callback
                this.reloadParent();
                // ^^^^^^^^^^^^
            }
        }.bind(this);

        // successful payment, so pre register one
        new Request.JSON({
            url: this.options.localurl+'backend/fbusersubscriptions/' + type,
            onSuccess: js_callback
        }).send('id='+id+"&fb_subscriptionid="+fb_subscriptionid+"&"+this.options.fbdata);
    },

    cancelSubscriptionDialog: function(id)
    {
        if (!id) id = prompt("Enter a subscription id:");
        if (!id) return;

        var obj = {
            method:		  'pay',
            action:		  'cancel_subscription',
            subscription_id: id
        };

        var js_callback = function(res)
        {
            if (res && res.status && res.status == "active")
            {
                this.subscriptionCallback('cancel', 0, res.subscription_id, 'cancelSubscriptionDialog');
            }
        }.bind(this);

        FB.ui(obj, js_callback);
    },

    reactivateSubscriptionDialog: function(id)
    {
        if (!id) id = prompt("Enter a subscription id:");
        if (!id) return;

        var obj = {
            method:		  'pay',
            action:		  'reactivate_subscription',
            subscription_id: id
        };

        var js_callback = function(res)
        {
            if (res && res.status && res.status == "active")
            {
                this.subscriptionCallback('reactivate', 0, res.subscription_id, 'reactivateSubscriptionDialog');
            }
        }.bind(this);

        FB.ui(obj, js_callback);
    },

    changeSubscriptionPayDate: function(id)
    {
        if (!id) id = prompt("Enter a subscription id:");
        if (!id) return;

        new Request.JSON({
            url: this.options.localurl+'backend/fbusersubscriptions/changedate',
            onSuccess: function(data)
            {
                this.sendToSwf('changeSubscriptionPayDate', JSON.encode(data));
            }.bind(this)
        }).send('id='+id+'&'+this.options.fbdata);
    },

    changeSubscriptionPayType: function(id)
    {
        if (!id) id = prompt("Enter a subscription id:");
        if (!id) return;

        var obj = {
            method:         'pay',
            action:         'modify_subscription',
            subscription_id: id
        };

        var js_callback = function(res)
        {
            this.sendToSwf('changeSubscriptionPayType', JSON.encode(res));
        }.bind(this);

        FB.ui(obj, js_callback);
    },

    redeemFBGiftCard: function () {
        var url = cc.options.localurl + 'payments/facebook/initgiftcard';
        var myRequest = new Request.JSON({
            url: url,
        }).send();

        FB.ui({method: 'pay', action: 'redeem'}, function (data) {
            if (data.status == 'completed') {
                var myRequest = new Request.JSON({
                    url: localurl + "payments/facebook/giftcard",
                    onSuccess: function (data) {
                        cc.getCreditBalance(function (data) {
                            cc.sendToSwf(cc.fbTopupCallback, JSON.encode({'status': 'settled'}));
                            cc.sendToSwf('updateCredits', JSON.encode(data));
                        }, true);
                    }
                }).send(cc.options.fbdata + "&" + Object.toQueryString(data));
                cc.fb_hideTopup({"skip_cancelled": true});
            }
        });
    },

    processFlashHiding: function(state)
    {
        if(state == "closed")
        {
            return this.processHideGame(state, "");
        }

        var exportedImage;
        if(this.options.game_type == "unity")
        {
            this.getGameSwf().SendMessage("GameClientManager", "Screenshot", "cc.unityScreenshotCallback");
            return;
        }
        else
        {
            if (this.getGameSwf() && typeof(this.getGameSwf().exportScreenshot) == 'function')
            {
                exportedImage = this.getGameSwf().exportScreenshot();
                this.processHideGame(state, 'data:image/jpeg;base64,' + exportedImage);
            }
            else
            {
                this.processHideGame(state, "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAAAAACH5BAAAAAAALAAAAAABAAEAAAICTAEAOw==");
            }
        }
    },

    hideGameLock: 0,
    processHideGame: function(state, exportedImage)
    {
        if (state == "opened")
        {
            ++this.hideGameLock;
            if (this.hideGameLock > 1)
            {
                return;
            }
            var size = $('flashContent').getSize();

            $('screenshotObject').width  = size.x;
            $('screenshotObject').height = size.y - 2;
            $('screenshotObject').src = exportedImage;

            $('flashContent').style.top = '-10000px';
            $('imageContent').style.top = '';
        }
        else if (state == "closed")
        {
            --this.hideGameLock;
            if (this.hideGameLock > 0)
            {
                return;
            }
            $('flashContent').setStyle('top', '');
            $('imageContent').style.top = '-10000px';
        }
    },

    unityScreenshotCallback: function(exportedImage)
    {
        this.processHideGame("opened", 'data:image/png;base64,' + exportedImage);
    },

    startSessionPolling: function()
    {
        var timeout = 180; // 3 mins in seconds

        var props = {};
        if (!this.sessionPollHandle || this.sessionPollHandle === 0)
        {
            this.recordSessionTime = new Date().getTime();
            this.sessionPollHandle = setInterval(function() { cc.startSessionPolling(); }, timeout * 1000);

            props = {
                't'     : (new Date().getTime() / 1000),
                'tag'   : 'session',
                'stage' : 'sessionstart',
                'x'  : this.options.logsessionid
            };
            this.logGenericEvent(props);
            this.sendEventDT(props);
        }
        else
        {
            var now = new Date().getTime();
            var diff = now - this.recordSessionTime;
            this.recordSessionTime = new Date().getTime();

            props = {
                't'      : (new Date().getTime() / 1000),
                'tag'    : 'session',
                'stage'  : 'sessioninpro',
                'x'   : this.options.logsessionid,
                'status' : 1
            };
            this.logGenericEvent(props);
            this.sendEventDT(props);
        }
    },

    stopSessionPolling: function()
    {
        if (this.sessionPollHandle > 0)
        {
            clearInterval(this.sessionPollHandle);

            var now = new Date().getTime();
            var diff = now - this.recordSessionTime;

            var props = {
                't'      : (new Date().getTime() / 1000),
                'tag'    : 'session',
                'stage'  : 'sessioninpro',
                'x'   : this.options.logsessionid,
                'status' : 0
            };
            this.logGenericEvent(props);
            this.sendEventDT(props);

            this.sessionPollHandle = 0;
            this.recordSessionTime = false;
        }
    },

    getKXPData: function()
    {
        var data = {
            kixigned_request: "",
            kxid:             ""
        };

        if (typeof KXP !== 'undefined')
        {
            data.kixigned_request = KXP.kixigned_request;
            data.kxid = KXP.kxid;
        }

        return data;
    },

    getSurvey: function()
    {
        new Request.JSON({
            'url':this.options.localurl+'survey/getsurvey',
            onSuccess: function(data)
            {
                if(data.error)
                {
                    return;
                }

                jQuery(".kx-survey").html(
                    'Help make Battle Pirates better! Fill out <a href="'+data.link+'" target="_blank">this survey</a>!'
                );
            }
        }).send('surveyData='+this.options.survey_data);
    }
});

var KxLogger = new Class({

    Implements: [Options],

    options: {},

    initialize: function(options)
    {
        if(options) this.setOptions(options);
    },

    logGeneric: function(props, ignoreSplit)
    {
        try
        {
            if(this.options.kx_logger_url === '' || this.options.kx_logger_key === '') return false;
            if(this.options.logsessionid === '' && !ignoreSplit) return false;

            var defaultProps = {
                'p': this.options.integ,
                'g': this.options.game.toUpperCase(),
                'key': this.options.kx_logger_key,
                's': this.options.user.fbid ? this.options.user.fbid : '0',
                'u': this.options.userid,
                'k': this.options.user.kxid ? this.options.user.kxid : '',
                'x': this.options.logsessionid,
                'app': this.options.appname,
                't': (new Date().getTime() / 1000),
                'type': 'image'
            };

            if(this.options.hasOwnProperty("userlevel") && this.options.userlevel > 0)
            {
                defaultProps['l'] = this.options.userlevel;
            }

            if(this.options.kx_logger_env)
            {
                defaultProps['env'] = this.options.kx_logger_env;
            }

            props = Object.merge(defaultProps,props);
            props = Object.toQueryString(props);
            this.callUrlImg(this.options.kx_logger_url + '?' + props);
        }
        catch(e){}
        return true;
    },

    callUrlImg: function(src)
    {
        var img = new Image();
        img.src = src;
        (function(){ try { img.destroy(); } catch(e) {} }).delay(60000);//Remove the image tag after
    }
});

function dump(arr,level) {
    var dumped_text = "";
    if(!level) level = 0;

    //The padding given at the beginning of the line.
    var level_padding = "";
    for(var j=0;j<level+1;j++) level_padding += "    ";

    if(typeof(arr) == 'object') { //Array/Hashes/Objects
        for(var item in arr) {
            var value = arr[item];

            if(typeof(value) == 'object') { //If it is an array,
                dumped_text += level_padding + "'" + item + "' ...\n";
                dumped_text += dump(value,level+1);
            } else {
                dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
            }
        }
    } else { //Stings/Chars/Numbers etc.
        dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
    }
    return dumped_text;
}

function isNumber(n)
{
    return !isNaN(parseFloat(n)) && isFinite(n);
}

var UPayCredits = new Class({
    paymentInProgress : false,
    paymentSuccessful : false,
    flashParam : null,
    initialize : function()
    {
        var self = this;
        ulp.on('closeLB', function(data){
            // If we're force closing the LB, don't close the topup
            if (!data.forceCloseLB)
            {
                if (self.paymentSuccessful)
                {
                    cc.kxp_hideTopup({"skip_cancelled":true});
                }
                else
                {
                    cc.kxp_hideTopup({});
                }
            }

            ultimatepayPostProcess(data);
            self.completePayment(data);
        });
        ulp.on('paymentSuccess', function(data){
            self.paymentSuccessful = true;
        });
    },
    // call from within the game frame.
    displayLightbox : function(data) {
        window.ultimatePayParams = data;
        ulp.ultimatePay = true;
        if(cc.options.upLiveUrl != undefined && cc.options.upLiveUrl != 0) {
            ulp.upLiveUrl = cc.options.upLiveUrl;
        }
        ulp.displayUltimatePay();
    },
    // Close the lightbox
    closeLightbox : function(data) {
        ulp.closeBox(data);
    },
    buyCredits : function (blockid, flash, viewid, clicked, giftids, special, variable_cost_params, item_info) {
        // duplicating the logic inside buyCredits
        var upayRequestData = {
            blockid : blockid,
            viewid : (viewid ? viewid : 0),
            clicked : (clicked ? clicked : 0),
            giftids : (giftids ? giftids : ''),
            special : (special ? special : ''),
            variable_cost_params : (Object.getLength(variable_cost_params) > 0 ? variable_cost_params : []),
            item_info : (Object.getLength(item_info) > 0 ? item_info : [])
        };

        this.flashParam = flash;

        // don't start a second payment process till the previous one completes
        if (this.paymentInProgress === false)
        {
            this.paymentInProgress = true;
            this.paymentSuccessful = false;
            // after 5 seconds, re-enable the buy button
            setTimeout(function() {
                this.paymentInProgress = false;
            }, 5000);
            var upayRequest = new Request.JSON({
                'url':cc.options.localurl+'backend/upayStart',
                onSuccess : function(responseText){
                    this.displayLightbox(responseText);
                }.bind(this)
            });
            upayRequest.send('data='+JSON.encode(upayRequestData)+'&'+cc.options.fbdata);
        }
    },
    completePayment : function(data)
    {
        this.paymentInProgress = false;
        this.paymentSuccessful = false;

        if(typeof(data) == "object")
        {
            if(data.token !== '' && cc.getGameSwf())
            {
                cc.getCreditBalance(function(data){
                    if(this.flashParam)
                    {
                        cc.sendToSwf(this.flashParam, {'status':'settled'});
                    }
                    cc.sendToSwf('updateCredits',JSON.encode(data));
                }.bind(this),true);
            }
            else if(cc.getGameSwf())
            {
                cc.sendToSwf(this.flashParam, {'status':'canceled'});
            }
        }
    }
});

var FBCredits = new Class({
    getCreditsApi: function(callback)
    {
        FB.Bootstrap.requireFeatures(["Payments"], function()
        {
            callback(new FB.Payments());
        });
    },

    getBalance: function(app_id,to,token)
    {
        //console.log('FBCredits.getBalance');
        var myRequest = new Request.JSON({
            url: localurl+"backend/fbcredits/balance",
            method: 'post',
            onSuccess: function(data){
                if (typeof(data.balance) != "undefined")
                {
                    //alert("You FBC Balance: "+data.balance);
                    cc.sendToSwf("updateFBC",JSON.encode(data));
                }
            }
        }).send(fbdata);
    },

    openGetCreditsDialog: function(order_info,flash)
    {
        var params = {
            method: 'pay',
            order_info: order_info,
            action: 'buy_item'
        };
        if (cc.options.local_currency) params.dev_purchase_params = {'oscif': true};

        FB.ui(params,
            function(data)
            {
                var returnData = {};
                if (data['order_id'])
                {
                    if(flash) returnData = {'success':1,'order_id':data['order_id']};

                    var apsource = cc.options.fromstr.substr(0,6);
                    if (apsource == "fbbpap")
                    {
                        new Request.JSONP({'url': 'https://fbads.adparlor.com/Engagement/action.php?id=178&adid=545&vars=7djDxM/P1uDV4OfKs7SxjdbV1ObN4ebE3NXXz9jPwtjg1OTE58XK0Nni1Ky6vp7X3tnWwtbkwNrb5OTYs5aO1tfVtOfOqcC0'}).send();
                    }
                }
                else
                {
                    returnData = {'success':0};
                    //handle errors here
                    if (typeof(data['error_message']) != "undefined" && data['error_message'] == "User canceled the order.")
                    {
                        flash = 'purchaseCancelled';
                        returnData.canceled = 1;
                    }
                }
                cc.fbcGetBalance();
                if(flash && cc.getGameSwf() !== null) cc.sendToSwf(flash,JSON.encode(returnData));
            }
        );
    },

    buyFbCredits: function(ncp,callback)
    {
        if(cc.options.game == 'wc' && cc.options.preview_server == '1')
        {
            return cc.noPayments();
        }

        var params = {
            method: 'pay',
            action: 'buy_credits'
        };
        if(ncp) params.dev_purchase_params = {'credits_acquisition': true};

        FB.ui(
            params,
            function(data)
            {
                this.getBalance();
                if(cc.getGameSwf() !== null && data.error_code !='1383010') cc.sendToSwf("fbcBuyCreditsCallback",JSON.encode({'noUpdate': ncp}));
                if(callback) callback(data);
            }.bind(this)
        );
    },

    buyCreditsLocalCurrency: function(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info)
    {
        var startData = {
            blockid:  blockid,
            flash:    flash,
            viewid :  (viewid ? viewid : 0),
            clicked : (clicked ? clicked : 0),
            giftids : (giftids ? giftids : ''),
            special : (special ? special : ''),
            variable_cost_params : (Object.getLength(variable_cost_params) > 0 ? variable_cost_params : []),
            item_info : (Object.getLength(item_info) > 0 ? item_info : []),
            device_fingerprint : deviceFingerPrint
        };

        new Request.JSON({
            url: cc.options.localurl + 'payments/facebook/start',
            onSuccess: function(data)
            {
                console.log(data);
                this.buyCreditsLocalCurrencyGo(data);
            }.bind(this),
            onFailure: function(xhr)
            {
                //parse response
                var response = JSON.parse(xhr.responseText);
                alert('We are sorry but we cannot process this purchase at this time.\n\nIf you continue to have problems paying, please contact support.');
                console.log('Error : ' + response.error);
                console.log('Error Message: ' + response.error_message);
            }
        }).send(cc.options.fbdata + "&" + jQuery.param(startData));
    },

    buyCreditsLocalCurrencyGo: function(data)
    {
        var url = cc.options.localurl + 'payments/facebook/currencyinfo/' + data.quantity + '/' + data.block_id + '/' + data.currency;

        if(data.gift == 1) {
            url = url + '/' + data.gift_count;
        }
        var obj = {
            method:    'pay',
            action:    'purchaseitem',
            product:    url,
            quantity:   1,
            request_id: data.request_id
        };

        FB.ui(obj, function(data) {
            if(data.status == 'completed')
            {
                var myRequest = new Request.JSON({
                    url: localurl + "payments/facebook/complete",
                    onSuccess: function(data)
                    {
                        cc.getCreditBalance(function(data) {
                            cc.sendToSwf(cc.fbTopupCallback, JSON.encode({'status':'settled'}));
                            cc.sendToSwf('updateCredits',JSON.encode(data));
                        },true);

                    }
                }).send(cc.options.fbdata + "&" + Object.toQueryString(data));
                if(cc.fbIsDGP == 1) {
                    cc.dgpSuccess =1;
                }
                cc.fb_hideTopup({"skip_cancelled":true});
            }
            else
            {
                cc.hideTopup();
            }
        });
    },

    postProcessFbPayment: function(data)
    {
        var myRequest = new Request.JSON({
            url: localurl+"payments/facebook/update",
            method: 'post'
        }).send(data);
    },


    buyCredits: function(blockid,flash,viewid,clicked,giftids,special,variable_cost_params,item_info)
    {
        if(cc.options.game == 'wc' && cc.options.preview_server == '1')
        {
            return cc.noPayments();
        }

        if(cc.options.integ == 'fbg')
        {
            var params = {
                method: 'pay',
                order_info: {'blockid':blockid,'viewid':(viewid?viewid:0),'clicked':(clicked?clicked:0),'giftids':(giftids?giftids:''),'special':(special?special:''),'variable_cost_params':(variable_cost_params?variable_cost_params:{}),'item_info':(item_info?item_info:{})},
                action: 'buy_item'
            };
            if (cc.options.local_currency) params.dev_purchase_params = {'oscif': true};

            FB.ui(params, function(data){ this.buyCreditsComplete(blockid,data,flash,null,special); }.bind(this)
            );
        }
        else this.getCreditsApi(function(api){ this.buyCreditsCallback(blockid,api,flash,viewid,clicked,giftids,special); }.bind(this));
    },

    buyCreditsCallback: function(blockid,api,flash,viewid,clicked,giftids,special)
    {
        api.setParam('order_info',{'blockid':blockid,'viewid':(viewid?viewid:0),'clicked':(clicked?clicked:0),'giftids':(giftids?giftids:''),'special':(special?special:'')});
        api.setParam('next_js',function(data){ this.buyCreditsComplete(blockid,data,flash,(giftids?true:false),special); }.bind(this));
        api.submitOrder();
    },

    buyCreditsComplete: function(blockid,data,flash,checkgift,special)
    {
        if(!flash) flash = cc.getTopupCallback();

        if(data && data.order_id && data.status == 'settled') cc.dgpSuccess = 1;
        cc.hideTopup();
        var returnData = {};

        if(data && data.order_id && data.status == 'settled')
        {
            returnData = {'status':'settled'};
            if(!cc.getGameSwf()) return cc.redirect(cc.options.baseurl+'?r=fbcts&oid='+data.order_id+(checkgift?'&cg=1':''));
        }
        else if(data && data.error_message)
        {
            if(flash) returnData = {'status':'failed','error_message':data.error_message};
            //else return cc.redirect(cc.options.baseurl+'?r=fbctf&msg='+data.error_message);
        }
        else returnData = {'status':'canceled'};
        if(cc.getGameSwf())
        {
            cc.getCreditBalance(function(data){
                if(flash) cc.sendToSwf(flash,JSON.encode(returnData));
                cc.sendToSwf('updateCredits',JSON.encode(data));
            },true);

            if(special == 'gift' && data && data.status == 'settled')
            {
                cc.checkTopupGift();
            }
        }
    },

    // itemid - item json data from client for fbg
    buyItem: function(itemid,flash,srdata,integ)
    {
        if(cc.options.game == 'wc' && cc.options.preview_server == '1')
        {
            return cc.noPayments();
        }

        if(!itemid) return false;
        if (integ != "fbg")
        {
            this.getCreditsApi(function(api){ this.buyItemCallback(itemid,api,flash); }.bind(this));
        }
        else
        {
            var itemObj = JSON.decode(itemid);
            if(cc.getGameSwf() === null)
            {
                cc.setGameSwf($('gameswf'));
                //if(cc.getGameSwf() !== null) cc.sendToSwf(itemObj.callback,JSON.encode({'success':0,'jserror':1}));
                //return false;
            }

            var order_info = {
                "callback":itemObj.callback,
                "cost":itemObj.cost,
                "title":itemObj.title,
                "description":itemObj.description,
                "h":itemObj.h,
                "hn":itemObj.hn
            };

            // New method of passing data
            if (itemObj.referrer)
                order_info.referrer = itemObj.referrer;
            if (itemObj.itemInfo)
                order_info.iteminfo = itemObj.itemInfo;
            if (itemObj.storeCode)
                order_info.item = itemObj.storeCode;
            if (itemObj.type)
                order_info.type = itemObj.type;
            if (itemObj.baseid)
                order_info.baseid = itemObj.baseid;

            // Grandfathered method of passing itemids so other games wont break
            if (itemObj.itemid)
                order_info.item = itemObj.itemid;

            if(itemObj.stats) order_info.stats = itemObj.stats;

            // Open Facebook Payment Dialog
            this.openGetCreditsDialog(order_info, itemObj.callback);

        }
        return true;
    },

    buyItemCallback: function(itemid,api,flash)
    {
        api.setParam('order_info',{'itemid':itemid});
        api.setParam('next_js',function(data){ this.buyItemComplete(itemid,data,flash); }.bind(this));
        api.submitOrder();
    },

    buyItemComplete: function(itemid,data,flash)
    {
        var returnData = {};
        if(data.order_id && data.status == 'settled')
        {
            if(flash) returnData = {'success':1};
            else return cc.redirect(cc.options.baseurl+'?r=fbcts&oid='+data.order_id);
        }
        else if(data.error_message)
        {
            if(flash) returnData = {'success':0,'error_message':data.error_message};
        }
        else if(data.order_id && !isNumber(data.order_id))
        {
            if (data.order_id == "error")
            {
                var myRequest = new Request.JSON({
                    url: localurl+"backend/fbtxnlogging/getnewid",
                    method: 'post',
                    timeout: 10000,
                    onSuccess: function(data)
                    {
                        if (data.id)
                        {
                            itemid.txn_id = data.id;
                            this.openGetCreditsDialog(itemid,flash);
                        }
                    }.bind(this),
                    onTimeout: function()
                    {
                        var returnData = {'success':0,'error_message':'error'};
                        if(flash && cc.getGameSwf() !== null) cc.sendToSwf(flash,JSON.encode(returnData));
                    },
                    onFailure: function()
                    {
                        var returnData = {'success':0,'error_message':'error'};
                        if(flash && cc.getGameSwf() !== null) cc.sendToSwf(flash,JSON.encode(returnData));
                    }
                }).send('fbid='+cc.fbid);
                return false;
            }
            if(flash)
            {
                returnData = {'success':0,'error_message':data['order_id']};
            }
        }
        else if(data['order_id'] && isNumber(data['order_id']))
        {
            var apsource = cc.options.fromstr.substr(0,6);
            if (apsource == "fbbpap")
            {
                new Request.JSONP({'url': 'https://fbads.adparlor.com/Engagement/action.php?id=178&adid=545&vars=7djDxM/P1uDV4OfKs7SxjdbV1ObN4ebE3NXXz9jPwtjg1OTE58XK0Nni1Ky6vp7X3tnWwtbkwNrb5OTYs5aO1tfVtOfOqcC0'}).send();
            }

            if(flash) returnData = {'success':1,'order_id':data['order_id'],'frictionless':1};
            else return cc.redirect(cc.options.baseurl+'?r=fbcts&oid='+data['order_id']);
        }
        if(flash && cc.getGameSwf() !== null) cc.sendToSwf(flash,JSON.encode(returnData));
    }
});

var friendSelector = new Class({
    Implements: [Options,Events],
    options: {},
    initialize: function(options)
    {
        this.setOptions(options);
    },
    maxSelectable: 0,
    selectedCount: 0,
    init: function()
    {
        this.type = this.options.type;
        this.form = $(this.options.form);
        this.usDiv = $(this.options.unselected);
        if(this.type == 'text') this.sDiv = $(this.options.selected);

        if(this.options.sendbutton)
        {
            var sbtn = $(this.options.sendbutton);
            if(sbtn) sbtn.addEvent('click',this.sendForm.bind(this));
        }

        var els = this.usDiv.getElements('li.'+this.options.liname);
        if(!els) return false;
        this.maxSelectable = els.length;
        els.addEvent('click',this.selectFriend.bind(this));
    },
    selectedFriends: [],
    selectFriend: function(event)
    {
        var el;
        if($(event.target).hasClass(this.options.liname)) el = $(event.target);
        else el = $(event.target).getParent('li.'+this.options.liname);

        if(this.type == 'text')
        {
            el.removeEvents('click').dispose().inject(this.sDiv).addEvent('click',this.deSelectFriend.bind(this));
            el.getElement('input').setStyle('display','none').set('checked',false);
            el.getElement('span').setStyle('display','inline');
        }
        else
        {
            el.removeEvents('click').addEvent('click',this.deSelectFriend.bind(this));
            el.removeClass(this.options.uselclass).addClass(this.options.selclass);
        }

        this.selectedFriends.push(el.id.replace(this.options.liname,'').toInt());
        this.selectedCount++;
        this.checkMessages();

        this.fireEvent('select');
    },
    deSelectFriend: function(event)
    {
        var el;
        if($(event.target).hasClass(this.options.liname)) el = $(event.target);
        else el = $(event.target).getParent('li.'+this.options.liname);

        if(this.type == 'text')
        {
            el.removeEvents('click').dispose().inject(this.usDiv).addEvent('click',this.selectFriend.bind(this));
            el.getElement('input').setStyle('display','inline').set('checked',false);
            el.getElement('span').setStyle('display','none');
        }
        else
        {
            el.removeEvents('click').addEvent('click',this.selectFriend.bind(this));
            el.removeClass(this.options.selclass).addClass(this.options.uselclass);
        }

        this.selectedFriends.erase(el.id.replace(this.options.liname,'').toInt());
        this.selectedCount--;
        this.checkMessages();

        this.fireEvent('deselect');
    },
    checkMessages: function()
    {
        if(this.type != 'text') return true;
        if(this.selectedCount < 1) this.sDiv.getElement('.message').setStyle('display','block');
        else this.sDiv.getElement('.message').setStyle('display','none');
        if(this.selectedCount == this.maxSelectable) this.usDiv.getElement('.message').setStyle('display','block');
        else this.usDiv.getElement('.message').setStyle('display','none');
    },
    sendForm: function(blockid)
    {
        if(!this.selectedFriends.length) return this.fireEvent('sendfailure');
        var ids = '';
        this.selectedFriends.each(function(v){ ids += ','+v; });
        ids = ids.substr(1);
        new Element('input',{'type':'hidden','name':'ids','value':ids}).inject(this.form);
        if(blockid) new Element('input',{'type':'hidden','name':'blockid','value':blockid}).inject(this.form);
        this.form.submit();
    },
    sendFormFBC: function(blockid)
    {
        if(!this.selectedFriends.length) return this.fireEvent('sendfailure');
        var ids = '';
        this.selectedFriends.each(function(v){ ids += ','+v; });
        ids = ids.substr(1);
        cc.fbcBuyCredits(blockid,null,null,null,ids);
    },
    getSelectedCount: function()
    {
        return this.selectedCount;
    }
});

// Group thousands into comma seperated blocks (10000 becomes 10,000)
function addCommas(nStr)
{
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

/*
 CryptoJS v3.1.2
 code.google.com/p/crypto-js
 (c) 2009-2013 by Jeff Mott. All rights reserved.
 code.google.com/p/crypto-js/wiki/License
 */
var CryptoJS=CryptoJS||function(q,r){var k={},g=k.lib={},p=function(){},t=g.Base={extend:function(b){p.prototype=this;var j=new p;b&&j.mixIn(b);j.hasOwnProperty("init")||(j.init=function(){j.$super.init.apply(this,arguments)});j.init.prototype=j;j.$super=this;return j},create:function(){var b=this.extend();b.init.apply(b,arguments);return b},init:function(){},mixIn:function(b){for(var j in b)b.hasOwnProperty(j)&&(this[j]=b[j]);b.hasOwnProperty("toString")&&(this.toString=b.toString)},clone:function(){return this.init.prototype.extend(this)}},
        n=g.WordArray=t.extend({init:function(b,j){b=this.words=b||[];this.sigBytes=j!=r?j:4*b.length},toString:function(b){return(b||u).stringify(this)},concat:function(b){var j=this.words,a=b.words,l=this.sigBytes;b=b.sigBytes;this.clamp();if(l%4)for(var h=0;h<b;h++)j[l+h>>>2]|=(a[h>>>2]>>>24-8*(h%4)&255)<<24-8*((l+h)%4);else if(65535<a.length)for(h=0;h<b;h+=4)j[l+h>>>2]=a[h>>>2];else j.push.apply(j,a);this.sigBytes+=b;return this},clamp:function(){var b=this.words,j=this.sigBytes;b[j>>>2]&=4294967295<<
        32-8*(j%4);b.length=q.ceil(j/4)},clone:function(){var b=t.clone.call(this);b.words=this.words.slice(0);return b},random:function(b){for(var j=[],a=0;a<b;a+=4)j.push(4294967296*q.random()|0);return new n.init(j,b)}}),v=k.enc={},u=v.Hex={stringify:function(b){var a=b.words;b=b.sigBytes;for(var h=[],l=0;l<b;l++){var m=a[l>>>2]>>>24-8*(l%4)&255;h.push((m>>>4).toString(16));h.push((m&15).toString(16))}return h.join("")},parse:function(b){for(var a=b.length,h=[],l=0;l<a;l+=2)h[l>>>3]|=parseInt(b.substr(l,
            2),16)<<24-4*(l%8);return new n.init(h,a/2)}},a=v.Latin1={stringify:function(b){var a=b.words;b=b.sigBytes;for(var h=[],l=0;l<b;l++)h.push(String.fromCharCode(a[l>>>2]>>>24-8*(l%4)&255));return h.join("")},parse:function(b){for(var a=b.length,h=[],l=0;l<a;l++)h[l>>>2]|=(b.charCodeAt(l)&255)<<24-8*(l%4);return new n.init(h,a)}},s=v.Utf8={stringify:function(b){try{return decodeURIComponent(escape(a.stringify(b)))}catch(h){throw Error("Malformed UTF-8 data");}},parse:function(b){return a.parse(unescape(encodeURIComponent(b)))}},
        h=g.BufferedBlockAlgorithm=t.extend({reset:function(){this._data=new n.init;this._nDataBytes=0},_append:function(b){"string"==typeof b&&(b=s.parse(b));this._data.concat(b);this._nDataBytes+=b.sigBytes},_process:function(b){var a=this._data,h=a.words,l=a.sigBytes,m=this.blockSize,k=l/(4*m),k=b?q.ceil(k):q.max((k|0)-this._minBufferSize,0);b=k*m;l=q.min(4*b,l);if(b){for(var g=0;g<b;g+=m)this._doProcessBlock(h,g);g=h.splice(0,b);a.sigBytes-=l}return new n.init(g,l)},clone:function(){var b=t.clone.call(this);
            b._data=this._data.clone();return b},_minBufferSize:0});g.Hasher=h.extend({cfg:t.extend(),init:function(b){this.cfg=this.cfg.extend(b);this.reset()},reset:function(){h.reset.call(this);this._doReset()},update:function(b){this._append(b);this._process();return this},finalize:function(b){b&&this._append(b);return this._doFinalize()},blockSize:16,_createHelper:function(b){return function(a,h){return(new b.init(h)).finalize(a)}},_createHmacHelper:function(b){return function(a,h){return(new m.HMAC.init(b,
        h)).finalize(a)}}});var m=k.algo={};return k}(Math);
(function(q){function r(a,m,b,j,g,l,k){a=a+(m&b|~m&j)+g+k;return(a<<l|a>>>32-l)+m}function k(a,m,b,j,g,l,k){a=a+(m&j|b&~j)+g+k;return(a<<l|a>>>32-l)+m}function g(a,m,b,j,g,l,k){a=a+(m^b^j)+g+k;return(a<<l|a>>>32-l)+m}function p(a,g,b,j,k,l,p){a=a+(b^(g|~j))+k+p;return(a<<l|a>>>32-l)+g}for(var t=CryptoJS,n=t.lib,v=n.WordArray,u=n.Hasher,n=t.algo,a=[],s=0;64>s;s++)a[s]=4294967296*q.abs(q.sin(s+1))|0;n=n.MD5=u.extend({_doReset:function(){this._hash=new v.init([1732584193,4023233417,2562383102,271733878])},
    _doProcessBlock:function(h,m){for(var b=0;16>b;b++){var j=m+b,n=h[j];h[j]=(n<<8|n>>>24)&16711935|(n<<24|n>>>8)&4278255360}var b=this._hash.words,j=h[m+0],n=h[m+1],l=h[m+2],q=h[m+3],t=h[m+4],s=h[m+5],u=h[m+6],v=h[m+7],w=h[m+8],x=h[m+9],y=h[m+10],z=h[m+11],A=h[m+12],B=h[m+13],C=h[m+14],D=h[m+15],c=b[0],d=b[1],e=b[2],f=b[3],c=r(c,d,e,f,j,7,a[0]),f=r(f,c,d,e,n,12,a[1]),e=r(e,f,c,d,l,17,a[2]),d=r(d,e,f,c,q,22,a[3]),c=r(c,d,e,f,t,7,a[4]),f=r(f,c,d,e,s,12,a[5]),e=r(e,f,c,d,u,17,a[6]),d=r(d,e,f,c,v,22,a[7]),
        c=r(c,d,e,f,w,7,a[8]),f=r(f,c,d,e,x,12,a[9]),e=r(e,f,c,d,y,17,a[10]),d=r(d,e,f,c,z,22,a[11]),c=r(c,d,e,f,A,7,a[12]),f=r(f,c,d,e,B,12,a[13]),e=r(e,f,c,d,C,17,a[14]),d=r(d,e,f,c,D,22,a[15]),c=k(c,d,e,f,n,5,a[16]),f=k(f,c,d,e,u,9,a[17]),e=k(e,f,c,d,z,14,a[18]),d=k(d,e,f,c,j,20,a[19]),c=k(c,d,e,f,s,5,a[20]),f=k(f,c,d,e,y,9,a[21]),e=k(e,f,c,d,D,14,a[22]),d=k(d,e,f,c,t,20,a[23]),c=k(c,d,e,f,x,5,a[24]),f=k(f,c,d,e,C,9,a[25]),e=k(e,f,c,d,q,14,a[26]),d=k(d,e,f,c,w,20,a[27]),c=k(c,d,e,f,B,5,a[28]),f=k(f,c,
            d,e,l,9,a[29]),e=k(e,f,c,d,v,14,a[30]),d=k(d,e,f,c,A,20,a[31]),c=g(c,d,e,f,s,4,a[32]),f=g(f,c,d,e,w,11,a[33]),e=g(e,f,c,d,z,16,a[34]),d=g(d,e,f,c,C,23,a[35]),c=g(c,d,e,f,n,4,a[36]),f=g(f,c,d,e,t,11,a[37]),e=g(e,f,c,d,v,16,a[38]),d=g(d,e,f,c,y,23,a[39]),c=g(c,d,e,f,B,4,a[40]),f=g(f,c,d,e,j,11,a[41]),e=g(e,f,c,d,q,16,a[42]),d=g(d,e,f,c,u,23,a[43]),c=g(c,d,e,f,x,4,a[44]),f=g(f,c,d,e,A,11,a[45]),e=g(e,f,c,d,D,16,a[46]),d=g(d,e,f,c,l,23,a[47]),c=p(c,d,e,f,j,6,a[48]),f=p(f,c,d,e,v,10,a[49]),e=p(e,f,c,d,
            C,15,a[50]),d=p(d,e,f,c,s,21,a[51]),c=p(c,d,e,f,A,6,a[52]),f=p(f,c,d,e,q,10,a[53]),e=p(e,f,c,d,y,15,a[54]),d=p(d,e,f,c,n,21,a[55]),c=p(c,d,e,f,w,6,a[56]),f=p(f,c,d,e,D,10,a[57]),e=p(e,f,c,d,u,15,a[58]),d=p(d,e,f,c,B,21,a[59]),c=p(c,d,e,f,t,6,a[60]),f=p(f,c,d,e,z,10,a[61]),e=p(e,f,c,d,l,15,a[62]),d=p(d,e,f,c,x,21,a[63]);b[0]=b[0]+c|0;b[1]=b[1]+d|0;b[2]=b[2]+e|0;b[3]=b[3]+f|0},_doFinalize:function(){var a=this._data,g=a.words,b=8*this._nDataBytes,j=8*a.sigBytes;g[j>>>5]|=128<<24-j%32;var k=q.floor(b/
    4294967296);g[(j+64>>>9<<4)+15]=(k<<8|k>>>24)&16711935|(k<<24|k>>>8)&4278255360;g[(j+64>>>9<<4)+14]=(b<<8|b>>>24)&16711935|(b<<24|b>>>8)&4278255360;a.sigBytes=4*(g.length+1);this._process();a=this._hash;g=a.words;for(b=0;4>b;b++)j=g[b],g[b]=(j<<8|j>>>24)&16711935|(j<<24|j>>>8)&4278255360;return a},clone:function(){var a=u.clone.call(this);a._hash=this._hash.clone();return a}});t.MD5=u._createHelper(n);t.HmacMD5=u._createHmacHelper(n)})(Math);
(function(){var q=CryptoJS,r=q.enc.Utf8;q.algo.HMAC=q.lib.Base.extend({init:function(k,g){k=this._hasher=new k.init;"string"==typeof g&&(g=r.parse(g));var p=k.blockSize,q=4*p;g.sigBytes>q&&(g=k.finalize(g));g.clamp();for(var n=this._oKey=g.clone(),v=this._iKey=g.clone(),u=n.words,a=v.words,s=0;s<p;s++)u[s]^=1549556828,a[s]^=909522486;n.sigBytes=v.sigBytes=q;this.reset()},reset:function(){var k=this._hasher;k.reset();k.update(this._iKey)},update:function(k){this._hasher.update(k);return this},finalize:function(k){var g=
    this._hasher;k=g.finalize(k);g.reset();return g.finalize(this._oKey.clone().concat(k))}})})();

function uuidCompact()
{
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c)
    {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

/**
 *
 * ccfDialog - Displays a modal dialog containing AJAX loaded HTML
 *
 * Instantiation:
 * var myDialog = new ccfDialog(options);
 *
 * Required options:
 * url:String - The url that the dialog content should be loaded from
 *
 * Optional options (heh):
 * See comments in class
 *
 * Props:
 * Allows the passing of arbitrary properties to any of the elements that make up the dialog
 * Elements: dialog, mask, contentWrapper, content, closeButton
 * Example: {'content':{'styles':{'color':'black'},'id':'myElement'}} will apply the styles and set the id of the "content" element
 *
 *
 */
var ccfDialog = new Class({

    Implements: [Events, Options],

    options: {
        props: {}, // Allows the passing of arbitrary properties to any of the elements that make up the dialog
        url: '', // The URL to be loaded into the dialog
        querystring: {}, // QueryString params to be sent with the request
        postdata: {}, // Postdata to be sent with the request
        stylesuffix: '', // In addition to the normal classnames, add an additional classname as <normalClassName>-suffix
        cachecontent: false, // Cache the result of all loadUrl calls (this will take into account changes in querystring and postdata)
        cachetimeout: false, // Expire the cached result of a loadUrl call after this duration (in seconds)
        mask: true, // Mask all other page content
        container: null, // The element that the dialog should be injected into, defaults to $('content')
        onShow: null, // A function that will be called when the dialog is shown - this is a helper, standard events are also supported
        onHide: null, // A function that will be called when the dialog is hidden - this is a helper, standard events are also supported
        showSpinner: false, // show the spinner while loading
        remainCentered: false // keep dialog centered on window resize
    },

    loaded: false,
    showing: false,

    container: null,
    dialog: null,
    content: null,
    contentWrapper: null,
    closeButton: null,
    mask: null,

    contentCache: {},

    initialize: function(options)
    {
        if(options) this.setOptions(options);

        if(this.options.onShow) this.addEvent('show',function(){ this.options.onShow(); });
        if(this.options.onHide) this.addEvent('hide',function(){ this.options.onHide(); });

        if(!this.options.container) this.options.container = $('content');
        this.container = this.options.container;
    },

    reInit: function(options)
    {
        this.setOptions(options);
    },

    show: function()
    {
        if(this.showing) return false;
        this.showing = true;

        this.createElements();

        this.dialog.setStyle('visibility','hidden');

        this.container.grab(this.dialog);
        if(this.options.mask) this.container.grab(this.mask);

        var left_offset;
        var margin_left = '0';
        if(cc.options.game_width == '100%')
        {
            if (this.options.remainCentered)
            {
                left_offset = '50%';
                margin_left = -1 * ((this.dialog.getSize().x)/2).round();
            }
            else
            {
                var windowSize = $(window).getSize();
                left_offset = ((windowSize.x - this.dialog.getSize().x)/2).round();
            }
        }
        else
        {
            left_offset = ((cc.options.game_width - this.dialog.getSize().x)/2).round();
        }

        this.dialog.setStyles({
            'left': left_offset,
            'margin-left': margin_left,
            'visibility': 'visible'
        });

        this.getContent();

        this.fireEvent('show');

        return this;
    },

    hide: function(args)
    {
        if(!this.showing) return false;

        this.dialog.dispose().empty();
        if(this.options.mask) this.mask.dispose();

        this.showing = false;
        this.fireEvent('hide',args);
    },

    getClassName: function(element)
    {
        var cname = 'ccfdialog';
        if(element) cname = cname+'-'+element;
        if(this.options.stylesuffix) cname = cname+' '+cname+'-'+this.options.stylesuffix;
        return cname;
    },

    createElements: function()
    {
        if(!this.dialog)
        {
            this.dialog = new Element('div',{
                'class': this.getClassName()
            });

            if(this.options.props.dialog) this.dialog.set(this.options.props.dialog);
        }

        if(!this.mask)
        {
            this.mask = new Element('div',{
                'class': this.getClassName('mask'),
                'styles': {
                    'opacity': 0.4
                }
            });

            this.mask.addEvent('click',this.hide.bind(this));

            if(this.options.props.mask) this.dialog.set(this.options.props.mask);
        }

        if(!this.closeButton)
        {
            this.closeButton = new Element('img',{
                'src': cc.options.cdnurl+'images/dialog/close-button.png',
                'class': this.getClassName('close'),
                'alt': 'X'
            }).addEvent('click',function(){
                    this.hide();
                }.bind(this));

            if(this.options.props.closeButton) this.dialog.set(this.options.props.closeButton);
        }

        this.contentWrapper = new Element('div',{
            'class': this.getClassName('wrapper'),
            'styles': {'background-image': 'url(\''+cc.options.assetsurl+'images/feeddialog/feed-dialog-popup-loading-screen.jpg\')'}
        });
        if(this.options.props.contentWrapper) this.contentWrapper.set(this.options.props.contentWrapper);

        this.content = new Element('div',{
            'class': this.getClassName('content')
        });
        if(this.options.props.content) this.content.set(this.options.props.content);

        if(this.options.showSpinner)
        {
            var loadwrap = new Element('div',{'id':'dialog-loading'});

            loadwrap.adopt(
                new Element('img',{'src': cc.options.cdnurl+'images/dialog/loading.png'}),
                new Element('img',{'src': cc.options.cdnurl+'images/dialog/spinner.gif'})
            );

            this.content.grab(loadwrap);
        }

        this.dialog.adopt(
            this.closeButton,
            this.contentWrapper,
            this.content
        );

        return true;
    },

    getContent: function()
    {
        var qs = this.options.querystring;
        var pd = this.options.postdata;
        var url = this.options.url;

        this.loadUrl(url,qs,pd);
    },

    loadUrl: function(url,qs,pd)
    {
        if(!qs) qs = {};
        if(!pd) pd = {};

        Object.append(qs,cc.options.fbdata.parseQueryString());

        qs = Object.toQueryString(qs);
        pd = Object.toQueryString(pd);

        if(qs) url = url+'?'+qs;

        var doRequest = true;

        if(this.options.cachecontent)
        {
            try
            {
                if(this.contentCache[url] && this.contentCache[url][pd])
                {
                    this.content.set('html',this.contentCache[url][pd].html);
                    Browser.exec(this.contentCache[url][pd].js);
                    doRequest = false;
                }
            } catch(e){}
        }

        if(doRequest)
        {
            new Request.HTML({
                'url': url,
                'update': this.content,
                'evalScripts': true,
                'onComplete': function(){
                    this.loaded = true;
                }.bind(this),
                'onSuccess': function(tree,els,html,js){
                    if(this.options.cachecontent)
                    {
                        if(!this.contentCache[url]) this.contentCache[url] = {};
                        if(!this.contentCache[url][pd]) this.contentCache[url][pd] = {};
                        this.contentCache[url][pd] = {
                            'html': html,
                            'js': js
                        };
                        if(this.options.cachetimeout)
                        {
                            (function(){ delete this.contentCache[url][pd]; }.bind(this)).delay(this.options.cachetimeout*1000);
                        }
                    }
                }.bind(this)
            }).send(pd);
        }
    }


});
