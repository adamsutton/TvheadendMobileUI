var maxHeight = 0;
var lh=50;
var channelToY = new Array();
var last = '';
var lastChannel = '';
var lastEpgX;
var limit = 400;
var start = 0;
var gap = 4;
var contentGroups = new Array();
var selectedTag = 0;
var channelTags = new Array();
var nullTime = new Date().getTime()/1000;
var scaleDown = 10;
var leftPadding = 150;
var epgLoaded = 0;
var configs;
var configSelect;
var tagSelect;
var cancelRecordingId;
var cancelRecordingStart;
var cancelRecordingChannel;
var colors = new Array();
var loadedPosters = new Array();
var loadedBackdrops = new Array();
var posterWidth = 92;
var backdropWidth = 780;
var tmdbImgUrl = 'http://d3gtl9l2a4fn1j.cloudfront.net/t/p/w';
colors[16*0] = '#94D6E7';
colors[16*1] = '#A5DE94';
colors[16*2] = '#94D639';
colors[16*3] = '#94D6CE';
colors[16*4] = '#C6B5DE';
colors[16*5] = '#FFCE9C';
colors[16*6] = '#FFFF6B';
colors[16*7] = '#EFE8AD';
colors[16*8] = '#F7BDDE';
colors[16*9] = '#BDC6DE';
colors[16*10] = '#FFC6A5';

function loadEpg(chid, chname, reload) {
	doPost("epg", readEpg, 'start='+start+'&limit='+limit+'&tag='+channelTags[selectedTag]);
}

function scrollHandler(event) {
	var nVScroll = document.documentElement.scrollTop || document.body.scrollTop;
	var nHScroll = document.documentElement.scrollLeft || document.body.scrollLeft;
	document.getElementById('logos').style.left = nHScroll+'px';
	document.getElementById('timeline').style.top = nVScroll+'px';
	if (lastEpgX != undefined && nHScroll + window.innerWidth + 100 > lastEpgX)
		loadMoreEpg();
}

window.onscroll = scrollHandler;

function showChannel(id) {
	if (document.getElementById('e_'+last) != null) {
		document.getElementById('e_'+last).className = document.getElementById('e_'+last).className.replace('big', '');
	}
	if (document.getElementById('c_'+lastChannel) != null) {
		document.getElementById('c_'+lastChannel).style.display = 'none';
		document.getElementById('i_'+lastChannel).style.zIndex = '6';
	}
	if (lastChannel != id) {
		lastChannel = id;
		var div = document.getElementById('c_'+id);
		div.style.display = 'block';
		document.getElementById('i_'+lastChannel).style.zIndex = '8';
	}
	else {
		lastChannel = '';
	}
}

function show(id) {
	if (document.getElementById('c_'+lastChannel) != null) {
		document.getElementById('c_'+lastChannel).style.display = 'none';
		document.getElementById('i_'+lastChannel).style.zIndex = '6';
	}
	if (document.getElementById('e_'+last) != null) {
		document.getElementById('e_'+last).className = document.getElementById('e_'+last).className.replace('big', '');
	}
	if (last != id) {
		last = id;
		var div = document.getElementById('e_'+id);
		div.className += ' big';
		var poster = div.getElementsByClassName('poster');
		if (poster.length > 0 && poster[0].innerHTML == '' && tmdbApiKey != '') {
			var title = div.getElementsByTagName('h1')[0].innerHTML;
			var p = '-';
			if (loadedPosters[title] != undefined) {
				p = loadedPosters[title];
				poster[0].innerHTML = (p!='-') ? '<img width="'+posterWidth+'px" src="'+tmdbImgUrl+posterWidth+p+'" />' : '&nbsp;';
				if (loadedBackdrops[title] != undefined && loadedBackdrops[title] != '-') {
					div.style.backgroundImage = 'url('+tmdbImgUrl+backdropWidth+loadedBackdrops[title]+')';
					div.className += ' backdrop';
				}
				var att = div.getElementsByClassName('tmdb');
				if (att.length > 0) {
					att[0].style.display = 'block';
				}
			}
			else {
				var http = new XMLHttpRequest();
				http.open("GET", 'http://api.themoviedb.org/3/search/movie?api_key='+tmdbApiKey+'&query='+encodeURI(title)+'&language='+navigator.language.substring(0,2));
				http.send(null);
				http.title = title;
				http.div = div;
				http.poster = poster;
				http.pw = posterWidth;
				
				http.onreadystatechange = function() {
					if(http.readyState == 4 && http.status == 200) {
						var response = JSON.parse("[" + http.responseText + "]");
						var p = '-';
						var bd = '-';
						if (response[0].results.length > 0) {
							p = response[0].results[0].poster_path;
							if (response[0].results[0].backdrop_path != '')
								bd = response[0].results[0].backdrop_path;
						}
						loadedPosters[http.title] = p;
						loadedBackdrops[http.title] = bd;
						http.poster[0].innerHTML = (p!='-') ? '<img width="'+http.pw+'px" src="'+tmdbImgUrl+http.pw+p+'" />' : '&nbsp;';
						if (bd != '-') {
							http.div.style.backgroundImage = 'url('+tmdbImgUrl+backdropWidth+bd+')';
							http.div.className += ' backdrop';
						}
						if (p!='-') {
							var att = http.div.getElementsByClassName('tmdb');
							if (att.length > 0) {
								att[0].style.display = 'block';
							}
						}
					}
				};
			}
		}
	}
	else {
		last = '';
	}
}

