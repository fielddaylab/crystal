#!/bin/bash

#mkdir bordered
#for i in *.png; do pixql_c -i $i -o bordered/$i -q "SELECT WHERE COL = 0 OR ROW = 0 OR COL = WIDTH-1 OR ROW = HEIGHT-1; OPERATE SET r = 255; OPERATE SET g = 0;"; done
#mkdir bordered/ping
#mkdir bordered/pong
#for i in bordered/*.png; do pixql_c -i $i -o `echo $i | sed s@bordered@bordered/ping@` -q "SELECT WHERE IN[COL,ROW-1].r = 255 AND IN[COL,ROW-1].g = 0 AND g > 0 AND r > 20; OPERATE SET r = 255; OPERATE SET g = 0;"; done

#rm bordered/pong/*; for i in bordered/ping/*.png; do pixql_c -i $i -o `echo $i | sed s/ping/pong/` -q "SELECT WHERE IN[COL,ROW-1].r = 255 AND IN[COL,ROW-1].g = 0 AND g > 0 AND r > 20; OPERATE SET r = 255; OPERATE SET g = 0;"; done
#rm bordered/ping/*; for i in bordered/pong/*.png; do pixql_c -i $i -o `echo $i | sed s/pong/ping/` -q "SELECT WHERE IN[COL,ROW-1].r = 255 AND IN[COL,ROW-1].g = 0 AND g > 0 AND r > 20; OPERATE SET r = 255; OPERATE SET g = 0;"; done
#rm bordered/pong/*; for i in bordered/ping/*.png; do pixql_c -i $i -o `echo $i | sed s/ping/pong/` -q "SELECT WHERE IN[COL,ROW+1].r = 255 AND IN[COL,ROW+1].g = 0 AND g > 0 AND r > 20; OPERATE SET r = 255; OPERATE SET g = 0;"; done
#rm bordered/ping/*; for i in bordered/pong/*.png; do pixql_c -i $i -o `echo $i | sed s/pong/ping/` -q "SELECT WHERE IN[COL,ROW+1].r = 255 AND IN[COL,ROW+1].g = 0 AND g > 0 AND r > 20; OPERATE SET r = 255; OPERATE SET g = 0;"; done
#rm bordered/pong/*; for i in bordered/ping/*.png; do pixql_c -i $i -o `echo $i | sed s/ping/pong/` -q "SELECT WHERE IN[COL-1,ROW].r = 255 AND IN[COL-1,ROW].g = 0 AND g > 0 AND r > 20; OPERATE SET r = 255; OPERATE SET g = 0;"; done
#rm bordered/ping/*; for i in bordered/pong/*.png; do pixql_c -i $i -o `echo $i | sed s/pong/ping/` -q "SELECT WHERE IN[COL-1,ROW].r = 255 AND IN[COL-1,ROW].g = 0 AND g > 0 AND r > 20; OPERATE SET r = 255; OPERATE SET g = 0;"; done
#rm bordered/pong/*; for i in bordered/ping/*.png; do pixql_c -i $i -o `echo $i | sed s/ping/pong/` -q "SELECT WHERE IN[COL+1,ROW].r = 255 AND IN[COL+1,ROW].g = 0 AND g > 0 AND r > 20; OPERATE SET r = 255; OPERATE SET g = 0;"; done
#rm bordered/ping/*; for i in bordered/pong/*.png; do pixql_c -i $i -o `echo $i | sed s/pong/ping/` -q "SELECT WHERE IN[COL+1,ROW].r = 255 AND IN[COL+1,ROW].g = 0 AND g > 0 AND r > 20; OPERATE SET r = 255; OPERATE SET g = 0;"; done

#for i in bordered/ping/*.png; do pixql_c -i $i -o `echo $i | sed s@bordered/ping@fixed@` -q "SELECT WHERE r = 255 AND g = 0; OPERATE SET r = 0; OPERATE SET g = 0; OPERATE SET a = 255-b; OPERATE SET b = 0;"; done

