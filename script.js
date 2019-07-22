inlets = 1;
outlets = 1;

include("grid.js");
include("andrew.js");

var controls = {}

var TT = 4;
var LO = 8;
var HI = 12;

var page = 0;

var locked = 0;

var g = grid.connect();

var update = function(h, i, j, v) {
	if (controls[h][i][j].v != v) {
		controls[h][i][j].event(v);
		controls[h][i][j].v = v;
	}
	
	controls[h][i][j].draw(g);
    
	redraw();
	g.refresh();
}

var update2 = function(h, i, j, k, v, index) {
    post(controls[h][i][j].i, index);
    
    if(controls[h][i][j].i == index) {
        if (controls[h][i][j][k].v != v) {
            controls[h][i][j][k].event(v);
            controls[h][i][j][k].v = v;
        }
    }

    controls[h][i][j][k].draw(g);

    g.refresh();
}

g.event = function(x, y, z) {
	for(h in controls) {
		for(i in controls[h]) {
            if(controls[h][i]) {
                for(j in controls[h][i]) {
                    if(controls[h][i][j] && controls[h][i][j].look) {
                        if(controls[h][i][j].look(x, y, z)) {
                            for(l in controls[h][i]) {
                                if(!(controls[h][i][j].ispattern) && controls[h][i][l].ispattern) {
                                    controls[h][i][l].store(h, i, j, controls[h][i][j].v);
                                }
                            }
                        }

                        if(controls[h][i][j].draw) controls[h][i][j].draw(g);
                    } else {
                        for(k in controls[h][i][j]) {
                            if(controls[h][i][j][k] && controls[h][i][j][k].look) {
                                if(controls[h][i][j][k].look(x, y, z)) {
                                    for(l in controls[h][i][j]) {
                                        if(!(controls[h][i][j][k].ispattern) && controls[h][i][j][l].ispattern) {
                                            controls[h][i][j][l].store(h, i, j, k, controls[h][i][j][k].v);
                                        }
                                    }
                                }

                                if(controls[h][i][j][k].draw) controls[h][i][j][k].draw(g);
                            }
                        }
                    }
                }
            }
		}
	}
	
    output(JSON.stringify(get()), null, 2);
	g.refresh();
}

var redraw = function() {
	g.all(0);
	for(h in controls) {
		for(i in controls[h]) {
			for(j in controls[h][i]) {
				if(controls[h][i][j].draw) controls[h][i][j].draw(g);
                else {
                    for(k in controls[h][i][j]) {
                        if(controls[h][i][j][k].draw) controls[h][i][j][k].draw(g);
                    }
                }
			}
		}
	}
}

var refresh = function() {
	
}

var Preset = function(n, i) {
    this.i = i;
    this.r = new Toggle(0, [0, n], [0, HI], function() { return page == 0; });
	this.m = new Toggle(0, [1, n], [0, HI], function() { return page == 0; });
	this.rev = new Toggle(0, [2, n], [LO, HI], function() { return page == 0; });
	this.s = new Value(2, [[3, 4, 5, 6, 7], n], [[0, 0, LO, 0, 0], HI], function() { return page == 0; }); //this.s.output = function(v) { return v - 2; }
    this.buf = new Value(n % 4, [[8, 9, 10, 11], n], [[0, 0, 0, 0], HI], function() { return page == 0; });
    this.pat = new Pattern(0, [15, n], [0, LO, HI], function() { return page == 0; }, update2, i);
    
    this.get = function() { return {
        r: this.r.get(),
        m: this.m.get(),
        rev: this.rev.get(),
        s: this.s.get(),
        buf: this.buf.get(),
        pat: this.pat.get(),
    }}
    
    this.set = function(input) {
        this.r.set(input.r);
        this.m.set(input.m);
        this.rev.set(input.rev);
        this.s.set(input.s);
        this.buf.set(input.buf);        
        this.pat.set(input.pat);
    }
}

var Line = function(n) {
    var me = this;
    me.n = n;
    
    this.presets = [];
    
    this.preset;
    
    this.menu = new Value(0, [[0, 1, 2, 3, 4, 5, 6, 7], n], [[0,0,0,0,0,0,0,0], HI], function() { return page == n + 1; });
    this.menu.event = function(v, last) {
        if(me.presets[v]) {
            me.preset = me.presets[v];
        } else {
            me.presets[v] = new Preset(me.n, v);
            if(me.preset) me.presets[v].set(me.preset.get());
            me.preset = me.presets[v];
            
            this.b[0][v] = TT;
        }
    }
    this.menu.event(0, 0);
    this.menub = new Momentary(0, [14, n], [TT, HI], function() { return page < 9; });
    this.menub.event = function(v) {
		this.v = v;
        this.v ? page = n + 1 : locked ? page = page : page = 0;
		
		redraw();
        g.refresh();
    }
    this.send = new Toggles([], [[12,13],n], [[0,0], LO], function() { return page == 0; });
    this.pat = new Pattern(0, [15, n], [0, LO, HI], function() { return page == n + 1; }, update);
    
    this.get = function() { 
        ret = {
            menu: this.menu.get(),
            send: this.send.get(),
            pat: this.pat.get(),
            presets: []
        } 
        
        for(var i=0; i < this.presets.length; i++) {
            ret.presets[i] = this.presets[i].get();
        }
        
        return ret;
    }
    
    this.set = function(input) {
        for(var i=0; i < input.presets.length; i++) {
            this.presets[i].set(input.presets[i]);
        }
        
        this.menu.set(input.menu);
        this.send.set(input.send);
        this.pat.set(input.pat);
    }
}

var get = function() {
    thing = [];
    
//    for(var i = 0; i < controls.lines.length; i++) {
//        ret[i] = controls.lines[i].get();
//    }
    
    for(var i = 0; i < controls.lines.length; i++) {
        thing[i] = controls.lines[i].get();
    }
    
    return thing;
}

var init = function() {
    controls.lines = [];
    
	for(var i = 0; i < 8; i++) {
 		controls.lines[i] = new Line(i);
		
		for(j in controls.lines[i]) {
			if(controls.lines[i][j].draw) {
				controls.lines[i][j].draw(g);
			}
		}
	}
	
	redraw();
	g.refresh();
}