function timestampToX(timestamp) {
	return leftPadding + (timestamp - nullTime)/scaleDown;
}

function readEpg(response) {
	if (response.entries.length > 0) {
		var html = '';
		var last = lastEpgX == undefined ? 0 : lastEpgX;
		for (var i in response.entries) {
			var e = response.entries[i];
			var w = (e.duration/scaleDown);
			var x = timestampToX(e.start);
			var y = channelToY[e.channel];
			if (x<0) {
				w+=x;
				x=0;
			}
			last = x > last ? x : last;
			e.contenttype -= e.contenttype % 16;
			html += '<div id="e_'+e.id+'" class="box '+e.schedstate+'" style="top:'+y+'px;left:'+x+'px;width:'+w+'px;height:'+lh+'px;background-color:'+colors[e.contenttype]+';">';
			html += '<div class="head" onclick="show('+e.id+');"><h1>'+e.title+'</h1>';
			var sub = '';
			if (e.subtitle != undefined && e.subtitle != e.title)
				sub += e.subtitle;
			if (e.episode != undefined)
				sub += (sub.length > 0 ? ' &mdash; ' : '') + e.episode;
			html += '<h2>'+sub+'</h2></div>';
			html += '<div class="add"><div class="poster"></div><h3 onclick="show('+e.id+');">'+nvl(contentGroups[e.contenttype])+'</h3><p class="desc" onclick="show('+e.id+');">'+nvl(e.description)+'</p>';
			html += '<p class="time">' + getDateTimeFromTimestamp(e.start, true) + '&ndash;' + getTimeFromTimestamp(e.start+e.duration) + ' (' + getDuration(e.duration) + l('hour.short') + ')</p>';
			html += '<p class="channel">' + e.channel + ' &mdash; <a href="http://akas.imdb.org/find?q='+e.title+'" target="_blank">'+l('imdbSearch')+'</a></p><br clear="all" />';
			html += '<form class="record">'+configSelect+'<br /><input type="button" value="'+l('record')+'" onclick="record('+e.id+',this);" /></form>';
			html += '<form class="cancel"><input type="button" value="'+l('cancel')+'" onclick="cancel('+e.id+', \''+e.start+'\',\''+e.channel+'\');" /></form>';
			html += '<p class="tmdb">'+l('tmdbAttribution')+'</p>';
			html += '</div>';
			html += '</div>';
		}
		append(html);
		epgLoaded += response.entries.length;
		lastEpgX = last;
		scrollHandler();
	}
}

function cancel(id, starttime, channel) {
	var start = 0;
	var limit = 20;
	var params = 'start='+start+'&limit='+limit;
	cancelRecordingId = id;
	cancelRecordingStart = starttime;
	cancelRecordingChannel = channel;
	doGet('dvrlist_upcoming?'+params, readRecordingsAndCancelRecording);
}

function readRecordingsAndCancelRecording(response) {
	for (var i in response.entries) {
		var e = response.entries[i];
		if (e.start == window.cancelRecordingStart && e.channel == window.cancelRecordingChannel) {
			var params = 'entryId='+e.id+'&op=cancelEntry';
			doPostWithParam("dvr", readCancelEpg, params);
			return;
		}
	}
	alert(l('recordingEntryNotFound'));
}

function record(id, button) {
	var params = 'eventId='+id+'&op=recordEvent&config_name='+button.form.config.value;
	doPostWithParam("dvr", readRecordEpg, params, id);
}

function readCancelEpg(response) {
	if (response.success == 1) {
		var e = document.getElementById('e_'+cancelRecordingId);
		e.className = 'big box';
	}
	else {
		alert(l('errorCreatingOrDeleteRecordingEntry'));
	}
}

