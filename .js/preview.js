<script type="text/javascript" src="/assets/script/jquery.countdown.min.js"></script>
	<link rel="stylesheet" type="text/css" href="/assets/style/jquery.countdown.css" />

    <script type="text/javascript" src="/assets/script/browserdetect.js"></script>
	<script type="text/javascript" src="/assets/script/Array.Math.min.js"></script>    
	<script type="text/javascript" src="/assets/script/fb.v199.js"></script>
	<script type="text/javascript" src="/assets/script/cc-framework.v199.js"></script>
	<script type="text/javascript" src="/assets/script/rightclick.v199.js"></script>
	<script type="text/javascript">
	
		var kxLogger = new KxLogger({
			'kx_logger_url':'https://bi-logging.sjc.kixeye.com/log',
			'kx_logger_key':'qwerty',
			'kx_logger_env':'prod',
			'logsessionid':'200246171465722233',
			'integ':'kxp',
			'game':'wc',
			'user':user,
			'userid':'20024617',
			'appname':'warcommander',
			'userlevel':'39'
		});

		var cc = null;
		
		window.addEvent('domready',function(){
			var loadDiff = new Date().getTime() - canvasInitTime;
			var ccdata = {
				'integ'                     :'kxp',
				'game'                      :'wc',
				'preview_server'            :'0',
				'authperms'                 :'public_profile,email,user_friends',
				'baseurl'                   :baseurl,
				'localurl'                  :localurl,
				'pmsurl'                    :pmsurl,
				'appname'                   :'warcommander',
				'fbog_localurl'             :'http://wc-kx-vip.sjc.kixeye.com/',
				'gamenamesh'                :'Wc',
				'twitterurl'                :'',
				'app_id'                    :'216862461657375',
				'jflashvars'                :{"kxid":"510c331cc64b6856630036f3","a":"216862461657375","g":"warcommander","username":"UniqueName","email":"andisthermal555@gmail.com","expireAt":1465736631,"status":"active","userIp":"111.94.71.47","facebookId":"1099366247","facebookTokenForBusiness":"AbzVFs_yl51ghNTF","token_for_business":"AbzVFs_yl51ghNTF","signed_request":"1tSt6uCrchy4AK_uMhhsGt2uee-4h1uA0Lxb93wn10M=.eyJreGlkIjoiNTEwYzMzMWNjNjRiNjg1NjYzMDAzNmYzIiwiYSI6IjIxNjg2MjQ2MTY1NzM3NSIsImciOiJ3YXJjb21tYW5kZXIiLCJ1c2VybmFtZSI6IlVuaXF1ZU5hbWUiLCJlbWFpbCI6ImFuZGlzdGhlcm1hbDU1NUBnbWFpbC5jb20iLCJleHBpcmVBdCI6MTQ2NTczNjYzMSwic3RhdHVzIjoiYWN0aXZlIiwidXNlcklwIjoiMTExLjk0LjcxLjQ3IiwiZmFjZWJvb2tJZCI6IjEwOTkzNjYyNDciLCJmYWNlYm9va1Rva2VuRm9yQnVzaW5lc3MiOiJBYnpWRnNfeWw1MWdoTlRGIn0=","userid":20024617,"newuser":0,"apiurl":"https:\/\/wc-kx-vip.sjc.kixeye.com\/api\/","wmbasemanurl":"https:\/\/wc-kx-vip.sjc.kixeye.com\/wmbaseman\/","baseurl":"http:\/\/wc-kx-vip.sjc.kixeye.com\/api\/wc\/base\/","cdnurl":"https:\/\/wc-fb-cdn6.kixeye.com\/","gameurl":"https:\/\/wc-fb-cdn6.kixeye.com\/game\/","statsurl":"http:\/\/wc-kx-vip.sjc.kixeye.com\/recordstats.php","logurl":"https:\/\/debuglog-lb2.sjc.kixeye.com\/debug\/recorddebugdata\/","probeurl":"https:\/\/debuglog-lb2.sjc.kixeye.com\/debug\/recordloadtime\/","mapurl":"http:\/\/wc-kx-vip.sjc.kixeye.com\/worldmapv2\/","gamenamesh":"wc","integ":"kxp","low_level_min_userid":9378000,"low_level_rollout_userid":19767782,"platform_api_url":"https:\/\/api.kixeye.com\/","app_enable_response_checksum":1,"app_enable_encrypt_body":1,"locale":"de_DE","splashloader":0,"siu":"https:\/\/wc-kx-vip.sjc.kixeye.com\/","worldmap_servers":"%5B%5B%22wc-fb-gsvip1.sjc.kixeye.com%22%2C2%2C%2280%2C8080%2C8000%2C50000%2C53%2C443%22%5D%2C%5B%22wc-fb-gsvip2.sjc.kixeye.com%22%2C3%2C%2280%22%5D%5D","logsessionid":"200246171465722233","user_level":39,"tutorialstage":"1000"},
				'jflashvarsf'               :{"kxid":"510c331cc64b6856630036f3","a":"216862461657375","g":"warcommander","username":"UniqueName","email":"andisthermal555@gmail.com","expireAt":1465736631,"status":"active","userIp":"111.94.71.47","facebookId":"1099366247","facebookTokenForBusiness":"AbzVFs_yl51ghNTF","token_for_business":"AbzVFs_yl51ghNTF","signed_request":"1tSt6uCrchy4AK_uMhhsGt2uee-4h1uA0Lxb93wn10M=.eyJreGlkIjoiNTEwYzMzMWNjNjRiNjg1NjYzMDAzNmYzIiwiYSI6IjIxNjg2MjQ2MTY1NzM3NSIsImciOiJ3YXJjb21tYW5kZXIiLCJ1c2VybmFtZSI6IlVuaXF1ZU5hbWUiLCJlbWFpbCI6ImFuZGlzdGhlcm1hbDU1NUBnbWFpbC5jb20iLCJleHBpcmVBdCI6MTQ2NTczNjYzMSwic3RhdHVzIjoiYWN0aXZlIiwidXNlcklwIjoiMTExLjk0LjcxLjQ3IiwiZmFjZWJvb2tJZCI6IjEwOTkzNjYyNDciLCJmYWNlYm9va1Rva2VuRm9yQnVzaW5lc3MiOiJBYnpWRnNfeWw1MWdoTlRGIn0=","userid":20024617,"newuser":0,"apiurl":"https:\/\/wc-kx-vip.sjc.kixeye.com\/api\/","wmbasemanurl":"https:\/\/wc-kx-vip.sjc.kixeye.com\/wmbaseman\/","baseurl":"http:\/\/wc-kx-vip.sjc.kixeye.com\/api\/wc\/base\/","cdnurl":"https:\/\/wc-fb-cdn6.kixeye.com\/","gameurl":"https:\/\/wc-fb-cdn6.kixeye.com\/game\/","statsurl":"http:\/\/wc-kx-vip.sjc.kixeye.com\/recordstats.php","logurl":"https:\/\/debuglog-lb2.sjc.kixeye.com\/debug\/recorddebugdata\/","probeurl":"https:\/\/debuglog-lb2.sjc.kixeye.com\/debug\/recordloadtime\/","mapurl":"http:\/\/wc-kx-vip.sjc.kixeye.com\/worldmapv2\/","gamenamesh":"wc","integ":"kxp","low_level_min_userid":9378000,"low_level_rollout_userid":19767782,"platform_api_url":"https:\/\/api.kixeye.com\/","app_enable_response_checksum":1,"app_enable_encrypt_body":1,"locale":"de_DE","splashloader":0,"siu":"https:\/\/wc-kx-vip.sjc.kixeye.com\/","worldmap_servers":"%5B%5B%22wc-fb-gsvip1.sjc.kixeye.com%22%2C2%2C%2280%2C8080%2C8000%2C50000%2C53%2C443%22%5D%2C%5B%22wc-fb-gsvip2.sjc.kixeye.com%22%2C3%2C%2280%22%5D%5D","logsessionid":"200246171465722233","user_level":39,"tutorialstage":"1000","visitBtn":"Visit","homeBtn":"Home","inviteBtn":"Invite a friend"},
				'game_width'                :'100%',
				'game_height'               :'750',
				'fswf_height'               :'133',
				'fswfversion'               :'11',
				'user'                      :user,
				'cdnurl'                    :cdnurl,
				'assetsurl'                 :'https://wc-fb-cdn6.kixeye.com/game/assets/',
				'kontagent_url'             :'',
				'kontagent_api_key'         :'',
				'kontagent_api_version'     :'',
				'kx_logger_url'             :'https://bi-logging.sjc.kixeye.com/log',
				'kx_logger_key'             :'qwerty',
				'kx_logger_env'             :'prod',
				'kx_logger_st'              :'load',
				'giftredir'                 :0,
                'opt_showleaderboard'       :0, // how many millis delay before showing leaderboard popup, 0 is "never"
				'fbdata'                    :fbdata,
				'logurl'                    :logurl,
				'logsessionid'              :'200246171465722233',
				'log_h'                     :'',
				'log_hn'                    :'',
				'canvas_init_time'          :canvasInitTime,
				'canvas_load_time'          :loadDiff,
				'sourcestr'                 :'fbwcbo-aq-t1-18-65-fbid-wcfriendsofwhales-vg',
				'installts'                 :'1356552865',
				'fb_access_token'           :'',
				'adid'                      : '-1',
				'userid'                    :'20024617',
				'userlevel'                 :'39',
				'kx_biapp_url'              :'https://bi-logging.sjc.kixeye.com/kx/www/sr.php',
                'short_invite_flow'         :'0',
				'ipaddr'                    : '111.94.71.47',
                'fanpageurl'                :'http://www.facebook.com/warcommander',
                'local_currency'            :1,
				'fromstr'                   :'appcenter',
				'timeplayed'                :9998024,
				'gg_timeplayed'             :86400,
				'gg_max_spend'              :100,
				'onLoadPopup'               :{},
				'localcurrencypayments'     :'1',
				'tp_vendor_id'              : '2POKTDMF',
				'upLiveUrl'                 : '0',
                'loadflag'                  :'',     // WC-20233
                'enable_deep_thought'       : '1',
                'disable_bi_logging'       : '0',
                'declinedpermissions'       : '',
                'deep_thought_request_scheme' : 'https',
                'deep_thought_request_host' : 'webheads.prod.ae.kixeye.com',
                'deep_thought_client_request_path' : '/game/3/client/',
                'deep_thought_game_id' : 'WC',
                'deep_thought_client_key' : '816b01e9042837fb574abf2571d45c5ede0a9670',
                'deep_thought_client_secret' : '266a7d73988409c489edeeea9f45c0b4779326ba',
                'deep_thought_api_version' : 3			};
			cc = new CCFramework(ccdata);

			// preload bg images for requests
			var preload = new Array(); 
			function doPreload() 
			{
				for (i = 0; i < doPreload.arguments.length; i++) {
					preload[i] = new Image()
					preload[i].src = doPreload.arguments[i]
				}
			}
			doPreload (
				ccdata.assetsurl+'images/feeddialog/invite_friends_screen.png',
				ccdata.cdnurl+'images/gift/gift_bg_v3.png'
			);
		});
	</script>
		    <script type="text/javascript" src="https://kxl-cdn-static.kixeye.com/kxpprod/script/kxp-client.min.v203.js"></script>
	
	<script type='text/javascript'>
		window.addEvent('domready',function(){
		var rollovers = [];
		jQuery(".topnavmenuassets").each(
	    	function(){
	    		var asrc = this.src.replace("_reg","_over");
	    		img = new Image();
	    		img.src = asrc;
	    		rollovers[this.src] = img;
			}
	    );	
	    
	    jQuery(".topnavmenuassets").hover(
	    	function(){if(this.src in rollovers) { this.src = rollovers[this.src].src;} },
          	function(){this.src = this.src.replace("_over","_reg"); }
        );
	});
	</script>
