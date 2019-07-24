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

if (!Math.log2) Math.log2 = function(x) { //log2 polyfill
  return Math.log(x) * Math.LOG2E;
};

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
    
    diction_out();
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
    var me = this;
    
    
//    //         0  1  2  3  4    5     6     7  8     9    10  11 12 13 14
//    //in max: -8 -4 -2 -1 -0.5 -0.25 -0.125 0. 0.125 0.25 0.5 1  2  4  8
//    var coarse_table = [
//        [ 9, 10, 11, 12, 13 ], //fwd
//        [ 5, 4, 3, 2, 1 ] //rev
//    ]
    
    var loopsize = 0;
    var buffer = new Buffer("&&buf_" + n);
    var initial_rec = false;
    
    var timer = new Task(function() {
        loopsize += this.softcut.rate * this.softcut.rate_offset;
	}, this);
	timer.interval = 1;
    
    this.i = i;
    this.n = n;
    this.r = new Toggle(0, [0, n], [0, HI], function() { return page == 0; });
    this.r.event = function(v) {
        if(v == 1 && me.m.get() == 0) { //start initial rec
            initial_rec = true;
            
            loopsize = 0;
            me.softcut.loop_end = buffer.length / 1000;
            me.softcut.position = 0;
            buffer.send("clear");
            
            timer.repeat();
        }
        else if(v == 0 && initial_rec) { //end initial rec
            initial_rec = false;
            
            timer.cancel();
            me.softcut.loop_end = loopsize;
            
            me.m.set(1);
        }
        
        me.softcut.rec = v;
    }
	this.m = new Toggle(0, [1, n], [0, HI], function() { return page == 0; });
    this.m.event = function(v) {
        if(v == 1 && initial_rec) { //end initial rec if that's going
            initial_rec = false;
            
            timer.cancel();
            me.softcut.loop_end = loopsize;
        }
        
        me.softcut.play = v;
    }
	this.rev = new Toggle(0, [2, n], [LO, HI], function() { return page == 0; });
    this.rev.event = function(v) {
        this.v = v
        
        me.softcut.rate = (v ? -1 : 1) * Math.abs(me.softcut.rate);
    }
    this.s = new Glide(2, [[3, 4, 5, 6, 7], n], [[0, 0, LO, 0, 0], HI], function() { return page == 0; });
    this.s.event = function(trans) {
        if(trans.time != null) me.softcut.rate_slew_time = trans.time;
        me.softcut.rate = (me.rev.get() ? -1 : 1) * Math.pow(2, (trans.dest - 2));
        
        if(trans.time) {
            var delay = new Task(function() { this.softcut.rate_slew_time = 0; 
                                             diction_out();
                                            }, me);
            delay.schedule((trans.time + 0.01) * 1000);
        }
    }
    
    this.buf = new Value(n % 4, [[8, 9, 10, 11], n], [[0, 0, 0, 0], HI], function() { return page == 0; });
    this.buf.event = function(v) {
        var num = (me.n >= 4) ? v + 4 : v;
        
        me.softcut.buffer = "&&buf_" + num;
        var buffer = new Buffer("&&buf_" + num);
    }
    this.pat = new Pattern(0, [15, n], [0, LO, HI], function() { return page == 0; }, update2, i);
    
    this.softcut = {
        rec: 0,
        play: 0,
        rate: 1,
        rate_offset: 0,
        rec_level: 1,
        pre_level: 0.5,
        voice_sync: "-",
        buffer: "&&buf_" + n % 4,
        level_slew_time: 0,
        rate_slew_time: 0,
        phase_quant: "-",
        fade_time: 0.032,
        loop_start: 0,
        loop_end: 0,
        loop: 1,
        position: "-",
        pan: 0.5,
        level: 1
    }
    
    this.get = function() { return {
        r: this.r.get(),
        m: this.m.get(),
        rev: this.rev.get(),
        s: this.s.get(),
        buf: this.buf.get(),
        pat: this.pat.get(),
        softcut: this.softcut
    }}
    
    this.set = function(input) {
        this.r.set(input.r);
        this.m.set(input.m);
        this.rev.set(input.rev);
        this.s.set(input.s);
        this.buf.set(input.buf);        
        this.pat.set(input.pat);
        this.softcut = JSON.parse(JSON.stringify(input.softcut));
    }
    
    this.softcut_get = function() { return this.softcut; }
    
    this.softcut_set = function(input) {
        this.r.set(input.rec);
        this.m.set(input.play);    
      
        var is_neg = Number(input.rate < 0);
        this.rev.set(is_neg);
        
        var absr = Math.abs(input.rate);
        if(absr <= 4) this.s.set(Math.round(Math.log2(absr)) + 2);
        
        this.buf.set(input.buffer.split('_')[1] % 4);
        buffer = new Buffer(input.buffer);
        
        this.softcut = input;
    }
}

var Line = function(n) {
    var me = this;
    me.n = n;
    
    this.presets = [];
    
    this.preset;
    
    this.preset_set = function(v) {
        var is_new = me.presets[v] == null
        
        if(me.presets[v]) {
            me.preset = me.presets[v];
        } else {
            me.presets[v] = new Preset(me.n, v);
            if(me.preset) me.presets[v].set(me.preset.get());
            me.preset = me.presets[v];
        }
        
        return is_new;
    }
    
    this.menu = new Value(0, [[0, 1, 2, 3, 4, 5, 6, 7], n], [[0,0,0,0,0,0,0,0], HI], function() { return page == n + 1; });
    this.menu.event = function(v, last) {
        if(me.preset_set(v)) this.b[0][v] = TT;
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
        var ret = {
            menu: this.menu.get(),
            send: this.send.get(),
            pat: this.pat.get(),
            presets: []
        }
        
        for(var i=0; i < this.presets.length; i++) {
            if(this.presets[i]) ret.presets[i] = this.presets[i].get();
            else ret.presets[i] = null;
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
    var thing = [];
    
    for(var i = 0; i < controls.lines.length; i++) {
        thing[i] = controls.lines[i].get();
    }
    
    return JSON.stringify(thing);
}

var diction_out = function() {
    var diction = {};
    diction.softcut = [];
    
    for(var i = 0; i < controls.lines.length; i++) {
        diction.softcut[i] = {}
        
        diction.softcut[i].active = controls.lines[i].preset.i;
        diction.softcut[i].presets = [];
        
        for(var j = 0; j < controls.lines[i].presets.length; j++) {
            diction.softcut[i].presets[j] = controls.lines[i].presets[j].softcut_get();
        }
    }
    
    output(JSON.stringify(diction));
}

var diction_in = function(stringified) {
    var softcut = JSON.parse(stringified).softcut;
    
    for(var i = 0; i < controls.lines.length; i++) {
        
        controls.lines[i].preset_set(softcut[i].active)
        
        for(var j = 0; j < controls.lines[i].presets.length; j++) {
            controls.lines[i].presets[j].softcut_set(softcut[i].presets[j]);
        }
    }
    
    redraw();
    g.refresh();
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

