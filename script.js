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
    //         0  1  2  3  4    5     6     7  8     9    10  11 12 13 14
    //in max: -8 -4 -2 -1 -0.5 -0.25 -0.125 0. 0.125 0.25 0.5 1  2  4  8
    var coarse_table = [
        [ 9, 10, 11, 12, 13 ], //fwd
        [ 5, 4, 3, 2, 1 ] //rev
    ]
    
    var loopsize = 0;
    var maxsize = 480;
    var buffer = new Buffer("&&buf_" + n);
    
    var timer = new Task(function() {
        loopsize = arguments.callee.task.iterations / 1000; //TODO: account for rate !!
	}, this);
	timer.interval = 1;
    
    this.i = i;
    this.n = n;
    this.r = new Toggle(0, [0, n], [0, HI], function() { return page == 0; });
    this.r.event = function(v) {
        if(v == 1 && me.m.get() == 0) { //start initial rec
            loopsize = 0;
            me.ekphras.length = maxsize;
            me.ekphras.pos = 0;
            buffer.send("clear");
            
            timer.repeat();
        }
        else if(v == 0 && me.m.get() == 0) { //end initial rec
            timer.cancel();
            me.ekphras.length = loopsize;
            
            me.m.set(1);
        }
        
        me.ekphras.rec = v;
    }
	this.m = new Toggle(0, [1, n], [0, HI], function() { return page == 0; });
    this.m.event = function(v) {
        if(v == 1 && me.ekphras.loop_end == 0) { //end initial rec if that's going
            timer.cancel();
            me.ekphras.length = loopsize;
        }
        
        me.ekphras.play = v;
    }
	this.rev = new Toggle(0, [2, n], [LO, HI], function() { return page == 0; });
    this.rev.event = function(v) {
        this.v = v
        
        if( coarse_table[v] && coarse_table[v][me.s.get()]) me.ekphras.coarse = coarse_table[v][me.s.get()];
    }
	this.s = new Value(2, [[3, 4, 5, 6, 7], n], [[0, 0, LO, 0, 0], HI], function() { return page == 0; });
    this.s.event = function(v) {
        this.v = v
        
        if(coarse_table[me.rev.get()][me.s.get()])
           me.ekphras.coarse = coarse_table[me.rev.get()][me.s.get()];
    }
    this.buf = new Value(n % 4, [[8, 9, 10, 11], n], [[0, 0, 0, 0], HI], function() { return page == 0; });
    this.buf.event = function(v) {
        var num = (me.n >= 4) ? v + 4 : v;
        
        me.ekphras.buffer = "&&buf_" + num;
        var buffer = new Buffer("&&buf_" + num);
    }
    this.pat = new Pattern(0, [15, n], [0, LO, HI], function() { return page == 0; }, update2, i);
    
    this.ekphras = { //TODO: go back to softcut-relevant vals
        rec: 0,
        play: 0,
        rec_lvl: 1,
        pre_lvl: 0.5,
        coarse: coarse_table[me.rev.get()][me.s.get()],
        fine: 0,
        buffer: "&&buf_" + n % 4,
        lvl_slew: 0,
        rate_slew: 0,
        fade: 0.032,
        start: 0,
        length: 0,
        pos: "-",
        pan: 0.5,
        out_lvl: 1
    }
    
    this.get = function() { return {
        r: this.r.get(),
        m: this.m.get(),
        rev: this.rev.get(),
        s: this.s.get(),
        buf: this.buf.get(),
        pat: this.pat.get(),
        ekphras: this.ekphras
    }}
    
    this.set = function(input) {
        this.r.set(input.r);
        this.m.set(input.m);
        this.rev.set(input.rev);
        this.s.set(input.s);
        this.buf.set(input.buf);        
        this.pat.set(input.pat);
        this.ekphras = JSON.parse(JSON.stringify(input.ekphras));
    }
    
    this.ekphras_get = function() { return this.ekphras; }
    
    this.ekphras_set = function(input) {
        this.r.set(input.rec);
        this.m.set(input.play);    
        
        var is_neg = (input.coarse < 7) ? 1 : 0;
        this.rev.set(is_neg);
        
        this.s.set(-1);
        for(var i = 0; i < coarse_table[is_neg].length; i++) {     
            if (coarse_table[is_neg][i] == input.coarse) {
                this.s.set(i);
            }
        }
        
        this.buf.set(input.buffer.split('_')[1] % 4);
        buffer = new Buffer(input.buffer);
        
        this.ekphras = input;
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
    diction.ekphras = [];
    
    for(var i = 0; i < controls.lines.length; i++) {
        diction.ekphras[i] = {}
        
        diction.ekphras[i].active = controls.lines[i].preset.i;
        diction.ekphras[i].presets = [];
        
        for(var j = 0; j < controls.lines[i].presets.length; j++) {
            diction.ekphras[i].presets[j] = controls.lines[i].presets[j].ekphras_get();
        }
    }
    
    output(JSON.stringify(diction));
}

var diction_in = function(stringified) {
    var ekphras = JSON.parse(stringified).ekphras;
    
    for(var i = 0; i < controls.lines.length; i++) {
        
        controls.lines[i].preset_set(ekphras[i].active)
        
        for(var j = 0; j < controls.lines[i].presets.length; j++) {
            controls.lines[i].presets[j].ekphras_set(ekphras[i].presets[j]);
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

