export function easeOutBack (t, b, c, d, s) {
  if (s == undefined) s = 1.70158;
  return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
}

export function easeOutCirc (t, b, c, d) {
  return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
}

export function arrowAnimation (t, c, d) {
  if (t / d <= 0.35) return (c / (0.35 * d)) * t
  else if (t / d <= 0.7) return -(c / (0.35 * d)) * t + 2 * c
  else return 0
}

export function locationAnimation (t, c, d) {
  if (t / d <= 0.25) return (c / (0.25 * d)) * t
  else if (t / d <= 0.75) return c
  else if (t / d < 1) return (c / (0.25 * d)) * (d - t)
  else return 0
}

export function titleCase(s) {
  if (!s) return ""
  return s.toLowerCase().split(/\s+/).map(function(item, index) {
      return item.slice(0, 1).toUpperCase() + item.slice(1);
  }).join(" ");
}

export function getCentroid (coordsStr) {
  const coordsArr = coordsStr.split(",");
  const coordsArrLength = coordsArr.length;
  const vertexArr = [];

  for (let i=0; i<coordsArrLength; i=i+2) {
    if (coordsArr[i]!=""&&coordsArr[i+1]!="") {
      vertexArr.push({
        x: parseInt(coordsArr[i]),
        y: parseInt(coordsArr[i+1]),
      });
    }
  }

  const vertexArrLength = vertexArr.length;
  let subAreaSum = 0;
  let subCentroidXSum = 0;
  let subCentroidYSum = 0;

  for(let i=2; i<vertexArrLength; i++){
    const p0 = vertexArr[0];
    const p1 = vertexArr[i-1];
    const p2 = vertexArr[i];
    const subArea = (p0.x*p1.y + p1.x*p2.y + p2.x*p0.y - p1.x*p0.y - p2.x*p1.y - p0.x*p2.y)/2;
    const subCentroidX = (p0.x+p1.x+p2.x)/3;
    const subCentroidY = (p0.y+p1.y+p2.y)/3;

    subAreaSum += subArea;
    subCentroidXSum += subCentroidX*subArea;
    subCentroidYSum += subCentroidY*subArea;
  }

  return {
    x: 	subCentroidXSum/subAreaSum,
    y: 	subCentroidYSum/subAreaSum,
  }
}

/* http://www.dbp-consulting.com/tutorials/canvas/CanvasArrow.html */
function drawHead(ctx,x0,y0,x1,y1,x2,y2,style) {
  'use strict';
  if(typeof(x0)=='string') x0=parseInt(x0);
  if(typeof(y0)=='string') y0=parseInt(y0);
  if(typeof(x1)=='string') x1=parseInt(x1);
  if(typeof(y1)=='string') y1=parseInt(y1);
  if(typeof(x2)=='string') x2=parseInt(x2);
  if(typeof(y2)=='string') y2=parseInt(y2);
  var radius=3;
  var twoPI=2*Math.PI;

  // all cases do this.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0,y0);
  ctx.lineTo(x1,y1);
  ctx.lineTo(x2,y2);
  switch(style){
    case 0:
      // curved filled, add the bottom as an arcTo curve and fill
      var backdist=Math.sqrt(((x2-x0)*(x2-x0))+((y2-y0)*(y2-y0)));
      ctx.arcTo(x1,y1,x0,y0,.55*backdist);
      ctx.fill();
      break;
    case 1:
      // straight filled, add the bottom as a line and fill.
      ctx.beginPath();
      ctx.moveTo(x0,y0);
      ctx.lineTo(x1,y1);
      ctx.lineTo(x2,y2);
      ctx.lineTo(x0,y0);
      ctx.fill();
      break;
    case 2:
      // unfilled head, just stroke.
      ctx.stroke();
      break;
    case 3:
      //filled head, add the bottom as a quadraticCurveTo curve and fill
      var cpx=(x0+x1+x2)/3;
      var cpy=(y0+y1+y2)/3;
      ctx.quadraticCurveTo(cpx,cpy,x0,y0);
      ctx.fill();
      break;
    case 4:
      //filled head, add the bottom as a bezierCurveTo curve and fill
      var cp1x, cp1y, cp2x, cp2y,backdist;
      var shiftamt=5;
      if(x2==x0){
        // Avoid a divide by zero if x2==x0
        backdist=y2-y0;
        cp1x=(x1+x0)/2;
        cp2x=(x1+x0)/2;
        cp1y=y1+backdist/shiftamt;
        cp2y=y1-backdist/shiftamt;
            }else{
        backdist=Math.sqrt(((x2-x0)*(x2-x0))+((y2-y0)*(y2-y0)));
        var xback=(x0+x2)/2;
        var yback=(y0+y2)/2;
        var xmid=(xback+x1)/2;
        var ymid=(yback+y1)/2;

        var m=(y2-y0)/(x2-x0);
        var dx=(backdist/(2*Math.sqrt(m*m+1)))/shiftamt;
        var dy=m*dx;
        cp1x=xmid-dx;
        cp1y=ymid-dy;
        cp2x=xmid+dx;
        cp2y=ymid+dy;
      }

      ctx.bezierCurveTo(cp1x,cp1y,cp2x,cp2y,x0,y0);
      ctx.fill();
      break;
  }
  ctx.restore();
};

