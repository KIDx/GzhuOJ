
//first document ready
var Query = {pagenum:25};
var left = {};
var cnt;
var searchTimeout;
var ContestAPI = {}, search_str, pageAPI = {};

var $tablebg = $('div.tablebg');
var $pagehead = $tablebg.find('div.pagination ul');
var $pages = $pagehead.find('li');
var $tbody = $tablebg.find('table#contest tbody');
var $search = $tablebg.find('#search');

//second document ready
var $logcolog = $('div#logcolog');
var $contestpassword = $logcolog.find('#contest_password');
var $contestsubmit = $logcolog.find('#contest_submit');
var $contestloginerror = $logcolog.find('#contest_error');
var $register;

function post() {
	$.ajax({
		type: 'POST',
		url: '/contest?type='+contest_type,
		dataType: 'json',
		data: Query,
		timeout: 5000
	})
	.done(Response);
}

var passTime = 0, timer;
function Timer() {
	$.each($register, function(){
		var cid = $(this).attr('id');
		var tp = left[cid] - passTime;
		if (tp <= 0) {
			$(this).parent().html('<span class="user-gray">Register Closed</span>');
		} else {
			var $pre = $(this).prev();
			if ($pre.text() != deal(tp))
				$pre.text(deal(tp));
		}
	});
	++passTime;
}

function Bind() {
	$('a.cid').click(function(){
		var str = $(this).attr('id').split('-');
		var cid = parseInt(str[0]);
		var manager = str[1];
		$.post('/checkLogin', {cid:cid, manager:manager}, function(res){
			if (res) {
				window.location.href = '/onecontest?cID='+cid;
				return ;
			}
			$logcolog.jqmShow();
			$contestsubmit.click(function(){
				if (!$contestpassword.val()) {
					$contestloginerror.text('the password can not be empty!');
					return false;
				}
				$.post('/loginContest', {
					cid: cid,
					password: $contestpassword.val()
				}, function(res){
					if (res) {
						window.location.href = '/onecontest?cID=' + cid;
						return ;
					}
					$contestloginerror.text('the password is not correct!');
				});
			});
			$contestpassword.keyup(function(e){
				if (e.keyCode == 13) {
					$contestsubmit.click();
				}
				return false;
			});
		});
	});
	$('a.public').click(function(){
		if ($logindialog.length > 0) {
			nextURL = '';
			$logindialog.jqmShow();
			return false;
		}
		if (current_user == 'admin') {
			ShowMessage('管理员无需注册');
			return false;
		}
		var $clickreg = $(this);
		var cid = parseInt($clickreg.attr('id'));
		$.post('/contestReg', {cid:cid}, function(res){
			if (res) {
				window.location.reload(true);
				return ;
			}
			$clickreg.parent().html('<span class="accept hidden">Registeration Complete</span>');
			$('span.hidden').removeClass('hidden');
			ShowMessage('Your Registeration has been submited successfully!');
		});
	});
	$register = $('a.register');
	if ($register.length > 0) {
		clearInterval(timer);
		Timer();
		timer = setInterval(Timer, 1000);
	}
}

function CacheResponse() {
	$.post('/conQuery?type='+contest_type, Query, function(){
		updatePage( pageAPI[search_str] );
		$tbody.html( ContestAPI[search_str] );
		Bind();
	});
}

function ClickResponse() {
	if ($(this).hasClass('active') || $(this).hasClass('nothing'))
		return false;
	Query.page = $(this).attr('id');

	//检查缓存
	search_str = Query.search+'-'+Query.page;
	if (ContestAPI[search_str]) CacheResponse();
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

function buildRow(con) {
	var html = '<tr class="';
	if (cnt % 2 == 1) html += 'odd';
	else html += 'even';
	++cnt;
	html += '">';

	left[con.contestID] = calTime(current_time, con.startTime);
	var style = 'progress-success';
	if (left[con.contestID] > 0) style = '';
	else if (left[con.contestID]+con.len*60 > 0) style = 'progress-danger';

	html += '<td>'+con.contestID+'</td>';
	html += '<td style="text-align:left;">';
	if (contest_type != 2 && con.password) html += '<a href="javascript:;" id="'+con.contestID+'-'+con.userName+'" class="cid">';
	else html += '<a href="/onecontest?cID='+con.contestID+'">';
	html += con.title+'</a>';
	if (contest_type == 2) {
		html += '<div class="table-tab">';
		if (!style) {
			if (con.flg)
				html += '<span class="accept">Registration completed</span>'
			else {
				left[con.contestID] -= 300;
				if (left[con.contestID] <= 0) {
					html += '<span class="user-gray">Registration Closed</span>';
				} else {
					html += 'Until Closed: <span class="user-gray" style="margin-right:20px;">'+deal(left[con.contestID])+'</span>';
					if (con.password) html += '<a href="/regform/'+con.contestID+'" class="';
					else html += '<a href="javascript:;" class="public ';
					html += 'register" id="'+con.contestID+'">Register &gt&gt</a>';
				}
			}
		} else if (con.password) {
			html += '<a class="standings" href="/regform/'+con.contestID+'">Registration Form</a>';
		}
		html += '</div>';
	}
	html += '</td>';

	html += '<td>'+con.startTime+':00<div class="progress progress-striped active '+style;
	html += '" style="margin:0;height:12px;">';
	html += '<div class="bar" style="width:100%;z-index:1;"></div></div></td>'

	var str = '';
	var day = parseInt(con.len/1440);
	if (day > 0) str += day + '天';
	var hour = parseInt((con.len%1440) / 60);
	str += ' ';
	if (hour < 10) str += '0';
	str += hour;
	var min = con.len%1440 % 60;
	str += ':';
	if (min < 10) str += '0';
	str += min + ':00';
	html += '<td style="text-align:right;">'+str+'</td><td>';
	
	if (con.password) html += '<font color="green">Private';
	else html += '<font color="blue">Public';
	html += '</font>'

	html += '</td><td>'+con.userName+'</td>';

	html += '</tr>';
	return html;
}

function Response(json) {
	pageAPI[search_str] = json.pop();
	updatePage(pageAPI[search_str]);
	if (json.length == 0) {
		ContestAPI[search_str] = '<tr class="odd"><td class="error-text center" colspan="6">No Contests are matched.</td></tr>';
	}
	else {
		cnt = 1;
		ContestAPI[search_str] = $.map(json, buildRow).join('');
	}
	$tbody.html( ContestAPI[search_str] );

	Bind();	
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
			if (ContestAPI[search_str]) CacheResponse();
			else searchTimeout = setTimeout(post, 300);
		}
	});
});

$(document).ready(function(){
	if ($logcolog.length > 0) {
		$logcolog.jqm({
			overlay: 30,
			trigger: false,
			modal: true,
			closeClass: 'contestclose',
			onShow: function(h){
				h.o.fadeIn(200);
				h.w.fadeIn(200);
			},
			onHide: function(h){
				h.w.fadeOut(200);
				h.o.fadeOut(200);
			}
		}).jqDrag('.jqDrag').jqResize('.jqResize');
	}
});