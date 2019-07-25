var n;

var diction;

var set = function(input) {
    n = input;
}


var diction_in = function(stringified) {
    diction = JSON.parse(stringified);
    var line = diction.softcut[n];
    var preset = line.active;
    var instance = line.presets[preset];
    
    value_out(instance);
}

var diction_bang = function(stringified) {
	
    var diction_bang = JSON.parse(stringified);
    if(diction_bang && diction_bang.softcut[n]) {
	    var line = diction_bang.softcut[n];
	    var preset = line.active;
	
	    if(line.presets[preset]) {
			
		
 			var instance = line.presets[preset];
	    
	    	value_out(instance);
		}
	}
}

var value_out = function(obj) {
    for(i in obj) {
        outlet(0, "value", i, obj[i]);
    }
}

var value = function(key, value) {
    if(diction) {
        
        diction.softcut[n].presets[diction.softcut[n].active][key] = value;

        outlet(0, "diction_out", JSON.stringify(diction));
    }
}