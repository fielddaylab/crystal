var G = [];

G = [0.25, 0.15, 0.2, 0.08, 0.03, 0.01, 0.005, 0.002, 0.0];

var GamePlayScene = function(game, stage)
{
  var self = this;

  var canv = stage.drawCanv;
  var canvas = canv.canvas;
  var ctx = canv.context;

  var clicker;
  var dragger;

  var dragging_molecule = 0;
  var cam;
  var game_cam;
  var menu_cam;
  var bounds;
  var shadow_dist = 8;

  //start at top, CW
  var no_charge  = [ 0, 0, 0, 0];
  var top_pos    = [ 1, 0, 0, 0];
  var bottom_pos = [ 0, 0, 1, 0];
  var left_pos   = [ 0, 0, 0, 1];
  var right_pos  = [ 0, 1, 0, 0];
  var top_neg    = [-1, 0, 0, 0];
  var bottom_neg = [ 0, 0,-1, 0];
  var left_neg   = [ 0, 0, 0,-1];
  var right_neg  = [ 0,-1, 0, 0];

  var levels;
  var cur_level;
  var cur_stars_bounce;

  var url_args;
  var lvl;

  var score = 0;
  var score_board;

  var score_patience = 10;

  var scroll;
  var stamps;
  var molecules;

  var back_btn;
  var clear_btn;
  var submit_btn;

  //block drawing
  var tx;
  var ty;
  var dblock = {wx:0,wy:0,ww:1,wh:1,x:0,y:0,w:0,h:0};
  var bounds_stroke  = "rgba(0,0,0,.6)";
  var shadow_fill  = "rgba(0,0,0,.1)";
  var block_fill   = "#F6F6F6";
  var block_stroke = "#E0E0E0";
  var scroll_fill = "rgba(0,0,0,0.1)";

  var w = 100;
  var h = 100;
  var in_r = w/4;
  var out_r = w/2-5;
  var theta;

  var star = GenIcon(w,h)
  theta = 0-halfpi;
  star.context.strokeStyle = "#000000";
  star.context.fillStyle = "#FFFFFF";
  star.context.lineWidth = 2;
  star.context.beginPath();
  star.context.moveTo(w/2+cos(theta)*out_r,h/2+sin(theta)*out_r);
  for(var i = 0; i < 5; i++)
  {
    theta = (i/5+1/10)*twopi-halfpi;
    star.context.lineTo(w/2+cos(theta)*in_r,h/2+sin(theta)*in_r);
    if(i != 4)
    {
      theta = (i/5+1/5)*twopi-halfpi;
      star.context.lineTo(w/2+cos(theta)*out_r,h/2+sin(theta)*out_r);
    }
  }
  star.context.closePath();
  star.context.fill();
  star.context.stroke();

  var star_full = GenIcon(w,h)
  theta = 0-halfpi;
  star_full.context.strokeStyle = "#000000";
  star_full.context.fillStyle = "#FFFF00";
  star_full.context.lineWidth = 2;
  star_full.context.beginPath();
  star_full.context.moveTo(w/2+cos(theta)*out_r,h/2+sin(theta)*out_r);
  for(var i = 0; i < 5; i++)
  {
    theta = (i/5+1/10)*twopi-halfpi;
    star_full.context.lineTo(w/2+cos(theta)*in_r,h/2+sin(theta)*in_r);
    if(i != 4)
    {
      theta = (i/5+1/5)*twopi-halfpi;
      star_full.context.lineTo(w/2+cos(theta)*out_r,h/2+sin(theta)*out_r);
    }
  }
  star_full.context.closePath();
  star_full.context.fill();
  star_full.context.stroke();

  var atoms = [];
  for(var i = 0; i < 5; i++)
  {
    var atom = GenIcon(w,h)
    atom.context.strokeStyle = "#FFFFFF";
    switch(i)
    {
      case 0: atom.context.fillStyle = "rgba(200,0,0,0.8)"; break;
      case 1: atom.context.fillStyle = "rgba(100,0,0,0.5)"; break;
      case 2: atom.context.fillStyle = "rgba(0,0,0,0.3)"; break;
      case 3: atom.context.fillStyle = "rgba(0,100,0,0.5)"; break;
      case 4: atom.context.fillStyle = "rgba(0,200,0,0.8)"; break;
    }
    atom.context.lineWidth = 4;
    atom.context.beginPath();
    atom.context.arc(w/2,h/2,2*w/7,0,2*Math.PI);
    atom.context.closePath();
    atom.context.fill();
    atom.context.stroke();
    //atom.context.fillText(i,w/2,h/2);
    atoms.push(atom);
  }

  var n_ticks = 0;

  var mode;
  var ENUM = 0;
  MODE_MENU   = ENUM; ENUM++;
  MODE_GAME   = ENUM; ENUM++;
  MODE_SUBMIT = ENUM; ENUM++;
  MODE_INTRO  = ENUM; ENUM++;

  var submitting_t;
  var star_outro_sub_slide = 40;
  var star_outro_sub_star = 100;
  var outro;

  var level = function(id)
  {
    var self = this;
    self.id = id;
    self.available_templates = [];
    self.scale = 1;
    self.repeat_x = 10;
    self.repeat_y = 10;
    self.bounds_x = 16;
    self.bounds_y = 0;
    self.bounds_w = 10;
    self.bounds_h = 10;
    self.scroll_w = 2;
    self.stars = 0;
    self.cur_stars = 0;
    self.cur_stars_t = 0; //t since new cur_stars rating
    self.best = -99999;
    self.star_req_score = [];
    for(var i = 0; i < 3; i++)
      self.star_req_score.push(0);

    //intro
    self.has_intro = false;
    self.intro = true;
    self.shouldClick = function(evt){ return false; }
    self.click = function(evt){};
    self.introtick = function(){ return self.intro; }
    self.introdraw = function(){}
  }

  var level_button = function(wx,wy,ww,wh,level)
  {
    var self = this;
    self.level = level;
    self.bounces = [];
    for(var i = 0; i < 3; i++)
      self.bounces[i] = new bounce();
    self.wx = wx;
    self.wy = wy;
    self.ww = ww;
    self.wh = wh;

    self.x = 0;
    self.y = 0;
    self.w = 0;
    self.h = 0;

    self.rotoff = rand()*6;

    self.draw = function()
    {
      ctx.beginPath();
      ctx.arc(self.x+self.w/2,self.y+self.h/2,2*self.w/5,0,2*Math.PI);
      ctx.stroke();
      draw_blocks(self.wx,self.wy,self.level.available_templates[0].cx,self.level.available_templates[0].cy,0,0,self.rotoff+n_ticks/100,0.5,0,self.level.available_templates[0].blocks);

      var x = self.x+self.w/2;
      var y = self.y+self.h/2;
      var s = self.w/3;
      var theta;
      var offx;
      var offy;
      var t = n_ticks%200;
      var p;
      for(var i = 0; i < 3; i++)
      {
        theta = quarterpi+(i/2)*halfpi;
        offx = cos(theta)*self.w/3;
        offy = sin(theta)*self.h/3;
        switch(i)
        {
          case 0: if(t == 90) self.bounces[i].vel = 2; break;
          case 1: if(t == 60) self.bounces[i].vel = 2; break;
          case 2: if(t == 30) self.bounces[i].vel = 2; break;
        }
        var bs = s;
        self.bounces[i].tick();
        bs += self.bounces[i].v;
        if(self.level.stars > 2-i)
          ctx.drawImage(star_full,x+offx-bs/2,y+offy-bs/2,bs,bs);
        else
          ctx.drawImage(star,x+offx-bs/2,y+offy-bs/2,bs,bs);
      }
    }

    self.click = function(evt)
    {
      set_level(self.level.id);
      mode = MODE_INTRO;
    }
  }

  var star_outro = function(wx,wy,ww,wh)
  {
    var self = this;

    self.wx = wx;
    self.wy = wy;
    self.ww = ww;
    self.wh = wh;

    self.x = 0;
    self.y = 0;
    self.w = 0;
    self.h = 0;

    self.start_ticks = 0;

    self.bounces = [];
    for(var i = 0; i < 3; i++)
      self.bounces[i] = new bounce();

    self.click = function(evt)
    {
      mode = MODE_MENU;
    }

    self.draw = function()
    {
      ctx.beginPath();
      ctx.arc(self.x+self.w/2,self.y+self.h/2,2*self.w/5,0,2*Math.PI);
      ctx.stroke();
      draw_blocks(self.wx,self.wy,cur_level.available_templates[0].cx,cur_level.available_templates[0].cy,0,0,n_ticks/100,1,0,cur_level.available_templates[0].blocks);

      var x = self.x+self.w/2;
      var y = self.y+self.h/2;
      var s = self.w/3;
      var theta;
      var offx;
      var offy;
      var t = (n_ticks-self.start_ticks)%200;
      var p;
      for(var i = 0; i < 3; i++)
      {
        theta = quarterpi+(i/2)*halfpi;
        offx = cos(theta)*self.w/3;
        offy = sin(theta)*self.h/3;
        switch(i)
        {
          case 0: if(t == 90) self.bounces[i].vel = 2; break;
          case 1: if(t == 60) self.bounces[i].vel = 2; break;
          case 2: if(t == 30) self.bounces[i].vel = 2; break;
        }
        var bs = s;
        self.bounces[i].tick();
        bs += self.bounces[i].v;
        if(cur_level.stars > 2-i && n_ticks-self.start_ticks > 30*(3-i))
          ctx.drawImage(star_full,x+offx-bs/2,y+offy-bs/2,bs,bs);
        else
          ctx.drawImage(star,x+offx-bs/2,y+offy-bs/2,bs,bs);
      }
    }
  }

  var init_levels = function()
  {
    levels = [];
    var n_rows = 2;
    var n_cols = 4;
    var i = 0;
    var j;

    function lvlx(i)
    {
      var x = i%n_cols;
      return menu_cam.wx-menu_cam.ww/2+(x+1.5)/(n_cols+2)*menu_cam.ww;
    }
    function lvly(i)
    {
      var y = floor(i/n_cols);
      return menu_cam.wy+menu_cam.wh/2-(y+.5)/(n_rows)*menu_cam.wh;
    }
    function lvlw(i)
    {
      return menu_cam.ww/(n_cols+2);
    }
    function lvlh(i)
    {
      return menu_cam.wh/(n_cols+2)*2;
    }

    //domino- no charge
    levels.push(new level(i));
    levels[i].scale = 1;
    levels[i].repeat_x = 6;
    levels[i].repeat_y = 4;
    levels[i].bounds_w = 6;
    levels[i].bounds_h = 4;
    levels[i].scroll_w = 2.5;
    levels[i].star_req_score[0] = 22;
    levels[i].star_req_score[1] = 30;
    levels[i].star_req_score[2] = 36;
    j = 0;
    levels[i].available_templates[j++] = new template(0,0.5,[{cx:0,cy:0,c:[0,0,0,0]},{cx:0,cy:1,c:[0,0,0,0]}]);
    levels[i].button = new level_button(lvlx(i),lvly(i),lvlw(i),lvlh(i),levels[i]);
    levels[i].has_intro = true;
    levels[i].shouldClick = function(evt)
    {
      return true;
    }
    levels[i].click = function(evt)
    {
      cur_level.intro = false;
    }
    levels[i].introtick = function()
    {
      return cur_level.intro;
    }
    levels[i].introdraw = function()
    {
      ctx.fillText("<- This is a molecule",bounds.x-110,150);
      ctx.fillText("Stack 'em here \\/",bounds.x+50,100);
    }
    i++;

    //tetris s- no charge
    levels.push(new level(i));
    levels[i].scale = 1;
    levels[i].repeat_x = 6;
    levels[i].repeat_y = 4;
    levels[i].bounds_w = 6;
    levels[i].bounds_h = 4;
    levels[i].scroll_w = 3.5;
    levels[i].star_req_score[0] = 13;
    levels[i].star_req_score[1] = 20;
    levels[i].star_req_score[2] = 30;
    j = 0;
    levels[i].available_templates[j++] = new template(0,0.5,[{cx:0,cy:0,c:[0,0,0,0]},{cx:0,cy:1,c:[0,0,0,0]},{cx:-1,cy:0,c:[0,0,0,0]},{cx:1,cy:1,c:[0,0,0,0]}]);
    levels[i].button = new level_button(lvlx(i),lvly(i),lvlw(i),lvlh(i),levels[i]);
    i++;

    //tetris T- no charge
    levels.push(new level(i));
    levels[i].scale = 1;
    levels[i].repeat_x = 6;
    levels[i].repeat_y = 4;
    levels[i].bounds_w = 6;
    levels[i].bounds_h = 4;
    levels[i].scroll_w = 3.5;
    levels[i].star_req_score[0] = 8;
    levels[i].star_req_score[1] = 17;
    levels[i].star_req_score[2] = 30;
    j = 0;
    levels[i].available_templates[j++] = new template(0,0.5,[{cx:0,cy:0,c:[0,0,0,0]},{cx:0,cy:1,c:[0,0,0,0]},{cx:-1,cy:0,c:[0,0,0,0]},{cx:1,cy:0,c:[0,0,0,0]}]);
    levels[i].button = new level_button(lvlx(i),lvly(i),lvlw(i),lvlh(i),levels[i]);
    i++;

    //domino- flip charge
    levels.push(new level(i));
    levels[i].scale = 1;
    levels[i].repeat_x = 6;
    levels[i].repeat_y = 4;
    levels[i].bounds_w = 6;
    levels[i].bounds_h = 4;
    levels[i].scroll_w = 2.5;
    levels[i].star_req_score[0] = 36;
    levels[i].star_req_score[1] = 37;
    levels[i].star_req_score[2] = 84;
    j = 0;
    levels[i].available_templates[j++] = new template(0,0.5,[{cx:0,cy:0,c:[0,1,0,0]},{cx:0,cy:1,c:[0,0,0,-1]}]);
    levels[i].button = new level_button(lvlx(i),lvly(i),lvlw(i),lvlh(i),levels[i]);
    i++;

    //L- hard charge
    levels.push(new level(i));
    levels[i].scale = 1;
    levels[i].repeat_x = 8;
    levels[i].repeat_y = 4;
    levels[i].bounds_w = 8;
    levels[i].bounds_h = 4;
    levels[i].scroll_w = 3.5;
    levels[i].star_req_score[0] = 48;
    levels[i].star_req_score[1] = 61;
    levels[i].star_req_score[2] = 90;
    j = 0;
    levels[i].available_templates[j++] = new template(0.5,1,[{cx:0,cy:0,c:[0,0,0,1]},{cx: 0,cy: 1,c:[0,0,0,0]},{cx: 0,cy:2,c:[-1,0,0,-1]},{cx: 1,cy:0,c:[1,1,0,0]}]); //L
    levels[i].button = new level_button(lvlx(i),lvly(i),lvlw(i),lvlh(i),levels[i]);
    i++;

    //square- hard charge
    levels.push(new level(i));
    levels[i].scale = 1;
    levels[i].repeat_x = 10;
    levels[i].repeat_y = 6;
    levels[i].bounds_w = 10;
    levels[i].bounds_h = 6;
    levels[i].scroll_w = 2.5;
    levels[i].star_req_score[0] = 140;
    levels[i].star_req_score[1] = 280;
    levels[i].star_req_score[2] = 284;
    j = 0;
    levels[i].available_templates[j++] = new template(0.5,0.5,[{cx:0,cy:0,c:bottom_pos},{cx: 0,cy: 1,c:left_neg  },{cx: 1,cy:0,c:right_neg },{cx: 1,cy:1,c:top_pos   }]); //box
    levels[i].button = new level_button(lvlx(i),lvly(i),lvlw(i),lvlh(i),levels[i]);
    i++;

    //free play
    levels.push(new level(i));
    levels[i].scale = 2;
    levels[i].repeat_x = 18;
    levels[i].repeat_y = 10;
    levels[i].bounds_w = 18;
    levels[i].bounds_h = 10;
    levels[i].scroll_w = 3;
    levels[i].star_req_score[0] = 0;
    levels[i].star_req_score[1] = 0;
    levels[i].star_req_score[2] = 0;
    j = 0;
      //1-no
    levels[i].available_templates[j++] = new template(0,0,[{cx:0,cy:0,c:top_pos   }]);
      //2-no
    levels[i].available_templates[j++] = new template(0,0.5,[{cx:0,cy:0,c:left_neg  },{cx:0,cy:1,c:no_charge }]);
      //3-no
    levels[i].available_templates[j++] = new template(0,0,[{cx:0,cy:0,c:no_charge },{cx:0,cy:1,c:left_neg  },{cx:0,cy:-1,c:right_pos }]); //line
    levels[i].available_templates[j++] = new template(0.5,0.5,[{cx:0,cy:0,c:no_charge },{cx:0,cy:1,c:right_pos },{cx:1,cy: 0,c:top_neg   }]); //crook
      //4-no
    levels[i].available_templates[j++] = new template(0,0.5,[{cx:0,cy:0,c:left_pos  },{cx: 0,cy:-1,c:left_pos  },{cx: 0,cy:1,c:right_neg },{cx: 0,cy:2,c:no_charge }]); //line
    levels[i].available_templates[j++] = new template(0.5,1,[{cx:0,cy:0,c:no_charge },{cx: 0,cy: 1,c:no_charge },{cx: 0,cy:2,c:right_neg },{cx: 1,cy:0,c:top_neg   }]); //L
    levels[i].available_templates[j++] = new template(-0.5,1,[{cx:0,cy:0,c:bottom_neg},{cx: 0,cy: 1,c:no_charge },{cx: 0,cy:2,c:no_charge },{cx:-1,cy:0,c:bottom_pos}]); //J
    levels[i].available_templates[j++] = new template(0,0.5,[{cx:0,cy:0,c:bottom_pos},{cx:-1,cy: 1,c:left_pos  },{cx: 0,cy:1,c:no_charge },{cx: 1,cy:0,c:no_charge }]); //Z
    levels[i].available_templates[j++] = new template(0,0.5,[{cx:0,cy:0,c:no_charge },{cx:-1,cy: 0,c:bottom_neg},{cx: 0,cy:1,c:no_charge },{cx: 1,cy:1,c:bottom_pos}]); //S
    levels[i].available_templates[j++] = new template(0,0.5,[{cx:0,cy:0,c:no_charge },{cx: 0,cy: 1,c:no_charge },{cx:-1,cy:0,c:top_pos   },{cx: 1,cy:0,c:right_neg }]); //T
    levels[i].available_templates[j++] = new template(0.5,0.5,[{cx:0,cy:0,c:bottom_pos},{cx: 0,cy: 1,c:left_neg  },{cx: 1,cy:0,c:right_neg },{cx: 1,cy:1,c:top_pos   }]); //box
    levels[i].button = new level_button(lvlx(i),lvly(i),lvlw(i),lvlh(i),levels[i]);
    i++;

  }

  var set_level = function(i)
  {
    cur_level = levels[i];

    cur_level.intro = cur_level.has_intro;

    stamps = [];
    molecules = [];
    dragging_molecule = 0;

    bounds = {wx:cur_level.bounds_x, wy:cur_level.bounds_y, ww:cur_level.bounds_w, wh:cur_level.bounds_h, x:0,y:0,w:0,h:0 };
    game_cam = {wx:cur_level.bounds_x-cur_level.scroll_w/2, wy:cur_level.bounds_y, ww:cur_level.bounds_w+2+cur_level.scroll_w, wh:cur_level.bounds_h+2 };

    scroll = new scroller();
    scroll.scroll_wy_min -= 0.2;
    scroll.scroll_wy_max += 0.2;

    for(var i = 0; i < cur_level.available_templates.length; i++)
    {
      stamps[i] = new stamp();
      stamps[i].wx = scroll.wx;
      stamps[i].wy = game_cam.wy+game_cam.wh/2-2.-4*i;
      if(stamps[i].wy < scroll.scroll_wy_min) scroll.scroll_wy_min = stamps[i].wy;
      if(stamps[i].wy > scroll.scroll_wy_max) scroll.scroll_wy_max = stamps[i].wy;
      copy_template(cur_level.available_templates[i],stamps[i].template);
    }

    score_board.reset();
  }

  var copy_template = function(from,to)
  {
    to.cx = from.cx;
    to.cy = from.cy;
    to.blocks = [];
    for(var i = 0; i < from.blocks.length; i++)
    {
      to.blocks[i] = {cx:from.blocks[i].cx,cy:from.blocks[i].cy,c:[]};
      for(var j = 0; j < 4; j++)
        to.blocks[i].c[j] = from.blocks[i].c[j];
    }
  }
  var rotate_template = function(t)
  {
    for(var i = 0; i < t.blocks.length; i++)
    {
      var tmp = t.blocks[i].cy;
      t.blocks[i].cy = -t.blocks[i].cx;
      t.blocks[i].cx = tmp;
      var last = t.blocks[i].c[3];
      for(var j = 3; j > 0; j--)
        t.blocks[i].c[j] = t.blocks[i].c[j-1];
      t.blocks[i].c[0] = last;
    }
    var tx = t.cx;
    t.cx = t.cy;
    t.cy = -tx;
  }
  var draw_blocks = function(wx,wy,offx,offy,bounces,happys,rot,scale,shadow,blocks)
  {
    tx = screenSpaceX(cam,canv,wx);
    ty = screenSpaceY(cam,canv,wy);
    //dblock.wx = wx;
    //dblock.wy = wy;
    screenSpace(cam,canv,dblock);
    //tx = dblock.x+dblock.w/2;
    //ty = dblock.y+dblock.h/2;

    ctx.save();
    ctx.translate(tx,ty);
    ctx.rotate(rot);
    ctx.translate(-offx*dblock.w*scale,offy*dblock.h*scale);
    ctx.scale(scale,scale);

    var top_left;
    var cur;
    var leftmost = 100;
    var topmost = -100;
    for(var i = 0; i < blocks.length; i++)
      if(blocks[i].cx < leftmost) leftmost = blocks[i].cx;
    for(var i = 0; i < blocks.length; i++)
      if(blocks[i].cx == leftmost && blocks[i].cy > topmost)
      {
        topmost = blocks[i].cy;
        top_left = i;
      }

    var xb = dblock.ww*3/8;
    var yb = dblock.wh*3/8;
    var start;
    var done;
    var found;


    if(shadow)
      ctx.fillStyle = shadow_fill;
    else
    {
      ctx.fillStyle = block_fill;
      ctx.strokeStyle = block_stroke;
    }

    cur = top_left;

    ctx.beginPath();

    dblock.wx = wx+blocks[cur].cx-xb;
    dblock.wy = wy+blocks[cur].cy+yb;
    screenSpace(cam,canv,dblock);
    ctx.moveTo(dblock.x-tx+dblock.w/2,dblock.y-ty+dblock.h/2);

    start = 0;
    done = 0;
    while(!done)
    {
      found = false;
      for(var i = 0; !found && !done && i < 4; i++) //start at top, CW
      {
        switch((i+start)%4)
        {
          case 0: //check top
          {
            for(var j = 0; !found && j < blocks.length; j++)
            {
              if(cur != j &&
                blocks[j].cx == blocks[cur].cx   &&
                blocks[j].cy == blocks[cur].cy+1)
              {
                found = true;
                cur = j;

                dblock.wx = wx+blocks[cur].cx-xb;
                dblock.wy = wy+blocks[cur].cy-yb;
                screenSpace(cam,canv,dblock);
                ctx.lineTo(dblock.x-tx+dblock.w/2,dblock.y-ty+dblock.h/2);

                start = 3;
              }
            }
            if(!found)
            {
              dblock.wx = wx+blocks[cur].cx+xb;
              dblock.wy = wy+blocks[cur].cy+yb;
              screenSpace(cam,canv,dblock);
              ctx.lineTo(dblock.x-tx+dblock.w/2,dblock.y-ty+dblock.h/2);
            }
          }
          break;
          case 1: //check right
          {
            for(var j = 0; !found && j < blocks.length; j++)
            {
              if(cur != j &&
                blocks[j].cx == blocks[cur].cx+1 &&
                blocks[j].cy == blocks[cur].cy)
              {
                found = true;
                cur = j;

                dblock.wx = wx+blocks[cur].cx-xb;
                dblock.wy = wy+blocks[cur].cy+yb;
                screenSpace(cam,canv,dblock);
                ctx.lineTo(dblock.x-tx+dblock.w/2,dblock.y-ty+dblock.h/2);

                start = 0;
              }
            }
            if(!found)
            {
              dblock.wx = wx+blocks[cur].cx+xb;
              dblock.wy = wy+blocks[cur].cy-yb;
              screenSpace(cam,canv,dblock);
              ctx.lineTo(dblock.x-tx+dblock.w/2,dblock.y-ty+dblock.h/2);
            }
          }
          break;
          case 2: //check bottom
          {
            for(var j = 0; !found && j < blocks.length; j++)
            {
              if(cur != j &&
                blocks[j].cx == blocks[cur].cx   &&
                blocks[j].cy == blocks[cur].cy-1)
              {
                found = true;
                cur = j;

                dblock.wx = wx+blocks[cur].cx+xb;
                dblock.wy = wy+blocks[cur].cy+yb;
                screenSpace(cam,canv,dblock);
                ctx.lineTo(dblock.x-tx+dblock.w/2,dblock.y-ty+dblock.h/2);

                start = 1;
              }
            }
            if(!found)
            {
              dblock.wx = wx+blocks[cur].cx-xb;
              dblock.wy = wy+blocks[cur].cy-yb;
              screenSpace(cam,canv,dblock);
              ctx.lineTo(dblock.x-tx+dblock.w/2,dblock.y-ty+dblock.h/2);
            }
          }
          break;
          case 3: //check left
          {
            for(var j = 0; !found && j < blocks.length; j++)
            {
              if(cur != j &&
                blocks[j].cx == blocks[cur].cx-1 &&
                blocks[j].cy == blocks[cur].cy)
              {
                found = true;
                cur = j;

                dblock.wx = wx+blocks[cur].cx+xb;
                dblock.wy = wy+blocks[cur].cy-yb;
                screenSpace(cam,canv,dblock);
                ctx.lineTo(dblock.x-tx+dblock.w/2,dblock.y-ty+dblock.h/2);

                start = 2;
              }
            }
            if(!found)
            {
              dblock.wx = wx+blocks[cur].cx-xb;
              dblock.wy = wy+blocks[cur].cy+yb;
              screenSpace(cam,canv,dblock);
              ctx.lineTo(dblock.x-tx+dblock.w/2,dblock.y-ty+dblock.h/2);
            }
          }
          break;
        }

        if(!found && cur == top_left && (i+start)%4 == 3) done = 1;
      }
    }
    ctx.fill();
    if(!shadow) ctx.stroke();

    if(!shadow)
    {
      for(var i = 0; i < blocks.length; i++)
      {
        dblock.wx = wx+blocks[i].cx;
        dblock.wy = wy+blocks[i].cy;
        screenSpace(cam,canv,dblock);

        var d = dblock.w/8;
        ctx.strokeStyle = block_stroke;
        for(var j = 0; j < 4; j++)
        {
               if(blocks[i].c[j] > 0) ctx.strokeStyle = "#00FF00";
          else if(blocks[i].c[j] < 0) ctx.strokeStyle = "#FF0000";
          else continue;
          switch(j)
          {
            case 0: ctx.beginPath(); ctx.moveTo(dblock.x         +d-tx,dblock.y         +d-ty); ctx.lineTo(dblock.x+dblock.w-d-tx,dblock.y         +d-ty); ctx.stroke(); break;
            case 1: ctx.beginPath(); ctx.moveTo(dblock.x+dblock.w-d-tx,dblock.y         +d-ty); ctx.lineTo(dblock.x+dblock.w-d-tx,dblock.y+dblock.h-d-ty); ctx.stroke(); break;
            case 2: ctx.beginPath(); ctx.moveTo(dblock.x         +d-tx,dblock.y+dblock.h-d-ty); ctx.lineTo(dblock.x+dblock.w-d-tx,dblock.y+dblock.h-d-ty); ctx.stroke(); break;
            case 3: ctx.beginPath(); ctx.moveTo(dblock.x         +d-tx,dblock.y         +d-ty); ctx.lineTo(dblock.x         +d-tx,dblock.y+dblock.h-d-ty); ctx.stroke(); break;
          }
        }
      }
    }
    ctx.restore();

    if(!shadow)
    {
      var c = cos(-rot);
      var s = sin(-rot);
      var rx;
      var ry;
      var oldww;
      var oldwh;
      for(var i = 0; i < blocks.length; i++)
      {
        rx = blocks[i].cx-offx;
        ry = blocks[i].cy-offy;

        dblock.wx = rx*c - ry*s;
        dblock.wy = rx*s + ry*c;

        dblock.wx *= scale;
        dblock.wy *= scale;

        dblock.wx += wx;
        dblock.wy += wy;

        oldww = dblock.ww;
        oldwh = dblock.wh;
        dblock.ww *= scale;
        dblock.wh *= scale;
        screenSpace(cam,canv,dblock);
        dblock.ww = oldww;
        dblock.wh = oldwh;

        if(happys)
        {
          var happy = clamp(-2,2,happys[i]);
          if(bounces)
            ctx.drawImage(atoms[happy+2], dblock.x+bounces[i].vx, dblock.y+bounces[i].vy, dblock.w, dblock.h);
          else
            ctx.drawImage(atoms[happy+2], dblock.x, dblock.y, dblock.w, dblock.h);
        }
        else
        {
          if(bounces)
            ctx.drawImage(atoms[2], dblock.x+bounces[i].vx, dblock.y+bounces[i].vy, dblock.w, dblock.h);
          else
            ctx.drawImage(atoms[2], dblock.x, dblock.y, dblock.w, dblock.h);
        }
      }
    }

  }

  var board = function()
  {
    var self = this;
    self.cells = [];

    var boardi = function(x,y) { return ((1+y)*(cur_level.repeat_x+2))+(x+1); }

    self.reset = function()
    {
      self.cells = [];
      for(var i = -1; i < cur_level.repeat_y+1; i++)
        for(var j = -1; j < cur_level.repeat_x+1; j++)
        {
          self.cells[boardi(j,i)] =
          {
            cx:j+1+bounds.wx-bounds.ww/2,
            cy:i+1+bounds.wy-bounds.wh/2,
            c:[0,0,0,0],
            molecule_id: 0,
            block_id: 0,
            present:0,
            present_t:0,
            score_up:0,
            score_right:0,
          };
        }
    }

    self.clear = function()
    {
      var cell;
      for(var i = 0; i < molecules.length; i++)
      {
        molecules[i].total_happy = 0;
        for(var j = 0; j < molecules[i].happys.length; j++)
          molecules[i].happys[j] = 0;
      }
      for(var i = -1; i < cur_level.repeat_y+1; i++)
      {
        for(var j = -1; j < cur_level.repeat_x+1; j++)
        {
          cell = self.cells[boardi(j,i)];
          for(var k = 0; k < 4; k++)
            cell.c[k] = 0;
          cell.present = 0;
          cell.molecule_id = 0;
          cell.block_id = 0;
          cell.score_up = 0;
          cell.score_right = 0;
        }
      }
    }

    self.stampCell = function(block,x,y,molecule_id,block_id)
    {
      var cell;
      if(x == clamp(-1,cur_level.repeat_x,x) && y == clamp(-1,cur_level.repeat_y,y))
      {
        cell = self.cells[boardi(x,y)];
        for(var k = 0; k < 4; k++) cell.c[k] = block.c[k];
        cell.present = 1;
        cell.molecule_id = molecule_id;
        cell.block_id = block_id;
      }
    }

    self.stampMolecule = function(molecule,id)
    {
      var block;
      var x;
      var y;
      for(var i = 0; i < molecule.template.blocks.length; i++)
      {
        block = molecule.template.blocks[i];
        x = molecule.cx+block.cx-bounds.wx+bounds.ww/2-1;
        y = molecule.cy+block.cy-bounds.wy+bounds.wh/2-1;
        self.stampCell(block,x                   ,y                   , id, i);
        self.stampCell(block,x+cur_level.repeat_x,y                   , id, i);
        self.stampCell(block,x-cur_level.repeat_x,y                   , id, i);
        self.stampCell(block,x                   ,y+cur_level.repeat_y, id, i);
        self.stampCell(block,x                   ,y-cur_level.repeat_y, id, i);
        self.stampCell(block,x+cur_level.repeat_x,y+cur_level.repeat_y, id, i);
        self.stampCell(block,x+cur_level.repeat_x,y-cur_level.repeat_y, id, i);
        self.stampCell(block,x-cur_level.repeat_x,y+cur_level.repeat_y, id, i);
        self.stampCell(block,x-cur_level.repeat_x,y-cur_level.repeat_y, id, i);
      }
    }

    self.populate = function()
    {
      self.clear();
      for(var i = 0; i < molecules.length; i++)
      {
        if(!molecules[i].up)
          self.stampMolecule(molecules[i],i);
      }
    }

    self.score = function()
    {
      var cell;
      var neighbor;
      var cell_score;
      var score = 0;
      for(var i = -1; i < cur_level.repeat_y-1; i++)
      {
        for(var j = -1; j < cur_level.repeat_x-1; j++)
        {
          cell = self.cells[boardi(j,i)];
          if(cell.present)
          {
            neighbor = self.cells[boardi(j+1,i)]; //check right
            if(neighbor.present && cell.molecule_id != neighbor.molecule_id)
            {
              cell_score = (cell.c[1]*neighbor.c[3]*-1)*5;
              if(cell_score == 0) cell_score = 1;
              score            += cell_score;
              cell.score_right += cell_score;
              if(j < cur_level.repeat_x-1) //otherwise can get counted twice (which is good for score- not for happy)
              {
                molecules[cell.molecule_id].happys[cell.block_id] += cell_score;
                molecules[cell.molecule_id].total_happy += cell_score;
                molecules[neighbor.molecule_id].happys[neighbor.block_id] += cell_score;
                molecules[neighbor.molecule_id].total_happy;
              }
            }

            neighbor = self.cells[boardi(j,i+1)]; //check up
            if(neighbor.present && cell.molecule_id != neighbor.molecule_id)
            {
              cell_score = (cell.c[0]*neighbor.c[2]*-1)*5;
              if(cell_score == 0) cell_score = 1;
              score         += cell_score;
              cell.score_up += cell_score;
              if(i < cur_level.repeat_y-1) //otherwise can get counted twice (which is good for score- not for happy)
              {
                molecules[cell.molecule_id].happys[cell.block_id] += cell_score;
                molecules[cell.molecule_id].total_happy += cell_score;
                molecules[neighbor.molecule_id].happys[neighbor.block_id] += cell_score;
                molecules[neighbor.molecule_id].total_happy;
              }
            }
          }
        }
      }
      return score;
    }

  }

  var bring_to_top = function(molecule)
  {
    var found = false;
    for(var i = 0; !found && i < molecules.length; i++)
    {
      if(molecules[i] == molecule)
      {
        for(var j = i-1; j >= 0; j--)
          molecules[j+1] = molecules[j];
        molecules[0] = molecule;
        found = true;
        for(var j = 1; j < molecules.length; j++)
          molecules[j].snap();
      }
    }
  }
  var bring_to_bottom = function(molecule)
  {
    var found = false;
    for(var i = 0; !found && i < molecules.length; i++)
    {
      if(molecules[i] == molecule)
      {
        var j = i;
        while(j < molecules.length-1 && molecules[j+1].up)
        {
          molecules[j] = molecules[j+1];
          j++;
        }
        molecules[j] = molecule;
        found = true;
      }
    }
  }
  var remove_molecule = function(molecule)
  {
    var found = false;
    for(var i = 0; !found && i < molecules.length; i++)
    {
      if(molecules[i] == molecule)
      {
        molecules.splice(i,1);
        found = true;
      }
    }
  }

  var scroller = function()
  {
    var self = this;
    self.ww = cur_level.scroll_w;
    self.wh = game_cam.wh;
    self.wx = game_cam.wx-game_cam.ww/2+self.ww/2;
    self.wy = game_cam.wy-game_cam.wh/2+self.wh/2;
    self.x = 0;
    self.y = 0;
    self.w = 0;
    self.h = 0;

    self.scroll_wy_min = 9999999;
    self.scroll_wy_max = -999999;
    self.scroll_wyv = 0;
    self.scroll_wy = 0;

    var last_drag_wevt = {wx:0,wy:0};
    var worldevt = {wx:0,wy:0};
    self.shouldDrag = function(evt)
    {
      if(dragging_molecule || evt.hitUI) return false;
      worldevt.wx = worldSpaceX(cam,canv,evt.doX);
      worldevt.wy = worldSpaceY(cam,canv,evt.doY);
      var hit = worldPtWithin(self.wx,self.wy,self.ww,self.wh,worldevt.wx,worldevt.wy);
      if(hit)
      {
        evt.hitUI = true;
      }
      return hit;
    }
    self.dragStart = function(evt)
    {
      worldevt.wx = worldSpaceX(cam,canv,evt.doX);
      worldevt.wy = worldSpaceY(cam,canv,evt.doY);
      last_drag_wevt.wx = worldevt.wx;
      last_drag_wevt.wy = worldevt.wy;
      self.scroll_wyv = 0.;
    }
    self.drag = function(evt)
    {
      worldevt.wx = worldSpaceX(cam,canv,evt.doX);
      worldevt.wy = worldSpaceY(cam,canv,evt.doY);
      var x_toward_board = worldevt.wx-last_drag_wevt.wx;
      var stamp_hit = 0;
      for(var i = 0; !stamp_hit && i < stamps.length; i++)
      {
        if(stamps[i].ptWithin(worldevt.wx,worldevt.wy))
          stamp_hit = stamps[i];
      }

      if(
        stamp_hit &&
        x_toward_board > abs(worldevt.wy-last_drag_wevt.wy) &&
        x_toward_board > 0.02
      )
      {
        self.dragging = false;
        var s = new molecule();
        s.wx = stamp_hit.wx;
        s.wy = stamp_hit.wy-self.scroll_wy;
        s.setTemplate(stamp_hit.template);
        s.dragging = true;
        dragging_molecule = s;
        molecules[molecules.length] = s;
        bring_to_top(s);
      }
      else
      {
        self.scroll_wy -= worldevt.wy-last_drag_wevt.wy;
        self.scroll_wy = clamp(self.scroll_wy_min,self.scroll_wy_max,self.scroll_wy);
        self.scroll_wyv -= (worldevt.wy-last_drag_wevt.wy)*0.1;
      }
      last_drag_wevt.wx = worldevt.wx;
      last_drag_wevt.wy = worldevt.wy;
    }
    self.dragFinish = function(evt)
    {
    }

    self.tick = function(evt)
    {
      if(!self.dragging)
      {
        self.scroll_wy += self.scroll_wyv;
        self.scroll_wy = clamp(self.scroll_wy_min,self.scroll_wy_max,self.scroll_wy);
        self.scroll_wyv *= 0.8;
      }
      self.scroll_wyv *= 0.99;
    }
  }

  var molecule = function()
  {
    var self = this;

    self.template = new template();
    self.bounces = [];
    self.happys = [];
    self.total_happy = 0;

    self.setTemplate = function(t)
    {
      copy_template(t,self.template);
      self.bounces = [];
      for(var i = 0; i < self.template.blocks.length; i++)
        self.bounces.push(new bounce2());
      self.happys = [];
      for(var i = 0; i < self.template.blocks.length; i++)
        self.happys.push(0);
    }

    self.wx  = 0;
    self.wy  = 0;

    self.base_rot = 0;
    self.rot = 0;
    self.tmp_target_rot = 0;
    self.target_rot = 0;
    self.rot_ticks = 10000000;
    self.click_ticks = 1000000;
    self.up_ticks = 1000000;
    self.up = true;
    self.cx = 0;
    self.cy = 0;

    var worldevt = {wx:0,wy:0};
    var worldoff = {wx:0,wy:0};
    self.shouldClickOff = function(evt,woffx,woffy)
    {
      var hit = false
      for(var i = 0; !hit && i < self.template.blocks.length; i++)
        hit = worldPtWithin(self.wx+self.template.blocks[i].cx,self.wy+self.template.blocks[i].cy,1.,1.,worldevt.wx+woffx,worldevt.wy+woffy);
      return hit;
    }
    self.shouldClick = function(evt)
    {
      if(evt.hitUI) return false;
      if(self.up)
      {
        worldevt.wx = worldSpaceX(cam,canv,evt.doX-shadow_dist);
        worldevt.wy = worldSpaceY(cam,canv,evt.doY-shadow_dist);
      }
      else
      {
        worldevt.wx = worldSpaceX(cam,canv,evt.doX);
        worldevt.wy = worldSpaceY(cam,canv,evt.doY);
      }
      return (
        self.shouldClickOff(evt,                  0,                  0) ||
        self.shouldClickOff(evt, cur_level.repeat_x,                  0) ||
        self.shouldClickOff(evt,-cur_level.repeat_x,                  0) ||
        self.shouldClickOff(evt,                  0, cur_level.repeat_y) ||
        self.shouldClickOff(evt,                  0,-cur_level.repeat_y) ||
        self.shouldClickOff(evt, cur_level.repeat_x, cur_level.repeat_y) ||
        self.shouldClickOff(evt, cur_level.repeat_x,-cur_level.repeat_y) ||
        self.shouldClickOff(evt,-cur_level.repeat_x, cur_level.repeat_y) ||
        self.shouldClickOff(evt,-cur_level.repeat_x,-cur_level.repeat_y)
      );
    }
    self.click = function(evt)
    {
      if(self.click_ticks < 20 && self.target_rot == 0)
      {
        self.base_rot = self.rot;
        self.target_rot += halfpi;
        if(self.target_rot >= twopi-0.001) self.target_rot = 0;
        self.rot_ticks = 0;
        evt.hitUI = true;
      }
      self.click_ticks = 0;
    }

    self.shouldDragOff = function(evt, woffx, woffy)
    {
      var hit = false
      for(var i = 0; !hit && i < self.template.blocks.length; i++)
        hit = worldPtWithin(self.wx+self.template.blocks[i].cx,self.wy+self.template.blocks[i].cy,1.,1.,worldevt.wx+woffx,worldevt.wy+woffy);
      if(hit)
      {
        self.wx -= woffx;
        self.wy -= woffy;
      }
      return hit;
    }
    self.shouldDrag = function(evt)
    {
      if(dragging_molecule || evt.hitUI) return false;
      if(self.up)
      {
        worldevt.wx = worldSpaceX(cam,canv,evt.doX-shadow_dist);
        worldevt.wy = worldSpaceY(cam,canv,evt.doY-shadow_dist);
      }
      else
      {
        worldevt.wx = worldSpaceX(cam,canv,evt.doX);
        worldevt.wy = worldSpaceY(cam,canv,evt.doY);
      }
      var hit = (
        self.shouldDragOff(evt,                  0,                  0) ||
        self.shouldDragOff(evt, cur_level.repeat_x,                  0) ||
        self.shouldDragOff(evt,-cur_level.repeat_x,                  0) ||
        self.shouldDragOff(evt,                  0, cur_level.repeat_y) ||
        self.shouldDragOff(evt,                  0,-cur_level.repeat_y) ||
        self.shouldDragOff(evt, cur_level.repeat_x, cur_level.repeat_y) ||
        self.shouldDragOff(evt, cur_level.repeat_x,-cur_level.repeat_y) ||
        self.shouldDragOff(evt,-cur_level.repeat_x, cur_level.repeat_y) ||
        self.shouldDragOff(evt,-cur_level.repeat_x,-cur_level.repeat_y)
      );
      if(hit)
      {
        evt.hitUI = true;
        self.up = true;
        bring_to_top(self);
        dragging_molecule = self;
      }
      return hit;
    }
    self.dragStart = function(evt)
    {
      worldevt.wx = worldSpaceX(cam,canv,evt.doX);
      worldevt.wy = worldSpaceY(cam,canv,evt.doY);
      worldoff.wx = worldevt.wx-self.wx;
      worldoff.wy = worldevt.wy-self.wy;
      self.drag(evt);
    }
    self.drag = function(evt)
    {
      worldevt.wx = worldSpaceX(cam,canv,evt.doX);
      worldevt.wy = worldSpaceY(cam,canv,evt.doY);
      self.wx = worldevt.wx-worldoff.wx;
      self.wy = worldevt.wy-worldoff.wy;
    }
    self.dragFinish = function(evt)
    {
      if(self.wx < scroll.wx+scroll.ww/2)
        remove_molecule(self);
      self.snap();
      if(dragging_molecule == self) dragging_molecule = 0;
    }

    var blocks_collide = function(x0,y0,x1,y1)
    {
      return (x0 == x1 && y0 == y1);
    }
    self.snap = function()
    {
      var was_up = self.up; //not much, was up with you?
      var molecule;
      var cx = round(self.wx+0.5);
      var cy = round(self.wy+0.5);
      self.up = false;
      for(var i = 0; !self.up && i < molecules.length; i++)
      {
        molecule = molecules[i];
        if(molecule == self || molecule.up) continue;
        for(var j = 0; !self.up && j < self.template.blocks.length; j++)
          for(var k = 0; !self.up && k < molecule.template.blocks.length; k++)
          {
            if(
              blocks_collide(cx+self.template.blocks[j].cx,                    cy+self.template.blocks[j].cy,                    molecule.cx+molecule.template.blocks[k].cx, molecule.cy+molecule.template.blocks[k].cy) ||
              blocks_collide(cx+self.template.blocks[j].cx+cur_level.repeat_x, cy+self.template.blocks[j].cy,                    molecule.cx+molecule.template.blocks[k].cx, molecule.cy+molecule.template.blocks[k].cy) ||
              blocks_collide(cx+self.template.blocks[j].cx-cur_level.repeat_x, cy+self.template.blocks[j].cy,                    molecule.cx+molecule.template.blocks[k].cx, molecule.cy+molecule.template.blocks[k].cy) ||
              blocks_collide(cx+self.template.blocks[j].cx,                    cy+self.template.blocks[j].cy+cur_level.repeat_y, molecule.cx+molecule.template.blocks[k].cx, molecule.cy+molecule.template.blocks[k].cy) ||
              blocks_collide(cx+self.template.blocks[j].cx,                    cy+self.template.blocks[j].cy-cur_level.repeat_y, molecule.cx+molecule.template.blocks[k].cx, molecule.cy+molecule.template.blocks[k].cy) ||
              blocks_collide(cx+self.template.blocks[j].cx+cur_level.repeat_x, cy+self.template.blocks[j].cy+cur_level.repeat_y, molecule.cx+molecule.template.blocks[k].cx, molecule.cy+molecule.template.blocks[k].cy) ||
              blocks_collide(cx+self.template.blocks[j].cx+cur_level.repeat_x, cy+self.template.blocks[j].cy-cur_level.repeat_y, molecule.cx+molecule.template.blocks[k].cx, molecule.cy+molecule.template.blocks[k].cy) ||
              blocks_collide(cx+self.template.blocks[j].cx-cur_level.repeat_x, cy+self.template.blocks[j].cy+cur_level.repeat_y, molecule.cx+molecule.template.blocks[k].cx, molecule.cy+molecule.template.blocks[k].cy) ||
              blocks_collide(cx+self.template.blocks[j].cx-cur_level.repeat_x, cy+self.template.blocks[j].cy-cur_level.repeat_y, molecule.cx+molecule.template.blocks[k].cx, molecule.cy+molecule.template.blocks[k].cy)
            )
              self.up = true;
          }
      }
      if(was_up && !self.up)
      {
        self.cx = cx;
        self.cy = cy;
        self.wx = cx-0.5;
        self.wy = cy-0.5;
        self.up_ticks = 0;
        bring_to_bottom(self);
      }
      if(!was_up && self.up)
      {
        bring_to_top(self);
      }
    }

    self.tick = function()
    {
      self.click_ticks++;
      self.rot_ticks++;
      if(self.up) self.up_ticks++;
      var t;
      var n_min = 0;
      var n_max = 0;

      //windup
      n_min = n_max+1;
      n_max = 8;
      if(self.rot_ticks == n_min) self.tmp_target_rot = self.base_rot - 0.2*(self.target_rot - self.base_rot);
      if(self.rot_ticks >= n_min && self.rot_ticks < n_max)
        self.rot = lerp(self.rot,self.tmp_target_rot,0.4);

      //overshoot
      n_min = n_max+1;
      n_max = 15;
      if(self.rot_ticks == n_min) self.tmp_target_rot = self.target_rot + 0.1*(self.target_rot - self.base_rot);
      if(self.rot_ticks >= n_min && self.rot_ticks < n_max)
        self.rot = lerp(self.rot,self.tmp_target_rot,0.5);

      //relax
      n_min = n_max+1;
      n_max = 20;
      if(self.rot_ticks == n_min) self.tmp_target_rot = self.target_rot;
      if(self.rot_ticks >= n_min && self.rot_ticks < n_max)
        self.rot = lerp(self.rot,self.tmp_target_rot,0.5);

      if(self.rot_ticks == n_max)
      {
        if(abs(self.target_rot-halfpi) < 0.001)
          rotate_template(self.template);
        self.base_rot       = 0;
        self.rot            = 0;
        self.tmp_target_rot = 0;
        self.target_rot     = 0;
        self.snap();
      }


      for(var i = 0; i < self.bounces.length; i++)
      {
        if(rand() < 0.1)
        {
          var s = 3;

               if(self.happys[i] < -5)  s = 0;
          else if(self.happys[i] < -4)  s = 1;
          else if(self.happys[i] <  0)  s = 2;
          else if(self.happys[i] <  1)  s = 3;
          else if(self.happys[i] <  2)  s = 4;
          else if(self.happys[i] <  3)  s = 5;
          else if(self.happys[i] <  6)  s = 6;
          else if(self.happys[i] <  10) s = 7;
          else                          s = 8;

          s = G[s];

          self.bounces[i].velx += rand0()*s*10;
          self.bounces[i].vely += rand0()*s*10;
        }
        self.bounces[i].tick();
      }
    }

    self.draw_off_up = function(woffx,woffy)
    {
      draw_blocks(self.wx+woffx,self.wy+woffy,0,0,self.bounces,self.happys,self.rot,1,1,self.template.blocks);
      var t = (clamp(0,10,self.up_ticks-5)/10)*0.2;
      draw_blocks(self.wx+t+woffx,self.wy-t+woffy,0,0,self.bounces,self.happys,self.rot,1,0,self.template.blocks);
    }
    self.draw_off_down = function(woffx,woffy)
    {
      draw_blocks(self.wx+woffx,self.wy+woffy,0,0,self.bounces,self.happys,self.rot,1,0,self.template.blocks);
    }
    self.draw_front_up = function()
    {
      if(self.up) self.draw_off_up(0,0);
    }
    self.draw_front_down = function()
    {
      if(!self.up) self.draw_off_down(0,0);
    }
    self.draw_behind_up = function()
    {
      if(self.up)
      {
        self.draw_off_up( cur_level.repeat_x,                  0);
        self.draw_off_up(-cur_level.repeat_x,                  0);
        self.draw_off_up(                  0, cur_level.repeat_y);
        self.draw_off_up(                  0,-cur_level.repeat_y);
        self.draw_off_up( cur_level.repeat_x, cur_level.repeat_y);
        self.draw_off_up( cur_level.repeat_x,-cur_level.repeat_y);
        self.draw_off_up(-cur_level.repeat_x, cur_level.repeat_y);
        self.draw_off_up(-cur_level.repeat_x,-cur_level.repeat_y);
      }
    }
    self.draw_behind_down = function()
    {
      if(!self.up)
      {
        self.draw_off_down( cur_level.repeat_x,                  0);
        self.draw_off_down(-cur_level.repeat_x,                  0);
        self.draw_off_down(                  0, cur_level.repeat_y);
        self.draw_off_down(                  0,-cur_level.repeat_y);
        self.draw_off_down( cur_level.repeat_x, cur_level.repeat_y);
        self.draw_off_down( cur_level.repeat_x,-cur_level.repeat_y);
        self.draw_off_down(-cur_level.repeat_x, cur_level.repeat_y);
        self.draw_off_down(-cur_level.repeat_x,-cur_level.repeat_y);
      }
    }
  }

  var template = function(cx,cy,blocks)
  {
    var self = this;
    self.cx = cx;
    self.cy = cy;
    self.blocks = blocks;
  }

  var stamp = function()
  {
    var self = this;

    self.template = new template();

    self.wx  = 0;
    self.wy  = 0;

    self.base_rot = 0;
    self.rot = 0;
    self.tmp_target_rot = 0;
    self.target_rot = 0;
    self.rot_ticks = 10000000;
    self.click_ticks = 1000000;

    self.ptWithin = function(wx,wy)
    {
      if(self.target_rot != 0) return false;
      var hit = false
      hit = worldPtWithin(self.wx-self.template.cx,self.wy-template.cy-scroll.scroll_wy,1.,1.,wx,wy);
      for(var i = 0; !hit && i < self.template.blocks.length; i++)
        hit = worldPtWithin(self.wx-self.template.cx+self.template.blocks[i].cx,self.wy-self.template.cy+self.template.blocks[i].cy-scroll.scroll_wy,1.,1.,wx,wy);
      return hit;
    }

    var worldevt = {wx:0,wy:0};
    self.shouldClick = function(evt)
    {
      worldevt.wx = worldSpaceX(cam,canv,evt.doX);
      worldevt.wy = worldSpaceY(cam,canv,evt.doY);
      return self.ptWithin(worldevt.wx,worldevt.wy);
    }
    self.click = function(evt)
    {
      if(self.click_ticks < 20 && self.target_rot == 0)
      {
        self.base_rot = self.rot;
        self.target_rot += halfpi;
        if(self.target_rot >= twopi-0.001) self.target_rot = 0;
        self.rot_ticks = 0;
      }
      self.click_ticks = 0;
    }

    self.tick = function()
    {
      self.click_ticks++;
      self.rot_ticks++;
      var t;
      var n_min = 0;
      var n_max = 0;

      //windup
      n_min = n_max+1;
      n_max = 8;
      if(self.rot_ticks == n_min) self.tmp_target_rot = self.base_rot - 0.2*(self.target_rot - self.base_rot);
      if(self.rot_ticks >= n_min && self.rot_ticks < n_max)
        self.rot = lerp(self.rot,self.tmp_target_rot,0.4);

      //overshoot
      n_min = n_max+1;
      n_max = 15;
      if(self.rot_ticks == n_min) self.tmp_target_rot = self.target_rot + 0.1*(self.target_rot - self.base_rot);
      if(self.rot_ticks >= n_min && self.rot_ticks < n_max)
        self.rot = lerp(self.rot,self.tmp_target_rot,0.5);

      //relax
      n_min = n_max+1;
      n_max = 20;
      if(self.rot_ticks == n_min) self.tmp_target_rot = self.target_rot;
      if(self.rot_ticks >= n_min && self.rot_ticks < n_max)
        self.rot = lerp(self.rot,self.tmp_target_rot,0.5);

      if(self.rot_ticks == n_max)
      {
        if(abs(self.target_rot-halfpi) < 0.001)
          rotate_template(self.template);
        self.base_rot       = 0;
        self.rot            = 0;
        self.tmp_target_rot = 0;
        self.target_rot     = 0;
      }
    }

    self.draw = function()
    {
      draw_blocks(self.wx,self.wy-scroll.scroll_wy,self.template.cx,self.template.cy,0,0,self.rot,1,0,self.template.blocks);
    }
  }

  self.ready = function()
  {
    clicker = new Clicker({source:stage.dispCanv.canvas});
    dragger = new Dragger({source:stage.dispCanv.canvas});

    menu_cam = { wx:-20, wy:0, ww:12, wh:6 };
    cam = { wx:menu_cam.wx, wy:menu_cam.wy, ww:menu_cam.ww, wh:menu_cam.wh };
    mode = MODE_MENU;
    submitting_t = -1;

    score_board = new board();

    url_args = jsonFromURL()
    if(url_args["lvl"]) lvl = parseInt(url_args["lvl"]);
    if(!lvl) lvl = 0;
    init_levels();
    set_level(lvl);
    cur_stars_bounce = new bounce();

    back_btn = {wx:0,wy:0,ww:0,wh:0,x:0,y:0,w:0,h:0};
    back_btn.click = function(evt) { mode = MODE_MENU; evt.hitUI = true; }
    back_btn.ww = game_cam.ww/10;
    back_btn.wh = game_cam.wh/10;
    back_btn.wx = game_cam.wx-game_cam.ww/2+back_btn.ww/2;
    back_btn.wy = game_cam.wy+game_cam.wh/2-back_btn.wh/2;
    screenSpace(cam,canv,back_btn);

    clear_btn = {wx:0,wy:0,ww:0,wh:0,x:0,y:0,w:0,h:0};
    clear_btn.click = function(evt) { molecules = []; dragging_molecule = 0; }
    clear_btn.ww = game_cam.ww/10;
    clear_btn.wh = game_cam.wh/10;
    clear_btn.wx = game_cam.wx-game_cam.ww/2+clear_btn.ww/2;
    clear_btn.wy = game_cam.wy+game_cam.wh/2-back_btn.wh-clear_btn.wh/2;
    screenSpace(cam,canv,clear_btn);

    submit_btn = {wx:0,wy:0,ww:0,wh:0,x:0,y:0,w:0,h:0};
    submit_btn.click = function(evt) {
      mode = MODE_SUBMIT;
      submitting_t = 0;
      evt.hitUI = true;
    }
    submit_btn.ww = game_cam.ww/5;
    submit_btn.wh = game_cam.wh/10;
    submit_btn.wx = game_cam.wx+game_cam.ww/2-submit_btn.ww/2;
    submit_btn.wy = game_cam.wy+game_cam.wh/2-submit_btn.wh/2;
    screenSpace(cam,canv,submit_btn);

    outro = new star_outro();

    screenSpace(cam,canv,bounds);
    screenSpace(cam,canv,scroll);
  }

  self.tick = function()
  {
    n_ticks++;

    if(mode == MODE_INTRO)
    {
      clicker.filter(cur_level);
      if(!cur_level.introtick()) mode = MODE_GAME;
    }

    if(mode == MODE_MENU)
    {
      cam.wx = lerp(cam.wx,menu_cam.wx,0.1);
      cam.wy = lerp(cam.wy,menu_cam.wy,0.1);
      cam.ww = lerp(cam.ww,menu_cam.ww,0.1);
      cam.wh = lerp(cam.wh,menu_cam.wh,0.1);
    }
    if(mode == MODE_GAME || mode == MODE_SUBMIT || mode == MODE_INTRO)
    {
      cam.wx = lerp(cam.wx,game_cam.wx,0.1);
      cam.wy = lerp(cam.wy,game_cam.wy,0.1);
      cam.ww = lerp(cam.ww,game_cam.ww,0.1);
      cam.wh = lerp(cam.wh,game_cam.wh,0.1);
    }

    for(var i = 0; i < levels.length; i++)
    {
      screenSpace(cam,canv,levels[i].button);
    }
    screenSpace(cam,canv,bounds);
    screenSpace(cam,canv,scroll);

    back_btn.ww = game_cam.ww/10;
    back_btn.wh = game_cam.wh/10;
    back_btn.wx = game_cam.wx-game_cam.ww/2+back_btn.ww/2;
    back_btn.wy = game_cam.wy+game_cam.wh/2-back_btn.wh/2;
    screenSpace(cam,canv,back_btn);

    clear_btn.ww = game_cam.ww/10;
    clear_btn.wh = game_cam.wh/10;
    clear_btn.wx = game_cam.wx-game_cam.ww/2+clear_btn.ww/2;
    clear_btn.wy = game_cam.wy+game_cam.wh/2-back_btn.wh-clear_btn.wh/2;
    screenSpace(cam,canv,clear_btn);

    submit_btn.ww = game_cam.ww/5;
    submit_btn.wh = game_cam.wh/10;
    submit_btn.wx = game_cam.wx+game_cam.ww/2-submit_btn.ww/2;
    submit_btn.wy = game_cam.wy+game_cam.wh/2-submit_btn.wh/2;
    screenSpace(cam,canv,submit_btn);

    if(mode == MODE_GAME)
    {
      clicker.filter(back_btn);
      clicker.filter(clear_btn);
      clicker.filter(submit_btn);
      for(var i = 0; i < molecules.length; i++)
        clicker.filter(molecules[i]);
      for(var i = 0; i < stamps.length; i++)
        clicker.filter(stamps[i]);
      dragger.filter(scroll);
      for(var i = 0; i < molecules.length; i++)
        dragger.filter(molecules[i]);
    }
    else if(mode == MODE_MENU)
    {
      for(var i = 0; i < levels.length; i++)
        clicker.filter(levels[i].button);
    }
    else if(mode == MODE_SUBMIT)
    {
      if(submitting_t > star_outro_sub_slide+star_outro_sub_star)
        clicker.filter(outro);
    }

    clicker.flush();
    dragger.flush();

    for(var i = 0; i < molecules.length; i++)
      molecules[i].tick();
    for(var i = 0; i < stamps.length; i++)
      stamps[i].tick();
    scroll.tick();

    score_board.populate();
    score = score_board.score();

    if(submitting_t != -1)
    {
      if(submitting_t == 0) outro.start_ticks = n_ticks+40;
      var t_into_outro = submitting_t;
      if(t_into_outro < star_outro_sub_slide)
        outro.wx = lerp(bounds.wx-bounds.ww/2-5-5,bounds.wx,t_into_outro/star_outro_sub_slide);
      else
        outro.wx = bounds.wx;
      outro.wy = 0;
      outro.ww = cam.ww/4;
      outro.wh = cam.wh/2;
      screenSpace(cam,canv,outro);
      submitting_t++;
    }

    var old_cur_stars = cur_level.cur_stars;
    cur_level.cur_stars = 0;
    if(score > cur_level.best) cur_level.best = score;
    for(var i = 0; i < 3; i++)
      if(score >= cur_level.star_req_score[i]) cur_level.cur_stars = i+1;
    if(cur_level.cur_stars > cur_level.stars) cur_level.stars = cur_level.cur_stars;
    if(cur_level.cur_stars != old_cur_stars)
    {
      cur_level.cur_stars_t = 0;
      cur_stars_bounce.vel = 1;
    }
    cur_stars_bounce.tick();
    cur_level.cur_stars_t++;
  };

  self.draw = function()
  {
    ctx.font = "20px Arial";
    var x  = 0;
    var wx = 0;
    var min_wx = worldSpaceX(cam,canv,0);
    var max_wx = worldSpaceX(cam,canv,canv.width);
    var y  = 0;
    var wy = 0;
    var min_wy = worldSpaceY(cam,canv,canv.height);
    var max_wy = worldSpaceY(cam,canv,0);

    var v_spacing = 1;
    var h_spacing = 1;

    ctx.strokeStyle = "#EEEEEE";

    //grid
    wy = floor(min_wy/v_spacing)*v_spacing;
    while(wy < max_wy)
    {
      y = screenSpaceY(cam,canv,wy);
      ctx.beginPath();
      ctx.moveTo(0,y);
      ctx.lineTo(canv.width,y);
      ctx.stroke();
      wy += v_spacing;
    }

    wx = floor(min_wx/h_spacing)*h_spacing;
    while(wx < max_wx)
    {
      x = screenSpaceX(cam,canv,wx);
      ctx.beginPath();
      ctx.moveTo(x,0);
      ctx.lineTo(x,canv.height);
      ctx.stroke();
      wx += h_spacing;
    }

    for(var i = molecules.length-1; i >= 0; i--)
      molecules[i].draw_behind_down();
    for(var i = molecules.length-1; i >= 0; i--)
      molecules[i].draw_front_down();

    ctx.fillStyle = scroll_fill;
    if(bounds.w)
    {
      ctx.fillRect(0,0,canv.width,bounds.y);
      ctx.fillRect(0,bounds.y,bounds.x,bounds.h);
      ctx.fillRect(bounds.x+bounds.w,bounds.y,canv.width-(bounds.x+bounds.w),bounds.h);
      ctx.fillRect(0,bounds.y+bounds.h,canv.width,bounds.y);
    }
    else
      ctx.fillRect(0,0,canv.width,canv.height);

    for(var i = molecules.length-1; i >= 0; i--)
      molecules[i].draw_behind_up();
    ctx.fillStyle = scroll_fill;
    ctx.fillRect(scroll.x,scroll.y,scroll.w,scroll.h);
    for(var i = 0; i < stamps.length; i++)
      stamps[i].draw();
    for(var i = molecules.length-1; i >= 0; i--)
      molecules[i].draw_front_up();


    ctx.strokeStyle = bounds_stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(bounds.x,bounds.y,bounds.w,bounds.h);

    ctx.lineWidth = 2;

    ctx.fillStyle = "#000000";
    ctx.fillText("Score: "+score,bounds.x+bounds.w-200,bounds.y-10);
    ctx.fillText("< Menu",back_btn.x,back_btn.y+back_btn.h/2);
    ctx.fillText("Clear",clear_btn.x,clear_btn.y+clear_btn.h/2);
    ctx.fillText("[Submit]",submit_btn.x,submit_btn.y+submit_btn.h/2);

    var b = cur_stars_bounce.v*10;
    for(var i = 0; i < 3; i++)
    {
      if(cur_level.cur_stars > i)
        ctx.drawImage(star_full,bounds.x+bounds.w-270+20*i-b/2,bounds.y-26-b/2,20+b,20+b);
      else
        ctx.drawImage(star     ,bounds.x+bounds.w-270+20*i,bounds.y-26,20,20);
    }

    ctx.fillText("Crystal Packer 5000!!!",levels[0].button.x,levels[0].button.y);
    ctx.fillText("Choose a   ^",levels[0].button.x-100,levels[0].button.y+125);
    ctx.fillText("|",levels[0].button.x+4,levels[0].button.y+135);
    ctx.fillText("Molecule --",levels[0].button.x-100,levels[0].button.y+150);
    for(var i = 0; i < levels.length; i++)
      levels[i].button.draw();

    if(mode == MODE_SUBMIT)
    {
      outro.draw();
    }

    if(mode == MODE_INTRO)
    {
      cur_level.introdraw();
    }
  };

  self.cleanup = function()
  {
  };

};

