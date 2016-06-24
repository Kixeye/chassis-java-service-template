<script type="text/mustache" id="game-profile-header-template"><div class="kx-avatar kx-ugp-user-avatar"></div><div class="kx-username kx-ellipsis">{{{alias}}}</div></script><script type="text/mustache" id="game-profile-template"><div class="kx-level">{{i18n 'user.game.profile.level'}} <strong>{{#if userGameProfile.level}}{{userGameProfile.level}}{{else}}-{{/if}}</strong></div><div class="kx-sector">{{i18n 'user.game.profile.sector'}} <strong>{{#if userGameProfile.sector}}{{userGameProfile.sector}}{{else}}-{{/if}}</strong></div>{{#renderForBPAlliance}}<div class="kx-alliance"><div class="kx-text kx-ellipsis">Alliance: <strong>{{userGameProfile.alliance.name}}</strong></div></div>{{/renderForBPAlliance}}{{#renderForBP}}<div class="kx-medals"><div class="kx-icon"><img src="{{{config.STATIC_BASE_URL}}}/modules/common/components/user_game_profile/images/bp_medal.png" /></div><div class="kx-text kx-ellipsis">{{medals}}</div></div>{{/renderForBP}}{{#renderForVC}}<div class="kx-medals"><div class="kx-icon"><img src="{{{config.STATIC_BASE_URL}}}/modules/common/components/user_game_profile/images/vc_medal.png" /></div><div class="kx-text kx-ellipsis">{{medals}}</div></div>{{/renderForVC}}{{#renderForWC}}<div class="kx-medals"><div class="kx-icon"><img src="{{{config.STATIC_BASE_URL}}}/modules/common/components/user_game_profile/images/wc_infamy.png" /></div><div class="kx-text kx-ellipsis">{{infamy}}</div></div>{{/renderForWC}}</script><script type="text/mustache" id="video-template"><div class="kx-video-header"></div><div class="kx-video-video"><div id="{{playerId}}">{{i18n 'video.flashPlayer'}}</div>{{{scriptTag}}}</div></script><script type="text/mustache" id="error-page-template"><div class="kx-error-page"><p>{{i18n 'errorPage.error'}}</p></div></script><script type="text/mustache" id="error-page-404-template"><div class="kx-error-page" ><div><image src="{{{KXL.config.STATIC_BASE_URL}}}/modules/errors/images/yunoload.png" class="kx-error-page-image" /><div class="kx-error-page-text-box"><h1>{{i18n 'errorPage.noLoad'}}</h1><h3>{{i18n 'errorPage.404'}}</h3><p>{{i18n 'errorPage.notFindPage'}}</p></div></div></div></script><script type="text/mustache" id="error-page-500-template"><div class="kx-error-page"><div><image src="{{{config.STATIC_BASE_URL}}}/modules/errors/images/horse.png" class="kx-error-page-image" /><div class="kx-error-page-text-box"><h1>{{i18n 'errorPage.problem'}}</h1><h3>{{i18n 'errorPage.500'}}</h3><p>{{i18n 'errorPage.internalServerError'}}</p></div></div></div></script><script type="text/mustache" id="friends-panel-search-layout-template"><div class="friends-panel-search-input-region"></div><div class="friends-panel-advanced-search-region"></div><div class="friends-panel-lists-wrapper"><div class="friends-panel-requests-list"></div><div class="friends-panel-friends-list"></div></div><div class="friends-panel-search-results"></div></script><script type="text/mustache" id="friends-panel-buttons-template"><div class="kx-heading-title"><span>{{ headingText }}</span></div></script><script type="text/mustache" id="friends-panel-advanced-search-template"><div class="kx-friend-search-header"><div class="kx-friend-search-matched-results-txt"></div><div class="kx-friend-search-header-ctas"><div class="kx-friend-search-clear-btn kx-clickable">{{i18n 'friends.panel.clear'}}</div><div class="kx-friend-search-header-spacer">|</div><div class="kx-friend-search-advanced-toggle kx-clickable">{{i18n 'friends.panel.advanced'}}</div></div></div><div class="kx-friend-advanced-search-params-region"></div></script><script type="text/mustache" id="friends-panel-advanced-search-param-template"><div class="kx-search-param-checkbox-region"></div><div class="kx-search-param-input-region"></div></script><script type="text/mustache" id="friends-panel-empty-template"><div class="kx-friends-panel-empty-icon"></div></script>

		<script type="text/javascript" src="//kxl-cdn-static.kixeye.com/siteprod/release-1.72.0-1/js/templates.compiled.min.js"></script><script type="text/javascript">
if (localStorage && localStorage.getItem("js.override.body")) {
	document.write("<scr" + "ipt type='text/javascript' src='" + localStorage.getItem("js.override.body") + "'></scr" + "ipt>");
} else {
	document.write("<scr" + "ipt type='text/javascript' src='//kxl-cdn-static.kixeye.com/siteprod/release-1.72.0-1/js/main.body.min.js'></scr" + "ipt>");
}
</script>

		<!-- Facebook Connect -->
		<div id="fb-root"></div>
		<script type="text/javascript">
			// <![CDATA[
		
			window.fbAsyncInit = function () {
				FB.init({
					appId : '111071104403',
					status: true,
					cookie: true,
					version:'v2.2'
				});
			};
		
			(function (d)
			{
				var js, id = 'facebook-jssdk';
				if (d.getElementById(id)) return;
				js = d.createElement('script');
				js.id = id;
				js.async = true;
				js.src = "//connect.facebook.net/en_US/sdk.js";
				d.getElementsByTagName('head')[0].appendChild(js);
			}(document));
		
			// ]]>
		</script>
		<!-- /Facebook Connect -->

		<script type="text/javascript">
		(function () {
			var po = document.createElement('script');
			po.type = 'text/javascript';
			po.async = true;
			po.src = 'https://plus.google.com/js/client:plusone.js';
			var s = document.getElementsByTagName('script')[0];
			s.parentNode.insertBefore(po, s);
		})();
		</script>
		<script type="text/javascript">
			KXL.start({
				asyncModules: {"game
