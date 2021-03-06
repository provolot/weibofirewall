var datafile_json = "data/deleted_weibo_log_obfuscated.json";

//var datafile = "data/deleted_weibo_log.csv";
//var datafile = "data/deleted_weibo_log_old.csv";
//var datafile = "data/all_weibo_log_temp.csv";

var datadelim = String.fromCharCode(31);
var datadelim = "|||";

// this, in seconds, is how many seconds the created time of a post can be before it was tracked.
// set to a week or so. 604800 = 1 week.
var threshold_for_created_vs_tracking = 604800;

// how many posts to skip. default: 0. 
var datastartindex = 0;
var imgdir = "images/weibo_hashed_images/";


var chartwidth = 5000;
var chartheight; // = 960;
var yHorizon; // = screen.height / 2; //defined when chartheight is

var chartheight_padding = 80;
var chartxpadding=100;
var barheight = 10;
var heightscale = 10; // reposts per pixel
var bargap = 1;
var bar_dateformat = d3.time.format("%b %e, %Y %H:%M");
var timepadding = 3600; //one hour
var colorMin = 50;
var colorMax = 220;
var randomTimeRange= 20;
var tickstrokecolor = "#222";
var thisurl = document.URL;
var baseurl=thisurl.substring(0,thisurl.lastIndexOf("/"));

var wedgeMinimumX = 5;
var wedgeMinimumY = 2;

var tickinterval = 1; //interval between ticks, in days
var params = "";

var usernameOffsetX = -10;
var usernameOffsetY = 0;

var theme_color= "#FF2F2F";

var scrollToX, scrollToY;
var scrollRateX;
var scrollSmoothing = 20;

/**************/
/**************/
/**************/

function pad (str, max) {
  str = str.toString();
  return str.length < max ? pad("0" + str, max) : str;
}

function lifespanFormat(seconds) {
	//format xample:
	// 4 hours, 30 minutes
	// 30 minutes, 2 seconds
	//
	// cast, just to make sure
	seconds = parseInt(seconds);
	var minutes = Math.floor(seconds / 60);
	var hours = Math.floor(seconds / 3600);
	minutes = minutes % 60;
	seconds = seconds % 60;
	if(hours > 0)
		return hours + " hours, " + minutes + " minutes";
	else 
		//return pad(minutes,2) + " minutes" + pad(seconds,2) + " seconds";
		return minutes + " minutes, " + seconds + " seconds";
}

function dec2hex(i) {
	var hex = i.toString(16);
  	var padhex = hex.length < 2 ? dec2hex("0" + hex, 2) : hex;
	return padhex;

}

function randomTimeOffset() {
	return Math.ceil((Math.random() * randomTimeRange) + (randomTimeRange / 2));
}

function epochToDate(epoch) {
	return new Date(epoch * 1000);
}

function getcolor_bytime(d, i, scaleTimeForColor) {
	// generate colors per time 
	//elapsedtimecolor = scaleTimeForColor(d["last_checked_at"]-d["post_created_at"]); 
	elapsedtimecolor = scaleTimeForColor(d["last_checked_at"]) - scaleTimeForColor(d["post_created_at"]); 
	/*
	 * console.log("i = " + i + ", postid = " + d["post_id"] + ", user_id = " + d["user_id"]);
	console.log(d);
	console.log(d["last_checked_at"])
	console.log(d["post_created_at"]); 
	console.log(d["last_checked_at"]-d["post_created_at"]);  */
	var thiscolor_value = dec2hex(colorMax - (Math.round(elapsedtimecolor)));
	// create hexvalue
	thiscolor_bytime = "#" + thiscolor_value + thiscolor_value + thiscolor_value;
/*	console.log( thiscolor_bytime);
	console.log( thiscolor_bytime);
	console.log(scaleTimeForColor.domain()); */
	return thiscolor_bytime;
}

function getcolor_byuser(d) {
// generate colors per user 
	var dig = dec2hex((d.user_id) % 256);
	var thiscolor_byuser = "#" + dig + "FF" + dig;
	var thiscolor_byuser_2 = "#" + ((d.user_id) % 16777216).toString(16);

	////console.log(thiscolor_bytime);
	//return thiscolor_bytime;
//	var thiscolor_byuser = getcolor_byuser(d.user_id);
	return thiscolor_byuser_2;
}

