
var Query = {pagenum:25};
var cnt;
var searchTimeout;
var rankAPI = {}, search_str, pageAPI = {};

var $tablebg = $('div.tablebg');
var $pagehead = $tablebg.find('div.pagination ul');
var $pages = $pagehead.find('li');
var $tbody = $tablebg.find('table#rank tbody');
var $search = $tablebg.find('input#search');
var SigWidth = $tablebg.find('table#rank th').eq(2).innerWidth()*0.8;

function post() {
	$.ajax({
		type: 'POST',
		url: '/ranklist',
		dataType: 'json',
		data: Query,
		timeout: 5000
	})
	.done(Response);
}

function CacheResponse() {
	$.post('/rankQuery', {page:Query.page, search:Query.search}, function(){
		updatePage( pageAPI[search_str] );
		$tbody.html( rankAPI[search_str] );
	});
}

function ClickResponse() {
	if ($(this).hasClass('active') || $(this).hasClass('nothing'))
		return false;
	Query.page = $(this).attr('id');

	//检查缓存
	search_str = Query.search+'-'+Query.page;
	if (rankAPI[search_str]) CacheResponse();
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

function buildRow(user) {
	if (user.name == 'admin') return '';
	var html = '<tr class="';
	if (cnt % 2 == 1) html += 'odd';
	else html += 'even';
	html += '">';

	html += '<td>'+((Query.page-1)*Query.pagenum+cnt)+'</td>';
	
	var style = 'user ', title;
	var pvl = parseInt(user.privilege);
	style += 'user-'+UserCol(pvl);
	title = UserTitle(pvl);
	html += '<td><a class="'+style+'" title="'+title+'" href="/user/'+user.name+'">'+user.name+'</a></td>';
	html += '<td class="ellipsis"><span class="user-gray">'+user.nick+'</span></td>'
	html += '<td class="ellipsis">';
	if (user.signature) html += user.signature;
	html += '</td>';
	html += '<td><a href="status/?user='+user.name+'&result=2">'+user.solved+'</a></td>';
	html += '<td><a href="status/?user='+user.name+'">'+user.submit+'</a></td>';
	var ratio = 0;
	if (user.submit > 0) ratio = user.solved*100/user.submit;
	html += '<td>'+ratio.toFixed(2)+'%</td>';
	html += '</tr>';
	++cnt;
	return html;
}

function Response(json) {
	pageAPI[search_str] = json.pop();
	updatePage(pageAPI[search_str]);
	if (json.length == 0) {
		rankAPI[search_str] = '<tr class="odd"><td class="error-text center" colspan="7">No Users are matched.</td></tr>';
	} else {
		cnt = 1;
		rankAPI[search_str] = $.map(json, buildRow).join('');
	}
	$tbody.html( rankAPI[search_str] );
}

$(document).ready(function(){
	Query.page = $pagehead.attr('id');
	Query.search = trim($search.val());
	search_str = Query.search+'-'+Query.page;
	post();

	$search.keyup(function(){
		var tp = trim($(this).val());
		if (Query.search != tp) {
			clearTimeout(searchTimeout);
			Query.search = tp;
			//检查缓存
			Query.page = 1;
			search_str = Query.search+'-'+Query.page;
			if (rankAPI[search_str]) CacheResponse();
			else searchTimeout = setTimeout(post, 300);
		}
	});
});
