// imported from cc_framework
(function($)
{
	var ms = new messageSrv();
	var globalQueue = [];
	var heartBeatQueue = $({});
	var updateInterval = 60000;
	var globalCountdownFunc = function()
	{
		if (globalQueue.length < 1)
		{
			return;
		}
		$.each(globalQueue,function(k, v)
		{
			heartBeatQueue.queue('hb', function(next)
			{
				v();
				globalQueue.shift();
				if (typeof(next) == "function")
				{
					next();
				}
			});
		});
		
		heartBeatQueue.dequeue('hb');
	};
	var ditFunc = function(data)
	{
		var count = this.count;
		globalQueue.push(function()
		{
			if ($('#down_in_timer').length)
			{
				var durText = ((data.duration/1000) <= 10 ? 'Just a few seconds.' : getDuration((data.duration/1000)));
				$('#down_in_timer').text(durText);
			}
		});
	};
	
	$(window).ready(function()
	{
		ms.init();
		new countdown(null,(1000*60*60*24*365),null,null,globalCountdownFunc).start();
	});
	
	function messageSrv()
	{
		this.cdTimerObj = null;
        this.previousData = null;
		
		this.init = function()
		{
			var url = localurl+"backend/getmessage";
			$.ajax(
			{
				url: url,
                type: 'POST',
				success: function(data)
				{
					if((data.advert || typeof(data.down_in) != "undefined" || data.down_in > 0) && data.userid >= data.aduidrange['min'] && data.userid < data.aduidrange['max'])
					{
                       var defaultTimerText = ($('#down_in_timer').length ? $('#down_in_timer').text() : "");
						$('#above-game-message').html(data.advert);
						
						if (ms.cdTimerObj != null && typeof(ms.cdTimerObj.stop) != "undefined")
						{
							this.cdTimerObj.stop();
						}
						
						if (typeof(data.down_in) != "undefined" || data.down_in > 0) {

                            $('#above-game-message').append('<br />Scheduled downtime in: <span id="down_in_timer">' + defaultTimerText + '</span>');

                            if ((data.down_in * 1000) > updateInterval) {
                                ms.cdTimerObj = new countdown(null, (data.down_in * 1000), updateInterval, null, ditFunc, ms.init).start();
                            }
                            else {
                                ms.cdTimerObj = new countdown(null, (updateInterval - (data.down_in * 1000)), updateInterval, null, ditFunc, ms.init).start();
                            }
                        } else {
                            setTimeout(ms.init,updateInterval);
                        }
                        ms.showMATGBlastPopup(data, ms.previousData);
                        ms.previousData = data;
					}
					else
					{
						$('#above-game-message').html('');
                        setTimeout(ms.init,updateInterval);
					}
				},
				dataType: 'json',
				data: fbdata
			});
		};

        this.showMATGBlastPopup = function(currentData, oldData) {
            if(oldData != null) {
                var msg = "";
                if(oldData.advert != currentData.advert && (typeof(oldData.down_in) == "undefined" && typeof(currentData.down_in) != "undefined")) {
                    var defaultTimerText = getDuration(currentData.down_in);
                    msg = currentData.advert + "<br /> " + 'Scheduled downtime in: <span id="down_in_timer">'+defaultTimerText+'</span>';
                } else if(oldData.advert != currentData.advert) {
                    msg = currentData.advert;
                } else if(typeof(oldData.down_in) == "undefined" && typeof(currentData.down_in) != "undefined") {
                    var defaultTimerText = getDuration(currentData.down_in);
                    msg = 'Scheduled downtime in: <span id="down_in_timer">'+defaultTimerText+'</span>';
                }

                var swf = document.getElementById("gameswf");
                if (msg != "" && (swf != null || swf != undefined)) {

                    var  tmp = document.createElement("div");
                    tmp.innerHTML = msg;

                    var textMsg = tmp.textContent || tmp.innerText;

                    //console.log(textMsg);

                    swf.showAlertPopup(textMsg);
                }
            }
        };

        this.MATGCallback = function(data) {
            console.log(data);
        };
	}
	
	function countdown(started,duration,halt,inc,func,cb)
	{
		this.timer		= null;
		this.startTs	= new Date().getTime()-((started === null) ? 0 : started);
		this.endTs		= this.startTs+duration;
		this.func		= func;
		this.cb			= cb;
		this.inc		= inc;
		this.start		= function()
		{
			this.stop();
			var self	= this;
			this.timer	= setInterval(function(){doCountdown(self);},(this.inc !== null ? this.inc : 100));
		};
		this.stop		= function()
		{
			clearInterval(this.timer);
			this.timer	= null;
		};
		this.halt = halt;
		this.count = 0;
		return this;
	}
	
	function doCountdown(obj)
	{
		var currentTs = new Date().getTime();
		obj.func(
		{
			duration:	(obj.endTs-currentTs),
			percent:	(((currentTs-obj.startTs)/(obj.endTs-obj.startTs))*100)
		});
		
		if (obj.halt)
		{
			if (currentTs >= (obj.startTs+obj.halt))
			{
				obj.stop();
				
				if (typeof(obj.cb) != "function") return;
				obj.cb();
				
				return;
			}
		}
		
		if (currentTs < obj.endTs) return;
		obj.stop();
		
		if (typeof(obj.cb) != "function") return;
		obj.cb();
	}
	
	function getDuration(seconds,remSigFig)
	{
		remSigFig = (remSigFig === null) ? false : remSigFig;
		seconds				= Math.ceil(seconds);
		if (seconds == '0')
		{
			return '0 secs';
		}
		var days			= Math.floor(seconds / (24*60*60))+'';
		var hours			= Math.floor((seconds - (days * (24*60*60))) / (60*60))+'';
		var minutes			= Math.floor((seconds - (days * (24*60*60)) - (hours * (60*60))) / (60))+'';
		seconds				= Math.floor((seconds - (days * (24*60*60)) - (hours * (60*60)) - (minutes * (60))))+'';
		var noDays			= (days == '0') ? true : false;
		var noHours			= (hours == '0') ? true : false;
		var noMins			= (minutes == '0') ? true : false;
		var noSecs			= (seconds == '0') ? true : false;
		pdays				= (days == 1) ? 'day' : 'days';
		phours				= (hours == 1) ? 'hr' : 'hrs';
		pminutes			= (minutes == 1) ? 'min' : 'mins';
		pseconds			= (seconds == 1) ? 'sec' : 'secs';
		var returnDurString	= (noDays) ? '' : days+pdays+' ';
		returnDurString		+= (noHours && noDays) ? '' : (remSigFig === true && noHours) ? '' : hours+phours+' ';
		returnDurString		+= (remSigFig === true && noMins) ? '' : minutes+pminutes+' ';
		returnDurString		+= (remSigFig === true && noSecs) ? '' : seconds+pseconds;
		
		return returnDurString;
	}
})(jQuery);