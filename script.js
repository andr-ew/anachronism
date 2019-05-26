inlets = 1;
outlets = 1;

include("grid.js");

var controls = {}
controls.tracks = [];
controls.globals = [];

var LO = 7;
var HI = 11;

var page = 0;
//0 = start
//1-8 = presets
//9-16 = routers

//--------------------------------------------------------------

function Control(v, p, b, pg) {
	this.v = v;
	this.p = p;
	this.b = b;
	this.pg = pg;
	this.event = function() {}
	this.output = function(v) { return v }
}

Control.prototype.draw = function(g) {}
Control.prototype.look = function() {}

var Toggle = function(v, p, b, pg) {
	Control.call(this, v, p, b, pg);
}

Toggle.prototype = Object.create(Control.prototype);

Toggle.prototype.draw = function(g) {
	if(this.pg()) {	
		//post(this.p[0], this.p[1], this.b[this.v])
		g.led(this.p[0], this.p[1], this.b[this.v]);
	}
}
	
Toggle.prototype.look = function(x, y, z) {
	if(this.pg()) {
		if(x == this.p[0] && y == this.p[1]) {
			if(z == 0) {
				var last = this.v;
				this.v = Math.abs(this.v - 1)
				this.event(this.v, last);
				
				return 1;
			}
		}
	}
}

var Momentary = function(v, p, b, pg) {
	Toggle.call(this, v, p, b, pg);
}

Momentary.prototype = Object.create(Toggle.prototype);

Momentary.prototype.look = function(x, y, z) {
	if(this.pg()) {
		if(x == this.p[0] && y == this.p[1]) {
			var v = z
			this.event(v);
			this.v = v;
			
			return 1;
		}
	}
}
	
var Value = function(v, p, b, pg) {
	Control.call(this, v, p, b, pg);
}

Value.prototype = Object.create(Control.prototype);

Value.prototype.draw = function(g) {
	if(this.pg()) {
		var bb = this.b[0].slice();
		bb[this.v] = this.b[1];
		
		if(this.p[0].length) {
			for(var i = 0; i < this.p[0].length; i++) {
				g.led(this.p[0][i], this.p[1], bb[i]);
			}
		} 
		else {
			
			for(var i = 0; i < this.p[1].length; i++) {
				g.led(this.p[0], this.p[1][i], bb[i]);
			}
		}
	}
}

Value.prototype.look = function(x, y, z) {
	if(this.pg()) {
		if(this.p[0].length) {
			if(y == this.p[1]) {
				for(var i = 0; i < this.p[0].length; i++) {
					if(this.p[0][i] == x && z == 1) {
						var v = i;
						this.event(v);
						this.v = v;
						
						return 1;
					}
				}
			}
		}
		else {
			if(x == this.p[0]) {
				for(var i = 0; i < this.p[1].length; i++) {
					if(this.p[1][i] == y && z == 1) {
						var v = i;
						this.event(v);
						this.v = v;
						
						return 1;
					}
				}
			}
		}
	}
}

var Toggles = function(v, p, b, pg) {
	Control.call(this, v, p, b, pg);
}

Toggles.prototype = Object.create(Control.prototype);

Toggles.prototype.draw = function(g) { 
	if(this.pg()) {
		var bb = this.b[0].slice();
		
		for(var i = 0; i < this.v.length; i++) {
			bb[this.v[i]] = this.b[1];
		}
		
		if(this.p[0].length) {
			for(var i = 0; i < this.p[0].length; i++) {
				g.led(this.p[0][i], this.p[1], bb[i]);
			}
		} 
		else {
			for(var i = 0; i < this.p[1].length; i++) {
				g.led(this.p[0], this.p[1][i], bb[i]);
			}
		}
	}
}

