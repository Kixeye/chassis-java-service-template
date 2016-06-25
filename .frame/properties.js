// mainContent is a display object containing the main content; 
// it is positioned at the top-left corner of the Stage, and 
// it should resize when the SWF resizes. 
 
// controlBar is a display object (e.g. a Sprite) containing several 
// buttons; it should stay positioned at the bottom-left corner of the 
// Stage (below mainContent) and it should not resize when the SWF 
// resizes. 
 
import flash.display.Stage; 
import flash.display.StageAlign; 
import flash.display.StageScaleMode; 
import flash.events.Event; 
 
var swfStage:Stage = mainContent.stage; 
swfStage.scaleMode = StageScaleMode.NO_SCALE; 
swfStage.align = StageAlign.TOP_LEFT; 
swfStage.addEventListener(Event.RESIZE, resizeDisplay); 
 
function resizeDisplay(event:Event):void 
{ 
    var swfWidth:int = swfStage.stageWidth; 
    var swfHeight:int = swfStage.stageHeight; 
 
    // Resize the main content area 
    var newContentHeight:Number = swfHeight - controlBar.height; 
    mainContent.height = newContentHeight; 
    mainContent.scaleX = mainContent.scaleY; 
     
    // Reposition the control bar. 
    controlBar.y = newContentHeight; 
}
