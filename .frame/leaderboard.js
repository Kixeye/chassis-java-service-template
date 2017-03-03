var toggleLB = function(tab)
{
	if(tabSelected == tab) return false;
	tabSelected = tab;
	
	tabList.each(function(v){
		if(v == tab)
		{
			$('lb-'+v).show();
			$('lb-'+v+'-toggle').addClass('selected');
		}
		else
		{
			$('lb-'+v).hide();
			$('lb-'+v+'-toggle').removeClass('selected');
		}
	});
}

function openRequestDialog(invite_content)
{
	if(cc.options.integ == 'kxp')
	{
		cc.kxp_showFeedDialog("invite", null);
	}
	else if(cc.options.integ == 'fbg')
	{
		cc.fbNewRequest(invite_content, ['app_non_users'],
			{
				success: function(request_id,fbids)
				{
					new Request.JSON({
						url: cc.options.localurl+'backend/sendinvite?'+cc.options.fbdata,
						onSuccess: function(data){}
					}).post(Object.toQueryString({request_id:request_id,fbids:fbids.join(',')}));
				},
				fail: function(response) {}
			},"IN:<?=$invite_id?>");
	}
}

function setupMagnifyingGlasses()
{
	img = new Image();
    img.src = cc.options.cdnurl + "images/leaderboard/friend_magnify.png";
    img2 = new Image();
    img2.src = cc.options.cdnurl + "images/leaderboard/friend_magnify_hover.png";
    
    jQuery(".mag_glass").hover(
    	function(){this.src = img2.src;},
      	function(){this.src = img.src;}
    );
}

function setupWeeklyCountdowns(weekly_reset_time)
{
	if(weekly_reset_time > 3600) //if greater than 1 hour left, show the countdown, otherwise just say "less than an hour"
    {
    	jQuery('#weekly_reset_countdown_t').countdown({until: "+"+weekly_reset_time, compact: true, layout: '{desc} {dn}{dl} {hnn}h {mnn}m', description: 'Leaderboard resets in '});
    	jQuery('#weekly_reset_countdown_w').countdown({until: "+"+weekly_reset_time, compact: true, layout: '{desc} {dn}{dl} {hnn}h {mnn}m', description: 'Leaderboard resets in '});
    }
    else
    {
    	jQuery('#weekly_reset_countdown_t').html("Leaderboard resets in less than 1 hour");
    	jQuery('#weekly_reset_countdown_w').html("Leaderboard resets in less than 1 hour");
    }
}

function setupEventCountdowns(event_end_time)        
{
    if(event_end_time > 3600)
    {
    	jQuery('#weekly_reset_countdown_e').countdown({until: "+"+event_end_time, compact: true, layout: '{desc} {dn}{dl} {hnn}h {mnn}m', description: 'Event ends in '});
    	jQuery('#weekly_reset_countdown_ew').countdown({until: "+"+event_end_time, compact: true, layout: '{desc} {dn}{dl} {hnn}h {mnn}m', description: 'Event ends in '});
    }
    else if(event_end_time > 0)
    {
    	jQuery('#weekly_reset_countdown_e').html("Event ends in less than 1 hour");
    	jQuery('#weekly_reset_countdown_ew').html("Event ends in less than 1 hour");
    }
    else
    {
    	jQuery('#weekly_reset_countdown_e').html("This event has ended. The Leaderboard will be visible for 48 hours.");
    	jQuery('#weekly_reset_countdown_ew').html("This event has ended. The Leaderboard will be visible for 48 hours.");
    }
}