Toggles.prototype.look = function(x, y, z) {
	if(this.pg()) {
		if(this.p[0].length) {
			if(y == this.p[1]) {
				for(var i = 0; i < this.p[0].length; i++) {
					if(this.p[0][i] == x && z == 1) {
						var last = this.v.slice();
						var added = -1;
						var removed = -1;
						
						var thing = this.v.indexOf(i);
						
						if(thing == -1) {
							this.v.push(i);
							this.v.sort(function(a, b) { return a - b; });
							
							var added = i;
						}
						else {
							this.v.splice(thing, 1);
							
							var removed = i;
						}
						
						this.event(this.v, last, added, removed);
						
						return 1;
					}
				}
			}
		}
		else {
			if(x == this.p[0]) {
				for(var i = 0; i < this.p[1].length; i++) {
					if(this.p[1][i] == y && z == 1) {
						var last = this.v.slice();
						var added = -1;
						var removed = -1;
						
						var thing = this.v.indexOf(i);
						
						if(thing == -1) {
							this.v.push(i);
							this.v.sort(function(a, b) { return a - b; });
							
							added = i;
						}
						else {
							this.v.splice(thing, 1);
							
							removed = i;
						}
						
						this.event(this.v, last, added, removed);
						
						return 1;
					}
				}
			}
		}
	}
}

var Momentaries = function(v, p, b, pg) {
	Toggles.call(this, v, p, b, pg);
}

Momentaries.prototype = Object.create(Toggles.prototype);

Momentaries.prototype.look = function(x, y, z) {
	if(this.pg()) {
		if(this.p[0].length) {
			if(y == this.p[1]) {
				for(var i = 0; i < this.p[0].length; i++) {
					if(this.p[0][i] == x) {
						var last = [];
						if(this.v) last = this.v.slice();
						var added = -1;
						var removed = -1;
						
						if(z == 1 && this.v.indexOf(i) == -1) {
							this.v.push(i);
							this.v.sort(function(a, b) { return a - b; });
							
							added = i;
						}
						else {
							this.v.splice(this.v.indexOf(i), 1);
							
							removed = i;
						}
						
						this.event(this.v, last, added, removed);
						
						return 1;
					}
				}
			}
		}
		else {
			if(x == this.p[0]) {
				for(var i = 0; i < this.p[1].length; i++) {
					if(this.p[1][i] == y && z == 1) {
						var last = this.v.slice();
						var added = -1;
						var removed = -1;
						
						if(z == 1 && this.v.indexOf(i) == -1) {
							this.v.push(i);
							this.v.sort(function(a, b) { return a - b; });
							
							added = i;
						}
						else {
							this.v.splice(this.v.indexOf(i), 1);
							
							removed = i;
						}
						
						this.event(this.v, last, added, removed);
						
						return 1;
					}
				}
			}
		}
	}
}

var Fader = function(v, p, b, pg) {
	Value.call(this, v, p, b, pg);
	
	this.pp = p[0].slice();
	this.bb = b[0];
	
	//var value = new Value(v, p, b, pg);
	this.p[0] = [];
	this.b[0] = [];
	
	for(var i = this.pp[0]; i <= this.pp[1]; i++) {
		this.p[0][i - this.pp[0]] = i;
		this.b[0][i] = this.bb;
	}
}

Fader.prototype = Object.create(Value.prototype);

Fader.prototype.draw = function(g) {
	if(this.pg()) {
		if(this.p[0].length) {
			for(var i = 0; i < this.p[0].length; i++) {
				if(i < this.v) this.b[0][i] = this.b[2];
				else this.b[0][i] = this.bb;
			}
		}
		else {
			for(var i = 0; i < this.p[1].length; i++) {
				if(i < this.v) this.b[0][i] = this.b[2];
				else this.b[0][i] = this.bb;
			}
		}
		Value.prototype.draw.call(this, g);
	}
}

var Crossfader = function(v, p, b, pg) {
	Fader.call(this, v, p, b, pg);
}

Crossfader.prototype = Object.create(Fader.prototype);

Crossfader.prototype.draw = function(g) {
	if(this.pg()) {
		if(this.p[0].length) {
			for(var i = 0; i < this.p[0].length; i++) {
				if((i > this.v && i <= Math.round(this.p[0].length - 1) / 2) || (i < this.v && i >= Math.round(this.p[0].length - 1) / 2)) this.b[0][i] = this.b[2];
				else this.b[0][i] = this.bb;
			}
		}
		else {
			for(var i = 0; i < this.p[1].length; i++) {
				if((i > this.v && i <= this.p[0].length / 2) || (i < this.v && i >= this.p[0].length / 2)) this.b[0][i] = this.b[2];
				else this.b[0][i] = this.bb;
			}
		}
		Value.prototype.draw.call(this, g);
	}
}

