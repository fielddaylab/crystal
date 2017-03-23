var GamePlayScene = function(game, stage)
{
  var self = this;

  var canv = stage.drawCanv;
  var canvas = canv.canvas;
  var ctx = canv.context;

  var clicker;
  var dragger;

  var dragging_shape = 0;
  var coord = {x:0,y:0};
  var cam = { wx:0, wy:0, ww:20, wh:10 };
  var bounds = {wx:2, wy:0, ww:12, wh:6, x:0,y:0,w:0,h:0 };
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

  var template_blocks = [];
  var i = 0;
  var url_args = jsonFromURL();
  var lvl = 0;
  if(url_args["lvl"]) lvl = parseInt(url_args["lvl"]);
  if(!lvl) lvl = 0;
  switch(lvl)
  {
    case 0:
        //1-no
      template_blocks[i++] = [{cx:0,cy:0,c:top_pos   }];
        //2-no
      template_blocks[i++] = [{cx:0,cy:0,c:left_neg  },{cx:0,cy:1,c:no_charge }];
        //3-no
      template_blocks[i++] = [{cx:0,cy:0,c:no_charge },{cx:0,cy:1,c:left_neg  },{cx:0,cy:-1,c:right_pos }]; //line
      template_blocks[i++] = [{cx:0,cy:0,c:no_charge },{cx:0,cy:1,c:right_pos },{cx:1,cy: 0,c:top_neg   }]; //crook
        //4-no
      template_blocks[i++] = [{cx:0,cy:0,c:left_pos  },{cx: 0,cy:-1,c:left_pos  },{cx: 0,cy:1,c:right_neg },{cx: 0,cy:2,c:no_charge }]; //line
      template_blocks[i++] = [{cx:0,cy:0,c:no_charge },{cx: 0,cy: 1,c:no_charge },{cx: 0,cy:2,c:right_neg },{cx: 1,cy:0,c:top_neg   }]; //L
      template_blocks[i++] = [{cx:0,cy:0,c:bottom_neg},{cx: 0,cy: 1,c:no_charge },{cx: 0,cy:2,c:no_charge },{cx:-1,cy:0,c:bottom_pos}]; //J
      template_blocks[i++] = [{cx:0,cy:0,c:bottom_pos},{cx:-1,cy: 1,c:left_pos  },{cx: 0,cy:1,c:no_charge },{cx: 1,cy:0,c:no_charge }]; //Z
      template_blocks[i++] = [{cx:0,cy:0,c:no_charge },{cx:-1,cy: 0,c:bottom_neg},{cx: 0,cy:1,c:no_charge },{cx: 1,cy:1,c:bottom_pos}]; //S
      template_blocks[i++] = [{cx:0,cy:0,c:no_charge },{cx: 0,cy: 1,c:no_charge },{cx:-1,cy:0,c:top_pos   },{cx: 1,cy:0,c:right_neg }]; //T
      template_blocks[i++] = [{cx:0,cy:0,c:bottom_pos},{cx: 0,cy: 1,c:left_neg  },{cx: 1,cy:0,c:right_neg },{cx: 1,cy:1,c:top_pos   }]; //box
      break;
    case 1:
      template_blocks[i++] = [{cx:0,cy:0,c:[0,1,0,0]},{cx:0,cy:1,c:[0,0,0,-1]}];
      break;
    case 2:
      template_blocks[i++] = [{cx:0,cy:0,c:[0,0,0,1]},{cx: 0,cy: 1,c:[0,0,0,0]},{cx: 0,cy:2,c:[-1,0,0,-1]},{cx: 1,cy:0,c:[1,1,0,0]}]; //L
      break;
  }
  var copy_blocks = function(template,blocks)
  {
    for(var i = 0; i < template.length; i++)
    {
      blocks[i] = {cx:template[i].cx,cy:template[i].cy,c:[]};
      for(var j = 0; j < 4; j++)
        blocks[i].c[j] = template[i].c[j];
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
  var tx;
  var ty;
  var dblock = {wx:0,wy:0,ww:1,wh:1,x:0,y:0,w:0,h:0};
  var bounds_fill  = "rgba(0,0,0,.6)";
  var shadow_fill  = "rgba(0,0,0,.1)";
  var border_fill  = "#FFFFFF";
  var block_fill   = "#A77777";
  var block_stroke = "#822222";
  var draw_blocks = function(wx,wy,rot,shadow,b,blocks)
  {
    dblock.wx = wx;
    dblock.wy = wy;
    screenSpace(cam,canv,dblock);
    tx = dblock.x+dblock.w/2;
    ty = dblock.y+dblock.h/2;

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
      ctx.save();
      ctx.translate(tx,ty);
      ctx.rotate(rot);
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
      ctx.restore();
    }
  }

  var score = 0;
  var board = [];
  var boardi = function(x,y) { return (y*bounds.ww)+x; }
  var createBoard = function()
  {
    var w = bounds.ww;
    var h = bounds.wh;
    for(var i = 0; i < h; i++)
      for(var j = 0; j < w; j++)
        for(var k = 0; k < 5; k++)
          board[boardi(j,i)] = {cx:j+1+bounds.wx-bounds.ww/2,cy:i+1+bounds.wy-bounds.wh/2,c:[0,0,0,0],present:0,old_present:0,tentative_present:0,present_t:0,score:0,old_score:0,tentative_score:0,score_t:0};
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
        cell.score = 0;
      }
    }
  }
  var populateBoard = function()
  {
    var shape;
    var block;
    var cell;
    var x;
    var y;
    for(var i = 0; i < shapes.length; i++)
    {
      shape = shapes[i];
      if(!shape.up)
      {
        for(var j = 0; j < shape.blocks.length; j++)
        {
          block = shape.blocks[j];
          x = shape.cx+block.cx-bounds.wx+bounds.ww/2-1;
          y = shape.cy+block.cy-bounds.wy+bounds.wh/2-1;
          cell = board[boardi(x,y)];
          if(cell)
          {
            for(var k = 0; k < 4; k++)
              cell.c[k] = block.c[k];
            cell.present = 1;
          }
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
              cell_score = cell.c[1]*neighbor.c[3]*-1;
              score      += cell_score;
              cell.score += cell_score;
            }
          }
          if(i != bounds.wh-1) //check up
          {
            neighbor = board[boardi(j,i+1)];
            if(neighbor.present)
            {
              cell_score = cell.c[0]*neighbor.c[2]*-1;
              score      += cell_score;
              cell.score += cell_score;
            }
          }
        }
      }
    }
  }
  var score_patience = 10;
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
            x = screenSpaceX(cam,canv,cell.cx);
            y = screenSpaceY(cam,canv,cell.cy);
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

        if(cell.score != cell.old_score)
        {
          if(cell.score != cell.tentative_score)
          {
            cell.score_t = 0;
            cell.tentative_score = cell.score;
          }
          cell.score_t++;
          if(cell.score_t >= score_patience)
          {
            x = screenSpaceX(cam,canv,cell.cx);
            y = screenSpaceY(cam,canv,cell.cy);
            popDelta(x,y,cell.score-cell.old_score)
            cell.old_score = cell.score;
            cell.score_t = 0;
          }
        }
        else
        {
          cell.tentative_score = cell.score;
          cell.score_t = 0;
        }
      }
    }
  }

  var deltas = [];
  var delta_max_t = 100;;
  var popDelta = function(x,y,delta)
  {
    var txt;
    if(delta < 0) txt = ""+delta;
    if(delta > 0) txt = "+"+delta;
    deltas.push({x:x,y:y,delta:delta,txt:txt,t:0});
  }
  var tickDeltas = function()
  {
    for(var i = 0; i < deltas.length; i++)
    {
      deltas[i].t++;
      if(deltas[i].t >= delta_max_t)
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
      if(d.delta > 0) ctx.fillStyle = "rgba(0,255,0,"+(1-t)+")";
      if(d.delta < 0) ctx.fillStyle = "rgba(255,0,0,"+(1-t)+")";

      ctx.fillText(d.txt,d.x+sin(t*pi*5)*5,d.y-t*100);
    }
  }

  var scroll;
  var templates = [];
  var shapes = [];
  var bring_to_top = function(shape)
  {
    var found = false;
    for(var i = 0; !found && i < shapes.length; i++)
    {
      if(shapes[i] == shape)
      {
        for(var j = i-1; j >= 0; j--)
          shapes[j+1] = shapes[j];
        shapes[0] = shape;
        found = true;
        for(var j = 1; j < shapes.length; j++)
          shapes[j].snap();
      }
    }
  }
  var bring_to_bottom = function(shape)
  {
    var found = false;
    for(var i = 0; !found && i < shapes.length; i++)
    {
      if(shapes[i] == shape)
      {
        var j = i;
        while(j < shapes.length-1 && shapes[j+1].up)
        {
          shapes[j] = shapes[j+1];
          j++;
        }
        shapes[j] = shape;
        found = true;
      }
    }
  }
  var remove_shape = function(shape)
  {
    var found = false;
    for(var i = 0; !found && i < shapes.length; i++)
    {
      if(shapes[i] == shape)
      {
        shapes.splice(i,1);
        found = true;
      }
    }
  }

  var scroller = function()
  {
    var self = this;
    self.wx = -8.5;
    self.wy = 0;
    self.ww = 5;
    self.wh = 10;
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
      if(dragging_shape || evt.hitUI) return false;
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
      var template_hit = 0;
      for(var i = 0; !template_hit && i < templates.length; i++)
      {
        if(templates[i].ptWithin(worldevt.wx,worldevt.wy))
          template_hit = templates[i];
      }

      if(
        template_hit &&
        x_toward_board > abs(worldevt.wy-last_drag_wevt.wy) &&
        x_toward_board > 0.02
      )
      {
        self.dragging = false;
        var s = new shape();
        s.wx = template_hit.wx;
        s.wy = template_hit.wy-self.scroll_wy;
        copy_blocks(template_hit.blocks,s.blocks);
        s.dragging = true;
        dragging_shape = s;
        shapes[shapes.length] = s;
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

  var shape = function()
  {
    var self = this;

    self.blocks = [];

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

    var worldevt = {wx:0,wy:0};
    var worldoff = {wx:0,wy:0};
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
      var hit = false
      for(var i = 0; !hit && i < self.blocks.length; i++)
        hit = worldPtWithin(self.wx+self.blocks[i].cx,self.wy+self.blocks[i].cy,1.,1.,worldevt.wx,worldevt.wy);
      return hit;
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

    self.shouldDrag = function(evt)
    {
      if(dragging_shape || evt.hitUI) return false;
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
      var hit = false
      for(var i = 0; !hit && i < self.blocks.length; i++)
        hit = worldPtWithin(self.wx+self.blocks[i].cx,self.wy+self.blocks[i].cy,1.,1.,worldevt.wx,worldevt.wy);
      if(hit)
      {
        evt.hitUI = true;
        self.up = true;
        bring_to_top(self);
        dragging_shape = self;
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
      if(self.wx < -6.)
        remove_shape(self);
      self.snap();
      if(dragging_shape == self) dragging_shape = 0;
    }

    self.snap = function()
    {
      var was_up = self.up; //not much, was up with you?
      var shape;
      var cx = round(self.wx+0.5);
      var cy = round(self.wy+0.5);
      self.up = false;
      for(var i = 0; !self.up && i < shapes.length; i++)
      {
        shape = shapes[i];
        if(shape == self || shape.up) continue;
        for(var j = 0; !self.up && j < self.blocks.length; j++)
          for(var k = 0; !self.up && k < shape.blocks.length; k++)
            if(cx+self.blocks[j].cx == shape.cx+shape.blocks[k].cx && cy+self.blocks[j].cy == shape.cy+shape.blocks[k].cy)
              self.up = true;
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
          rotate_blocks(self.blocks);
        self.base_rot       = 0;
        self.rot            = 0;
        self.tmp_target_rot = 0;
        self.target_rot     = 0;
        self.snap();
      }
    }

    self.draw = function()
    {
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
      var shake_x = rand0()*s;
      var shake_y = rand0()*s;
      if(self.up)
      {
        //shadow
        draw_blocks(self.wx+shake_x,self.wy+shake_y,self.rot,shadow_fill,0,self.blocks);
        //real
        var t = (clamp(0,10,self.up_ticks-5)/10)*0.2;
        draw_blocks(self.wx+t+shake_x,self.wy-t+shake_y,self.rot,false,0,self.blocks);
      }
      else
      {
        draw_blocks(self.wx+shake_x,self.wy+shake_y,self.rot,false,0,self.blocks);
      }
      ctx.fillStyle = "#000000";
      var x = screenSpaceX(cam,canv,self.wx);
      var y = screenSpaceY(cam,canv,self.wy);
      //ctx.fillText(self.happy,x,y);
    }
  }
  var block_happiness = function(a,b)
  {
    var happy = 0;
    for(var i = 0; i < a.blocks.length; i++)
    {
      for(var j = 0; j < b.blocks.length; j++)
      {
        if(a.wx+a.blocks[i].cx == b.wx+b.blocks[j].cx) //vert aligned
        {
          if((a.wy+a.blocks[i].cy) - (b.wy+b.blocks[j].cy) ==  1) //a above b
            happy -= (a.blocks[i].c[2] * b.blocks[j].c[0]);
          if((a.wy+a.blocks[i].cy) - (b.wy+b.blocks[j].cy) == -1) //a below b
            happy -= (a.blocks[i].c[0] * b.blocks[j].c[2]);
        }
        if(a.wy+a.blocks[i].cy == b.wy+b.blocks[j].cy) //horiz aligned
        {
          if((a.wx+a.blocks[i].cx) - (b.wx+b.blocks[j].cx) ==  1) //a right of b
            happy -= (a.blocks[i].c[3] * b.blocks[j].c[1]);
          if((a.wx+a.blocks[i].cx) - (b.wx+b.blocks[j].cx) == -1) //a left of b
            happy -= (a.blocks[i].c[1] * b.blocks[j].c[3]);
        }
      }
    }
    return happy;
  }

  var template = function()
  {
    var self = this;

    self.blocks = [];

    self.wx  = 0;
    self.wy  = 0;

    self.ptWithin = function(wx,wy)
    {
      var hit = false
      hit = worldPtWithin(self.wx,self.wy-scroll.scroll_wy,1.,1.,wx,wy);
      for(var i = 0; !hit && i < self.blocks.length; i++)
        hit = worldPtWithin(self.wx+self.blocks[i].cx,self.wy-scroll.scroll_wy+self.blocks[i].cy,1.,1.,wx,wy);
      return hit;
    }

    self.draw = function()
    {
      //border
      draw_blocks(self.wx,self.wy-scroll.scroll_wy,0,border_fill,4,self.blocks);
      //real
      draw_blocks(self.wx,self.wy-scroll.scroll_wy,0,false,0,self.blocks);
    }
  }

  self.ready = function()
  {
    clicker = new Clicker({source:stage.dispCanv.canvas});
    dragger = new Dragger({source:stage.dispCanv.canvas});

    scroll = new scroller();
    for(var i = 0; i < template_blocks.length; i++)
    {
      templates[i] = new template();
      templates[i].wx = -cam.ww/2+2.;
      templates[i].wy =  cam.wh/2-2.-4*i;
      if(templates[i].wy < scroll.scroll_wy_min) scroll.scroll_wy_min = templates[i].wy;
      if(templates[i].wy > scroll.scroll_wy_max) scroll.scroll_wy_max = templates[i].wy;
      copy_blocks(template_blocks[i],templates[i].blocks);
    }

    scroll.scroll_wy_min -= 0.2;
    scroll.scroll_wy_max += 0.2;

    createBoard();

    screenSpace(cam,canv,bounds);
    screenSpace(cam,canv,scroll);
  };

  self.tick = function()
  {
    for(var i = 0; i < shapes.length; i++)
      clicker.filter(shapes[i]);
    clicker.flush();
    for(var i = 0; i < shapes.length; i++)
      dragger.filter(shapes[i]);
    dragger.filter(scroll);
    //for(var i = 0; i < templates.length; i++)
      //dragger.filter(templates[i]);
    dragger.flush();

    var happy = 0;
    for(var i = 0; i < shapes.length; i++)
      shapes[i].happy = 0;
    for(var i = 0; i < shapes.length; i++)
    {
      if(shapes[i].up) continue;
      for(var j = i+1; j < shapes.length; j++)
      {
        if(shapes[j].up) continue;
        happy = block_happiness(shapes[i],shapes[j]);
        shapes[i].happy += happy;
        shapes[j].happy += happy;
      }
    }

    for(var i = 0; i < shapes.length; i++)
      shapes[i].tick();
    scroll.tick();

    clearBoard();
    populateBoard();
    scoreBoard();
    tickBoard();

    tickDeltas();
  };

  self.draw = function()
  {
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
    ctx.fillRect(scroll.x,scroll.y,scroll.w,scroll.h);
    for(var i = 0; i < templates.length; i++)
      templates[i].draw();
    for(var i = shapes.length-1; i >= 0; i--)
      shapes[i].draw();

    ctx.strokeStyle = bounds_fill;
    ctx.strokeRect(bounds.x,bounds.y,bounds.w,bounds.h);

    ctx.fillStyle = "#000000";
    ctx.fillText("Score: "+score,bounds.x+bounds.w-100,bounds.y-20);

    drawDeltas();
  };

  self.cleanup = function()
  {
  };

};

