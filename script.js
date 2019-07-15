inlets = 1;
outlets = 1;

include("grid.js");
include("andrew.js");

var controls = {}
controls.tracks = [];

var TT = 4;
var LO = 8;
var HI = 12;

var page = 0;

var locked = 0;

var Track = function(n) {
	this.r = new Toggle(0, [0, n], [0, HI], function() { return page == 0; });
	this.m = new Toggle(0, [1, n], [0, HI], function() { return page == 0; });
	this.pat = new Pattern(0, [15, n], [0, LO, HI], function() { return 1; }, update);
	this.rev = new Toggle(0, [2, n], [LO, HI], function() { return page == 0; });
	this.s = new Value(2, [[3, 4, 5, 6, 7], n], [[0, 0, LO, 0, 0], HI], function() { return page == 0; });
	this.s.output = function(v) { return v - 2; }
    
	this.buf = new Value(n % 4, [[8, 9, 10, 11], n], [[0, 0, 0, 0], HI], function() { return page == 0; });
	this.bus = new Toggles([], [[12,13],n], [[0,0], LO], function() { return page == 0; });
    
    this.focus = new Momentary(0, [14, n], [TT, HI], function() { return page < 9; });
    this.focus.event = function(v) {
		this.v = v;
        this.v ? page = n + 1 : locked ? page = page : page = 0;
		
		redraw();
        g.refresh();
    }
    this.presets = new Value(0, [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], n], [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], HI], function() { return page == n + 1; });
}

var init = function() {
	for(var i = 0; i < 8; i++) {
 		controls.tracks[i] = new Track(i);
		
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