var Pattern = function(v, p, b, pg, f) {
	Toggle.call(this, v, p, b, pg);
	
	this.ispattern = 1;

	var time = 0;
	var r = 0;
	
	var pattern = {}
		
	var task = new Task(function() {
		if(time > 0) {
			for(t in pattern) {
				if(pg() && (arguments.callee.task.iterations % time) == t) {
					f.apply(null, pattern[t]);
				}
			}
		}
	}, this);
	task.interval = 1;
	
	this.event = function(v, last) {
		if(last == 2) {
			this.v = 0;
			
			time = 0;
			r = 0;
			pattern = {}
			task.cancel();
		}
		else if(v == 0 && last == 1) {
			this.v = 2;
			
			time = task.iterations;
			r = 0;
			task.cancel();
			task.repeat();
		}
		else if(v == 1 && last == 0) {
			r = 1;
			task.repeat();
		}
		
		this.draw(g);
	}
	
	this.store = function(j, k, v) {
		if(r) {
			pattern[task.iterations] = arguments;
		}
	}
}

Pattern.prototype = Object.create(Toggle.prototype);

//---------------------------------------------------------------------

var g = grid.connect();

var update = function(h, i, j, v) {
	if (controls[h][i][j].v != v) {
		controls[h][i][j].event(v);
		controls[h][i][j].v = v;
		
		output(h, Number(i), j, controls[h][i][j].output(controls.tracks[i][j].v));
	}
	
	controls[h][i][j].draw(g);
	
	g.refresh();
}

g.event = function(x, y, z) {
	for(h in controls) {
		for(i in controls[h]) {
            if(controls[h][i]) {
                for(j in controls[h][i]) {
                    if(controls[h][i] && controls[h][i][j] && controls[h][i][j].look) {
                        if(controls[h][i][j].look(x, y, z)) {
                            for(l in controls[h][i]) {
                                if(!(controls[h][i][j].ispattern) && controls[h][i][l].ispattern) {
                                    controls[h][i][l].store(h, i, j, controls[h][i][j].v);
                                }
                            }

                            if(controls[h][i]) output(h, Number(i), j, controls[h][i][j].output(controls[h][i][j].v));
                        }

                        if(controls[h][i]) controls[h][i][j].draw(g);
                    }
                }
            }
		}
	}
	
	g.refresh();
}

var redraw = function() {
	g.all(0);
	for(h in controls) {
		for(i in controls[h]) {
			for(j in controls[h][i]) {
				if(controls[h][i][j].draw) controls[h][i][j].draw(g);
				//output(h, i, j, controls[h][i][j].output(controls.tracks[i][j].v));
			}
		}
	}
}

var refresh = function() {
	g.all(0);
	for(h in controls) {
		for(i in controls[h]) {
			for(j in controls[h][i]) {
				if(controls[h][i][j].draw) controls[h][i][j].draw(g);
				output(h, Number(i), j, controls[h][i][j].output(controls[h][i][j].v));
			}
		}
	}
}

var locked = 0;

