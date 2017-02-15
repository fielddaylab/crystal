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
  var cam = { wx:0, wy:0, ww:16, wh:8 };
  var bounds = {wx:1.5, wy:0, ww:11, wh:6, x:0,y:0,w:0,h:0 };
  var scroll = {wx:-6.5, wy:0, ww:3, wh:8, x:0,y:0,w:0,h:0 };
  var shadow_dist = 8;

  var template_blocks = [];
  template_blocks[0] = [{cx:-1,cy:0},{cx:0,cy:1}];// _|           |
  template_blocks[1] = [{cx:-1,cy:0},{cx:0,cy:1},{cx:0,cy:2}];// _|
  var copy_template = function(template,blocks)
  {
    for(var i = 0; i < template.length; i++)
      blocks[i] = {cx:template[i].cx,cy:template[i].cy};
  }

  var templates = [];
  var shapes = [];

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
      hit = worldPtWithin(self.wx,self.wy,1.,1.,worldevt.wx,worldevt.wy);
      for(var i = 0; !hit && i < self.blocks.length; i++)
        hit = worldPtWithin(self.wx+self.blocks[i].cx,self.wy+self.blocks[i].cy,1.,1.,worldevt.wx,worldevt.wy);
      return hit;
    }
    self.click = function(evt)
    {
      if(self.click_ticks < 20)
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
      hit = worldPtWithin(self.wx,self.wy,1.,1.,worldevt.wx,worldevt.wy);
      for(var i = 0; !hit && i < self.blocks.length; i++)
        hit = worldPtWithin(self.wx+self.blocks[i].cx,self.wy+self.blocks[i].cy,1.,1.,worldevt.wx,worldevt.wy);
      if(hit)
      {
        evt.hitUI = true;
        self.up = false;
        for(var i = 0; !self.up && i < shapes.length; i++)
        {
          if(shapes[i] == self)
          {
            for(var j = i-1; j >= 0; j--)
              shapes[j+1] = shapes[j];
            shapes[0] = self;
            self.up = true;
            for(var j = 0; j < i; j++)
              shapes[i].snap();
          }
        }
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
      self.snap();
    }

    self.snap = function()
    {
      var shape;
      var cx = round(self.wx+0.5);
      var cy = round(self.wy+0.5);
      self.up = false;
      for(var i = 0; !self.up && i < shapes.length; i++)
      {
        shape = shapes[i];
        if(shape == self || shape.up) continue;
        if(cx == shape.cx && cy == shape.cy)
          self.up = true; //check centers
        for(var k = 0; !self.up && k < shape.blocks.length; k++) //check center against their blocks
          if(shape.cx+shape.blocks[k].cx == cx && shape.cy+shape.blocks[k].cy == cy)
            self.up = true;
        for(var j = 0; !self.up && j < self.blocks.length; j++) //check their center against blocks
          if(cx+self.blocks[j].cx == shape.cx && cy+self.blocks[j].cy == shape.cy)
            self.up = true;
        for(var j = 0; !self.up && j < self.blocks.length; j++) //check blocks against blocks
          for(var k = 0; !self.up && k < shape.blocks.length; k++)
            if(cx+self.blocks[j].cx == shape.cx+shape.blocks[k].cx && cy+self.blocks[j].cy == shape.cy+shape.blocks[k].cy)
              self.up = true;
      }
      if(!self.up)
      {
        self.cx = cx;
        self.cy = cy;
        self.wx = cx-0.5;
        self.wy = cy-0.5;
        self.up_ticks = 0;

        self.up = true;
        for(var i = 0; self.up && i < shapes.length; i++)
        {
          if(shapes[i] == self)
          {
            for(var j = i; j < shapes.length-1; j++)
              shapes[j] = shapes[j+1];
            shapes[shapes.length-1] = self;
            self.up = false;
          }
        }
      }
      if(dragging_shape == self) dragging_shape = 0;
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
        {
          for(var i = 0; i < self.blocks.length; i++)
          {
            var tmp = self.blocks[i].cy;
            self.blocks[i].cy = -self.blocks[i].cx;
            self.blocks[i].cx = tmp;
          }
        }
        self.base_rot       = 0;
        self.rot            = 0;
        self.tmp_target_rot = 0;
        self.target_rot     = 0;
        self.snap();
      }
    }

    var cblock = {x:0,y:0,w:0,h:0,wx:1,wy:1,ww:1,wh:1}
    var block = {x:0,y:0,w:0,h:0,wx:1,wy:1,ww:1,wh:1}
    var tx;
    var ty;
    self.draw = function()
    {
      ctx.strokeStyle = "#B11111";

      if(self.up)
      {
        //shadow
        cblock.wx = self.wx;
        cblock.wy = self.wy;
        screenSpace(cam,canv,cblock);
        tx = cblock.x+cblock.w/2;
        ty = cblock.y+cblock.h/2;

        ctx.fillStyle = "rgba(0,0,0,.1)";
        ctx.save();
        ctx.translate(tx,ty);
        ctx.rotate(self.rot);
        ctx.fillRect(cblock.x-tx,cblock.y-ty,cblock.w,cblock.h);
        ctx.restore();
        for(var i = 0; i < self.blocks.length; i++)
        {
          block.wx = self.wx+self.blocks[i].cx;
          block.wy = self.wy+self.blocks[i].cy;
          screenSpace(cam,canv,block);

          ctx.save();
          ctx.translate(tx,ty);
          ctx.rotate(self.rot);
          ctx.fillRect(block.x-tx,block.y-ty,block.w,block.h);
          ctx.restore();
        }

        //real
        var t = clamp(0,10,self.up_ticks-5)/10;

        cblock.wx = self.wx;
        cblock.wy = self.wy;
        screenSpace(cam,canv,cblock);
        cblock.x += shadow_dist*t
        cblock.y += shadow_dist*t
        tx = cblock.x+cblock.w/2;
        ty = cblock.y+cblock.h/2

        ctx.fillStyle = "#D44444";
        ctx.save();
        ctx.translate(tx,ty);
        ctx.rotate(self.rot);
        ctx.fillRect(  cblock.x-tx,cblock.y-ty,cblock.w,cblock.h);
        ctx.strokeRect(cblock.x-tx,cblock.y-ty,cblock.w,cblock.h);
        ctx.restore();
        for(var i = 0; i < self.blocks.length; i++)
        {
          block.wx = self.wx+self.blocks[i].cx;
          block.wy = self.wy+self.blocks[i].cy;
          screenSpace(cam,canv,block);
          block.x += shadow_dist*t
          block.y += shadow_dist*t

          ctx.save();
          ctx.translate(tx,ty);
          ctx.rotate(self.rot);
          ctx.fillRect(  block.x-tx,block.y-ty,block.w,block.h);
          ctx.strokeRect(block.x-tx,block.y-ty,block.w,block.h);
          ctx.restore();
        }
      }
      else
      {
        cblock.wx = self.wx;
        cblock.wy = self.wy;
        screenSpace(cam,canv,cblock);
        tx = cblock.x+cblock.w/2;
        ty = cblock.y+cblock.h/2;

        ctx.save();
        ctx.translate(tx,ty);
        ctx.rotate(self.rot);
        ctx.fillRect(cblock.x-tx,cblock.y-ty,cblock.w,cblock.h);
        ctx.strokeRect(cblock.x-tx,cblock.y-ty,cblock.w,cblock.h);
        ctx.restore();
        for(var i = 0; i < self.blocks.length; i++)
        {
          block.wx = self.wx+self.blocks[i].cx;
          block.wy = self.wy+self.blocks[i].cy;
          screenSpace(cam,canv,block);

          ctx.save();
          ctx.translate(tx,ty);
          ctx.rotate(self.rot);
          ctx.fillRect(block.x-tx,block.y-ty,block.w,block.h);
          ctx.strokeRect(block.x-tx,block.y-ty,block.w,block.h);
          ctx.restore();
        }
      }
    }
  }

  var template = function()
  {
    var self = this;

    self.blocks = [];

    self.wx  = 0;
    self.wy  = 0;

    var worldevt = {wx:0,wy:0};

    self.shouldDrag = function(evt)
    {
      if(dragging_shape || evt.hitUI) return false;
      worldevt.wx = worldSpaceX(cam,canv,evt.doX);
      worldevt.wy = worldSpaceY(cam,canv,evt.doY);
      var hit = false
      hit = worldPtWithin(self.wx,self.wy,1.,1.,worldevt.wx,worldevt.wy);
      for(var i = 0; !hit && i < self.blocks.length; i++)
        hit = worldPtWithin(self.wx+self.blocks[i].cx,self.wy+self.blocks[i].cy,1.,1.,worldevt.wx,worldevt.wy);
      if(hit)
      {
        evt.hitUI = true;
        var s = new shape();
        s.wx = self.wx;
        s.wy = self.wy;
        copy_template(self.blocks,s.blocks);
        s.dragging = true;
        dragging_shape = s;
        for(var i = shapes.length-1; i >= 0; i--)
          shapes[i+1] = shapes[i];
        shapes[0] = s;
      }
      return hit;
    }
    self.dragStart = function(evt)
    {
    }
    self.drag = function(evt)
    {
    }
    self.dragFinish = function(evt)
    {
    }

    var cblock = {x:0,y:0,w:0,h:0,wx:1,wy:1,ww:1,wh:1}
    var block = {x:0,y:0,w:0,h:0,wx:1,wy:1,ww:1,wh:1}
    var tx;
    var ty;
    self.draw = function()
    {
      //border
      var b = 4;
      ctx.fillStyle   = "#DDDDDD";

      cblock.wx = self.wx;
      cblock.wy = self.wy;
      screenSpace(cam,canv,cblock);
      tx = cblock.x+cblock.w/2;
      ty = cblock.y+cblock.h/2;

      ctx.save();
      ctx.translate(tx,ty);
      ctx.fillRect(cblock.x-tx-b,cblock.y-ty-b,cblock.w+2*b,cblock.h+2*b);
      ctx.restore();
      for(var i = 0; i < self.blocks.length; i++)
      {
        block.wx = self.wx+self.blocks[i].cx;
        block.wy = self.wy+self.blocks[i].cy;
        screenSpace(cam,canv,block);

        ctx.save();
        ctx.translate(tx,ty);
        ctx.fillRect(block.x-tx-b,block.y-ty-b,block.w+2*b,block.h+2*b);
        ctx.restore();
      }

      //real
      ctx.strokeStyle = "#B11111";
      ctx.fillStyle   = "#D44444";

      cblock.wx = self.wx;
      cblock.wy = self.wy;
      screenSpace(cam,canv,cblock);
      tx = cblock.x+cblock.w/2;
      ty = cblock.y+cblock.h/2;

      ctx.save();
      ctx.translate(tx,ty);
      ctx.fillRect(cblock.x-tx,cblock.y-ty,cblock.w,cblock.h);
      ctx.strokeRect(cblock.x-tx,cblock.y-ty,cblock.w,cblock.h);
      ctx.restore();
      for(var i = 0; i < self.blocks.length; i++)
      {
        block.wx = self.wx+self.blocks[i].cx;
        block.wy = self.wy+self.blocks[i].cy;
        screenSpace(cam,canv,block);

        ctx.save();
        ctx.translate(tx,ty);
        ctx.fillRect(block.x-tx,block.y-ty,block.w,block.h);
        ctx.strokeRect(block.x-tx,block.y-ty,block.w,block.h);
        ctx.restore();
      }

    }
  }

  self.ready = function()
  {
    clicker = new Clicker({source:stage.dispCanv.canvas});
    dragger = new Dragger({source:stage.dispCanv.canvas});

    templates[0] = new template();
    templates[0].wx = -cam.ww/2+2.;
    templates[0].wy =  cam.wh/2-2.;
    copy_template(template_blocks[0],templates[0].blocks);
    templates[1] = new template();
    templates[1].wx = -cam.ww/2+2.;
    templates[1].wy =  cam.wh/2-2.-4.;
    copy_template(template_blocks[1],templates[1].blocks);

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
    for(var i = 0; i < templates.length; i++)
      dragger.filter(templates[i]);
    dragger.flush();

    for(var i = 0; i < shapes.length; i++)
      shapes[i].tick();
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

    ctx.strokeStyle = "#000000";
    ctx.strokeRect(bounds.x,bounds.y,bounds.w,bounds.h);
    ctx.fillStyle = "rgba(66,66,66,0.5)";
    ctx.fillRect(scroll.x,scroll.y,scroll.w,scroll.h);

    for(var i = 0; i < templates.length; i++)
      templates[i].draw();
    for(var i = shapes.length-1; i >= 0; i--)
      shapes[i].draw();

  };

  self.cleanup = function()
  {
  };

};