function rehumanize(time){
	time = time._data;
    if(time.years   > 0){   return time.years   + ' years and '     + time.months   + ' months';}
    if(time.months  > 0){   return time.months  + ' months and '    + time.days     + ' days';}
    if(time.days    > 0){   return time.days    + ' days and '      + time.hours    + ' hours';}
    if(time.hours   > 0){   return time.hours   + ' hours and '     + time.minutes  + ' mins and ' + time.seconds + ' secs';}
    if(time.minutes > 0){   return time.minutes + ' mins and '   + time.seconds  + ' secs';}
    if(time.seconds > 0){   return time.seconds + ' secs';}
    return "Time's up!";
}


function hideLoadingSplash() {
	$("#loadingsplash").fadeOut(2000);
}

function handleMouse(e) {

  //what we weant to do: proportional to client, scroll page.
	//so: if cursor is 25% of clientX and 25% of clientY, scroll page to 25% of pageX and 25% of pageY.
	//but actually. we want some padding. so: if cursor is 25% of clientX and 25% of clientY, scroll page to 25% of pageX and 25% of pageY.
	var scrollToX = (e.clientX)/ $(window).width() * $(document).width();
	var scrollToY = (e.clientY) / $(window).height() * $(document).height();

	//but also. we want to have a scroll rate. so - the closer the pointer is to the desired location, the slower the scroll rate.
	// when e.clientX is close to scrollToX then scroll rate goes down
	// add this to scrollLeft
	scrollRateX = (scrollToX - $(window).scrollLeft()) / scrollSmoothing;

	//window.scrollTo(scrollToX, scrollToY);
	//$(window).scrollLeft(scrollToX);

}

function scrollWindow() {
	$(window).scrollLeft($(window).scrollLeft() + scrollRateX);
}

function wedgeopacity(opacity) {
	opacity = (typeof opacity == "undefined") ? "0.3" : opacity;
	return "opacity:" + opacity + ";";
}
//define mouseover functions
function barselect_mouseover(d, i) {
	d3.selectAll(".postdiv.post-" + d["post_id"]).style('opacity', 1).style('z-index', 100);
	d3.selectAll(".post-" + d["post_id"]).classed("hover", true); 
	//highlight same users
	d3.selectAll(".user-" + d["user_id"]).classed("same-user-hover", true);
}

// define mouseout
function barselect_mouseout( d, i) {
	d3.selectAll(".postdiv.post-" + d["post_id"]).style('opacity', 0).style('z-index', 0);
//	d3.selectAll(".postdiv.post-" + d["post_id"]).style('opacity', 0); //.style('z-index', 0);
	d3.selectAll(".post-" + d["post_id"]).classed("hover", false); 
	//highlight same users
	d3.selectAll(".user-" + d["user_id"]).classed("same-user-hover", false);
}



function resizeimage(imgurl) {
	thisresizedimage = "https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?url=" 
		+ baseurl 
		+ "/"
		+ imgurl
		+ "&container=focus&resize_h=200&refresh=2592000";
	return thisresizedimage;
}

function makeparamstring(params) {
	var s = "";
	var keys = Object.keys(params);
	for(var i = 0; i < keys.length; i++) {
		if(i > 0) s+= "&";
		s += keys[i] + "=" + params[keys[i]];
	}
	return s;
}

function getthiscolor(d, i, scaleTimeForColor) {
	if(params["colorby"] == "bytime") {
		// generate colors by time
		var thiscolor_bytime = getcolor_bytime(d, i, scaleTimeForColor);
		return thiscolor_bytime;
	} else {
		// generate colors per user 
		var thiscolor_byuser = getcolor_byuser(d);
		return thiscolor_byuser;
	}	

}

function setoptions(params) {
	//read url, set radio buttons
	var keys = Object.keys(params);
	for(var i = 0; i < keys.length; i++) {
		thiskey = keys[i];
		$("[name=" + thiskey + "]#" + params[thiskey]).iCheck('check');
	}
	refreshoptions();
//	console.log(setoptions);
//	console.log(keys);
}

function cleanparams(params) {
/*
	if(!("labels" in params)) {
		params["labels"] = "true";
	} else if(params["labels"] != "true") params["labels"] = "false";

	if(!("colorby" in params)) {
		params["colorby"] = "bytime";
	} else if(params["colorby"] != "byuser") params["colorby"] = "bytime";

	if(!("graphstyle" in params)) {
		params["graphstyle"] = "bar";
	} 

	history.replaceState(null, null, "?" + makeparamstring(params));
	setoptions(params);*/
	return params;
}

