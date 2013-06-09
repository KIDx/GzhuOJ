
var Query = {pagenum:25};
var cnt;
var searchTimeout, Users;
var StatusAPI = {}, search_str = '', pageAPI = {}, z = '';

var $tablebg = $('div.tablebg');
var $pagehead = $tablebg.find('div.pagination ul');
var $pages = $pagehead.find('li');
var $tbody = $tablebg.find('table#statustable tbody');
var $search = $tablebg.find('input#search');
var $what = $tablebg.find('select#what');
var $pid = $tablebg.find('input#pID');

var $Filter = $tablebg.find('button#filter');

var iname = $pagehead.attr('name');
var ipid = $pagehead.attr('pid');
var iresult = $pagehead.attr('result');

function post() {
	$.ajax({
		type: 'POST',
		url: '/status',
		dataType: 'json',
		data: Query,
		timeout: 5000
	})
	.done(Response);
}

function CacheResponse() {
	updatePage( pageAPI[search_str] );
	$tbody.html( StatusAPI[search_str] );
	BindCE();
}

function ClickResponse() {
	if ($(this).hasClass('active') || $(this).hasClass('nothing'))
		return false;
	Query.page = $(this).attr('id');

	//检查缓存
	search_str = Query.search+'-'+Query.page+'-'+Query.what+'-'+Query.pid;
	if (StatusAPI[search_str]) CacheResponse();
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

function buildRow(sol) {
	var html = '<tr class="';
	if (cnt % 2 == 1) html += 'odd';
	else html += 'even';
	++cnt;
	if (sol.userName == current_user) html += ' highlight';
	html += '">';

	html += '<td>'+sol.runID+'</td>';
	var pvl = parseInt(Users[sol.userName]);
	html += '<td><a href="/user/'+sol.userName+'" class="user user-';
	html += UserCol(pvl)+'" title="'+UserTitle(pvl)+'">'+sol.userName+'</a></td>';
	html += '<td><a href="/problem?pID='+sol.problemID+'">'+sol.problemID+'</a></td>';
	html += '<th';
	if (sol.result == 8 && (sol.userName == current_user || current_user == 'admin')) {
		html += '><a href="javascript:;" title="more information" rid="'+sol.runID+'" class="CE '+Col(sol.result)+'">'+Res(sol.result)+'</a>';
	} else {
		html += ' class="'+Col(sol.result)+'">'+Res(sol.result);
		if (sol.result < 2) html += '...';
	}
	html += '</th>';

	var tpstr = '---', watch = 0;

	if (sol.cID == -1 || current_user == sol.userName) {
		watch = 1;
		tpstr = sol.time+' MS';
	}
	if (sol.result == 0) {
		tpstr = '<img src="img/pending.gif"/><img style="display:none;width:14px;height:14px;" src="img/running.gif"/>';
	} else if (sol.result == 1) {
		tpstr = '<img style="display:none;" src="img/pending.gif"/><img style="width:14px;height:14px;" src="img/running.gif"/>';
	}
	html += '<td>'+tpstr+'</td>';
	tpstr = '---';
	if (watch == 1) {
		tpstr = sol.memory+' KB';
	}
	html += '<td>'+tpstr+'</td>';

	var lang = sol.language, str = 'C';
	if (lang == 2) str = 'C++';
	else if (lang == 3) str = 'Java';
	
	if (sol.userName == current_user || current_user == 'admin') {
		html += '<td><a href="/sourcecode?runID='+sol.runID+'" target="_blank">'+str+'</a></td>'
	} else {
		html += '<td>'+str+'</td>';
	}

	if (watch == 1) {
		tpstr = sol.length+' B';
	}
	html += '<td>'+tpstr+'</td>';
	html += '<td>'+sol.inDate+'</td>';
	html += '</tr>';
	return html;
}

function Response(json) {
	Users = json.pop();
	pageAPI[search_str] = json.pop();
	updatePage(pageAPI[search_str]);
	if (json.length == 0) {
		StatusAPI[search_str] = '<tr class="odd"><td class="error-text center" colspan="9">No Status are matched.</td></tr>';
	} else {
		cnt = 1;
		StatusAPI[search_str] = $.map(json, buildRow).join('');
	}
	$tbody.html( StatusAPI[search_str] );
	BindCE();
}

function Run() {
	var ts = trim($search.val()), tp = trim($pid.val()), tw = $what.val();
	if (Query.search != ts || Query.pid != tp || Query.what != tw) {
		Query.search = ts;
		Query.pid = tp;
		Query.what = tw;
		clearTimeout(searchTimeout);
		//检查缓存
		Query.page = 1;
		search_str = Query.search+'-'+Query.page+'-'+Query.what+'-'+Query.pid;
		if (StatusAPI[search_str]) CacheResponse();
		else searchTimeout = setTimeout(post, 300);
	}
}

$(document).ready(function(){
	Query.page = 1;
	if (iname) $search.val(iname);
	if (ipid) $pid.val(ipid);
	if (iresult) $what.val(iresult);
	Query.search = trim($search.val());
	Query.pid = trim($pid.val());
	Query.what = $what.val();
	search_str = Query.search+'-'+Query.page+'-'+Query.what+'-'+Query.pid;
	post();

	$Filter.click(Run);

	$('button#reset').click(function(){
		$search.val('');
		$pid.val('');
		$what.val(-1);
		$Filter.click();
	});

	$search.keyup(function(e){
		if (e.keyCode == 13) {
			$Filter.click();
		}
		return false;
	});

	$pid.keyup(function(e){
		if (e.keyCode == 13) {
			$Filter.click();
		}
		return false;
	});
});
