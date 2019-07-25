var diction;

var diction_in = function(stringified) {
    diction = JSON.parse(stringified);
    
    value_out();
}

var value_out = function() {
    for(line in diction.softcut) {
        var preset = diction.softcut[line].presets[diction.softcut[line].active];
        
        for(key in preset) {
            
        }
    }
}

var value = function(key, line, value) {
    
    if(diction) {
        
        if(line < 0) {
            for(var i in diction.softcut) {
                diction.softcut[i].presets[diction.softcut[i].active][key] = value;
            }
        }
        else diction.softcut[line].presets[diction.softcut[line].active][key] = value;

        outlet(0, "diction_out", JSON.stringify(diction));
    }
}