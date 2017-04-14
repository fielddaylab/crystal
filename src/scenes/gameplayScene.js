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

  var url_args;
  var lvl;

  var score = 0;
  var board;

  var score_patience = 10;

  var deltas = [];
  var delta_max_t = 100;

  var scroll;
  var stamps;
  var molecules;

  var back_btn;
  var submit_btn;

  //block drawing
  var tx;
  var ty;
  var dblock = {wx:0,wy:0,ww:1,wh:1,x:0,y:0,w:0,h:0};
  var bounds_stroke  = "rgba(0,0,0,.6)";
  var shadow_fill  = "rgba(0,0,0,.1)";
  var border_fill  = "#FFFFFF";
  var block_fill   = "#A77777";
  var block_stroke = "#966666";

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

  var n_ticks = 0;

  var mode;
  var ENUM = 0;
  MODE_MENU   = ENUM; ENUM++;
  MODE_GAME   = ENUM; ENUM++;
  MODE_SUBMIT = ENUM; ENUM++;

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
    self.stars = 1;
    self.star_req_score = [];
    for(var i = 0; i < 3; i++)
      self.star_req_score.push(0);
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
      draw_blocks(self.wx,self.wy,self.level.available_templates[0].cx,self.level.available_templates[0].cy,self.rotoff+n_ticks/100,0.5,false,0,self.level.available_templates[0].blocks);

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
      mode = MODE_GAME;
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
      draw_blocks(self.wx,self.wy,cur_level.available_templates[0].cx,cur_level.available_templates[0].cy,n_ticks/100,1,false,0,cur_level.available_templates[0].blocks);

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
    var n = 3;
    var n_cols = n;
    var n_rows = 1;
    for(var i = 0; i < n; i++)
    {
      levels.push(new level(i));
      var j = 0;
      switch(i)
      {
        case 0:
          levels[i].scale = 2;
          levels[i].repeat_x = 18;
          levels[i].repeat_y = 10;
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
          break;
        case 1:
          levels[i].scale = 1;
          levels[i].repeat_x = 6;
          levels[i].repeat_y = 4;

          levels[i].available_templates[j++] = new template(0,0.5,[{cx:0,cy:0,c:[0,1,0,0]},{cx:0,cy:1,c:[0,0,0,-1]}]);
          break;
        case 2:
          levels[i].scale = 1;
          levels[i].repeat_x = 8;
          levels[i].repeat_y = 4;

          levels[i].available_templates[j++] = new template(0.5,1,[{cx:0,cy:0,c:[0,0,0,1]},{cx: 0,cy: 1,c:[0,0,0,0]},{cx: 0,cy:2,c:[-1,0,0,-1]},{cx: 1,cy:0,c:[1,1,0,0]}]); //L
          break;
      }

      levels[i].button = new level_button(menu_cam.wx-menu_cam.ww/2+(i+1.5)/(n_cols+2)*menu_cam.ww,menu_cam.wy+menu_cam.wh/2-1.5/(n_rows+2)*menu_cam.wh/2,menu_cam.ww/(n_cols+2),menu_cam.wh/(n_cols+2)*2,levels[i]);
    }
  }

  var set_level = function(i)
  {
    cur_level = levels[i];

    stamps = [];
    molecules = [];
    dragging_molecule = 0;

    game_cam = { wx:10, wy:0, ww:12*cur_level.scale, wh:6*cur_level.scale };
    bounds = {wx:game_cam.wx+2, wy:game_cam.wy, ww:game_cam.ww-4-2, wh:game_cam.wh-2, x:0,y:0,w:0,h:0 };

    scroll = new scroller();
    scroll.scroll_wy_min -= 0.2;
    scroll.scroll_wy_max += 0.2;

    for(var i = 0; i < cur_level.available_templates.length; i++)
    {
      stamps[i] = new stamp();
      stamps[i].wx = game_cam.wx-game_cam.ww/2+2.;
      stamps[i].wy = game_cam.wy+game_cam.wh/2-2.-4*i;
      if(stamps[i].wy < scroll.scroll_wy_min) scroll.scroll_wy_min = stamps[i].wy;
      if(stamps[i].wy > scroll.scroll_wy_max) scroll.scroll_wy_max = stamps[i].wy;
      copy_template(cur_level.available_templates[i],stamps[i].template);
    }

    create_board();
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
  var rotate_blocks = function(blocks)
  {
    for(var i = 0; i < blocks.length; i++)
    {
      var tmp = blocks[i].cy;
      blocks[i].cy = -blocks[i].cx;
      blocks[i].cx = tmp;
      var last = blocks[i].c[3];
      for(var j = 3; j > 0; j--)
        blocks[i].c[j] = blocks[i].c[j-1];
      blocks[i].c[0] = last;
    }
  }
  var draw_blocks = function(wx,wy,offx,offy,rot,scale,shadow,b,blocks)
  {
    dblock.wx = wx;
    dblock.wy = wy;
    screenSpace(cam,canv,dblock);
    tx = dblock.x+dblock.w/2;
    ty = dblock.y+dblock.h/2;

    ctx.save();
    ctx.translate(tx,ty);
    ctx.rotate(rot);
    ctx.translate(-offx*dblock.w*scale,offy*dblock.h*scale);
    ctx.scale(scale,scale);
    for(var i = 0; i < blocks.length; i++)
    {
      dblock.wx = wx+blocks[i].cx;
      dblock.wy = wy+blocks[i].cy;
      screenSpace(cam,canv,dblock);

      if(shadow) ctx.fillStyle = shadow;
      else
      {
        ctx.fillStyle = block_fill;
        ctx.strokeStyle = block_stroke;
      }
      ctx.fillRect(  dblock.x-tx-b,dblock.y-ty-b,dblock.w+b*2,dblock.h+b*2);
      if(!shadow)
      {
        ctx.strokeRect(dblock.x-tx-b,dblock.y-ty-b,dblock.w+b*2,dblock.h+b*2);
        for(var j = 0; j < 4; j++)
        {
               if(blocks[i].c[j] > 0) ctx.strokeStyle = "#00FF00";
          else if(blocks[i].c[j] < 0) ctx.strokeStyle = "#FF0000";
          else continue;
          switch(j)
          {
            case 0: ctx.beginPath(); ctx.moveTo(dblock.x         +5-tx,dblock.y         +5-ty); ctx.lineTo(dblock.x+dblock.w-5-tx,dblock.y         +5-ty); ctx.stroke(); break;
            case 1: ctx.beginPath(); ctx.moveTo(dblock.x+dblock.w-5-tx,dblock.y         +5-ty); ctx.lineTo(dblock.x+dblock.w-5-tx,dblock.y+dblock.h-5-ty); ctx.stroke(); break;
            case 2: ctx.beginPath(); ctx.moveTo(dblock.x         +5-tx,dblock.y+dblock.h-5-ty); ctx.lineTo(dblock.x+dblock.w-5-tx,dblock.y+dblock.h-5-ty); ctx.stroke(); break;
            case 3: ctx.beginPath(); ctx.moveTo(dblock.x         +5-tx,dblock.y         +5-ty); ctx.lineTo(dblock.x         +5-tx,dblock.y+dblock.h-5-ty); ctx.stroke(); break;
          }
        }
      }
    }

    if(!shadow)
    {
      //outline block shape
      ctx.strokeStyle = "#FFFFFF";
      for(var i = 0; i < blocks.length; i++)
      {
        var neighbor;
        dblock.wx = wx+blocks[i].cx;
        dblock.wy = wy+blocks[i].cy;
        screenSpace(cam,canv,dblock);

        //above
        neighbor = false;
        for(var j = 0; !neighbor && j < blocks.length; j++)
        {
          if(blocks[i].cx == blocks[j].cx && blocks[i].cy == blocks[j].cy-1)
            neighbor = true;
        }
        if(!neighbor)
        {
          ctx.beginPath();
          ctx.moveTo(dblock.x-tx,dblock.y-ty);
          ctx.lineTo(dblock.x+dblock.w-tx,dblock.y-ty);
          ctx.stroke();
        }

        //below
        neighbor = false;
        for(var j = 0; !neighbor && j < blocks.length; j++)
        {
          if(blocks[i].cx == blocks[j].cx && blocks[i].cy == blocks[j].cy+1)
            neighbor = true;
        }
        if(!neighbor)
        {
          ctx.beginPath();
          ctx.moveTo(dblock.x-tx,dblock.y+dblock.h-ty);
          ctx.lineTo(dblock.x+dblock.w-tx,dblock.y+dblock.h-ty);
          ctx.stroke();
        }

        //left
        neighbor = false;
        for(var j = 0; !neighbor && j < blocks.length; j++)
        {
          if(blocks[i].cy == blocks[j].cy && blocks[i].cx == blocks[j].cx+1)
            neighbor = true;
        }
        if(!neighbor)
        {
          ctx.beginPath();
          ctx.moveTo(dblock.x-tx,dblock.y-ty);
          ctx.lineTo(dblock.x-tx,dblock.y+dblock.h-ty);
          ctx.stroke();
        }

        //right
        neighbor = false;
        for(var j = 0; !neighbor && j < blocks.length; j++)
        {
          if(blocks[i].cy == blocks[j].cy && blocks[i].cx == blocks[j].cx-1)
            neighbor = true;
        }
        if(!neighbor)
        {
          ctx.beginPath();
          ctx.moveTo(dblock.x+dblock.w-tx,dblock.y-ty);
          ctx.lineTo(dblock.x+dblock.w-tx,dblock.y+dblock.h-ty);
          ctx.stroke();
        }

      }
    }

    ctx.restore();
  }

  var boardi = function(x,y) { return ((1+y)*(bounds.ww+2))+(x+1); }
  var create_board = function()
  {
    board = [];
    var w = bounds.ww;
    var h = bounds.wh;
    for(var i = -1; i < h+1; i++)
      for(var j = -1; j < w+1; j++)
        board[boardi(j,i)] =
        {
          cx:j+1+bounds.wx-bounds.ww/2,
          cy:i+1+bounds.wy-bounds.wh/2,
          c:[0,0,0,0],
          present:0,
          old_present:0,
          tentative_present:0,
          present_t:0,
          score_up:0,
          old_score_up:0,
          tentative_score_up:0,
          score_right:0,
          old_score_right:0,
          tentative_score_right:0,
          score_t:0
        };
  }
  var clearBoard = function()
  {
    var w = bounds.ww;
    var h = bounds.wh;
    var cell;
    for(var i = 0; i < h; i++)
    {
      for(var j = 0; j < w; j++)
      {
        cell = board[boardi(j,i)];
        for(var k = 0; k < 4; k++)
          cell.c[k] = 0;
        cell.present = 0;
        cell.score_up = 0;
        cell.score_right = 0;
      }
    }
  }
  var stampBoard = function(block,x,y)
  {
    var cell;
    if(x == clamp(0,bounds.ww-1,x) && y == clamp(0,bounds.wh-1,y))
    {
      cell = board[boardi(x,y)];
      for(var k = 0; k < 4; k++)
        cell.c[k] = block.c[k];
      cell.present = 1;
    }
  }
  var populateBoard = function()
  {
    var molecule;
    var block;
    var x;
    var y;
    for(var i = 0; i < molecules.length; i++)
    {
      molecule = molecules[i];
      if(!molecule.up)
      {
        for(var j = 0; j < molecule.template.blocks.length; j++)
        {
          block = molecule.template.blocks[j];
          x = molecule.cx+block.cx-bounds.wx+bounds.ww/2-1;
          y = molecule.cy+block.cy-bounds.wy+bounds.wh/2-1;
          stampBoard(block,x                   ,y                   );
          stampBoard(block,x+cur_level.repeat_x,y                   );
          stampBoard(block,x-cur_level.repeat_x,y                   );
          stampBoard(block,x                   ,y+cur_level.repeat_y);
          stampBoard(block,x                   ,y-cur_level.repeat_y);
          stampBoard(block,x+cur_level.repeat_x,y+cur_level.repeat_y);
          stampBoard(block,x+cur_level.repeat_x,y-cur_level.repeat_y);
          stampBoard(block,x-cur_level.repeat_x,y+cur_level.repeat_y);
          stampBoard(block,x-cur_level.repeat_x,y-cur_level.repeat_y);
        }
      }
    }
  }
  var scoreBoard = function()
  {
    var cell;
    var neighbor;
    var cell_score;
    score = 0;
    for(var i = 0; i < bounds.wh; i++)
    {
      for(var j = 0; j < bounds.ww; j++)
      {
        cell = board[boardi(j,i)];
        if(cell.present)
        {
          score++;
          if(j != bounds.ww-1) //check right
          {
            neighbor = board[boardi(j+1,i)];
            if(neighbor.present)
            {
              cell_score = (cell.c[1]*neighbor.c[3]*-1)*5;
              score            += cell_score;
              cell.score_right += cell_score;
            }
          }
          if(i != bounds.wh-1) //check up
          {
            neighbor = board[boardi(j,i+1)];
            if(neighbor.present)
            {
              cell_score = (cell.c[0]*neighbor.c[2]*-1)*5;
              score         += cell_score;
              cell.score_up += cell_score;
            }
          }
        }
      }
    }
  }

  var tickBoard = function()
  {
    var cell;
    var neighbor;
    var x;
    var y;
    for(var i = 0; i < bounds.wh; i++)
    {
      for(var j = 0; j < bounds.ww; j++)
      {
        cell = board[boardi(j,i)];
        if(cell.present != cell.old_present)
        {
          if(cell.present != cell.tentative_present)
          {
            cell.present_t = 0;
            cell.tentative_present = cell.present;
          }
          cell.present_t++;
          if(cell.present_t >= score_patience)
          {
            x = screenSpaceX(cam,canv,cell.cx-0.5);
            y = screenSpaceY(cam,canv,cell.cy-0.5);
            popDelta(x,y,cell.present-cell.old_present)
            cell.old_present = cell.present;
            cell.present_t = 0;
          }
        }
        else
        {
          cell.tentative_present = cell.present;
          cell.present_t = 0;
        }

        if(
          cell.score_up    != cell.old_score_up ||
          cell.score_right != cell.old_score_right)
        {
          if(cell.score_up != cell.tentative_score_up)
          {
            cell.score_t = 0;
            cell.tentative_score_up = cell.score_up;
          }
          if(cell.score_right != cell.tentative_score_right)
          {
            cell.score_t = 0;
            cell.tentative_score_right = cell.score_right;
          }
          cell.score_t++;
          if(cell.score_t >= score_patience)
          {
            x = screenSpaceX(cam,canv,cell.cx-0.5);
            y = screenSpaceY(cam,canv,cell.cy-0.5);
            if(cell.old_score_up != cell.score_up)
              popDelta(x,y-10,cell.score_up-cell.old_score_up);
            else if(cell.score_right-cell.old_score_right)
              popDelta(x+10,y,cell.score_right-cell.old_score_right);
            cell.old_score_up    = cell.score_up;
            cell.old_score_right = cell.score_right;
            cell.score_t = 0;
          }
        }
        else
        {
          cell.tentative_score_up = cell.score_up;
          cell.tentative_score_right = cell.score_right;
          cell.score_t = 0;
        }

      }
    }
  }

  var popDelta = function(x,y,delta)
  {
    var txt;
    if(delta < 0) txt = "-";//""+delta;
    if(delta > 0) txt = "+";//"+"+delta;
    for(var i = 0; i < abs(delta); i++)
      deltas.push({x:x,y:y,xvel:rand0()*0.1,yvel:rand0()*0.1,delta:delta,txt:txt,t:delta_max_t-(rand()*20)});
  }
  var tickDeltas = function()
  {
    for(var i = 0; i < deltas.length; i++)
    {
      deltas[i].t--;
      deltas[i].x += deltas[i].xvel;
      deltas[i].y += deltas[i].yvel;
      deltas[i].xvel *= 0.99;
      deltas[i].yvel *= 0.99;
      if(deltas[i].t <= 0)
      {
        deltas.splice(i,1);
        i--;
      }
    }
  }
  var drawDeltas = function()
  {
    var d;
    var t;
    for(var i = 0; i < deltas.length; i++)
    {
      d = deltas[i];
      t = d.t/delta_max_t;
      if(d.delta > 0) ctx.fillStyle = "rgba(0,255,0,"+t+")";
      if(d.delta < 0) ctx.fillStyle = "rgba(255,0,0,"+t+")";

      //ctx.fillRect(d.x-5,d.y-5,10,10);
      ctx.fillText(d.txt,d.x-5,d.y+5);
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
    self.ww = 4;
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
        copy_template(stamp_hit.template,s.template);
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
    self.happy_ticks = 100000;
    self.happy = 0;
    self.cx = 0;
    self.cy = 0;

    self.shake_x = 0;
    self.shake_y = 0;

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
      if(self.happy != 0) self.happy_ticks++;
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
          rotate_blocks(self.template.blocks);
        self.base_rot       = 0;
        self.rot            = 0;
        self.tmp_target_rot = 0;
        self.target_rot     = 0;
        self.snap();
      }

      var s = 0;
      switch(self.happy)
      {
        case -3: s = 0.15; break;
        case -2: s = 0.08; break;
        case -1: s = 0.04; break;
        case  0: s = 0.02; break;
        case  1: s = 0.008; break;
        case  2: s = 0.002; break;
      }
      if(self.happy >  2) s = 0;
      if(self.happy < -3) s = self.happy/10;
      self.shake_x = rand0()*s;
      self.shake_y = rand0()*s;
    }

    self.draw_off_up = function(woffx,woffy)
    {
      //shadow
      draw_blocks(self.wx+self.shake_x+woffx,self.wy+self.shake_y+woffy,0,0,self.rot,1,shadow_fill,0,self.template.blocks);
      //real
      var t = (clamp(0,10,self.up_ticks-5)/10)*0.2;
      draw_blocks(self.wx+self.shake_x+t+woffx,self.wy+self.shake_y-t+woffy,0,0,self.rot,1,false,0,self.template.blocks);
    }
    self.draw_off_down = function(woffx,woffy)
    {
      draw_blocks(self.wx+self.shake_x+woffx,self.wy+self.shake_y+woffy,0,0,self.rot,1,false,0,self.template.blocks);
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
  var block_happiness_off = function(a,b,offx,offy)
  {
    var happy = 0;
    for(var i = 0; i < a.template.blocks.length; i++)
    {
      for(var j = 0; j < b.template.blocks.length; j++)
      {
        if(a.wx+a.template.blocks[i].cx+offx == b.wx+b.template.blocks[j].cx) //vert aligned
        {
          if((a.wy+a.template.blocks[i].cy+offy) - (b.wy+b.template.blocks[j].cy) ==  1) //a above b
            happy -= (a.template.blocks[i].c[2] * b.template.blocks[j].c[0]);
          if((a.wy+a.template.blocks[i].cy+offy) - (b.wy+b.template.blocks[j].cy) == -1) //a below b
            happy -= (a.template.blocks[i].c[0] * b.template.blocks[j].c[2]);
        }
        if(a.wy+a.template.blocks[i].cy+offy == b.wy+b.template.blocks[j].cy) //horiz aligned
        {
          if((a.wx+a.template.blocks[i].cx+offx) - (b.wx+b.template.blocks[j].cx) ==  1) //a right of b
            happy -= (a.template.blocks[i].c[3] * b.template.blocks[j].c[1]);
          if((a.wx+a.template.blocks[i].cx+offx) - (b.wx+b.template.blocks[j].cx) == -1) //a left of b
            happy -= (a.template.blocks[i].c[1] * b.template.blocks[j].c[3]);
        }
      }
    }
    return happy;
  }
  var block_happiness = function(a,b)
  {
    var happy = 0;
    happy += block_happiness_off(a,b,0,0);
    happy += block_happiness_off(a,b, cur_level.repeat_x,                  0);
    happy += block_happiness_off(a,b,-cur_level.repeat_x,                  0);
    happy += block_happiness_off(a,b,                  0, cur_level.repeat_y);
    happy += block_happiness_off(a,b,                  0,-cur_level.repeat_y);
    happy += block_happiness_off(a,b, cur_level.repeat_x, cur_level.repeat_y);
    happy += block_happiness_off(a,b, cur_level.repeat_x,-cur_level.repeat_y);
    happy += block_happiness_off(a,b,-cur_level.repeat_x, cur_level.repeat_y);
    happy += block_happiness_off(a,b,-cur_level.repeat_x,-cur_level.repeat_y);
    happy += block_happiness_off(a,b,2* cur_level.repeat_x,2*                  0);
    happy += block_happiness_off(a,b,2*-cur_level.repeat_x,2*                  0);
    happy += block_happiness_off(a,b,2*                  0,2* cur_level.repeat_y);
    happy += block_happiness_off(a,b,2*                  0,2*-cur_level.repeat_y);
    happy += block_happiness_off(a,b,2* cur_level.repeat_x,2* cur_level.repeat_y);
    happy += block_happiness_off(a,b,2* cur_level.repeat_x,2*-cur_level.repeat_y);
    happy += block_happiness_off(a,b,2*-cur_level.repeat_x,2* cur_level.repeat_y);
    happy += block_happiness_off(a,b,2*-cur_level.repeat_x,2*-cur_level.repeat_y);
    return happy;
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

    self.ptWithin = function(wx,wy)
    {
      var hit = false
      hit = worldPtWithin(self.wx-self.template.cx,self.wy-template.cy-scroll.scroll_wy,1.,1.,wx,wy);
      for(var i = 0; !hit && i < self.template.blocks.length; i++)
        hit = worldPtWithin(self.wx-self.template.cx+self.template.blocks[i].cx,self.wy-self.template.cy+self.template.blocks[i].cy-scroll.scroll_wy,1.,1.,wx,wy);
      return hit;
    }

    self.draw = function()
    {
      //border
      draw_blocks(self.wx,self.wy-scroll.scroll_wy,self.template.cx,self.template.cy,0,1,border_fill,4,self.template.blocks);
      //real
      draw_blocks(self.wx,self.wy-scroll.scroll_wy,self.template.cx,self.template.cy,0,1,false,0,self.template.blocks);
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

    url_args = jsonFromURL()
    if(url_args["lvl"]) lvl = parseInt(url_args["lvl"]);
    if(!lvl) lvl = 0;
    init_levels();
    set_level(lvl);

    back_btn = {wx:0,wy:0,ww:0,wh:0,x:0,y:0,w:0,h:0};
    back_btn.click = function(evt) { mode = MODE_MENU; evt.hitUI = true; }
    back_btn.ww = game_cam.ww/10;
    back_btn.wh = game_cam.wh/10;
    back_btn.wx = game_cam.wx-game_cam.ww/2+back_btn.ww/2;
    back_btn.wy = game_cam.wy+game_cam.wh/2-back_btn.wh/2;
    screenSpace(cam,canv,back_btn);

    submit_btn = {wx:0,wy:0,ww:0,wh:0,x:0,y:0,w:0,h:0};
    submit_btn.click = function(evt) { mode = MODE_SUBMIT; submitting_t = 0; evt.hitUI = true; }
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

    if(mode == MODE_MENU)
    {
      cam.wx = lerp(cam.wx,menu_cam.wx,0.1);
      cam.wy = lerp(cam.wy,menu_cam.wy,0.1);
      cam.ww = lerp(cam.ww,menu_cam.ww,0.1);
      cam.wh = lerp(cam.wh,menu_cam.wh,0.1);
    }
    if(mode == MODE_GAME || mode == MODE_SUBMIT)
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

    submit_btn.ww = game_cam.ww/5;
    submit_btn.wh = game_cam.wh/10;
    submit_btn.wx = game_cam.wx+game_cam.ww/2-submit_btn.ww/2;
    submit_btn.wy = game_cam.wy+game_cam.wh/2-submit_btn.wh/2;
    screenSpace(cam,canv,submit_btn);

    if(mode == MODE_GAME)
    {
      clicker.filter(back_btn);
      clicker.filter(submit_btn);
      for(var i = 0; i < molecules.length; i++)
        clicker.filter(molecules[i]);
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
      if(submitting_t > bounds.ww*bounds.wh+star_outro_sub_slide+star_outro_sub_star)
        clicker.filter(outro);
    }

    clicker.flush();
    dragger.flush();

    var happy = 0;
    for(var i = 0; i < molecules.length; i++)
      molecules[i].happy = 0;
    for(var i = 0; i < molecules.length; i++)
    {
      if(molecules[i].up) continue;
      for(var j = i+1; j < molecules.length; j++)
      {
        if(molecules[j].up) continue;
        happy = block_happiness(molecules[i],molecules[j]);
        molecules[i].happy += happy;
        molecules[j].happy += happy;
      }
    }

    for(var i = 0; i < molecules.length; i++)
      molecules[i].tick();
    scroll.tick();

    clearBoard();
    populateBoard();
    scoreBoard();
    tickBoard();

    if(submitting_t != -1)
    {
      submitting_t++;
      var bounds_t = bounds.ww*bounds.wh;
      if(submitting_t < bounds_t)
      {
        var x = submitting_t%bounds.ww;
        var y = floor(submitting_t/bounds.ww);
        var cell = board[boardi(x,y)];
        x = screenSpaceX(cam,canv,cell.cx-0.5);
        y = screenSpaceY(cam,canv,cell.cy-0.5);
        popDelta(x,y,cell.present+cell.score_up+cell.score_right);
      }
      else if(submitting_t >= bounds_t)
      {
        if(submitting_t == bounds_t) outro.start_ticks = n_ticks+40;
        var t_into_outro = submitting_t-bounds_t;
        if(t_into_outro < star_outro_sub_slide)
          outro.wx = lerp(bounds.wx-bounds.ww/2-5-5,bounds.wx,t_into_outro/star_outro_sub_slide);
        else
          outro.wx = bounds.wx;
        outro.wy = 0;
        outro.ww = cam.ww/4;
        outro.wh = cam.wh/2;
        screenSpace(cam,canv,outro);
      }
    }
    tickDeltas();
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

    ctx.strokeStyle = "#CCCCCC";

    //horizontal
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

    ctx.fillStyle = "rgba(66,66,66,0.5)";
    for(var i = molecules.length-1; i >= 0; i--)
      molecules[i].draw_behind_down();
    for(var i = molecules.length-1; i >= 0; i--)
      molecules[i].draw_front_down();
    for(var i = molecules.length-1; i >= 0; i--)
      molecules[i].draw_behind_up();
    ctx.fillRect(scroll.x,scroll.y,scroll.w,scroll.h);
    for(var i = 0; i < stamps.length; i++)
      stamps[i].draw();
    for(var i = molecules.length-1; i >= 0; i--)
      molecules[i].draw_front_up();

    ctx.strokeStyle = bounds_stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(bounds.x,bounds.y,bounds.w,bounds.h);
    ctx.lineWidth = 8;
    ctx.strokeRect(bounds.x,bounds.y,bounds.w,bounds.h);

    ctx.lineWidth = 2;

    ctx.fillStyle = "#000000";
    ctx.fillText("Score: "+score,bounds.x+bounds.w-200,bounds.y-10);
    ctx.fillText("< Menu",back_btn.x,back_btn.y+back_btn.h/2);
    ctx.fillText("[Submit]",submit_btn.x,submit_btn.y+submit_btn.h/2);

    drawDeltas();

    for(var i = 0; i < levels.length; i++)
      levels[i].button.draw();

    if(mode == MODE_SUBMIT && submitting_t > bounds.ww*bounds.wh)
    {
      outro.draw();
    }
  };

  self.cleanup = function()
  {
  };

};