function refreshoptions() {
}

function cleanjson(json) {

	var first_started_tracking_at_epoch = d3.min(json, function(d) { return +d.started_tracking_at_epoch });
//	console.log("min_started_tracking_at = " + first_started_tracking_at_epoch);


	// filter for old posts that are going to throw off our time scale
	json = json.filter(function (d) { 
		// if the created time is way less (by a threshold) than initial track time, return false
		if(+d.post_created_at_epoch + threshold_for_created_vs_tracking < first_started_tracking_at_epoch) {
//			console.info("we discarded post " + d.post_id);
			return false;
		} else {
			return true;
		}
	});


	var data = jQuery.map(json,function (d, i) {
		// this is the format of what we need, adopted from weibo_module's make_csvline_from_post 

		// for some reason. skip the first datastartindex posts.
		if(i < datastartindex) {
			return null;
		} 

		d.post_repost_log.map(function(d) {
			var checked_at_parse = d3.time.format("%Y-%m-%d %H:%M:%S %Z").parse //all our times are china!
			d.checked_at = checked_at_parse(d.checked_at + " +0800");
		}); 

		return {
			post_id: +d.post_id,
			user_id: parseFloat(d.user_id),
			user_name: d.user_name,
//			user_follower_count_initial: +d.user_follower_count_initial,
			user_follower_count: +d.user_follower_count,
			post_original_pic: d.post_original_pic,
			post_created_at : epochToDate(d.post_created_at_epoch),
			post_repost_count_initial: +d.post_repost_count_initial,
			post_repost_count: +d.post_repost_count,
			post_text: d.post_text,
			started_tracking_at: epochToDate(+d.started_tracking_at_epoch),
			is_deleted: d.is_deleted,
			is_retired: d.is_retired,
			error_message: d.error_message,
			error_code: +d.error_code,
			last_checked_at: epochToDate(+d.last_checked_at_epoch),
			post_lifespan: +d.post_lifespan,
			post_repost_log: d.post_repost_log,
			user_info: d.user_info
		}
	});

	return data;
}

function yFunction(d, i) { 
//	console.log(d);
//	return d["user_id"] % 2000 + 300;
//	return (i * (barheight + bargap)) + (barheight / 2); 
	return yHorizon;
}

function transformwedgesparkline(d, datatype, mode) {
	var thisx = d["post_created_at_scaled"]; 
	var thisy = yHorizon;
	var returnstring = "";
	//console.log(crossplatformtransform("translate(0px," + y + "px)"));
	//return crossplatformtransform("translate(0px," + y + "px)");
	if(mode == "scatter") { thisy = d["scatter_height"]; }
	if(datatype == "username") {
		thisx += usernameOffsetX;
		thisy += usernameOffsetY;
	} 
	else {
		returnstring += wedgeopacity() ;
		returnstring += " ";
	}
	returnstring += crossplatformtransform("translate3d(" + thisx + "px," + thisy + "px, 0px)");
	return returnstring;
	//return crossplatformtransform("translate3d(0px," + y + "px, 0px)");
}


