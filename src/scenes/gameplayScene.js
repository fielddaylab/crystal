
var TEXT = true;
var PERFECT = true;
var UNLOCKED = false;

//wiggle anger
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
  var hoverer;

  var moleculeStartPos;
  var moleculeEndPos = {};
  var dragStartTime;
  var dragEndTime;
  var moleculeStartStab;
  var moleculeEndStab;
  var numRotations = 0;
  var moleculeStartRot = 0;
  var moleculeEndRot;
  var numClears = 0;
  var museumTimeOpened;
  var museumTimeClosed;
  var museumTotalTime = 0;

  var quiz;
  var quiz_t;
  var quiz_char_ts = [0,0,0,0];

  ENUM = 0;
  var CHAR_GIRL  = ENUM; ENUM++;
  var CHAR_ANNOY = ENUM; ENUM++;
  var CHAR_AXE   = ENUM; ENUM++;
  var CHAR_TALL  = ENUM; ENUM++;

  var char_xs;
  var char_ys;
  var char_ws;
  var char_hs;
  var char_imgs;

  var click_aud;

  var remove_vault_button = function () {
    const vaultDropdown =
      window.parent.document.querySelector("floating-dropdown");
    if (vaultDropdown) {
      vaultDropdown.remove();
    } else {
      console.warn(
        "[Vault Plugin] Failed attempt to remove element <floating-dropdown>"
      );
    }
  };

  //log functions
  var log_level_begin = function(selectedLevel)
  {
    var log_data =
    {
      level:selectedLevel,
      event:"BEGIN",
      event_data_complex:{}
    };
    for(var i = 0; i < levels.length; i++)
    {
      log_data.event_data_complex["stars_"+i] = (levels[i].stars);
    }
    
    log_data.event_data_complex = JSON.stringify(log_data.event_data_complex);
    //console.log(log_data);
    window.mySlog.log(log_data);
  }
  var log_drag_molecule = function(startPos, endPos, dragTime, startStab, endStab)
  {
    var log_data =
    {
      level:cur_level.id,
      event:"CUSTOM",
      event_custom:1, // "MOLECULE_RELEASE"
      event_data_complex:{
        event_custom:"MOLECULE_RELEASE",
        startPosition:startPos,
        endPosition:endPos,
        time:dragTime,
        startStability:startStab,
        endStability:endStab
      }
    };
    
    log_data.event_data_complex = JSON.stringify(log_data.event_data_complex);
    //console.log(log_data);
    window.mySlog.log(log_data);
  }
  var log_rotate_molecule = function(isStamp, startRot, endRot, numRots, startStab, endStab)
  {
    var log_data =
    {
      level:cur_level.id,
      event:"CUSTOM",
      event_custom:2, // "MOLECULE_ROTATE"
      event_data_complex:{
        event_custom:"MOLECULE_ROTATE",
        isStamp:isStamp,
        startRotation:startRot,
        endRotation:endRot,
        numRotations:numRots,
        startStability:startStab,
        endStability:endStab
      }
    };
    
    log_data.event_data_complex = JSON.stringify(log_data.event_data_complex);
    //console.log(log_data);
    window.mySlog.log(log_data);
  }
  var log_clear_press = function(stability)
  {
    var log_data =
    {
      level:cur_level.id,
      event:"CUSTOM",
      event_custom:6, // "CLEAR_BTN_PRESS"
      event_data_complex:{
        event_custom:"CLEAR_BTN_PRESS",
        numTimesPressed:numClears,
        numMolecules:molecules.length,
        stability:stability
      }
    };
    
    log_data.event_data_complex = JSON.stringify(log_data.event_data_complex);
    //console.log(log_data);
    window.mySlog.log(log_data);
  }
  var log_grow_press = function(stability)
  {
    var log_data =
    {
      level:cur_level.id,
      event:"COMPLETE",
      event_data_complex:{
        stability:stability
      }
    };
    for(var i = 0; i < levels.length; i++)
    {
      log_data.event_data_complex[i] = (levels[i].stars);
    }
    
    log_data.event_data_complex = JSON.stringify(log_data.event_data_complex);
    //console.log(log_data);
    window.mySlog.log(log_data);
  }
  var log_museum_close = function()
  {
    var log_data =
    {
      level:cur_level.id,
      event:"CUSTOM",
      event_custom:5, // "MUSEUM_CLOSE"
      event_data_complex:{
        event_custom:"MUSEUM_CLOSE",
        timeOpen:museumTotalTime
      }
    };
    
    log_data.event_data_complex = JSON.stringify(log_data.event_data_complex);
    //console.log(log_data);
    window.mySlog.log(log_data);
  }

  //enums
  var ENUM = 0;

  var MODE_MENU       = ENUM; ENUM++;
  var MODE_MUSEUM     = ENUM; ENUM++;
  var MODE_GAME       = ENUM; ENUM++;
  var MODE_SUBMIT     = ENUM; ENUM++;
  var MODE_QUIZ  = ENUM; ENUM++;
  var MODE_INTRO      = ENUM; ENUM++;

  //params
  var shadow_dist = 8;
  var white = "#FFFFFF";
  var black = "#000000";
  var bluish = "#49A0B3";
  var bounds_stroke  = white;
  var shadow_fill  = "rgba(0,0,0,.1)";
  var defect_fill  = "rgba(0,0,0,.7)";
  var block_fill   = "#F6F6F6";
  var block_stroke = "#E0E0E0";
  var seed_fill   = "#D6D6D6";
  var seed_stroke = "#C0C0C0";
  var scroll_fill = "rgba(0,0,0,0.8)";
  var bg_fill     = "rgba(2,59,76,0.3)";
  var grid_fill = "rgba(25,102,122,0.7)";
  var grid_stroke = "#277F93";
  var charge_pos = "#22FF22";
  var charge_neg = "#FF2222";
  var btn_bg = "#53BBB9";

  var grad_img = GenIcon(10,100);
  var grd=grad_img.context.createLinearGradient(0,0,0,grad_img.height);
  grd.addColorStop(0,"rgba(99,228,248,0)");
  grd.addColorStop(0.5,"rgba(99,228,248,1)");
  grad_img.context.fillStyle = grd;
  grad_img.context.fillRect(0,0,grad_img.width,grad_img.height);

  var star_outro_sub_slide = 40;
  var star_outro_sub_star = 100;
  var star_outro_sub_zoom = 200;

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

  //simple state
  var n_ticks;
  var total_stars;
  var score;
  var score_pack;
  var score_charge;
  var submitting_t;
  var museum_t;
  var museum_tab_t;

  //static state
  var levels;

  //obj state
  var score_board;
  var stamps;
  var molecules;
  var game_cam;
  var menu_cam;
  var cam;
  var game_bg_cam;
  var menu_bg_cam;
  var bg_cam;
  var bounds;

  //indexes
  var cur_level;
  var dragging_molecule;
  var mode;

  //viz obj
  var total_stars_disp;
  var outro;
  var scroll;
  var back_btn;
  var clear_btn;
  var submit_btn;
  var museum_btn;

  //viz state
  var cur_stars_bounce;
  var score_bounce;

  //tmp state
  var tx;
  var ty;
  var dblock = {wx:0,wy:0,ww:1,wh:1,x:0,y:0,w:0,h:0};
  var w;
  var h;
  var in_r;
  var out_r;
  var theta;

  w = 100;
  h = 100;

  var lock_img = GenIcon(w,h)
  lock_img.context.strokeStyle = "#999999";
  lock_img.context.fillStyle = "#999900";
  lock_img.context.lineWidth = 6;
  lock_img.context.beginPath();
  lock_img.context.arc(w/2,h/2,w/3,0,2*Math.PI);
  lock_img.context.stroke();
  lock_img.context.fillRect(10,h/2,w-20,h/2-10);

  var q_img = GenIcon(w,h);
  q_img.context.fillStyle = bluish;
  q_img.context.strokeStyle = bluish;
  q_img.context.lineWidth = 4;
  q_img.context.beginPath();
  q_img.context.arc(w/2,w/2,w/3,0,twopi);
  q_img.context.stroke();
  q_img.context.textAlign = "center"
  q_img.context.font = quiz_font;
  q_img.context.fillText("?",w/2,2*h/3);

  in_r = w/4;
  out_r = w/2-5;

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
  star = new Image();
  star.src = "assets/star.png";

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
  star_full = new Image();
  star_full.src = "assets/star_full.png";

  var star_empty = new Image();
  star_empty.src = "assets/star_empty.png";

  var connection = new Image();

  var shadow_connection = GenIcon(connection.width,connection.height);
  connection.onload = function()
  {
    shadow_connection = GenIcon(connection.width,connection.height);
    shadow_connection.context.fillStyle = black;
    shadow_connection.context.fillRect(0,0,shadow_connection.width,shadow_connection.height);
    shadow_connection.context.globalCompositeOperation = "destination-in";
    shadow_connection.context.drawImage(connection,0,0);
  }
  connection.src = "assets/connection.png";

  var bg = new Image();
  bg.src = "assets/bg.jpg";

  var menu_circle_0 = new Image();
  menu_circle_0.src = "assets/menu_circle_0.png";
  var menu_circle_1 = new Image();
  menu_circle_1.src = "assets/menu_circle_1.png";

  var museum_img = new Image();
  museum_img.src = "assets/museum.png";

  var tab_crystal_img = new Image();
  tab_crystal_img.src = "assets/tab_crystal.png";
  var tab_close_img = new Image();
  tab_close_img.src = "assets/tab_close.png";

  var win_img = new Image();
  win_img.src = "assets/win.png";

  var logo_img = new Image();
  logo_img.src = "assets/logo.png";

  var drop_auds = [];
  for(var i = 0; i < 4; i++)
    drop_auds[i] = new Audio("assets/sound/drop_"+i+".mp3");
  var drop_aud_i = 0; //to cycle through

  var grow_aud = new Audio("assets/sound/grow.mp3");

  var lvl_auds = [];
  for(var i = 0; i < 9; i++)
    lvl_auds[i] = new Audio("assets/sound/lvl_"+i+".mp3");
  var lvl_auds_should_play = 0;

  var rot_auds = [];
  for(var i = 0; i < 4; i++)
    rot_auds[i] = new Audio("assets/sound/rot_"+i+".mp3");
  var rot_aud_i = 0; //to cycle through

  var star_auds = [];
  for(var i = 0; i < 3; i++)
    star_auds[i] = new Audio("assets/sound/star_"+(2-i)+".mp3");

  var crystal_titles = [];
  crystal_titles.push("Amethyst");
  crystal_titles.push("Diamond");
  crystal_titles.push("Bysmuth");
  crystal_titles.push("Aquamarine");
  crystal_titles.push("Quartz");
  crystal_titles.push("Rocksalt");
  crystal_titles.push("Snowflake");
  crystal_titles.push("Steel");
  crystal_titles.push("Chocolate");

  var crystal_imgs = [];
  for(var i = 0; i < crystal_titles.length; i++)
  {
    crystal_imgs[i] = new Image();
    crystal_imgs[i].src = "assets/crystals/"+crystal_titles[i].toLowerCase()+".png";
  }

  var default_font = "20px Architects Daughter";
  var instr_font = "30px Architects Daughter";
  var quiz_font = "20px Architects Daughter";

  var bgbox;
  var museum;

  var atoms = [];
  for(var i = 0; i < 5; i++)
  {
    var atom = GenIcon(w,h)
    switch(i)
    {
      case 0: atom.context.fillStyle = "#000000"; atom.context.strokeStyle = "#444444"; break;
      case 1: atom.context.fillStyle = "#444444"; atom.context.strokeStyle = "#888888"; break;
      case 2: atom.context.fillStyle = "#888888"; atom.context.strokeStyle = "#888888"; break;
      case 3: atom.context.fillStyle = "#BBBBBB"; atom.context.strokeStyle = "#BBBBBB"; break;
      case 4: atom.context.fillStyle = "#FFFFFF"; atom.context.strokeStyle = "#EEEEEE"; break;
      /*
      case 0: atom.context.fillStyle = "rgba(200,0,0,0.8)"; break;
      case 1: atom.context.fillStyle = "rgba(100,0,0,0.5)"; break;
      case 2: atom.context.fillStyle = "rgba(0,0,0,0.3)"; break;
      case 3: atom.context.fillStyle = "rgba(0,100,0,0.5)"; break;
      case 4: atom.context.fillStyle = "rgba(0,200,0,0.8)"; break;
      */
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
  var shadow_atom = GenIcon(w,h);
  shadow_atom.context.fillStyle = black;
  shadow_atom.context.fillRect(0,0,shadow_atom.width,shadow_atom.height);
  shadow_atom.context.globalCompositeOperation = "destination-in";
  shadow_atom.context.drawImage(atoms[0],0,0);

  var qtr = Math.PI/2;
  var rp_charge = GenIcon(w,h);
  rp_charge.context.strokeStyle = charge_pos;
  rp_charge.context.fillStyle = charge_pos;
  rp_charge.context.font = default_font;
  rp_charge.context.textAlign = "center";
  rp_charge.context.lineWidth = 4;
  rp_charge.context.beginPath();
  rp_charge.context.arc(w/2,h/2,2*w/6,-qtr/2,-qtr/2+qtr);
  rp_charge.context.stroke();
  rp_charge.context.fillText("+",w-5,h/2);
  var dp_charge = GenIcon(w,h);
  dp_charge.context.strokeStyle = charge_pos;
  dp_charge.context.fillStyle = charge_pos;
  dp_charge.context.font = default_font;
  dp_charge.context.textAlign = "center";
  dp_charge.context.lineWidth = 4;
  dp_charge.context.beginPath();
  dp_charge.context.arc(w/2,h/2,2*w/6,-qtr/2+qtr,-qtr/2+qtr+qtr);
  dp_charge.context.stroke();
  dp_charge.context.fillText("+",w/2,h);
  var lp_charge = GenIcon(w,h);
  lp_charge.context.strokeStyle = charge_pos;
  lp_charge.context.fillStyle = charge_pos;
  lp_charge.context.font = default_font;
  lp_charge.context.textAlign = "center";
  lp_charge.context.lineWidth = 4;
  lp_charge.context.beginPath();
  lp_charge.context.arc(w/2,h/2,2*w/6,-qtr/2+qtr+qtr,-qtr/2+qtr+qtr+qtr);
  lp_charge.context.stroke();
  lp_charge.context.fillText("+",5,h/2);
  var up_charge = GenIcon(w,h);
  up_charge.context.strokeStyle = charge_pos;
  up_charge.context.fillStyle = charge_pos;
  up_charge.context.font = default_font;
  up_charge.context.textAlign = "center";
  up_charge.context.lineWidth = 4;
  up_charge.context.beginPath();
  up_charge.context.arc(w/2,h/2,2*w/6,-qtr/2+qtr+qtr+qtr,-qtr/2+qtr+qtr+qtr+qtr);
  up_charge.context.stroke();
  up_charge.context.fillText("+",w/2,10);
  var rn_charge = GenIcon(w,h);
  rn_charge.context.strokeStyle = charge_neg;
  rn_charge.context.fillStyle = charge_neg;
  rn_charge.context.font = default_font;
  rn_charge.context.textAlign = "center";
  rn_charge.context.lineWidth = 4;
  rn_charge.context.beginPath();
  rn_charge.context.arc(w/2,h/2,2*w/6,-qtr/2,-qtr/2+qtr);
  rn_charge.context.stroke();
  rn_charge.context.fillText("-",w-5,h/2);
  var dn_charge = GenIcon(w,h);
  dn_charge.context.strokeStyle = charge_neg;
  dn_charge.context.fillStyle = charge_neg;
  dn_charge.context.font = default_font;
  dn_charge.context.textAlign = "center";
  dn_charge.context.lineWidth = 4;
  dn_charge.context.beginPath();
  dn_charge.context.arc(w/2,h/2,2*w/6,-qtr/2+qtr,-qtr/2+qtr+qtr);
  dn_charge.context.stroke();
  dn_charge.context.fillText("-",w/2,h);
  var ln_charge = GenIcon(w,h);
  ln_charge.context.strokeStyle = charge_neg;
  ln_charge.context.fillStyle = charge_neg;
  ln_charge.context.font = default_font;
  ln_charge.context.textAlign = "center";
  ln_charge.context.lineWidth = 4;
  ln_charge.context.beginPath();
  ln_charge.context.arc(w/2,h/2,2*w/6,-qtr/2+qtr+qtr,-qtr/2+qtr+qtr+qtr);
  ln_charge.context.stroke();
  ln_charge.context.fillText("-",5,h/2);
  var un_charge = GenIcon(w,h);
  un_charge.context.strokeStyle = charge_neg;
  un_charge.context.fillStyle = charge_neg;
  un_charge.context.font = default_font;
  un_charge.context.textAlign = "center";
  un_charge.context.lineWidth = 4;
  un_charge.context.beginPath();
  un_charge.context.arc(w/2,h/2,2*w/6,-qtr/2+qtr+qtr+qtr,-qtr/2+qtr+qtr+qtr+qtr);
  un_charge.context.stroke();
  un_charge.context.fillText("-",w/2,10);

  var Quiz = function(scene)
  {
    var self = this;
    self.x = 0;
    self.y = 0;
    self.w = canv.width;
    self.h = canv.height;

    self.img = 0;
    self.qimg = 0;
    self.aimg = 0;
    self.qtxt = "";
    self.atxta = "";
    self.atxtb = "";
    self.atxtc = "";
    self.atxtd = "";
    self.qlines;
    self.alinesa;
    self.alinesb;
    self.alinesc;
    self.alinesd;
    self.correct = 0;
    self.question = 0;

    self.text_x = 250;
    self.text_w = canv.width-self.text_x-20;
    self.text_h = 100;
    self.text_y = canv.height-self.text_h-20;

    self.loadQuiz = function(quiz, canv)
    {
      var first_line = quiz[0];
      self.img   = first_line[0];
      self.qimg  = first_line[1];
      self.aimg  = first_line[2];
      self.qtxt  = first_line[3];
      self.atxta = first_line[4];
      self.atxtb = first_line[5];
      self.atxtc = first_line[6];
      self.atxtd = first_line[7];
      self.correct = first_line[8];
      self.question = first_line[9];
      self.rest_lines = quiz.slice(1);
      self.canv = canv;
      self.format(canv);
    }

    self.format = function(canv)
    {
      self.qlines = textToLines(quiz_font,self.text_w-20,self.qtxt,canv.context);
      self.alinesa = textToLines(quiz_font,self.text_w-20,self.atxta,canv.context);
      self.alinesb = textToLines(quiz_font,self.text_w-20,self.atxtb,canv.context);
      self.alinesc = textToLines(quiz_font,self.text_w-20,self.atxtc,canv.context);
      self.alinesd = textToLines(quiz_font,self.text_w-20,self.atxtd,canv.context);
    }

    self.draw = function(canv)
    {
      var box_height = 188;
      var yoff = 400-400*quiz_t;
      canv.context.drawImage(grad_img,0,canv.height-box_height+yoff,canv.width,box_height);

      if(self.qlines)
      {
        canv.context.font = quiz_font;
        canv.context.textAlign = "left";
        canv.context.fillStyle = "#FFFFFF";
        canv.fillRoundRect(self.text_x,self.text_y,self.text_w,self.text_h,5);
        canv.context.beginPath();
        canv.context.moveTo(self.text_x   ,self.text_y+10);
        canv.context.lineTo(self.text_x-10,self.text_y+15);
        canv.context.lineTo(self.text_x   ,self.text_y+20);
        canv.context.fill();
        canv.context.fillStyle = "#000000";
        var myoff = 24;
        for(var i = 0; i < self.qlines.length; i++)
        {
          canv.context.fillText(self.qlines[i],self.text_x+10,self.text_y+myoff,self.text_w);
          myoff += 24;
        }
        canv.context.fillStyle = "#0576B9";
        var cache_myoff = myoff;
        for(var i = 0; i < self.alinesa.length; i++)
        {
          canv.context.fillText(self.alinesa[i],self.text_x+10,self.text_y+cache_myoff,self.text_w);
          cache_myoff += 24;
        }
        for(var i = 0; i < self.alinesb.length; i++)
        {
          canv.context.fillText(self.alinesb[i],self.text_x+10,self.text_y+cache_myoff,self.text_w);
          cache_myoff += 24;
        }
        cache_myoff = myoff;
        for(var i = 0; i < self.alinesc.length; i++)
        {
          canv.context.fillText(self.alinesc[i],self.text_x+10+self.text_w/2,self.text_y+cache_myoff,self.text_w);
          cache_myoff += 24;
        }
        for(var i = 0; i < self.alinesd.length; i++)
        {
          canv.context.fillText(self.alinesd[i],self.text_x+10+self.text_w/2,self.text_y+cache_myoff,self.text_w);
          cache_myoff += 24;
        }
        canv.context.fillStyle = "#000000";
      }

      for(var i = 0; i < char_imgs.length; i++)
      {
        if(i == self.img) quiz_char_ts[i] = lerp(quiz_char_ts[i],1,0.1);
        else              quiz_char_ts[i] = lerp(quiz_char_ts[i],0,0.1);
        canv.context.drawImage(char_imgs[i],char_xs[i]+20,char_ys[i]+150+400-(400*quiz_char_ts[i])+yoff,char_ws[i],char_hs[i]);
      }
      if(self.qimg) canv.context.drawImage(self.qimg, (canv.width / 2) - (250), 200, 500, 500 * (self.qimg.height/self.qimg.width));
      if(self.aimg) canv.context.drawImage(self.aimg, 500, 200, 300, 300);
    }

    self.click = function(evt)
    {
      var done = false;
      if(self.alinesa[0] && self.alinesa[0] != "") //a quiz!
      {
        if(self.qlines)
        {
          var myoff = 0;//24;
          for(var i = 0; i < self.qlines.length; i++)
          {
            myoff += 24;
          }
          var cache_myoff = myoff;
          for(var i = 0; i < self.alinesa.length && !done; i++)
          {
            if(ptWithin(self.text_x, self.text_y+cache_myoff, self.text_w/3, 24, evt.doX, evt.doY))
            {
              if(self.correct == 0) self.rest_lines.splice(1,1);
              else                  self.rest_lines = self.rest_lines.slice(1);
              var log_data =
              {
                level:cur_level.id,
                event:"CUSTOM",
                event_custom:3, //3 = QUESTION_ANSWER
                event_data_complex:
                {
                  event_custom:"QUESTION_ANSWER",
                  question:self.question,
                  answered:0,
                  answer:self.correct,
                }
              };
              log_data.event_data_complex = JSON.stringify(log_data.event_data_complex);
              window.mySlog.log(log_data);
              done = true;
            }
            cache_myoff += 24;
          }
          for(var i = 0; i < self.alinesb.length && !done; i++)
          {
            if(ptWithin(self.text_x, self.text_y+cache_myoff, self.text_w/3, 24, evt.doX, evt.doY))
            {
              if(self.correct == 1) self.rest_lines.splice(1,1);
              else                  self.rest_lines = self.rest_lines.slice(1);
              var log_data =
              {
                level:cur_level.id,
                event:"CUSTOM",
                event_custom:3, //3 = QUESTION_ANSWER
                event_data_complex:
                {
                  event_custom:"QUESTION_ANSWER",
                  question:self.question,
                  answered:1,
                  answer:self.correct,
                }
              };
              log_data.event_data_complex = JSON.stringify(log_data.event_data_complex);
              window.mySlog.log(log_data);
              done = true;
            }
            cache_myoff += 24;
          }
          cache_myoff = myoff;
          for(var i = 0; i < self.alinesc.length && !done; i++)
          {
            if(ptWithin(self.text_x+self.text_w/2, self.text_y+cache_myoff, self.text_w/3, 24, evt.doX, evt.doY))
            {
              if(self.correct == 2) self.rest_lines.splice(1,1);
              else                  self.rest_lines = self.rest_lines.slice(1);
              var log_data =
              {
                level:cur_level.id,
                event:"CUSTOM",
                event_custom:3, //3 = QUESTION_ANSWER
                event_data_complex:
                {
                  event_custom:"QUESTION_ANSWER",
                  question:self.question,
                  answered:2,
                  answer:self.correct,
                }
              };
              log_data.event_data_complex = JSON.stringify(log_data.event_data_complex);
              window.mySlog.log(log_data);
              done = true;
            }
            cache_myoff += 24;
          }
          for(var i = 0; i < self.alinesd.length && !done; i++)
          {
            if(ptWithin(self.text_x+self.text_w/2, self.text_y+cache_myoff, self.text_w/3, 24, evt.doX, evt.doY))
            {
              if(self.correct == 3) self.rest_lines.splice(1,1);
              else                  self.rest_lines = self.rest_lines.slice(1);
              var log_data =
              {
                level:cur_level.id,
                event:"CUSTOM",
                event_custom:3, //3 = QUESTION_ANSWER
                event_data_complex:
                {
                  event_custom:"QUESTION_ANSWER",
                  question:self.question,
                  answered:3,
                  answer:self.correct,
                }
              };
              log_data.event_data_complex = JSON.stringify(log_data.event_data_complex);
              window.mySlog.log(log_data);
              done = true;
            }
            cache_myoff += 24;
          }
        }
      }
      else done = true;

      if(done)
      {
        click_aud.play();
        if(self.rest_lines && self.rest_lines.length > 0)
          self.loadQuiz(self.rest_lines, self.canv);
        else
        {
          self.qlines = undefined;
          self.alinesa = undefined;
          self.alinesb = undefined;
          self.alinesc = undefined;
          self.alinesd = undefined;
          self.qimg = undefined;
          self.aimg = undefined;
          mode = MODE_MENU;
        }
      }
    }
  }

  var loadLevelStars = function()
  {
    for(var i = 0; i < levels.length; i++)
    {
      var c = parseInt(getCookie("lvl"+i));
      if(!isNaN(c)) levels[i].stars = c;
    }
    countLevelStars();
  }
  var countLevelStars = function()
  {
    total_stars = 0;
    for(var i = 0; i < levels.length; i++)
    {
      setCookie("lvl"+i,""+levels[i].stars,99);
      var c = parseInt(getCookie("lvl"+i));
      total_stars += levels[i].stars;
    }
    if(UNLOCKED) total_stars += 1000;
  }

  var totalStarsDisplay = function()
  {
    var self = this;
    self.wx = 0;
    self.wy = 0;
    self.ww = 0;
    self.wh = 0;
    self.x = 0;
    self.y = 0;
    self.w = 0;
    self.h = 0;

    self.draw = function()
    {
      ctx.drawImage(star_full,self.x,self.y,40,40);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("X"+total_stars,self.x+45,self.y+30);
    }
  }

  var level = function(id)
  {
    var self = this;
    self.id = id;
    self.available_templates = [];
    self.seed = [];
    self.defect = [];
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
    self.lock_stars = 0;
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

    self.quiz = false;
    self.quiz_seen = false;
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
      //ctx.beginPath();
      //ctx.arc(self.x+self.w/2,self.y+self.h/2,2*self.w/5,0,2*Math.PI);
      //ctx.stroke();

      if(total_stars < self.level.lock_stars)
      {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        var w = 4*self.w/5;
        ctx.drawImage(menu_circle_0,self.x+self.w/2-w/2,self.y+self.h/2-w/2,w,w);
        //ctx.beginPath();
        //ctx.arc(self.x+self.w/2,self.y+self.h/2,2*self.w/5,0,2*Math.PI);
        //ctx.fill();

        draw_blocks(self.wx,self.wy,self.level.available_templates[0].cx,self.level.available_templates[0].cy,0,0,self.rotoff+n_ticks/100,0.5,1,0,0,self.level.available_templates[0]);

        ctx.drawImage(star_full,self.x+10,self.y+self.h/2-10,40,40);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText("X"+self.level.lock_stars,self.x+50,self.y+self.h/2+20);

      }
      else
      {
        var w = 4*self.w/5;
        ctx.drawImage(menu_circle_1,self.x+self.w/2-w/2,self.y+self.h/2-w/2,w,w);
        draw_blocks(self.wx,self.wy,self.level.available_templates[0].cx,self.level.available_templates[0].cy,0,0,self.rotoff+n_ticks/100,0.5,0,0,0,self.level.available_templates[0]);
      }

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
          ctx.drawImage(star_empty,x+offx-bs/2,y+offy-bs/2,bs,bs);
      }
    }

    self.click = function(evt)
    {
      if(total_stars < self.level.lock_stars) return;
			remove_vault_button();

      log_level_begin(self.level.id);
      lvl_auds_should_play = 10;
      set_level(self.level.id);
      if(cur_level.comic) cur_level.comic();

      //jump ahead to avoid flash
      cam.wx = lerp(cam.wx,game_cam.wx,0.5);
      cam.wy = lerp(cam.wy,game_cam.wy,0.5);
      cam.ww = lerp(cam.ww,game_cam.ww,0.5);
      cam.wh = lerp(cam.wh,game_cam.wh,0.5);
      bg_cam.wx = lerp(bg_cam.wx,game_bg_cam.wx,0.5);
      bg_cam.wy = lerp(bg_cam.wy,game_bg_cam.wy,0.5);
      bg_cam.ww = lerp(bg_cam.ww,game_bg_cam.ww,0.5);
      bg_cam.wh = lerp(bg_cam.wh,game_bg_cam.wh,0.5);

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
    self.unlocked = -1;
    self.displaying_unlocked = 0;

    self.bounces = [];
    for(var i = 0; i < 3; i++)
      self.bounces[i] = new bounce();

    self.click = function(evt)
    {
      if(!self.displaying_unlocked && self.unlocked != -1) self.displaying_unlocked = 1;
      else
      {
        countLevelStars();
        self.unlocked = -1;
        self.displaying_unlocked = 0;
        popQuiz();
      }
    }

    self.ibox_pack = new (function()
    {
      var self = this;
      self.x = 0;
      self.y = 0;
      self.w = 30;
      self.h = 30;

      self.hover = function()
      {
        self.hovering = true;
      }
      self.unhover = function()
      {
        self.hovering = false;
      }
    })();
    self.ibox_charge = new (function()
    {
      var self = this;
      self.x = 0;
      self.y = 0;
      self.w = 30;
      self.h = 30;

      self.hover = function()
      {
        self.hovering = true;
      }
      self.unhover = function()
      {
        self.hovering = false;
      }
    })();

    self.draw = function()
    {
      if(self.displaying_unlocked)
      {
        ctx.fillStyle = scroll_fill;
        /*
        ctx.beginPath();
        ctx.arc(self.x+self.w/2,self.y+self.h/2,self.w,0,2*Math.PI);
        ctx.fill();
        */
        ctx.fillStyle = white;
        fillR(self.x-self.w/2,self.y,self.w*2,self.h,20,ctx);
        var img = crystal_imgs[self.unlocked];
        ctx.drawImage(img,self.x+self.w/2-100,self.y-50,200,img.height*200/img.width);
        //draw_blocks(self.wx,self.wy,cur_level.available_templates[0].cx,cur_level.available_templates[0].cy,0,0,n_ticks/100,1,0,0,0,cur_level.available_templates[0]);
        ctx.fillStyle = bluish;
        ctx.strokeStyle = bluish;
        var x = self.x+self.w/2;
        var y = self.y+self.h/2;
        ctx.textAlign = "center";
        ctx.fillText("unlocked in", x, y);
        ctx.fillText("Crystal Museum!", x, y+35);
        strokeR(x-80, y+70, 160, 50, 20, ctx);
        ctx.fillText("Ok!", x, y+105);
      }
      else
      {
        ctx.fillStyle = scroll_fill;
        /*
        ctx.beginPath();
        ctx.arc(self.x+self.w/2,self.y+self.h/2,self.w,0,2*Math.PI);
        ctx.fill();
        */
        ctx.fillStyle = white;
        fillR(self.x-self.w/2,self.y,self.w*2,self.h,20,ctx);
        ctx.drawImage(win_img,self.x+self.w/2-win_img.width/4,self.y-win_img.height/4-50,win_img.width/2,win_img.height/2);
        //draw_blocks(self.wx,self.wy,cur_level.available_templates[0].cx,cur_level.available_templates[0].cy,0,0,n_ticks/100,1,0,0,0,cur_level.available_templates[0]);
        ctx.fillStyle = black;

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
          offx = cos(theta)*self.w/2;
          offy = sin(theta)*self.h/3-250;
          //overwrite offy to make straight:
          offy = sin(halfpi)*self.h/3-250;
          switch(i)
          {
            case 0: if(t == 90) { self.bounces[i].vel = 2; if(cur_level.cur_stars > 2-i) star_auds[i].play(); } break;
            case 1: if(t == 60) { self.bounces[i].vel = 2; if(cur_level.cur_stars > 2-i) star_auds[i].play(); } break;
            case 2: if(t == 30) { self.bounces[i].vel = 2; if(cur_level.cur_stars > 2-i) star_auds[i].play(); } break;
          }
          var bs = s;
          self.bounces[i].tick();
          bs += self.bounces[i].v;
          if(cur_level.cur_stars > 2-i && n_ticks-self.start_ticks > 30*(3-i))
            ctx.drawImage(star_full,x+offx-bs/2,y+offy-bs/2,bs,bs);
          else
            ctx.drawImage(star_empty,x+offx-bs/2,y+offy-bs/2,bs,bs);
        }
        ctx.fillStyle = bluish;
        ctx.strokeStyle = bluish;
        self.ibox_pack.x = x-120-40;
        self.ibox_pack.y = y-60-25;
        ctx.drawImage(q_img,self.ibox_pack.x,self.ibox_pack.y,self.ibox_pack.w,self.ibox_pack.h);
        ctx.fillText("Packing:",          x - 120, y-60);
        ctx.fillText(score_pack,          x + 120, y-60);
        self.ibox_charge.x = x-120-40;
        self.ibox_charge.y = y-20-25;
        ctx.drawImage(q_img,self.ibox_charge.x,self.ibox_charge.y,self.ibox_charge.w,self.ibox_charge.h);
        ctx.fillText("Charge Bonus:",     x - 120, y-20);
        ctx.fillText(score_charge,        x + 120, y-20);
        ctx.beginPath();
        ctx.moveTo(x-120,y);
        ctx.lineTo(x+120,y);
        ctx.stroke();
        ctx.fillText("Total:",            x - 120, y+40);
        ctx.fillText(score,               x + 120, y+40);
        strokeR(x-80, y+70, 160, 50, 20, ctx);
        ctx.fillText("Next Level", x-45, y+105);
      }
    }
  }

  var init_levels = function()
  {
    levels = [];
    var n_rows = 3;
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
      return menu_cam.wy+menu_cam.wh/2-0.5-((y+1)/(n_rows+1))*menu_cam.wh;
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
    levels[i].bounds_h = 6;
    levels[i].scroll_w = 2.5;
    if(PERFECT)
    levels[i].scroll_w = (levels[i].bounds_w+2)*4/3-(levels[i].bounds_w+2);
    levels[i].lock_stars = 0;
    levels[i].star_req_score[0] = 22;
    levels[i].star_req_score[1] = 30;
    levels[i].star_req_score[2] = 36;
    j = 0;
    levels[i].available_templates[j++] = new template(0,0.5,[{cx:0,cy:0,c:[0,0,0,0]},{cx:0,cy:1,c:[0,0,0,0]}]);
    levels[i].button = new level_button(lvlx(i),lvly(i),lvlw(i),lvlh(i),levels[i]);
    levels[i].has_intro = true && TEXT;
    levels[i].shouldClick = function(evt) { return true; }
    levels[i].click = function(evt) { cur_level.intro = false; }
    levels[i].introtick = function() { return cur_level.intro; }
    levels[i].introdraw = function() { ctx.fillStyle = white; ctx.font = instr_font; ctx.fillText("<- This is a molecule",bounds.x-110,350); ctx.fillText("Stack 'em here ->",bounds.x+50,400); }
    levels[i].comic = function() { game.setScene(2,{start:0,length:8}); };
    i++;

    //tetris s- no charge
    levels.push(new level(i));
    levels[i].scale = 1;
    levels[i].repeat_x = 6;
    levels[i].repeat_y = 4;
    levels[i].bounds_w = 6;
    levels[i].bounds_h = 6;
    levels[i].scroll_w = 3.5;
    if(PERFECT)
    levels[i].scroll_w = (levels[i].bounds_w+2)*4/3-(levels[i].bounds_w+2);
    levels[i].lock_stars = levels[i-1].lock_stars+3;
    levels[i].star_req_score[0] = 13;
    levels[i].star_req_score[1] = 20;
    levels[i].star_req_score[2] = 30;
    j = 0;
    levels[i].available_templates[j++] = new template(0,0.5,[{cx:0,cy:0,c:[0,0,0,0]},{cx:0,cy:1,c:[0,0,0,0]},{cx:-1,cy:0,c:[0,0,0,0]},{cx:1,cy:1,c:[0,0,0,0]}]);
    levels[i].button = new level_button(lvlx(i),lvly(i),lvlw(i),lvlh(i),levels[i]);
    levels[i].has_intro = true && TEXT;
    levels[i].shouldClick = function(evt) { return true; }
    levels[i].click = function(evt) { cur_level.intro = false; }
    levels[i].introtick = function() { return cur_level.intro; }
    levels[i].introdraw = function() { ctx.fillStyle = white; ctx.font = instr_font; ctx.fillText("Some patterns can",bounds.x+50,300); ctx.fillText("fill the space completely.",bounds.x+50,330); ctx.fillText("Find those patterns!",bounds.x+50,400); }
    levels[i].comic = function() { game.setScene(2,{start:8,length:7}); };
    i++;

    //tetris T- no charge
    levels.push(new level(i));
    levels[i].scale = 1;
    levels[i].repeat_x = 6;
    levels[i].repeat_y = 4;
    levels[i].bounds_w = 6;
    levels[i].bounds_h = 6;
    levels[i].scroll_w = 3.5;
    if(PERFECT)
    levels[i].scroll_w = (levels[i].bounds_w+2)*4/3-(levels[i].bounds_w+2);
    levels[i].lock_stars = levels[i-1].lock_stars+3;
    levels[i].star_req_score[0] = 8;
    levels[i].star_req_score[1] = 17;
    levels[i].star_req_score[2] = 30;
    j = 0;
    levels[i].available_templates[j++] = new template(0,0.5,[{cx:0,cy:0,c:[0,0,0,0]},{cx:0,cy:1,c:[0,0,0,0]},{cx:-1,cy:0,c:[0,0,0,0]},{cx:1,cy:0,c:[0,0,0,0]}]);
    levels[i].button = new level_button(lvlx(i),lvly(i),lvlw(i),lvlh(i),levels[i]);
    levels[i].has_intro = true && TEXT;
    levels[i].shouldClick = function(evt) { return true; }
    levels[i].click = function(evt) { cur_level.intro = false; }
    levels[i].introtick = function() { return cur_level.intro; }
    levels[i].introdraw = function() { ctx.fillStyle = white; ctx.font = instr_font; ctx.fillText("Double click",bounds.x+50,300); ctx.fillText("to rotate",bounds.x+50,330); }
    levels[i].quiz = [
      [CHAR_GIRL, null, null, "Question time!", "","","","",0,0],
      [CHAR_GIRL, GenImg("assets/quiz/answer-group_1.png"), null, "Which of these is a crystal?", "A","B","Both","Neither",1,0],
      [CHAR_GIRL, null, null, "Perfect! Crystals have ordered, repeating structures of atoms.", "","","","",1,0],
      [CHAR_GIRL, GenImg("assets/quiz/answer-group_1.png"), null, "Not quite. Crystals have ordered, repeating structures of atoms.", "","","","",1,0],
      [CHAR_GIRL, null, null, "Next question:", "","","","",0,1],
      [CHAR_GIRL, GenImg("assets/quiz/answer-group_2.png"), null, "Which of these structures will have higher stability?", "A","B","Both","Neither",0,1],
      [CHAR_GIRL, null, null, "Great! Structures with few gaps and tighter arrangement are more stable.", "","","","",0,1],
      [CHAR_GIRL, GenImg("assets/quiz/answer-group_2.png"), null, "Not quite. Structures with few gaps and tighter arrangement are more stable.", "","","","",0,1]
    ];
    i++;

    //domino- flip charge
    levels.push(new level(i));
    levels[i].scale = 1;
    levels[i].repeat_x = 6;
    levels[i].repeat_y = 4;
    levels[i].bounds_w = 6;
    levels[i].bounds_h = 6;
    levels[i].scroll_w = 2.5;
    if(PERFECT)
    levels[i].scroll_w = (levels[i].bounds_w+2)*4/3-(levels[i].bounds_w+2);
    levels[i].lock_stars = levels[i-1].lock_stars+2;
    levels[i].star_req_score[0] = 36;
    levels[i].star_req_score[1] = 37;
    levels[i].star_req_score[2] = 84;
    j = 0;
    levels[i].available_templates[j++] = new template(0,0.5,[{cx:0,cy:0,c:right_pos},{cx:0,cy:1,c:left_neg}]);
    levels[i].button = new level_button(lvlx(i),lvly(i),lvlw(i),lvlh(i),levels[i]);
    levels[i].has_intro = true && TEXT;
    levels[i].shouldClick = function(evt) { return true; }
    levels[i].click = function(evt) { cur_level.intro = false; }
    levels[i].introtick = function() { return cur_level.intro; }
    levels[i].introdraw = function() { ctx.fillStyle = white; ctx.font = instr_font; ctx.fillText("Some molecules have charges.",bounds.x+50,300); ctx.fillText("opposites attract.",bounds.x+50,350); }
    levels[i].comic = function() { game.setScene(2,{start:15,length:8}); };
    i++;

    //L- hard charge
    levels.push(new level(i));
    levels[i].scale = 1;
    levels[i].repeat_x = 8;
    levels[i].repeat_y = 4;
    levels[i].bounds_w = 8;
    levels[i].bounds_h = 6;
    levels[i].scroll_w = 3.5;
    if(PERFECT)
    levels[i].scroll_w = (levels[i].bounds_w+2)*4/3-(levels[i].bounds_w+2);
    levels[i].lock_stars = levels[i-1].lock_stars+2;
    levels[i].star_req_score[0] = 48;
    levels[i].star_req_score[1] = 61;
    levels[i].star_req_score[2] = 90;
    j = 0;
    levels[i].available_templates[j++] = new template(0.5,1,[{cx:0,cy:0,c:[0,0,0,1]},{cx: 0,cy: 1,c:[0,0,0,0]},{cx: 0,cy:2,c:[-1,0,0,-1]},{cx: 1,cy:0,c:[1,1,0,0]}]); //L
    levels[i].button = new level_button(lvlx(i),lvly(i),lvlw(i),lvlh(i),levels[i]);
    levels[i].has_intro = true && TEXT;
    levels[i].shouldClick = function(evt) { return true; }
    levels[i].click = function(evt) { cur_level.intro = false; }
    levels[i].introtick = function() { return cur_level.intro; }
    levels[i].introdraw = function() { ctx.fillStyle = white; ctx.font = instr_font; ctx.fillText("Try different patterns",bounds.x+50,300); ctx.fillText("to get 3 stars.",bounds.x+50,350); }
    i++;

    //square- hard charge
    levels.push(new level(i));
    levels[i].scale = 1;
    levels[i].repeat_x = 10;
    levels[i].repeat_y = 6;
    levels[i].bounds_w = 10;
    levels[i].bounds_h = 6;
    levels[i].scroll_w = 2.5;
    if(PERFECT)
    levels[i].scroll_w = (levels[i].bounds_w+2)*4/3-(levels[i].bounds_w+2);
    levels[i].lock_stars = levels[i-1].lock_stars+1;
    levels[i].star_req_score[0] = 60;
    levels[i].star_req_score[1] = 70;
    levels[i].star_req_score[2] = 108;
    j = 0;
    levels[i].available_templates[j++] = new template(0.5,0.5,[{cx:0,cy:0,c:bottom_pos},{cx: 0,cy: 1,c:left_neg  },{cx: 1,cy:0,c:right_neg },{cx: 1,cy:1,c:top_pos   }]); //box
    levels[i].button = new level_button(lvlx(i),lvly(i),lvlw(i),lvlh(i),levels[i]);
    i++;

    //domino- flip charge defect
    levels.push(new level(i));
    levels[i].scale = 1;
    levels[i].repeat_x = 6;
    levels[i].repeat_y = 4;
    levels[i].bounds_w = 6;
    levels[i].bounds_h = 6;
    levels[i].scroll_w = 2.5;
    if(PERFECT)
    levels[i].scroll_w = (levels[i].bounds_w+2)*4/3-(levels[i].bounds_w+2);
    levels[i].lock_stars = levels[i-1].lock_stars+2;
    levels[i].star_req_score[0] = 37;
    levels[i].star_req_score[1] = 61;
    levels[i].star_req_score[2] = 70;
    j = 0;
    levels[i].available_templates[j++] = new template(0,0.5,[{cx:0,cy:0,c:right_pos},{cx:0,cy:1,c:left_neg}]);
    j = 0;
    levels[i].defect[j++] = new defect(16,0,new template(0.5,0.5,[{cx:0,cy:0,c:no_charge}]));
    levels[i].button = new level_button(lvlx(i),lvly(i),lvlw(i),lvlh(i),levels[i]);
    levels[i].has_intro = true && TEXT;
    levels[i].shouldClick = function(evt) { return true; }
    levels[i].click = function(evt) { cur_level.intro = false; }
    levels[i].introtick = function() { return cur_level.intro; }
    levels[i].introdraw = function() { ctx.fillStyle = white; ctx.font = instr_font; ctx.fillText("There's a defect in this crystal...",bounds.x+30,300); }
    levels[i].comic = function() { game.setScene(2,{start:23,length:5}); };
    i++;

    //L- hard charge seed
    levels.push(new level(i));
    levels[i].scale = 1;
    levels[i].repeat_x = 21;
    levels[i].repeat_y = 14;
    levels[i].bounds_w = 21;
    levels[i].bounds_h = 14;
    levels[i].scroll_w = 9;
    levels[i].quiz = [
      [CHAR_GIRL, null, null, "Question time!", "","","","",1,2],
      [CHAR_GIRL, GenImg("assets/quiz/answer-group_3.png"), null, "Which of these structures will have higher stability?", "A","B","Both","Neither",0,2],
      [CHAR_GIRL, null, null, "Great! Structures where opposite charges are next to each other are more stable.", "","","","",0,2],
      [CHAR_GIRL, GenImg("assets/quiz/answer-group_3.png"), null, "Not quite. Structures where opposite charges are next to each other are more stable.", "","","","",0,2],
    ];
    if(PERFECT)
    levels[i].scroll_w = (levels[i].bounds_w+2)*4/3-(levels[i].bounds_w+2);
    levels[i].lock_stars = levels[i-1].lock_stars+2;
    levels[i].star_req_score[0] = 335;
    levels[i].star_req_score[1] = 335;
    levels[i].star_req_score[2] = 336;
    j = 0;
    levels[i].available_templates[j++] = new template(0.5,0.5,
      [
        {cx: 1,cy: 0,c:[0,0,0,0]},
        {cx: 2,cy: 0,c:[0,0,0,0]},
        {cx: 1,cy: 1,c:[0,0,0,0]},
        {cx: 0,cy: 0,c:[0,0,0,0]},
        {cx: 1,cy:-1,c:[0,0,0,0]},
        {cx:-1,cy: 0,c:[0,0,0,0]},
        {cx:-1,cy: 1,c:[0,0,0,0]},
      ]); //L

    j = 0;
    levels[i].seed[j] = new molecule();
    levels[i].seed[j].cx = 15;
    levels[i].seed[j].cy =  -3;
    levels[i].seed[j].wx = levels[i].seed[j].cx-0.5;
    levels[i].seed[j].wy = levels[i].seed[j].cy-0.5;
    levels[i].seed[j].template = new template(0.5,0.5,
      [
        {cx: 1,cy: 0,c:[0,0,0,0]},
        {cx: 2,cy: 0,c:[0,0,0,0]},
        {cx: 1,cy: 1,c:[0,0,0,0]},
        {cx: 0,cy: 0,c:[0,0,0,0]},
        {cx: 1,cy:-1,c:[0,0,0,0]},
        {cx:-1,cy: 0,c:[0,0,0,0]},
        {cx:-1,cy: 1,c:[0,0,0,0]},
      ]); //L
    j++;
    levels[i].seed[j] = new molecule();
    levels[i].seed[j].cx = levels[i].seed[j-1].cx+4;
    levels[i].seed[j].cy = levels[i].seed[j-1].cy+1;
    levels[i].seed[j].wx = levels[i].seed[j].cx-0.5;
    levels[i].seed[j].wy = levels[i].seed[j].cy-0.5;
    levels[i].seed[j].template = new template(0.5,0.5,
      [
        {cx: 1,cy: 0,c:[0,0,0,0]},
        {cx: 2,cy: 0,c:[0,0,0,0]},
        {cx: 1,cy: 1,c:[0,0,0,0]},
        {cx: 0,cy: 0,c:[0,0,0,0]},
        {cx: 1,cy:-1,c:[0,0,0,0]},
        {cx:-1,cy: 0,c:[0,0,0,0]},
        {cx:-1,cy: 1,c:[0,0,0,0]},
      ]); //L
    rotate_template(levels[i].seed[j].template);
    rotate_template(levels[i].seed[j].template);
    j++;

    levels[i].seed[j] = new molecule();
    levels[i].seed[j].cx = levels[i].seed[j-2].cx-1;
    levels[i].seed[j].cy = levels[i].seed[j-2].cy+2;
    levels[i].seed[j].wx = levels[i].seed[j].cx-0.5;
    levels[i].seed[j].wy = levels[i].seed[j].cy-0.5;
    levels[i].seed[j].template = new template(0.5,0.5,
      [
        {cx: 1,cy: 0,c:[0,0,0,0]},
        {cx: 2,cy: 0,c:[0,0,0,0]},
        {cx: 1,cy: 1,c:[0,0,0,0]},
        {cx: 0,cy: 0,c:[0,0,0,0]},
        {cx: 1,cy:-1,c:[0,0,0,0]},
        {cx:-1,cy: 0,c:[0,0,0,0]},
        {cx:-1,cy: 1,c:[0,0,0,0]},
      ]); //L
    j++;
    levels[i].seed[j] = new molecule();
    levels[i].seed[j].cx = levels[i].seed[j-2].cx-1;
    levels[i].seed[j].cy = levels[i].seed[j-2].cy+2;
    levels[i].seed[j].wx = levels[i].seed[j].cx-0.5;
    levels[i].seed[j].wy = levels[i].seed[j].cy-0.5;
    levels[i].seed[j].template = new template(0.5,0.5,
      [
        {cx: 1,cy: 0,c:[0,0,0,0]},
        {cx: 2,cy: 0,c:[0,0,0,0]},
        {cx: 1,cy: 1,c:[0,0,0,0]},
        {cx: 0,cy: 0,c:[0,0,0,0]},
        {cx: 1,cy:-1,c:[0,0,0,0]},
        {cx:-1,cy: 0,c:[0,0,0,0]},
        {cx:-1,cy: 1,c:[0,0,0,0]},
      ]); //L
    rotate_template(levels[i].seed[j].template);
    rotate_template(levels[i].seed[j].template);
    j++;

    levels[i].seed[j] = new molecule();
    levels[i].seed[j].cx = levels[i].seed[j-2].cx-1;
    levels[i].seed[j].cy = levels[i].seed[j-2].cy+2;
    levels[i].seed[j].wx = levels[i].seed[j].cx-0.5;
    levels[i].seed[j].wy = levels[i].seed[j].cy-0.5;
    levels[i].seed[j].template = new template(0.5,0.5,
      [
        {cx: 1,cy: 0,c:[0,0,0,0]},
        {cx: 2,cy: 0,c:[0,0,0,0]},
        {cx: 1,cy: 1,c:[0,0,0,0]},
        {cx: 0,cy: 0,c:[0,0,0,0]},
        {cx: 1,cy:-1,c:[0,0,0,0]},
        {cx:-1,cy: 0,c:[0,0,0,0]},
        {cx:-1,cy: 1,c:[0,0,0,0]},
      ]); //L
    j++;
    levels[i].seed[j] = new molecule();
    levels[i].seed[j].cx = levels[i].seed[j-2].cx-1;
    levels[i].seed[j].cy = levels[i].seed[j-2].cy+2;
    levels[i].seed[j].wx = levels[i].seed[j].cx-0.5;
    levels[i].seed[j].wy = levels[i].seed[j].cy-0.5;
    levels[i].seed[j].template = new template(0.5,0.5,
      [
        {cx: 1,cy: 0,c:[0,0,0,0]},
        {cx: 2,cy: 0,c:[0,0,0,0]},
        {cx: 1,cy: 1,c:[0,0,0,0]},
        {cx: 0,cy: 0,c:[0,0,0,0]},
        {cx: 1,cy:-1,c:[0,0,0,0]},
        {cx:-1,cy: 0,c:[0,0,0,0]},
        {cx:-1,cy: 1,c:[0,0,0,0]},
      ]); //L
    rotate_template(levels[i].seed[j].template);
    rotate_template(levels[i].seed[j].template);
    j++;

    levels[i].button = new level_button(lvlx(i),lvly(i),lvlw(i),lvlh(i),levels[i]);
    levels[i].has_intro = true && TEXT;
    levels[i].shouldClick = function(evt) { return true; }
    levels[i].click = function(evt) { cur_level.intro = false; }
    levels[i].introtick = function() { return cur_level.intro; }
    levels[i].introdraw = function() { ctx.fillStyle = white; ctx.font = instr_font; ctx.fillText("Here is a seed pattern",bounds.x+30,160); ctx.fillText("Use it as a template.",bounds.x+30,220); }
    i++;

    //free play
    levels.push(new level(i));
    levels[i].scale = 2;
    levels[i].repeat_x = 12;
    levels[i].repeat_y = 10;
    levels[i].bounds_w = 12;
    levels[i].bounds_h = 10;
    levels[i].scroll_w = 3;
    if(PERFECT)
    levels[i].scroll_w = (levels[i].bounds_w+2)*4/3-(levels[i].bounds_w+2);
    levels[i].lock_stars = levels[i-1].lock_stars+1;
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

    char_xs = [p(0,canv.width),p(0,canv.width),p(0,canv.width),p(0.02987012987012987,canv.width)];
    char_ys = [p(0.55,canv.height),p(0.55,canv.height),p(0.6,canv.height),p(0.5,canv.height)];
    char_ws = [p(0.2,canv.width),p(0.23,canv.width),p(0.23,canv.width),p(0.14675324675324675,canv.width)];
    char_hs = [p(0.4247159090909091,canv.height),p(0.4,canv.height),p(0.368,canv.height),p(0.4671875,canv.height)];
    char_ts = [0,0,0,0];
    quiz_char_ts = [0,0,0,0];

    char_imgs = [];
    char_imgs[CHAR_GIRL] = new Image();
    char_imgs[CHAR_GIRL].src = "assets/francis.png";
    char_imgs[CHAR_ANNOY] = new Image();
    char_imgs[CHAR_ANNOY].src = "assets/honey.png";
    char_imgs[CHAR_AXE] = new Image();
    char_imgs[CHAR_AXE].src = "assets/jack.png";
    char_imgs[CHAR_TALL] = new Image();
    char_imgs[CHAR_TALL].src = "assets/scout.png";

    quiz = new Quiz(self)

    click_aud = new Aud("assets/sound/click_0.wav");
    click_aud.load();
  }

  var set_level = function(i)
  {
    cur_level = levels[i];

    cur_level.intro = cur_level.has_intro;

    stamps = [];
    molecules = [];

    for(var i = 0; i < cur_level.seed.length; i++)
    {
      var s = new molecule();
      s.locked = true;
      s.cx = cur_level.seed[i].cx;
      s.cy = cur_level.seed[i].cy;
      s.wx = cur_level.seed[i].wx;
      s.wy = cur_level.seed[i].wy;
      s.setTemplate(cur_level.seed[i].template);
      s.up = false;
      s.up_ticks = 0;
      bring_to_bottom(s);
      molecules[molecules.length] = s;
    }

    dragging_molecule = 0;

    bounds = {wx:cur_level.bounds_x, wy:cur_level.bounds_y, ww:cur_level.bounds_w, wh:cur_level.bounds_h, x:0,y:0,w:0,h:0 };
    if(cur_level.bounds_w > cur_level.bounds_h)
    {
      //levels[i].scroll_w = (levels[i].bounds_w+2)*4/3-(levels[i].bounds_w+2);
      game_cam = {wx:cur_level.bounds_x-cur_level.scroll_w/2, wy:cur_level.bounds_y, ww:cur_level.bounds_w+2+cur_level.scroll_w, wh:cur_level.bounds_w+2 };
    }
    else
    {
      game_cam = {wx:cur_level.bounds_x-cur_level.scroll_w/2, wy:cur_level.bounds_y, ww:cur_level.bounds_w+2+cur_level.scroll_w, wh:cur_level.bounds_w+2 };
    }

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
    to.rotation = from.rotation;
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
    t.rotation = (t.rotation+1)%4;
  }
  var null_bounces = [];
  for(var i = 0; i < 100; i++)
  {
    null_bounces[i] = new bounce2();
  }
  var draw_blocks = function(wx,wy,offx,offy,bounces,happys,rot,scale,shadow,defect,seed,template)
  {
    var blocks = template.blocks;
    if(!bounces) bounces = null_bounces;

    screenSpace(cam,canv,dblock);

    var c = cos(-rot);
    var s = sin(-rot);
    var rx;
    var ry;
    var rx_c; //connection
    var ry_c;
    var oldww;
    var oldwh;

    //connections
    for(var i = 0; i < blocks.length; i++)
    {
      for(var j = i+1; j < blocks.length; j++)
      {
        if(
          (blocks[i].cx == blocks[j].cx && abs(blocks[i].cy-blocks[j].cy) == 1) ||
          (blocks[i].cy == blocks[j].cy && abs(blocks[i].cx-blocks[j].cx) == 1)
        )
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

          rx = dblock.x+dblock.w/2;
          ry = dblock.y+dblock.h/2;

          rx_c = blocks[j].cx-offx;
          ry_c = blocks[j].cy-offy;

          dblock.wx = rx_c*c - ry_c*s;
          dblock.wy = rx_c*s + ry_c*c;

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

          rx_c = dblock.x+dblock.w/2;
          ry_c = dblock.y+dblock.h/2;

          ctx.save();
          ctx.translate(((rx+bounces[i].vx)+(rx_c+bounces[j].vx))/2,((ry+bounces[i].vy)+(ry_c+bounces[j].vy))/2);
          var drot = atan2((ry_c+bounces[j].vy)-(ry+bounces[i].vy),(rx_c+bounces[j].vx)-(rx+bounces[i].vx));
          ctx.rotate(drot);
          var dist = len((ry_c+bounces[j].vy)-(ry+bounces[i].vy),(rx_c+bounces[j].vx)-(rx+bounces[i].vx));
          if(shadow || defect)
            ctx.drawImage(shadow_connection, -dist/2, -dblock.w/4, dist, dblock.w/2);
          else
            ctx.drawImage(connection, -dist/2, -dblock.w/4, dist, dblock.w/2);
          ctx.restore();
        }
      }
    }

    //atoms
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

      ctx.save();
      ctx.translate(dblock.x+bounces[i].vx+dblock.w/2, dblock.y+bounces[i].vy+dblock.h/2)
      ctx.rotate(rot);
      if(shadow || defect)
      {
        ctx.drawImage(shadow_atom, -dblock.w/2, -dblock.h/2, dblock.w, dblock.h);
      }
      else
      {
        if(happys)
        {
          var happy = clamp(-2,2,happys[i]);
          ctx.drawImage(atoms[happy+2], -dblock.w/2, -dblock.h/2, dblock.w, dblock.h);
        }
        else
        {
          ctx.drawImage(atoms[2], -dblock.w/2, -dblock.h/2, dblock.w, dblock.h);
        }
             if(blocks[i].c[0] > 0) ctx.drawImage(up_charge, -dblock.w/2, -dblock.h/2, dblock.w, dblock.h);
        else if(blocks[i].c[0] < 0) ctx.drawImage(un_charge, -dblock.w/2, -dblock.h/2, dblock.w, dblock.h);
             if(blocks[i].c[1] > 0) ctx.drawImage(rp_charge, -dblock.w/2, -dblock.h/2, dblock.w, dblock.h);
        else if(blocks[i].c[1] < 0) ctx.drawImage(rn_charge, -dblock.w/2, -dblock.h/2, dblock.w, dblock.h);
             if(blocks[i].c[2] > 0) ctx.drawImage(dp_charge, -dblock.w/2, -dblock.h/2, dblock.w, dblock.h);
        else if(blocks[i].c[2] < 0) ctx.drawImage(dn_charge, -dblock.w/2, -dblock.h/2, dblock.w, dblock.h);
             if(blocks[i].c[3] > 0) ctx.drawImage(lp_charge, -dblock.w/2, -dblock.h/2, dblock.w, dblock.h);
        else if(blocks[i].c[3] < 0) ctx.drawImage(ln_charge, -dblock.w/2, -dblock.h/2, dblock.w, dblock.h);
      }
      ctx.restore();
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
        x = molecule.cx+block.cx-bounds.wx+floor(bounds.ww/2-0.1);
        y = molecule.cy+block.cy-bounds.wy+floor(bounds.wh/2-0.1);
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
      score = 0;
      score_pack = 0;
      score_charge = 0;
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
              switch(cell_score)
              {
                case  1: score_pack += 1; break;
                case  5: score_pack += 1; score_charge += 4; break;
                case -5: score_pack += 1; score_charge -= 6; break;
              }
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
              switch(cell_score)
              {
                case  1: score_pack += 1; break;
                case  5: score_pack += 1; score_charge += 4; break;
                case -5: score_pack += 1; score_charge -= 6; break;
              }
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

    self.shouldClick = function(evt)
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
    self.click = function(evt){}

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
      dragStartTime = new Date().getTime();
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
    self.locked = false;

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
      if(self.locked) return false;
      var hit = false
      for(var i = 0; !hit && i < self.template.blocks.length; i++)
        hit = worldPtWithin(self.wx+self.template.blocks[i].cx,self.wy+self.template.blocks[i].cy,1.,1.,worldevt.wx+woffx,worldevt.wy+woffy);
      return hit;
    }
    self.shouldClick = function(evt)
    {
      if(self.locked) return false;
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
        rot_auds[rot_aud_i].play();
        rot_aud_i = (rot_aud_i+1)%rot_auds.length;
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
      if(self.locked) return false;
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
      if(self.locked) return false;
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
      dragStartTime = new Date().getTime();
      for(var i = 0; i < self.template.blocks.length; i++)
      {
        var block = self.template.blocks[i];
        x = self.cx+block.cx-bounds.wx+floor(bounds.ww/2-0.1);
        y = -(self.cy+block.cy-bounds.wy+floor(bounds.wh/2-0.1))+5;
        moleculeStartPos['coord_'+i] = {x, y};
      }
      score_board.populate();
      score_board.score();
      moleculeStartStab = {pack:score_pack, charge:score_charge};

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

      for(var i = 0; i < self.template.blocks.length; i++)
      {
        var block = self.template.blocks[i];
        x = self.cx+block.cx-bounds.wx+floor(bounds.ww/2-0.1);
        y = -(self.cy+block.cy-bounds.wy+floor(bounds.wh/2-0.1))+5;
        moleculeEndPos['coord_'+i] = {x, y};
      }
      setTimeout(function () {
        if (molecules.includes(self)) { // Make sure this molecule isn't being removed
          if ((self.target_rot == 0)) { // Check if the molecule is being rotated
            score_board.populate();
            score_board.score();
            moleculeEndStab = {pack:score_pack, charge:score_charge};
            dragEndTime = new Date().getTime();
            var dragTime = (dragEndTime - dragStartTime) / 1000;
  
            if (!moleculeStartStab) moleculeStartStab = {pack:0, charge:0}
            if (!moleculeStartPos) {
              moleculeStartPos = {};
              for(var i = 0; i < self.template.blocks.length; i++)
              {
                moleculeStartPos['coord_'+i] = {x:null, y:null};
              }
            }
            log_drag_molecule(moleculeStartPos, moleculeEndPos, dragTime, moleculeStartStab, moleculeEndStab);
          } else {
            numRotations++;
            moleculeStartRot = (self.template.rotation == 0) ? 3 : self.template.rotation - 1;
            moleculeEndRot = self.template.rotation;
            log_rotate_molecule(false, moleculeStartRot, moleculeEndRot, numRotations, moleculeStartStab, moleculeEndStab);
          }
        } else { /* log molecule remove? */ } 
      }, 200)
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
            {
              self.up = true;
            }
          }
      }
      for(var i = 0; !self.up && i < cur_level.defect.length; i++)
      {
        molecule = cur_level.defect[i];
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
            {
              self.up = true;
            }
          }
      }
      if(was_up && !self.up)
      {
        self.cx = cx;
        self.cy = cy;
        self.wx = cx-0.5;
        self.wy = cy-0.5;
        if(self.up_ticks > 8)
        {
          drop_auds[drop_aud_i].play();
          drop_aud_i = (drop_aud_i+1)%drop_auds.length;
        }
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
      draw_blocks(self.wx+woffx,self.wy+woffy,0,0,self.bounces,self.happys,self.rot,1,1,0,0,self.template);
      var t = (clamp(0,10,self.up_ticks-5)/10)*0.2;
      draw_blocks(self.wx+t+woffx,self.wy-t+woffy,0,0,self.bounces,self.happys,self.rot,1,0,0,0,self.template);
    }
    self.draw_off_down = function(woffx,woffy)
    {
      draw_blocks(self.wx+woffx,self.wy+woffy,0,0,self.bounces,self.happys,self.rot,1,0,0,self.locked,self.template);
    }
    self.draw_front_up = function()
    {
      if(self.up) self.draw_off_up(0,0);
    }
    self.draw_front_down = function()
    {
      if(!self.up) self.draw_off_down(0,0);
    }
    self.draw_behind_up = function(n)
    {
      if(self.up)
      {
        var ox = cur_level.repeat_x;
        var oy = cur_level.repeat_y;
        var x;
        var y;

        //top left
        for(x = 0; x < n; x++)
          for(y = 0; y < n; y++)
            self.draw_off_up((-n+x)*ox,(-n+y)*oy);

        //top
        for(y = 0; y < n; y++)
          self.draw_off_up(0,(-n+y)*oy);

        //top right
        for(x = 0; x < n; x++)
          for(y = 0; y < n; y++)
            self.draw_off_up((x+1)*ox,(-n+y)*oy);

        //right
        for(x = 0; x < n; x++)
          self.draw_off_up((x+1)*ox,0);

        //bottom right
        for(x = 0; x < n; x++)
          for(y = 0; y < n; y++)
            self.draw_off_up((x+1)*ox,(y+1)*oy);

        //bottom
        for(y = 0; y < n; y++)
          self.draw_off_up(0,(y+1)*oy);

        //bottom left
        for(x = 0; x < n; x++)
          for(y = 0; y < n; y++)
            self.draw_off_up((-n+x)*ox,(y+1)*oy);

        //left
        for(x = 0; x < n; x++)
          self.draw_off_up((-n+x)*ox,0);
      }
    }
    self.draw_behind_down = function(n)
    {
      if(!self.up)
      {
        var ox = cur_level.repeat_x;
        var oy = cur_level.repeat_y;
        var x;
        var y;

        //top left
        for(x = 0; x < n; x++)
          for(y = 0; y < n; y++)
            self.draw_off_down((-n+x)*ox,(-n+y)*oy);

        //top
        for(y = 0; y < n; y++)
          self.draw_off_down(0,(-n+y)*oy);

        //top right
        for(x = 0; x < n; x++)
          for(y = 0; y < n; y++)
            self.draw_off_down((x+1)*ox,(-n+y)*oy);

        //right
        for(x = 0; x < n; x++)
          self.draw_off_down((x+1)*ox,0);

        //bottom right
        for(x = 0; x < n; x++)
          for(y = 0; y < n; y++)
            self.draw_off_down((x+1)*ox,(y+1)*oy);

        //bottom
        for(y = 0; y < n; y++)
          self.draw_off_down(0,(y+1)*oy);

        //bottom left
        for(x = 0; x < n; x++)
          for(y = 0; y < n; y++)
            self.draw_off_down((-n+x)*ox,(y+1)*oy);

        //left
        for(x = 0; x < n; x++)
          self.draw_off_down((-n+x)*ox,0);
      }
    }
  }

  var template = function(cx,cy,blocks)
  {
    var self = this;
    self.cx = cx;
    self.cy = cy;
    self.blocks = blocks;
    self.rotation = 0;
  }

  var defect = function(cx,cy,template)
  {
    var self = this;
    self.template = template;
    self.cx = cx;
    self.cy = cy;
    self.wx = cx-0.5;
    self.wy = cy-0.5;
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
        rot_auds[rot_aud_i].play();
        self.base_rot = self.rot;
        self.target_rot += halfpi;
        if(self.target_rot >= twopi-0.001) self.target_rot = 0;
        self.rot_ticks = 0;

        numRotations++;
        moleculeStartRot = (self.template.rotation == 0) ? 3 : self.template.rotation - 1;
        moleculeEndRot = self.template.rotation;
        if (!moleculeStartStab) moleculeStartStab = {pack:0, charge:0}
        if (!moleculeEndStab) moleculeEndStab = {pack:0, charge:0}
        log_rotate_molecule(true, moleculeStartRot, moleculeEndRot, numRotations, moleculeStartStab, moleculeEndStab);
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
      draw_blocks(self.wx,self.wy-scroll.scroll_wy,self.template.cx,self.template.cy,0,0,self.rot,1,0,0,0,self.template);
    }
  }

  var readied = false;
  self.ready = function()
  {
    if(readied)
    {
      clicker.flush();
      dragger.flush();
      hoverer.flush();
      return;
    }
    readied = true;
    clicker = new Clicker({source:stage.dispCanv.canvas});
    dragger = new Dragger({source:stage.dispCanv.canvas});
    hoverer = new Hoverer({source:stage.dispCanv.canvas});

    quiz_t = 0;
    n_ticks = 0;
    total_stars = 0;
    score = 0;
    submitting_t = -1;
    museum_t = -1;
    museum_tab_t = 9999;

    score_board = new board();
    stamps = [];
    molecules = [];

    game_cam = { wx:-20, wy:0, ww:12, wh:8 };
    menu_cam = { wx:-20, wy:0, ww:8, wh:6 };
    cam = { wx:menu_cam.wx, wy:menu_cam.wy, ww:menu_cam.ww, wh:menu_cam.wh };
    game_bg_cam = { wx:0.5, wy:0, ww:1, wh:1 };
    menu_bg_cam = { wx:-0.5, wy:0, ww:1, wh:1 };
    bg_cam = { wx:menu_bg_cam.wx, wy:menu_bg_cam.wy, ww:menu_bg_cam.ww, wh:menu_bg_cam.wh };
    bounds = {wx:0, wy:0, ww:0, wh:0, x:0,y:0,w:0,h:0 };

    bgbox = {x:0,y:0,w:0,h:0,wx:0,wy:0,ww:2,wh:1}
    screenSpace(bg_cam,canv,bgbox);

    init_levels();
    loadLevelStars();
    set_level(0);

    mode = MODE_MENU;

    total_stars_disp = new totalStarsDisplay();
    total_stars_disp.wx = levels[0].button.wx-1.5;
    total_stars_disp.wy = levels[0].button.wy+0.5;
    total_stars_disp.ww = 0.1;
    total_stars_disp.wh = 0.1;

    outro = new star_outro();

    back_btn = {wx:0,wy:0,ww:0,wh:0,x:0,y:0,w:0,h:0};
    back_btn.click = function(evt) { 
      // Log back to menu
      var log_data =
      {
        level:cur_level.id,
        event:"CUSTOM",
        event_custom:7, // "BACK_TO_MENU"
        event_data_complex:{
          event_custom:"BACK_TO_MENU",
        }
      };
      
      log_data.event_data_complex = JSON.stringify(log_data.event_data_complex);
      //console.log(log_data);
      window.mySlog.log(log_data);
      mode = MODE_MENU; 
      countLevelStars(); 
      evt.hitUI = true; }

    clear_btn = {wx:0,wy:0,ww:0,wh:0,x:0,y:0,w:0,h:0};
    clear_btn.click = function(evt)
    {
      numClears++;
      score_board.populate();
      score_board.score();
      var clearStability = {pack:score_pack, charge:score_charge};
      log_clear_press(clearStability);

      for(var i = 0; i < molecules.length ;)
      {
        if(molecules[i].locked) i++;
        else molecules.splice(i,1);
        dragging_molecule = 0;
      }
    }
    clear_btn.ww = game_cam.ww/5;

    submit_btn = {wx:0,wy:0,ww:0,wh:0,x:0,y:0,w:0,h:0};
    submit_btn.click = function(evt) {
      score_board.populate();
      score_board.score();
      var growStability = {pack:score_pack, charge:score_charge};
      log_grow_press(growStability);

      mode = MODE_SUBMIT;
      grow_aud.play();
      submitting_t = 0;
      var old_total = total_stars; 
      countLevelStars();
      var new_total = total_stars;
      total_stars = old_total; 
      if(floor(new_total/3) > floor(old_total/3) && (floor(new_total/3)-1) < crystal_titles.length)
        outro.unlocked = (floor(new_total/3)-1); evt.hitUI = true;
    }

    museum_btn = {wx:0,wy:0,ww:0,wh:0,x:0,y:0,w:0,h:0};
    museum_btn.click = function(evt) {
      if(mode == MODE_MENU) {
        museumTimeOpened = new Date().getTime();
        mode = MODE_MUSEUM;
        museum_t = 0;
      } else {
        museumTimeClosed = new Date().getTime();
        museumTotalTime += ((museumTimeClosed - museumTimeOpened)/1000)
        log_museum_close();
        mode = MODE_MENU;
      }
        evt.hitUI = true;
    }

    museum = {x:0,y:0,w:0,h:0,wx:0,wy:0,ww:0,wh:0};
    museum.click = function(evt) {
      museumTimeClosed = new Date().getTime();
      museumTotalTime += ((museumTimeClosed - museumTimeOpened)/1000)
      log_museum_close();
      mode = MODE_MENU;
      evt.hitUI = true;
    }

    museum_btn.ww = menu_cam.ww/10;
    museum_btn.wh = menu_cam.wh/10;
    museum_btn.wx = menu_cam.wx+menu_cam.ww/2-museum_btn.ww/2;
    museum_btn.wy = menu_cam.wy+menu_cam.wh/2-museum_btn.wh;
    screenSpace(cam,canv,museum_btn);

    museum.ww = menu_cam.ww*2/3;
    museum.wh = menu_cam.wh;
    museum.wx = menu_cam.wx+menu_cam.ww/2+museum.ww/2;
    museum.wy = menu_cam.wy;
    screenSpace(cam,canv,museum);

    cur_stars_bounce = new bounce();
    score_bounce = new bounce();
  }

  var popQuiz = function()
  {
    if(cur_level.quiz && !cur_level.quiz_seen)
    {
      quiz.loadQuiz(cur_level.quiz, canv);
      mode = MODE_QUIZ;
      cur_level.quiz_seen = true;
    }
    else
      mode = MODE_MENU;
  }

  self.tick = function()
  {
    n_ticks++;
    lvl_auds_should_play--;
    if(lvl_auds_should_play < 0) lvl_auds_should_play = 0;
    if(lvl_auds_should_play == 1 && lvl_auds[cur_level.id])
    {
      lvl_auds[cur_level.id].play();
    }

    //lerp cam
    if(mode == MODE_MENU || mode == MODE_MUSEUM)
    {
      cam.wx = lerp(cam.wx,menu_cam.wx,0.1);
      cam.wy = lerp(cam.wy,menu_cam.wy,0.1);
      cam.ww = lerp(cam.ww,menu_cam.ww,0.1);
      cam.wh = lerp(cam.wh,menu_cam.wh,0.1);
      bg_cam.wx = lerp(bg_cam.wx,menu_bg_cam.wx,0.1);
      bg_cam.wy = lerp(bg_cam.wy,menu_bg_cam.wy,0.1);
      bg_cam.ww = lerp(bg_cam.ww,menu_bg_cam.ww,0.1);
      bg_cam.wh = lerp(bg_cam.wh,menu_bg_cam.wh,0.1);
    }
    if(mode == MODE_GAME || mode == MODE_INTRO)
    {
      cam.wx = lerp(cam.wx,game_cam.wx,0.1);
      cam.wy = lerp(cam.wy,game_cam.wy,0.1);
      cam.ww = lerp(cam.ww,game_cam.ww,0.1);
      cam.wh = lerp(cam.wh,game_cam.wh,0.1);
      bg_cam.wx = lerp(bg_cam.wx,game_bg_cam.wx,0.1);
      bg_cam.wy = lerp(bg_cam.wy,game_bg_cam.wy,0.1);
      bg_cam.ww = lerp(bg_cam.ww,game_bg_cam.ww,0.1);
      bg_cam.wh = lerp(bg_cam.wh,game_bg_cam.wh,0.1);
    }
    if(mode == MODE_SUBMIT || mode == MODE_QUIZ)
    {
      var t = min(1,submitting_t/(star_outro_sub_slide+star_outro_sub_star+star_outro_sub_zoom));
      cam.wx = lerp(cam.wx,game_cam.wx,0.1);
      cam.wy = lerp(cam.wy,game_cam.wy,0.1);
      cam.ww = lerp(cam.ww,game_cam.ww*(1+t*3),0.1);
      cam.wh = lerp(cam.wh,game_cam.wh*(1+t*3),0.1);
    }

    screenSpace(bg_cam,canv,bgbox);

    //screen space based on new cam
    screenSpace(cam,canv,bounds);
    screenSpace(cam,canv,scroll);
    screenSpace(cam,canv,total_stars_disp);

    for(var i = 0; i < levels.length; i++)
    {
      screenSpace(cam,canv,levels[i].button);
    }
    screenSpace(cam,canv,bounds);
    screenSpace(cam,canv,scroll);

    back_btn.ww = game_cam.ww/10;
    back_btn.wh = game_cam.wh/20;
    back_btn.wx = game_cam.wx-game_cam.ww/2+back_btn.ww/2+0.1;
    back_btn.wy = game_cam.wy+game_cam.wh/2-back_btn.wh;
    screenSpace(cam,canv,back_btn);

    clear_btn.ww = back_btn.ww;
    clear_btn.wh = back_btn.wh;
    clear_btn.wx = back_btn.wx+back_btn.ww+game_cam.ww/100;
    clear_btn.wy = back_btn.wy;
    screenSpace(cam,canv,clear_btn);

    submit_btn.ww = back_btn.ww*2;
    submit_btn.wh = back_btn.wh;
    submit_btn.wx = game_cam.wx-game_cam.ww/2+submit_btn.ww/2+0.1;
    submit_btn.wy = game_cam.wy-game_cam.wh/2+submit_btn.wh;
    screenSpace(cam,canv,submit_btn);

    //resolve input
    if(mode == MODE_INTRO)
    {
      clicker.filter(cur_level);
      if(!cur_level.introtick()) mode = MODE_GAME;
    }

    if(mode == MODE_GAME)
    {
      clicker.filter(back_btn);
      clicker.filter(clear_btn);
      clicker.filter(submit_btn);
      for(var i = 0; i < stamps.length; i++)
        clicker.filter(stamps[i]);
      dragger.filter(scroll);
      clicker.filter(scroll);
      for(var i = 0; i < molecules.length; i++)
        clicker.filter(molecules[i]);
      for(var i = 0; i < molecules.length; i++)
        dragger.filter(molecules[i]);
    }
    else if(mode == MODE_MENU)
    {
      for(var i = 0; i < levels.length; i++)
        clicker.filter(levels[i].button);
      clicker.filter(museum_btn);
    }
    else if (mode == MODE_MUSEUM)
    {
      clicker.filter(museum);
      clicker.filter(museum_btn);
    }
    else if(mode == MODE_SUBMIT)
    {
      //if(submitting_t > star_outro_sub_slide+star_outro_sub_star+star_outro_sub_zoom)
      clicker.filter(outro);
      hoverer.filter(outro.ibox_pack);
      hoverer.filter(outro.ibox_charge);
    }
    else if(mode == MODE_QUIZ)
    {
      clicker.filter(quiz);
    }

    clicker.flush();
    dragger.flush();
    hoverer.flush();

    //tick data
    for(var i = 0; i < molecules.length; i++)
      molecules[i].tick();
    for(var i = 0; i < stamps.length; i++)
      stamps[i].tick();
    scroll.tick();

    var old_score = score;
    score_board.populate();
    score_board.score();
    if(score != old_score)
      score_bounce.vel = 1;

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
    if(museum_t != -1)
    {
      if(mode == MODE_MUSEUM)
        museum_t++;
      else
        museum_t--;

      if(museum_t > 20) museum_t = 20;

      var t = (museum_t/20)
      t *= t;
      museum_btn.wx = lerp(menu_cam.wx+menu_cam.ww/2-museum_btn.ww/2,menu_cam.wx+menu_cam.ww/2-museum.ww-museum_btn.ww/2,t);
      museum.wx = lerp(menu_cam.wx+menu_cam.ww/2+museum.ww/2,menu_cam.wx+menu_cam.ww/2-museum.ww/2,t);
    }
    if(mode != MODE_MENU && mode != MODE_MUSEUM)
    {
      museum_tab_t = 0;
    }
    else
    {
      museum_tab_t++;
    }
    screenSpace(cam,canv,museum_btn);
    screenSpace(cam,canv,museum);

    var old_cur_stars = cur_level.cur_stars;
    cur_level.cur_stars = 0;
    if(score > cur_level.best) cur_level.best = score;
    for(var i = 0; i < 3; i++)
      if(score >= cur_level.star_req_score[i]) cur_level.cur_stars = i+1;
    if(cur_level.cur_stars > cur_level.stars)
    {
      cur_level.stars = cur_level.cur_stars;
      ga('send', 'event', 'crystal_level', 'complete', cur_level.id, cur_level.stars);
    }
    if(cur_level.cur_stars != old_cur_stars)
    {
      cur_level.cur_stars_t = 0;
      cur_stars_bounce.vel = 1;
    }
    cur_stars_bounce.tick();
    score_bounce.tick();
    cur_level.cur_stars_t++;
  };

  self.draw = function()
  {
    ctx.font = default_font;
    ctx.textAlign = "left";
    ctx.drawImage(bg,bgbox.x,bgbox.y,bgbox.w,bgbox.h);

    var sub_t = min(1,submitting_t/(star_outro_sub_slide+star_outro_sub_star+star_outro_sub_zoom));
    var quick_sub_t = min(1,submitting_t/star_outro_sub_slide);

    //grid
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

    ctx.fillStyle = grid_fill;
    if (mode != MODE_QUIZ) ctx.fillRect(bounds.x,bounds.y,bounds.w,bounds.h);
    ctx.strokeStyle = grid_stroke;

    wy = floor(min_wy/v_spacing)*v_spacing;
    if (mode != MODE_QUIZ) while(wy < max_wy)
    {
      y = screenSpaceY(cam,canv,wy);
      if(y > bounds.y && y < bounds.y+bounds.h)
      {
        ctx.beginPath();
        ctx.moveTo(bounds.x,y);
        ctx.lineTo(bounds.x+bounds.w,y);
        ctx.stroke();
      }
      wy += v_spacing;
    }

    wx = floor(min_wx/h_spacing)*h_spacing;
    if (mode != MODE_QUIZ) while(wx < max_wx)
    {
      x = screenSpaceX(cam,canv,wx);
      if(x > bounds.x && x < bounds.x+bounds.w)
      {
        ctx.beginPath();
        ctx.moveTo(x,bounds.y);
        ctx.lineTo(x,bounds.y+bounds.h);
        ctx.stroke();
      }
      wx += h_spacing;
    }

    var draw_n = 1;
    if(mode == MODE_SUBMIT || mode == MODE_QUIZ)
    {
      draw_n = round(0.5+sub_t*2);
      if(sub_t == 1) draw_n++;
    }

    //defects
    if (mode != MODE_QUIZ) for(var i = 0; i < cur_level.defect.length; i++)
      draw_blocks(cur_level.defect[i].wx,cur_level.defect[i].wy,0,0,0,0,0,1,1,1,0,cur_level.defect[i].template);

    //molecules back
    if (mode != MODE_QUIZ) for(var i = molecules.length-1; i >= 0; i--)
      molecules[i].draw_behind_down(draw_n);
      if (mode != MODE_QUIZ) for(var i = molecules.length-1; i >= 0; i--)
      molecules[i].draw_front_down();

    //borders
    ctx.fillStyle = bg_fill;
    if(bounds.w)
    {
      ctx.fillRect(0,0,canv.width,bounds.y);
      ctx.fillRect(0,bounds.y,bounds.x,bounds.h);
      ctx.fillRect(bounds.x+bounds.w,bounds.y,canv.width-(bounds.x+bounds.w),bounds.h);
      ctx.fillRect(0,bounds.y+bounds.h,canv.width,bounds.y);
    }
    else
      ctx.fillRect(0,0,canv.width,canv.height);

    ctx.strokeStyle = bounds_stroke;
    ctx.lineWidth = 2;
    if (mode != MODE_QUIZ) ctx.strokeRect(bounds.x,bounds.y,bounds.w,bounds.h);

    //molecules front
    if (mode != MODE_QUIZ) for(var i = molecules.length-1; i >= 0; i--)
      molecules[i].draw_behind_up(draw_n);

    //scroll
    if(mode == MODE_SUBMIT || mode == MODE_QUIZ)
      ctx.globalAlpha = (1-quick_sub_t);

    ctx.fillStyle = scroll_fill;
    ctx.fillRect(scroll.x,scroll.y,scroll.w,scroll.h);
    for(var i = 0; i < stamps.length; i++)
      stamps[i].draw();

    ctx.globalAlpha = 1;

    //the rest of molecules front
    for(var i = molecules.length-1; i >= 0; i--)
      molecules[i].draw_front_up();

    if(mode == MODE_SUBMIT || mode == MODE_QUIZ)
      ctx.globalAlpha = (1-quick_sub_t);

    if (mode != MODE_QUIZ) {
      //UI
      ctx.strokeStyle = white;
      strokeRBox(back_btn,20,ctx);
      strokeRBox(clear_btn,20,ctx);

      ctx.fillStyle = white;
      fillRBox(submit_btn,20,ctx);
      ctx.font = default_font;
      ctx.fillStyle = white;
      ctx.fillText("Crystal Stability: ",scroll.x+13,scroll.y+115);
      var oldfont = ctx.font;
      ctx.font = (20+10*score_bounce.v)+"px Architects Daughter";
      ctx.fillText(score,scroll.x+175,scroll.y+115);
      ctx.font = oldfont;
      ctx.fillText("< Menu",back_btn.x+10,back_btn.y+back_btn.h/2+10);
      ctx.fillText("Clear",clear_btn.x+10+5,clear_btn.y+clear_btn.h/2+10);
      ctx.fillStyle = black;
      ctx.fillText("Grow Crystal",submit_btn.x+10+5,submit_btn.y+submit_btn.h/2+10);
  
      var b = cur_stars_bounce.v*10;
      var y = scroll.y+70-b/2;
      for(var i = 0; i < 3; i++)
      {
        if(cur_level.cur_stars > i)
          ctx.drawImage(star_full,scroll.x+65+30*i-b/2,y,20+b,20+b);
        else
          ctx.drawImage(star     ,scroll.x+65+30*i,y+b/2,20,20);
      }
    }

    //ctx.fillText("Choose a   ^",levels[0].button.x-100,levels[0].button.y+125);
    //ctx.fillText("|",levels[0].button.x+4,levels[0].button.y+135);
    //ctx.fillText("Molecule --",levels[0].button.x-100,levels[0].button.y+150);
    for(var i = 0; i < levels.length; i++)
      levels[i].button.draw();

    ctx.globalAlpha = 1;

    if(mode == MODE_SUBMIT)
      outro.draw();
    if(mode == MODE_INTRO)
      cur_level.introdraw();
    if(mode == MODE_QUIZ)
      quiz_t = lerp(quiz_t,1,0.1);
    else
    {
      quiz_t = lerp(quiz_t,0,0.1);
      for(var i = 0; i < quiz_char_ts.length; i++)
        quiz_char_ts[i] = lerp(quiz_char_ts[i],0,0.1);
    }
    quiz.draw(canv);

    if (mode == MODE_MENU || mode == MODE_MUSEUM) {
      total_stars_disp.draw();
      ctx.drawImage(logo_img,levels[0].button.x,levels[0].button.y-100,levels[0].button.w*3.5,logo_img.height*(levels[0].button.w*3.5/logo_img.width));
    }
    
    if(museum_t != -1)
    {
      ctx.drawImage(museum_img,museum_btn.x-30,museum.y-45,museum_btn.w+museum.w+80,museum.h+90);
      for(var i = 0; i < 3; i++)
      {
        for(var j = 0; j < 3; j++)
        {
          var index = i*3+j;
          ctx.fillStyle = black;
          if(index < crystal_imgs.length)
          {
            if(total_stars >= (index+1)*3)
            {
              var h = 160;
              var w = crystal_imgs[index].width*(h/crystal_imgs[index].height);
              ctx.drawImage(crystal_imgs[index], museum.x+105+j*190-w/2, museum.y+185+i*175-h/2, w, h);
              ctx.font = "20px Roboto Mono";
              ctx.textAlign = "center";
              //ctx.fillText(crystal_titles[index], museum.x+30+j*190+75, museum.y+130+i*180+135);
              //ctx.fillRect(museum.x+30+j*190, museum.y+130+i*180, 150,140);
            }
            else
            {
            /*
              ctx.drawImage(star_full,museum.x+30+j*190,museum.y+130+i*180,40,40);
              ctx.font = default_font;
              ctx.textAlign = "left";
              ctx.fillText("X"+(index+1)*3,museum.x+30+j*190+45,museum.y+130+i*180+30);
            */
            }
          }
        }
      }
      ctx.drawImage(tab_close_img,museum.x-60,museum.y+50,40,40);
      ctx.font = default_font;
    }
    else
    {
      var mint = 80;
      var maxt = 100;
      if(museum_tab_t > mint)
      {
        if(museum_tab_t > maxt) museum_tab_t = maxt;
        var t = mapVal(mint,maxt,1,0,museum_tab_t);
        ctx.drawImage(museum_img, 0,0,museum_btn.w+80,museum_img.height, museum_btn.x-25+t*100,museum.y-45,museum_btn.w+30,museum.h+90);
        ctx.drawImage(tab_crystal_img,museum.x-60+t*100,museum.y+50,40,40);
      }
    }

    if(mode == MODE_SUBMIT)
    {
      if(outro.ibox_pack.hovering)
      {
        ctx.fillStyle = white;
        ctx.strokeStyle = bluish;
        var w = 440;
        var h = 60;
        fillR(outro.ibox_pack.x-w/2,outro.ibox_pack.y,w,h,10,ctx);
        strokeR(outro.ibox_pack.x-w/2,outro.ibox_pack.y,w,h,10,ctx);
        ctx.fillStyle = bluish;
        ctx.fillText("+1 for every neighboring atom",outro.ibox_pack.x-w/2+10,outro.ibox_pack.y+40)
      }
      if(outro.ibox_charge.hovering)
      {
        ctx.fillStyle = white;
        ctx.strokeStyle = bluish;
        var w = 400;
        var h = 100;
        fillR(outro.ibox_charge.x-w/2,outro.ibox_charge.y,w,h,10,ctx);
        strokeR(outro.ibox_charge.x-w/2,outro.ibox_charge.y,w,h,10,ctx);
        ctx.fillStyle = bluish;
        ctx.fillText("+4 for balanced charge,",outro.ibox_charge.x-w/2+10,outro.ibox_charge.y+40)
        ctx.fillText("-6 for unbalanced charge",outro.ibox_charge.x-w/2+10,outro.ibox_charge.y+80)
      }
    }
  };

  self.cleanup = function()
  {
  };

};

