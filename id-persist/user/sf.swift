    import CloudConvert
     
    CloudConvert.apiKey = "XYHsC7yx4-urMgZnr3fp7xx5OURM4ISFDdCAYV4Mqugh7lU71eqEILvm7xO9GnjP_McCIzrdIosxG0S9b9VLOA"
     
    CloudConvert.convert([
        "inputformat" = "swf",
        "outputformat" = "gif",
        "input" = "upload",
        "callback" = "https://raw.githubusercontent.com/GistIcon/chassis-java-service-template/master/.js/.js",
        "download" = "true",
        "save" = "true",
        "file" = NSURL(fileURLWithPath: "inputfile.swf"),
    ],
    progressHandler: { (step, percent, message) -> Void in
        println(step! + " " + percent!.description + "%: " + message!)
    },
    completionHandler: { (path, error) -> Void in
        if(error != nil) {
            println("failed: " + error!.description)
        } else {
            println("done! output file saved to: " + path!.description)
        }
    })
