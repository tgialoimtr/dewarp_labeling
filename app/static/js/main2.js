var ImgWarper = ImgWarper || {};

let warper = null;
let tc = null;
let abc = 3;

function getCurrentElements(table_ele, imgname) {
    var ths = table_ele.getElementsByTagName('th');
    var trs = table_ele.getElementsByTagName('tr');
    for (var i=0; i<ths.length; i++) {
        if (ths[i].innerHTML.indexOf(imgname) !== -1) {
            var id = i;
            break;
        }
    }
    return [id, ths[id], trs[1].children[id]]
}

function setScrollPos(container, pos, length) {
    if (length > 0) {
        var estPos = container.scrollWidth * pos / length - container.clientWidth / 2;
    } else {
        var estPos = 0;
    }
    $(container).scrollLeft(estPos);
}

function json2points(current_guidelines_json) {
    var gls = [];
    for (var c_gl of current_guidelines_json) {
        var gl = [];
        for (var point_json of c_gl) {
            var p = new ImgWarper.Point(point_json["x"], point_json["y"]);
            gl.push(p);
        }
        gls.push(gl);
    }
    return gls;
}


$(document).ready(function(){ 

    var imgname = document.getElementById('current_imgname').value;

    let leftcanvas = document.getElementById('leftcanvas');
    let rightcanvas = document.getElementById('rightcanvas');
    let htmlimg = document.getElementById('htmlimg');
    let oriImage = null;
    console.log('loaded');

    var table_ele = document.getElementsByClassName('search-table')[0]
    var rs = getCurrentElements(table_ele, imgname);
    var current_imgname_element = rs[1];
    var current_status_element = rs[2];
    // current_imgname_element.classList.add("current");
    // current_status_element.classList.add("current");
    current_status_element.style.backgroundColor = "red";
    abc = rs;

    setScrollPos(document.getElementsByClassName("search-table-outter")[0], rs[0], table_ele.getElementsByTagName('th').length);

    htmlimg.onload = function() {
        // Unify width/height of canvas with pixels
        leftcanvas.width = htmlimg.width;
        leftcanvas.height = htmlimg.height;
        let ctx = leftcanvas.getContext('2d');
        console.log(htmlimg.width + 'x' + htmlimg.height);
        console.log(leftcanvas.clientWidth + 'x' + leftcanvas.clientHeight);
        ctx.drawImage(htmlimg, 0, 0, leftcanvas.width, leftcanvas.height);
        oriImage = ctx.getImageData(0,0,leftcanvas.width, leftcanvas.height);
        console.log('current guidelines to warper GridDefiner')
        // convert json to list of Point
        warper = new ImgWarper.GridDefiner(leftcanvas, leftcanvas, rightcanvas, oriImage, json2points(current_guidelines));
        window.addEventListener("resize", function() {warper.redrawAll();});

    }
    htmlimg.src = imgurl;

    

    // this is the id of the form
    $("#updatework").submit(function(e) {

        e.preventDefault(); // avoid to execute the actual submit of the form.
        var form = $(this);
        var url = form.attr('action');
        var status = document.getElementById('status').value;
        var data = {'imgname': imgname, 'status':status, 'guidelines':JSON.stringify(warper.guidelines)};
        console.log(data);
        $.ajax({
            type: "POST",
            url: url,
            //data: {seriform: form.serialize(), other:"other"}, // serializes the form's elements.
            data:data,
            success: function(data)
            {
                console.log('returned ajax success');
                console.log(data); // show response from the php script.
                current_status_element.innerHTML = data["newstatus"];
            },
            error: function(jqXHR, textStatus, errorThrown)
            {
                console.log('returned ajax error');
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
                current_status_element.innerHTML = data;
            }
            });


    });


    // function readImage() {
    //     if ( this.files && this.files[0] ) {
    //         var FR= new FileReader();
    //         FR.onload = function(e) {
    //            var img = new Image();
    //            img.onload = function() {
    //             leftcanvas.width = leftcanvas.clientWidth;
    //              leftcanvas.height = leftcanvas.width * img.height/img.width;
    //             //  rightcanvas.height = leftcanvas.height;
    //              console.log(img.width +':' + img.height);
    //              console.log(leftcanvas.width +':' + leftcanvas.height);
    //              ctx.drawImage(img, 0, 0, leftcanvas.width, leftcanvas.height);
    //              oriImage = ctx.getImageData(0,0,leftcanvas.width, leftcanvas.height);
    //              console.log(oriImage.width +':' + oriImage.height);
    //              warper = new ImgWarper.GridDefiner(leftcanvas, leftcanvas, rightcanvas, oriImage);

    //            };
    //            img.src = e.target.result;
    //         };       
    //         FR.readAsDataURL( this.files[0] );
    //     }
    // }

    // inputElement.addEventListener('change', readImage);

    

    // let lines = []
    // let current_point = null // lineid, number

    // function get_current_point(lines, coordinate) {
    //     for(let line of lines) {
            
    //     }
    // }

    // leftcanvas.addEventListener('mousedown', function(e){
    //     var startX = (e.offsetX || e.clientX - $(e.target).offset().left);
    //     var startY = (e.offsetY || e.clientY - $(e.target).offset().top);
    //     coordinate = new ImgWarper.Point(startX, startY);
    // });


    // mousedown {
    //     X, y 
    //     current_point = get_current_point(x, y)
    //     if 'shift': 
    //         delete current_point
    // }

    // mousemove {
    //     draw_current_line
    //     // or move current_point
    //     redraw()
    // }

    // mouseup {
    //     line.pushback([x,y])

    //     redraw()
    // }

    // // loop check lines and draw
    // function redraw(lines) {
    //     // draw lines on left canvas 
    //     pass 

        // mapping = []
        // // mapping first and last line
        // // mapping each line
        // for (line in lines) {
        //     mapping.pushback((drawed_point, aligned_point))
        // }

            
        // imgdata = lefcanvas.getImageData()
        // ImgWarper(rightcanvas, img, imgdata)
        // imgwarper = ImgWarper.Warper(canvas, img, imgData, optGridSize, optAlpha)
        // imgdata = ImgWarper.warp(drawed_points, aligned_points)


        // target_grid = buildGrid(width, height, optGridSize) // estimate width, height from ratio/size of lines
        // draw_grid(rightcanvas, target_grid)
        // rightcanvas.putImageData(imgdata)

    // }

});