export function drawArrow(ctx,x1,y1,x2,y2,style,which,angle,d) {
  'use strict';
  // Ceason pointed to a problem when x1 or y1 were a string, and concatenation
  // would happen instead of addition
  if(typeof(x1)=='string') x1=parseInt(x1);
  if(typeof(y1)=='string') y1=parseInt(y1);
  if(typeof(x2)=='string') x2=parseInt(x2);
  if(typeof(y2)=='string') y2=parseInt(y2);
  style=typeof(style)!='undefined'? style:3;
  which=typeof(which)!='undefined'? which:1; // end point gets arrow
  angle=typeof(angle)!='undefined'? angle:Math.PI/8;
  d    =typeof(d)    !='undefined'? d    :10;
  // default to using drawHead to draw the head, but if the style
  // argument is a function, use it instead
  var toDrawHead=typeof(style)!='function'?drawHead:style;

  // For ends with arrow we actually want to stop before we get to the arrow
  // so that wide lines won't put a flat end on the arrow.
  //
  // var dist=Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
  // var ratio=(dist-d/3)/dist;
  // var tox, toy,fromx,fromy;
  // if(which&1){
  //   tox=Math.round(x1+(x2-x1)*ratio);
  //   toy=Math.round(y1+(y2-y1)*ratio);
  // }else{
  //   tox=x2;
  //   toy=y2;
  // }
  // if(which&2){
  //   fromx=x1+(x2-x1)*(1-ratio);
  //   fromy=y1+(y2-y1)*(1-ratio);
  // }else{
  //   fromx=x1;
  //   fromy=y1;
  // }

  // Draw the shaft of the arrow
  // ctx.beginPath();
  // ctx.moveTo(fromx,fromy);
  // ctx.lineTo(tox,toy);
  // ctx.stroke();

  // calculate the angle of the line
  var lineangle=Math.atan2(y2-y1,x2-x1);
  // h is the line length of a side of the arrow head
  var h=Math.abs(d/Math.cos(angle));

  // if(which&1){	// handle far end arrow head
  if (which === 1) {
    var angle1=lineangle+Math.PI+angle;
    var topx=x2+Math.cos(angle1)*h;
    var topy=y2+Math.sin(angle1)*h;
    var angle2=lineangle+Math.PI-angle;
    var botx=x2+Math.cos(angle2)*h;
    var boty=y2+Math.sin(angle2)*h;
    toDrawHead(ctx,topx,topy,x2,y2,botx,boty,style);
  }
  // if(which&2){ // handle near end arrow head
  if (which === 0) {
    var angle1=lineangle+angle;
    var topx=x1+Math.cos(angle1)*h;
    var topy=y1+Math.sin(angle1)*h;
    var angle2=lineangle-angle;
    var botx=x1+Math.cos(angle2)*h;
    var boty=y1+Math.sin(angle2)*h;
    toDrawHead(ctx,topx,topy,x1,y1,botx,boty,style);
  }
}
