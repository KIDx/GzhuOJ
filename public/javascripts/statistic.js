
var Query = {pagenum:25};
var presearch = '', cnt;

//current sort key
var CSK = 0;
var StatisticAPI = {}, search_str, pageAPI = {}, Users = {};

var $tablebg = $('div.tablebg');
var $pagehead = $tablebg.eq(1).find('div.pagination ul');
var $pages = $pagehead.find('li');
var $tbody = $tablebg.eq(1).find('table#statistic tbody');
var $search = $tablebg.eq(1).find('select#search');
var $sortkey = $tablebg.eq(1).find('thead tr a');

function post() {
	$.ajax({
		type: 'POST',
		url: '/statistic',
		dataType: 'json',
		data: Query,
		timeout: 5000
	})
	.done(Response);
}

function CacheResponse() {
	updatePage( pageAPI[search_str] );
	$tbody.html( StatisticAPI[search_str] );
}

function ClickResponse() {
	if ($(this).hasClass('active') || $(this).hasClass('nothing'))
		return false;
	Query.page = $(this).attr('id');

	//检查缓存
	search_str = Query.search+'-'+Query.page+'-'+Query.sort;
	if (StatisticAPI[search_str]) CacheResponse();
	else post();
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
	if (sol.userName == current_user) html += ' highlight';
	html += '">';

	var rank = (Query.page-1)*Query.pagenum+cnt;
	html += '<td>'+rank+'</td>';
	++cnt;
	
	var pvl = parseInt(Users[sol.userName]);
	html += '<td><a href="/user/'+sol.userName+'" class="user user-';
	html += UserCol(pvl)+'" title="'+UserTitle(pvl)+'">'+sol.userName+'</a></td>';

	html += '<td>'+sol.time+' MS</td>';
	html += '<td>'+sol.memory+' KB</td>';

	var str = 'C';
	if (sol.language == 2) str = 'C++';
	else if (sol.language == 3) str = 'Java';
	html += '<td>'+sol.length+' B</td><td>';
	if (current_user == sol.userName || current_user == 'admin')
		html += '<a href="/sourcecode?runID='+sol.runID+'">'+str+'</a>';
	else html += str;
	html += '</td><td>'+sol.inDate+'</td>';

	html += '</tr>';
	return html;
}

function Response(json) {
	Users = json.pop();
	var tp = json.pop().split('-');
	pageAPI[search_str] = parseInt(tp[0]);
	if (!Query.amount) {
		$tablebg.eq(0).find('table tbody tr').find('td:eq(1)').each(function(i){
			$(this).text(tp[i+1]);
		});
	}
	updatePage(pageAPI[search_str]);
	if (json.length == 0) {
		StatisticAPI[search_str] = '<tr class="odd"><td class="error-text center" colspan="7">No Status are matched.</td></tr>';
	} else {
		cnt = 1;
		StatisticAPI[search_str] = $.map(json, buildRow).join('');
	}
	$tbody.html( StatisticAPI[search_str] );
}

function Run() {
	Query.search = $search.val();
	Query.amount = 1;
	presearch = Query.search;
	//检查缓存
	Query.page = 1;
	search_str = Query.search+'-'+Query.page+'-'+Query.sort;
	if (StatisticAPI[search_str]) CacheResponse();
	else post();
}

$(document).ready(function(){
	Query.page = 1;
	Query.sort = 1;
	Query.pid = $pagehead.attr('id');
	presearch = Query.search = $search.val();
	search_str = Query.search+'-'+Query.page+'-'+Query.sort;
	post();

	$search.change(Run);

	var pre = 1;
	$sortkey.click(function(i, e){
		if ($(this).hasClass('current')) return false;
		$sortkey.eq(pre-1).removeClass('current');
		$(this).addClass('current');
		pre = Query.sort = $(this).attr('id');
		Run();
	});
});

$divback = $('div.back');
$sortkey = $tablebg.eq(1).find('table#statistic > thead > tr > th > a');

$(document).ready(function(){
	var code = new Array, w = new Array;
	$sortkey.each(function(i){
		code.push($(this).offset());
		w.push($(this).innerWidth());
		$(this).mouseenter(function(){
			if (i == CSK) return false;

			$divback.stop().stop();
			var ch, move = code[i].left-$divback.offset().left;
			var d = move*0.1; if (d < 0) d = -d;
			if (move < 0) ch = '+=', move -= d;
			else ch = '-=', move += d;

			$divback.animate({
				left: '+='+move+'px',
				width: w[i]
			}, 500).animate({left: ch+d}, 300);
		});
		$(this).mouseleave(function(){
			if (i == CSK) return false;

			$divback.stop().stop();
			var ch, move = code[CSK].left-$divback.offset().left;
			var d = move*0.1; if (d < 0) d = -d;
			if (move < 0) ch = '+=', move -= d;
			else ch = '-=', move += d;

			$divback.animate({
				left: '+='+move+'px',
				width: w[CSK]
			}, 500).animate({left: ch+d}, 300);
		});
		$(this).click(function(){CSK=i;});
	});
	$divback.offset(code[0]);
	$divback.css({width:w[0]+'px'});
	
});