var Track = function(n) {
	this.r = new Toggle(0, [0, n], [0, HI], function() { return page == 0; });
	this.m = new Toggle(0, [1, n], [0, HI], function() { return page == 0; });
	this.pat = new Pattern(0, [15, n], [0, LO, HI], function() { return 1; }, update);
	this.rev = new Toggle(0, [2, n], [LO, HI], function() { return page == 0; });
	this.s = new Value(3, [[3, 4, 5, 6, 7, 8], n], [[0, 0, 0, LO, 0, 0], HI], function() { return page == 0; });
	this.s.output = function(v) { return v - 3; }
	this.b = new Value(n % 4, [[9, 10, 11, 12], n], [[0, 0, 0, 0], HI], function() { return page == 0; });
    
    this.prst = new Momentary(0, [13, n], [LO, HI], function() { return page < 9; });
    this.prst.event = function(v) {
		this.v = v;
        this.v ? page = n + 1 : locked ? page = page : page = 0;
		
		redraw();
        g.refresh();
    }
    
    this.prst_states = new Value(0, [[0, 1, 2, 3, 4, 5, 6, 7], n], [[LO, LO, LO, LO, LO, LO, LO, LO], HI], function() { return page == n + 1; });
    
    this.prst_lock = new Toggle(0, [12, n], [LO, HI], function() { return page == n + 1; });
    this.prst_lock.event = function(v) {
		locked = v;
        if(!v) page = 0;
		
		redraw();
        g.refresh();
    }
    
    this.rout = new Momentary(0, [14, n], [LO, HI], function() { return 1; });
    this.rout.event = function(v) {
		this.v = v;
        this.v ? page = n + 9 : page = 0;
		
		redraw();
        g.refresh();
    }
    
    this.rout_marker = new Value(-1, [[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], n], [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 1], function() { return page == n + 9; });
    
    this.rout_inputs = new Value(0, [0, [0, 1, 2, 3]],  [[LO, LO, LO, LO], HI], function() { return page == n + 9; });
    
    this.rout_outputs = new Value(0, [0, [5, 6, 7]],  [[LO, LO, LO], HI], function() { return page == n + 9; });
    
    var friend_func = function(friend) {
        return function(v) { 
            this.v = v;

            friend.v = -1;
            post("hi");
            
            redraw();
            g.refresh();
        }
    }
    
    this.route_s0_patch = new Value(0, [2, [0, 1, 2, 3]],  [[LO, LO, LO, LO], HI], function() { return page == n + 9; });
    this.route_s1_patch = new Value(1, [5, [0, 1, 2, 3]],  [[LO, LO, LO, LO], HI], function() { return page == n + 9; });
    this.route_s2_patch = new Value(2, [8, [0, 1, 2, 3]],  [[LO, LO, LO, LO], HI], function() { return page == n + 9; });
    this.route_s3_patch = new Value(3, [11, [0, 1, 2, 3]],  [[LO, LO, LO, LO], HI], function() { return page == n + 9; });
    this.route_s0_track = new Value(-1, [3, [0, 1, 2, 3, 4, 5, 6, 7]],  [[0, 0, 0, 0, 0, 0, 0, 0], HI], function() { return page == n + 9; });
    
    this.route_s1_track = new Value(-1, [6, [0, 1, 2, 3, 4, 5, 6, 7]],  [[0, 0, 0, 0, 0, 0, 0, 0], HI], function() { return page == n + 9; });
    this.route_s2_track = new Value(-1, [9, [0, 1, 2, 3, 4, 5, 6, 7]],  [[0, 0, 0, 0, 0, 0, 0, 0], HI], function() { return page == n + 9; });
    this.route_s3_track = new Value(-1, [12, [0, 1, 2, 3, 4, 5, 6, 7]],  [[0, 0, 0, 0, 0, 0, 0, 0], HI], function() { return page == n + 9; });
    
    this.route_s0_patch.event = friend_func(this.route_s0_track);
    this.route_s1_patch.event = friend_func(this.route_s1_track);
    this.route_s2_patch.event = friend_func(this.route_s2_track);
    this.route_s3_patch.event = friend_func(this.route_s3_track);
    
    this.route_s0_track.event = friend_func(this.route_s0_patch);
    this.route_s1_track.event = friend_func(this.route_s1_patch);
    this.route_s2_track.event = friend_func(this.route_s2_patch);
    this.route_s3_track.event = friend_func(this.route_s3_patch);
    
    
}

var init = function() {
	for(var i = 0; i < 8; i++) {
 		controls.tracks[i] = new Track(i, function() { return 1; });
		
		for(j in controls.tracks[i]) {
			if(controls.tracks[i][j].draw) {
				controls.tracks[i][j].draw(g);
				
				output(i, j, controls.tracks[i][j].output(controls.tracks[i][j].v));
			}
		}
	}
	
	redraw();
	g.refresh();
}

input["input"] = function(n) {

}