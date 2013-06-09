
var Query = {pagenum:25};
var cnt;
var searchTimeout;
var ProblemsetAPI = {}, search_str, pageAPI = {};
var ProbStatus;

var $tablebg = $('div.tablebg');
var $pagehead = $tablebg.find('div.pagination ul');
var $pages = $pagehead.find('li');
var $tbody = $tablebg.find('table#problemset tbody');
var $search = $tablebg.find('input#search');

function Bind() {
	$('a[tag]').click(function(){
		$search.val($(this).text());
		$search.keyup();
	});
	$('a.submit').click(function(){
		if ($logindialog.length > 0) {
            nextURL = '/submit?pID=' + $(this).attr('pid');
            $logindialog.jqmShow();
        } else window.location.href = '/submit?pID=' + $(this).attr('pid');
	});
}

function post() {
	$.ajax({
		type: 'POST',
		url: '/problemset',
		dataType: 'json',
		data: Query,
		timeout: 5000
	})
	.done(Response);
}

function CacheResponse() {
	$.post('/probQuery', {page:Query.page, search:Query.search}, function(){
		updatePage( pageAPI[search_str] );
		$tbody.html( ProblemsetAPI[search_str] );
		Bind();
	});
}

function ClickResponse() {
	if ($(this).hasClass('active') || $(this).hasClass('nothing'))
		return false;
	Query.page = $(this).attr('id');

	//检查缓存
	search_str = Query.search+'-'+Query.page;
	if (ProblemsetAPI[search_str]) CacheResponse();
	else post();

	$search.focus();
	var str = $search.val();
	if (str) $search.val(''), $search.val(str);
}

function updatePage(n) {
	if (n <= 0) n = 1;
	var pn = parseInt((n+Query.pagenum-1)/Query.pagenum);
	$pagehead.html(buildPager(Query.page, pn));
	$pages = $pagehead.find('li');
	$pages.click(ClickResponse);
}

function buildRow(prob) {
	var html = '<tr class="';
	if (cnt % 2 == 1) html += 'odd';
	else html += 'even';
	++cnt;
	html += '">';

	html += '<td style="text-align:center;"';
	var res = '';
	if (ProbStatus[prob.problemID]) {
		if (ProbStatus[prob.problemID] == '2') res = 'AC';
		else res = 'WA';
	}
	if (res) html += ' class="'+res+'"';
	html += '>'+prob.problemID+'</td>';
	html += '<td><a href="/problem?pID='+prob.problemID+'">'+prob.title+'</a>';
	html += '<div class="table-tab prob-tag">';
	if (prob.tags) {
		var Pt = prob.tags;
		for (var i = 0; i < Pt.length; i++) {
			var p = Pt[i];
			if (i > 0) html += ', ';
			var j = parseInt(p);
			html += '<a tag="'+j+'" href="javascript:;" title="'+ProTil[j]+'">'+Tag[j]+'</a>';
		}
	}

	html += '<td class="user-gray ellipsis" title="'+prob.source+'">'+prob.source+'</td>';

	html += '</div></td><td';
	if (res) html += ' class="'+res+'-fill"';
	html += '><span class="act-item"><a class="submit" href="javascript:;" pid="'+prob.problemID+'">';
	html += '<img src="/img/submit.png" title="Submit" alt="Submit"/>';
	html += '</a></span>';
	//html += '<span class="act-item"><img src="/img/star.png" title="Add to favourites"/></span>';
	html += '</td>';

	var ratio = 0;
	if (prob.submit > 0) ratio = prob.AC*100 / prob.submit;
	html += '<td style="text-align:center;">';
	html += ratio.toFixed(2)+'% (<a href="/status?pID='+prob.problemID+'&result=2">';
	html += prob.AC+'</a>/<a href="/status?pID='+prob.problemID+'">'+prob.submit+'</a>)';
	html += '</td>';

	html += '</tr>';
	return html;
}

function Response(json) {
	ProbStatus = json.pop();
	pageAPI[search_str] = json.pop();
	updatePage(pageAPI[search_str]);
	if (json.length == 0) {
		ProblemsetAPI[search_str] = '<tr class="odd"><td class="error-text center" colspan="5">No Problems are matched.</td></tr>';
	}
	else {
		cnt = 1;
		ProblemsetAPI[search_str] = $.map(json, buildRow).join('');
	}
	$tbody.html( ProblemsetAPI[search_str] );
	Bind();
}

$(document).ready(function(){
	Query.page = $pagehead.attr('id'); $pagehead.removeAttr('id');
	var tps = trim($search.val());
	Query.search = tps;
	Query.tag = new Array();
	var pattern = new RegExp("^.*"+toEscape(tps)+".*$", "i");
	if (pattern) for (i = 0; i < Tag.length; i++) {
		if (pattern.test(Tag[i])) {
			Query.tag.push(i);
		}
	}
	search_str = Query.search+'-'+Query.page;
	post();

	$search.keyup(function(){
		var tp = trim($(this).val());
		if (Query.search != tp) {
			clearTimeout(searchTimeout);
			Query.search = tp;
			Query.page = 1;
			Query.tag = [];
			var pattern = new RegExp("^.*"+toEscape(tp)+".*$", "i");
			for (i = 0; i < Tag.length; i++) {
				if (pattern.test(Tag[i])) {
					Query.tag.push(i);
				}
			}
			//检查缓存
			search_str = Query.search+'-'+Query.page;
			if (ProblemsetAPI[search_str]) CacheResponse();
			else searchTimeout = setTimeout(post, 300);
		}
	});
});
