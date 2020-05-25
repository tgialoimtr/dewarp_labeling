var ImgWarper = ImgWarper || {};

ImgWarper.GridDefiner = function(canvas, image, rightcanvas, imgData, guidelines=[]) {
    this.guidelines = guidelines;
    this.neighbour_threshold = 20;
    console.log(canvas.width + 'xx' + canvas.height);
    console.log(rightcanvas.width + 'xx' + rightcanvas.height);
    console.log(imgData.width + 'xx' + imgData.height);
    //set up points for change; 
    var c = canvas;
    this.canvas = canvas;
    this.rightcanvas = rightcanvas;
    this.imgData = imgData;
    var that = this;
    this.dragging_ = false;
    this.computing_ = false;
    $(c).unbind();
    $(c).bind('mousedown', function (e) { that.touchStart(e); });
    $(c).bind('mousemove', function (e) { that.touchDrag(e); });
    $(c).bind('mouseup', function (e) { that.touchEnd(e); });
    $(c).bind('mouseout', function (e) { that.touchEnd(e); });
    this.currentLineIdx = -1;
    this.currentPointIdx = -1;
    this.redrawAll();
}
  
  
ImgWarper.GridDefiner.prototype.touchStart = function(e) {
    var startX = (e.offsetX || e.clientX - $(e.target).offset().left);
    var startY = (e.offsetY || e.clientY - $(e.target).offset().top);
    startX = startX / e.target.clientWidth * e.target.width;
    startY = startY / e.target.clientHeight * e.target.height;
    var q = new ImgWarper.Point(startX, startY);
    console.log(startX + ',' + startY);
    if (e.ctrlKey) { // start if head or tail or nothing
        var idx = this.getCurrentPointIndex(q);  
        if (idx != null) {
            this.currentLineIdx = idx[0];
            this.currentPointIdx = idx[1];
            this.guidelines[this.currentLineIdx].push(q);
            this.currentPointIdx = this.guidelines[this.currentLineIdx].length - 1;
            this.dragging_ = true;
            //console.log('1Ctrl ' + this.currentLineIdx + ' ' + this.currentPointIdx)
        } else {
            new_guideline = [q];
            this.guidelines.push(new_guideline);
            this.currentLineIdx = this.guidelines.length - 1;
            this.currentPointIdx = 0;
            this.dragging_ = true;
            //console.log('1Ctrl ' + this.currentLineIdx + ' ' + this.currentPointIdx)
        }
    } else if (e.shiftKey) { // delete 
        var idx = this.getCurrentPointIndex(q);  
        if (idx != null) {
            this.guidelines[idx[0]].splice(idx[1], 1);
            if (this.guidelines[idx[0]].length < 2) {
                this.guidelines.splice(idx[0], 1);
            }
        }
    } else { // move
        idx = this.getCurrentPointIndex(q);
        if (idx != null) {
            this.currentLineIdx = idx[0];
            this.currentPointIdx = idx[1];
            this.dragging_ = true;
            //console.log('1None ' + this.currentLineIdx + ' ' + this.currentPointIdx)
        }
    }
    this.redraw(this.canvas, this.imgData, this.guidelines);
};

ImgWarper.GridDefiner.prototype.touchDrag = function(e) {
    if (this.computing_ || !this.dragging_) {
        return;
    }
    this.computing_ = true;
    e.preventDefault();
    var endX = (e.offsetX || e.clientX - $(e.target).offset().left);
    var endY = (e.offsetY || e.clientY - $(e.target).offset().top);
    endX = endX / e.target.clientWidth * e.target.width;
    endY = endY / e.target.clientHeight * e.target.height;
    this.guidelines[this.currentLineIdx][this.currentPointIdx] = new ImgWarper.Point(endX, endY);
    this.redraw(this.canvas, this.imgData, this.guidelines);
    console.log('redraw left dragging')
    this.computing_ = false;
};

ImgWarper.GridDefiner.prototype.redraw = function(canvas, imgData, guidelines) {
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(imgData, 0, 0);
    for (var i = 0 ; i < guidelines.length; i++){
        let guideline = guidelines[i];
        for (var j = 0 ; j < guideline.length; j++){
            if (j < guideline.length - 1) {
                // point
                this.drawOnePoint(guideline[j], ctx, 'orange');
                // line to next
                ctx.beginPath();
                ctx.lineWidth = 3;
                ctx.moveTo(guideline[j].x, guideline[j].y);
                ctx.lineTo(guideline[j+1].x, guideline[j+1].y);
                ctx.stroke();
            } else {
                // point
                this.drawOnePoint(guideline[j], ctx, 'red');
                //line to cursor is still dragging
            }
        }
    }
    ctx.stroke(); 
};


ImgWarper.GridDefiner.prototype.getCurrentPointIndex = function(q) {
    nearest_distance = this.neighbour_threshold;
    nearest_point = null;
    for (var i = 0 ; i < this.guidelines.length; i++) {
        let guideline = this.guidelines[i];
        for (var j = 0 ; j < guideline.length; j++) {
            distance = guideline[j].InfintyNormDistanceTo(q);
            if (distance < nearest_distance) {
                nearest_distance = distance
                nearest_point = [i, j];
            }
        }
    }
    console.log('not found');
    return nearest_point;
};

