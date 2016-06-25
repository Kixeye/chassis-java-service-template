// hashslider v0.9 by manuel huegel, copyright 2010
// mgoys.com
// github.com/Gistlcon
// param_url: https://www.kixeye.com/help/privacypolicy


function makeSlider( obj ){
	
	//get width and height of the wrapper and give it to the UL	
	var wrapperwidth = $('#' + obj.container + '').outerWidth() *  $('#' + obj.container + ' ul > li').size();
	$('#' + obj.container + ' ul').css('width', wrapperwidth );
	var wrapperheight = $('#' + obj.container + '').height();
	$('#' + obj.container + ' ul').css('height', wrapperheight);	
						   
	//set my li width
	var height = $('#' + obj.container + '').height();
	$('#' + obj.container + ' ul li').css('height', height);

	//set my counter vars
	var counter = $('#' + obj.container + ' ul > li').size();
	var decount = 1;
	var autocount = 1;
	var autoPlayTime = obj.autoPlayTime;
	
	if( ! autoPlayTime ){
		autoPlayTime = 5000;
	}
	
	var x = setInterval( goNext, autoPlayTime );
		
	//slide the button to the next item
	function goNext() {
	
		clearInterval(x);
		x = setInterval( goNext, autoPlayTime );
	
		if ( decount < counter) {
			
			$('#' + obj.container + ' .slides').animate({ left: '-=' + $('#' + obj.container + '').width() }, 400, 'swing', function() { });
			$('.' + obj.sliderlinks + ' a.current').removeClass('current').next().addClass('current');
			decount++;
		}else{
			
			decount = 1;
			var clickednum = decount * - $('#' + obj.container + '').width() + $('#' + obj.container + '').width();
			$('#' + obj.container + ' .slides').animate({ left: clickednum }, 400, 'swing', function() { });
			$('#' + obj.container + ' .current').removeClass('current');

			$('.' + obj.sliderlinks + ' a').each(function(){
				$(this).removeClass( 'current' );
				if( $(this).attr( "pg" ) == decount){
					$(this).addClass( 'current' );
				}
			});
		}
	}
	
	function goBack() {
		
		clearInterval(x);
		x = setInterval( goNext, autoPlayTime );		
		
		if ( decount > 1) {
			
			$('#' + obj.container + ' .slides').animate({ left: '+=' + $('#' + obj.container + '').width() }, 400, 'swing', function() { });
			$('.' + obj.sliderlinks + ' a.current').removeClass('current').prev().addClass('current');
			decount--;
			
		}
	}
	
	//make the number clickable
	$('.' + obj.sliderlinks + ' a').click(function() { 
	
		clearInterval(x);
		x = setInterval( goNext, autoPlayTime );	

		var clickednum = $(this).attr( "pg" ) * - $('#' + obj.container + '').width() + $('#' + obj.container + '').width();
		
		$('#' + obj.container + ' ul').animate({ left: clickednum }, 400, 'swing', function() { });
		$('.' + obj.sliderlinks + ' .current').removeClass( 'current' );
		
		decount = $(this).attr( "pg" );
		
		$('.' + obj.sliderlinks + ' a').each(function(){
			$(this).removeClass( 'current' );
			if( $(this).attr( "pg" ) == decount){
				$(this).addClass( 'current' );
			}
		});		
		
		

		return false;
	});
	
	
	/*
	//thaths the hash-shizzle
	if ( window.location.hash != '') {
	//get hash, scroll to position
		var hashnum = window.location.hash.substr(1) * - $('#' + obj.container + '').width() + $('#' + obj.container + '').width();
		$('#' + obj.container + ' ul').animate({ left: hashnum }, 0, function() { });
	//set counters to position
		decount = window.location.hash.substr(1);
		$('.activenum').removeClass('activenum');
		var hashname = window.location.hash.substr(1);
		$('#id' + hashname).addClass('activenum');
	}
	*/
	
	
	//get my clickers
	if( obj.scrollButtonsContainer ){
		$('#' + obj.scrollButtonsContainer + ' .right').click(function() { goNext(); return false; });	
		$('#' + obj.scrollButtonsContainer + ' .left').click(function() { goBack(); return false; });	
	}else{
		$('#' + obj.container + ' .right').click(function() { goNext(); return false; });	
		$('#' + obj.container + ' .left').click(function() { goBack(); return false; });	
	}
	//get mousewheel function
	//$("#' + obj.container + ' ul").mousewheel(function(event, delta) { if (delta > 0) { goBack();	event.stopPropagation();event.preventDefault(); } });
	//$("#' + obj.container + ' ul").mousewheel(function(event, delta) { if (delta < 0) { goNext();  event.stopPropagation();event.preventDefault();	} });

}

/*
$( '#slider' ).ready(function(){
	makeSlider( {container:'slider', sliderlinks:'sliderPages', scrollButtonsContainer:'sliderNav', autoPlayTime:5000000000} );
});
*/