function wedgesparkline(iswedge, d, i, scaleTime) {

	var checked_at_format = d3.time.format("%Y-%m-%d %H:%M:%S %Z")

//	console.log("inside wedgesparkline");
//	console.log(d);

	// GET X Y COORDINATES
	var x = scaleTime(d["post_created_at"]); 
	var y = yFunction(d, i);

	// WIDTH = TIME, SCALED
	var width = scaleTime(d["last_checked_at"]) - scaleTime(d["post_created_at"]); 
	width += 5;
	var height = (d["post_repost_count"] - d["post_repost_log"][0]["post_repost_count"]);
	height /= heightscale;
	height += (barheight / 2); // have a minimum height

	// M syntax
	// MOVE TO (x-value) (y-value) 
	// RELATIVE LINE TO (width, height / w), 
	// RELATIVE LINE TO (0, -height), 
	// CLOSE LINE
	//wedgestring =  'M ' + x +' '+ y + ' l ' + width + ' ' + (height / 2) + ' l 0 -' + height + ' z';

	// M syntax
	// MOVE TO 0, 0
	// RELATIVE LINE TO (width, height / w), 
	// RELATIVE LINE TO (0, -height), 
	// CLOSE LINE
	// ---TRANSLATE to x, y
	wedgestring =  'M 0 0 l ' + width + ' ' + (height / 2) + ' l 0 -' + height + ' z';

	if (d["post_repost_log"] == "") {
		return wedgestring;
	}

	// OKAY LET'S TRY A SPARKLINE
	var repostlog = d["post_repost_log"]
	/*console.log(repostlog)
	var repostlog_post_repost_count = [];
	var repostlog_checked_at = [];

	for (var j = 0; j < repostlog.length; j+= 2) {
		repostlog_post_repost_count.push(repostlog[j]);
		//console.log(checked_at_format.parse(repostlog[j+1]));
		//console.log("i = " + i );
		repostlog_checked_at.push(checked_at_format.parse(repostlog[j+1]));
	} */


	//sparklinestring = 'M ' + x + ' ' + y + ' ';
	sparklinestring = 'M 0 0 ';
	//string goes up
	for (var j = 0; j < repostlog.length; j++) {
		var thisX = scaleTime(repostlog[j]["checked_at"]) + wedgeMinimumX;
		var thisY = y - (repostlog[j]["post_repost_count"] / heightscale / 2);
		thisY -= wedgeMinimumY; //minimum so that unshared posts are still visible
		sparklinestring += 'L ' + (thisX - x).toFixed(2) + ' ' + (thisY - y).toFixed(2) + ' ';
	}

	if(iswedge == "wedge") {
		//mirror this; string goes back to origin
		for (var j = repostlog.length - 1; j >= 0; j--) {
			var thisX = scaleTime(repostlog[j]["checked_at"]) + wedgeMinimumX;
			var thisY = y + (repostlog[j]["post_repost_count"] / heightscale / 2);
			thisY += wedgeMinimumY; //minimum
			sparklinestring += 'L ' + (thisX - x).toFixed(2) + ' ' + (thisY - y).toFixed(2) + ' ';
		}

		sparklinestring += ' z';
	}

	return sparklinestring;
	//return wedgestring;
}

/* THIS IS THE CSVLINE 
	*
	post_id,
user_id,
user_name,
user_follower_count_initial,
user_follower_count,
post_original_pic,
post_created_at,
post_created_at_epoch ,post_repost_count_initial,
post_repost_count,
post_text,
started_tracking_at,
started_tracking_at_epoch,
is_deleted,
is_retired,
error_message,
error_code,
last_checked_at,
last_checked_at_epoch,
post_lifespan
post_repostlog

 */

$(document).ready(function() {

	// Assign handleMouse to mouse movement events
	document.onmousemove = handleMouse;

	window.onpopstate = function(event) {
		params = purl().param();
//		console.log(params);
		setoptions(params);
	};

	setInterval(scrollWindow,10);

});

function crossplatformtransform (transformcommand) {
	var transformstring = 
		'transform: ' + transformcommand + ' !important; ' + 
		'-ms-transform: ' + transformcommand + ' !important;' + 
		'-webkit-transform: ' + transformcommand + ' !important;';
	return transformstring;
}

function scatterrandom(min, max, userid, yHorizon) {

	//forget min and max
	// we want to avoid yHorizon by +- horizonavoidance pixels
	// hash userid (just do a simple mod) between 0 and (yHorizon - horizonavoidance)
	// if odd, keep
	// if even, add horizonavoidance + yHorizon
	// so that domain of y value is between
	// yHorizon + horizonavoidance and yHorizon * 2 
	var horizonavoidance = 100;

	thisy = userid % (yHorizon - horizonavoidance);
	if(thisy % 2 == 0)
		thisy += yHorizon + horizonavoidance;

	return thisy;

}

function getuseridfromclasses(hoverclasses) {
	// this is messy - but get userid from classes
	var usermatch = hoverclasses.match(/user-(\d*)/);
	//var thisuserid = usermatch[1];
	return usermatch[1];
}

function getpostidfromclasses(hoverclasses) {
	// this is messy - but get postid from classes
	var postmatch = hoverclasses.match(/post-(\d*)/);
	//var thispostid = postmatch[1];
	return postmatch[1];
}