ImgWarper.GridDefiner.prototype.drawOnePoint = function(point, ctx, color) {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.arc(parseInt(point.x), parseInt(point.y), 3, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill(); 

};


ImgWarper.GridDefiner.prototype.alignGuidelines = function(guidelines, target_canvas) {
    // topline = guidelines[0];
    // tl = topline[0]; tr = topline[topline.length - 1];
    // botline = guidelines[1];
    // bl = botline[0]; br = botline[botline.length - 1];
    // a = tr.subtract(tl);
    // b = br.subtract(bl);
    // diagline = a.add(b).multiply_d(0.5);
    // diagline_len = Math.sqrt(diagline.dotP(diagline));

    var sumx = 0;
    var sumy = 0;
    for (var i = 0 ; i < guidelines.length; i++){
        let guideline = guidelines[i];
        if (guideline.length < 2) { continue; }
        l = guideline[0]; r = guideline[guideline.length - 1];
        sumx += r.subtract(l).x;
        sumy += r.subtract(l).y;
    }
    len = Math.sqrt(sumx*sumx + sumy*sumy)
    cosa = sumx / len;
    sina = sumy / len;
    mat2points = new ImgWarper.Matrix22(cosa, +sina, -sina, cosa);
    mat2std = new ImgWarper.Matrix22(cosa, -sina, +sina, cosa);
    std_guidelines = [];

    left_min = target_canvas.width;
    right_max = 0;
    top_min = target_canvas.height;
    for (var i = 0 ; i < guidelines.length; i++){
        let guideline = guidelines[i];
        let std_guideline = [];
        let sumy = 0;
        for (var j = 0 ; j < guideline.length; j++){
            std = guideline[j].multiply(mat2std);
            sumy += std.y;
            std_guideline.push(std)
        }
        for (var j = 0 ; j < std_guideline.length; j++){
            std_guideline[j].y = sumy/std_guideline.length;
            if (std_guideline[j].y < top_min) {
                top_min = std_guideline[j].y;
            }
        }
        if (std_guideline.length > 0) {
            if (std_guideline[0].x < left_min) { left_min = std_guideline[0].x; }
            if (std_guideline[std_guideline.length - 1].x > right_max) { right_max = std_guideline[std_guideline.length - 1].x; }
        }
        std_guidelines.push(std_guideline);
    }

    r = target_canvas.width/(right_max - left_min);
    if ((r < 0) || (r != r)) {
        return std_guidelines;
    }

    for (var i = 0 ; i < std_guidelines.length; i++){
        for (point of std_guidelines[i]) {
            point.x = (point.x - left_min) * r;
            point.y = (point.y - top_min) * r;
        }
    }

    return std_guidelines;
};

ImgWarper.GridDefiner.prototype.touchEnd = function(event) {
    if (this.dragging_) {
        this.dragging_ = false;
        this.redrawRightCanvas();
    }
};

ImgWarper.GridDefiner.prototype.redrawAll = function () {
    console.log('redraw all')
    this.redraw(this.canvas, this.imgData, this.guidelines);
    this.redrawRightCanvas();
};

ImgWarper.GridDefiner.prototype.redrawRightCanvas = function () {
    console.log('redraw right canvas')
    if (!(this.guidelines.length >= 2 && this.guidelines[1].length >= 2)) {
        return;
    }
    // prepare right canvas to draw
    this.rightcanvas.width = this.canvas.width;
    this.rightcanvas.height = this.canvas.height;
    // from guidelines to two set points
    aligned_guidelines  = this.alignGuidelines(this.guidelines, this.rightcanvas);

    var ctx = this.rightcanvas.getContext("2d");
    var optGridSize = 20;
    var optAlpha = 1;
    this.imgWarper = new ImgWarper.MyWarper(this.rightcanvas, this.rightcanvas, this.imgData, optGridSize, optAlpha);
    var newImg = this.imgWarper.warp([].concat.apply([], this.guidelines), [].concat.apply([], aligned_guidelines));

    // ctx.setTransform(1, 0, 0, 1, 0, 0);
    // ctx.clearRect(0, 0, this.rightcanvas.width, this.rightcanvas.height);
    // ctx.putImageData(newImg, 0, 0);

    this.redraw(this.rightcanvas, newImg, aligned_guidelines);
};

ImgWarper.MyWarper = function(canvas, img, imgData, optGridSize, optAlpha) {
  this.alpha = optAlpha || 1;
  this.gridSize = optGridSize || 20;
  this.canvas = canvas;
  this.ctx = canvas.getContext("2d");

  var source = img;
  this.width = source.width;
  this.height = source.height;
  this.imgData = imgData.data;
  canvas.width = source.width;
  canvas.height = source.height;

  this.grid = [];
  for (var i = 0; i < this.width ; i += this.gridSize) {
    for (var j = 0; j < this.height ; j += this.gridSize) {
      a = new ImgWarper.Point(i,j);
      b = new ImgWarper.Point(i + this.gridSize, j);
      c = new ImgWarper.Point(i + this.gridSize, j + this.gridSize);
      d = new ImgWarper.Point(i, j + this.gridSize);
      this.grid.push([a, b, c, d]);
    }
  }
};

ImgWarper.MyWarper.prototype.warp = function(fromPoints, toPoints) {

    console.log(fromPoints);
    abc = fromPoints;
    var deformation = new ImgWarper.AffineDeformation(toPoints, fromPoints, this.alpha);


    var transformedGrid = [];
    for (var i = 0; i < this.grid.length; ++i) {
      transformedGrid[i] = [
          deformation.pointMover(this.grid[i][0]),
          deformation.pointMover(this.grid[i][1]),
          deformation.pointMover(this.grid[i][2]),
          deformation.pointMover(this.grid[i][3])];
    }


    this.bilinearInterpolation = new ImgWarper.BilinearInterpolation(this.width, this.height, this.canvas);
    var newImg = this.bilinearInterpolation.generate(this.imgData, this.grid, transformedGrid);
    return newImg;

};