function readRecordEpg(response) {
	if (response.success == 1) {
		var e = document.getElementById('e_'+response.param);
		if (e.style.left <= document.getElementById('current').style.left)
			e.className += ' running';
		else
			e.className += ' scheduled';
	}
	else {
		alert(l('errorCreatingOrDeleteRecordingEntry'));
	}
}

function readConfigs(response) {
	window.configs = response.entries;
	window.configSelect = '<select name="config">';
	for (i in response.entries) {
		var e = response.entries[i];
		var selected = (e.identifier == '') ? ' selected="selected"' : '';
		window.configSelect += '<option value="'+e.identifier+'"'+selected+'>'+e.name+'</option>';
	}
	window.configSelect += '</select>';
	loadStandardTable("channeltags", readChannelTags);
}

function showTag(tag) {
	window.location.search = '?'+tag;
}

function readChannelTags(response) {
	var sel = new Array();
	sel[0] = '<option value="0">'+l('allChannels')+'</option>';
	for (var i=0; i<response.entries.length; i++) {	
		var e = response.entries[i];
		var selected= '';
		var tag = window.location.search.replace('?','');
		if (tag == e.id) {
			selectedTag = e.id;
			selected = ' selected="selected"';
		}
		window.channelTags[e.id] = e.name;
		sel[e.id] = '<option value="'+e.id+'"'+selected+'>'+e.name+'</option>';
	}
	tagSelect = '<select onchange="showTag(this.value);">';
	for (var i in sel)
		tagSelect += sel[i];
	tagSelect += '</select>';
	doPost("channels", readChannels, "op=list");
}

function loadMoreEpg() {
	lastEpgX = undefined;
	start += limit;
	loadEpg();
}

function initTimeline() {
	var start = new Date();
	var html = '';
	var i=0;
	start.setTime(start.getTime()-60*60*1000);
	start.setMinutes(0);
	start.setSeconds(0);
	while (i++<60) {
		html += '<div style="left:'+(timestampToX(start.getTime()/1000)-1)+'px;width:'+(30*60/scaleDown)+'px;">';
		if (start.getHours() == 0 && start.getMinutes() == 0)
			html += getDate(start, true) + ' ';
		html += getTime(start)+'</div>';
		start.setTime(start.getTime()+30*60*1000);
	}
	append('<div id="timeline">'+html+'</div><div id="current"></div>');
}

function setCurrent() {
	var c = document.getElementById('current');
	if (c != null) {
		c.style.left = timestampToX((new Date().getTime())/1000) + 'px';
		c.style.height = maxHeight + 'px';
	}
	setTimeout(setCurrent, 30*1000);
}

function readChannels(response) {
	initTimeline();
	window.channels = response.entries;
	var y=20;
	var html = '';
	var channels = new Array();
	for (var i in response.entries) {
		var e = response.entries[i];
		var tags = ',0,'+e.tags+',';
		if (tags.indexOf(','+selectedTag+',') >= 0) {
			var sortNo = e.number!=undefined?e.number:9999;
			if (channels[sortNo] == undefined) channels[sortNo] = new Array();
			channels[sortNo][channels[sortNo].length] = e;
		}
	}
	for (var i in channels) {
		for (var j in channels[i]) {
			var e = channels[i][j];
      var ci = e.chicon || e.ch_ico || '';
			html += '<div id="c_'+e.chid+'" style="left:0px;top:'+y+'px;" class="channelinfo"><h1>'+e.name+'</h1>';
			var streamUrl = window.location.protocol+'//'+window.location.host+'/stream/channelid/'+e.chid;
			html += '<h2>'+icon('control_play.png') + l('liveTv')+'</h2><p>'+streamUrl+'</p>';
			html += '<p><a target="_blank" href="'+streamUrl+'"><button>HTTP</button></a>';
			html += '<a target="_blank" href="buzzplayer://'+streamUrl+'"><button>Buzzplayer</button></a></p>';
			html += '<hr><h2>'+icon('tag_blue.png') + l('tags') + '</h2><p>' + tagSelect + '</p>';
			html += '</div>';
			html += '<img id="i_'+e.chid+'" height="'+lh+'px" onclick="showChannel('+e.chid+');" class="channel" src="'+ci+'" alt="'+e.name+'" title="'+e.name+'" style="left:0px;top:'+y+'px;" />';
			channelToY[e.name] = y;
			y+=lh+gap;
			maxHeight = y;
		}
	}
	loadEpg();
	append('<div id="logos" style="height:'+y+'px;">'+html+'</div>');
	setCurrent();
}

function readContentGroups(response) {
	for (var i=0; i<response.entries.length; i++) {	
		var e = response.entries[i];
		window.contentGroups[e.code] = e.name;
	}
	doPost("confignames", readConfigs, "op=list");
}

function init() {
	doGet("ecglist", readContentGroups);
}