// used to switch between view modes with the menu
function d3update(delay) {
	/*
	if(params["graphstyle"] == "bar") {
		d3.selectAll("path.sparkline").transition().duration(delay).style('opacity', 0);
		d3.selectAll("path.wedge").transition().duration(delay).style('opacity', 0);
		d3.selectAll("rect.bar").transition().duration(delay).style('opacity', 1);
	} else {
		if(params["graphstyle"] == "wedge") {
			d3.selectAll("path.sparkline").transition().duration(delay).style('opacity', 0);
			d3.selectAll("path.wedge").transition().duration(delay).style('opacity', 1);
			d3.selectAll("rect.bar").transition().duration(delay).style('opacity', 0);
		} else {
			d3.selectAll("path.sparkline").transition().duration(delay).style('opacity', 1);
			d3.selectAll("path.wedge").transition().duration(delay).style('opacity', 0);
			d3.selectAll("rect.bar").transition().duration(delay).style('opacity', 0);
		}
	} */
}

function chart_click(d, i) { 
//		console.log("chart_click");
	if ($(".hover").length ) {

		// WE CLICKED ON A WEDGE - SO SPLIT
		// this is messy - but get userid from classes
		var thisuserid = getuseridfromclasses($(".hover").attr("class"));

		if(thisuserid == clickeduserid) {

			//we clicked on OLD wedge
			//
			//so grab post id
			var thispostid = getpostidfromclasses($(".hover").attr("class"));

			// and send us there
//				console.log('window.location = "readpost.php?post_id="' + thispostid);
//				window.location = "readpost.php?post_id=" + thispostid;

		} else {

			//we clicked on NEW wedge
			//store global so we know when we clicked on existing
			clickeduserid = thisuserid;

			//TRANSITION WEDGES
			d3.selectAll("path.wedge")
				.classed("sameuser-hover", function(d, i) { return(d["user_id"] == thisuserid); })
				.transition().duration(1000)
				.attr("style", function(d, i) {
					//get x, since wedges are all oriented at 0, 0
					var thisx = d["post_created_at_scaled"]; 
					if(d["user_id"] == thisuserid) { 
						//return wedgeopacity() + crossplatformtransform("translate3d(" + thisx + "px, " + yHorizon + "px, 0px)");
						return transformwedgesparkline(d, "wedge", "horizon");
					} else { 
						return transformwedgesparkline(d, "wedge", "scatter");
					}
				}) 
			d3.selectAll("g.usernames").transition().duration(1000).attr("style", "opacity: 0.6");

/*
			//TRANSITION USERNAMES
			d3.selectAll(".username").transition().duration(1000)
				.attr("style", function(d, i) {
					var thisx = d["post_created_at_scaled"]; 
					if(d["user_id"] == thisuserid) { 
						return transformwedgesparkline(d, "username", "horizon");
						//return crossplatformtransform("translate3d(" + (thisx + usernameOffsetX) + "px, " + yHorizon + "px, 0px)");
						//return yHorizon;
					} else { 
						return transformwedgesparkline(d, "username", "scatter");
						//return crossplatformtransform("translate3d(" + (thisx + usernameOffsetX) + "px, " + scatterrandom(0, 1000, d["user_id"], yHorizon) + "px, 0px)"); 
						//return "fill: #F00FFF;";
						//return crossplatformtransform("translate3d(0px, 0px, 0px)");
						//return scatterrandom(0, 1000, d["user_id"], yHorizon);
					}
				}) 
*/
		}

	} else {
		d3.selectAll("g.usernames").transition().duration(1000).attr("style", "opacity: 0.0");

		// WE CLICKED OUTSIDE - SO COLLAPSE
		//void global
		clickeduserid = null;

//			console.log("clicked outside");
		d3.selectAll("path.wedge")
			.classed("sameuser-hover", function(d, i) { return(d["user_id"] == thisuserid); })
			.transition().duration(1000)
			.attr("style", function(d, i) {
					//return wedgeopacity() + crossplatformtransform("translate3d(" + d["post_created_at_scaled"] + "px, " + yHorizon + "px, 0px)");
					return transformwedgesparkline(d, "wedge", "horizon");
			}) 
/*
		d3.selectAll(".username").transition().duration(1000)
			.attr("style", function(d, i) {
					return transformwedgesparkline(d, "username", "scatter");
					//return wedgeopacity(0.0) + transformwedgesparkline(d, "username", "horizon");
					//return crossplatformtransform("translate3d(" + (d["post_created_at_scaled"] + usernameOffsetX) + "px, " + yHorizon + "px, 0px)");
			}) 
*/

	}
}

// define click function
function barselect_click(d, i) {
	return;
}

function window_resize() {
	windowheight = $(window).height();
	// this is to vertically center chartdiv
	$("#chartdiv").css("top", ((windowheight / 2) - (chartheight / 2)) + "px");
}
