
var Query = {pagenum:25};
var cnt, Users;
var searchTimeout;
var regAPI = {}, search_str, pageAPI = {};

var $tablebg = $('div.tablebg');
var $pagehead = $tablebg.find('div.pagination ul');
var $pages = $pagehead.find('li');
var $tbody = $tablebg.find('table#regform tbody');
var $search = $tablebg.find('input#search');

var $info = $('#info');
var cid = $pagehead.attr('cid');
var startTime = $pagehead.attr('st');

//register dialog
var $regcolog = $('div#regcolog');
var $number = $regcolog.find('#number');
var $realname = $regcolog.find('#realname');
var $grade = $regcolog.find('#grade');
var $regc_submit = $regcolog.find('#regc_submit');
var $regerror = $regcolog.find('#regc_error');

var $checkbox;
var $regsubmit = $('#regupdate');

function Bind() {
	$checkbox = $(':checkbox');
	var cbox = new Array();
	$.each($checkbox, function(i, p){
		cbox.push(p);
	});
	cbox.forEach(function(p, i){
		$(p).change(function(){
			if (p.checked) {
				if (i % 2 == 0) cbox[i+1].checked = false;
				else cbox[i-1].checked = false
			}
		});
	});
}

function post() {
	$.ajax({
		type: 'POST',
		url: '/regform',
		dataType: 'json',
		data: Query,
		timeout: 5000
	})
	.done(Response);
}

function CacheResponse() {
	$.post('/regQuery', {page:Query.page, search:Query.search}, function(){
		updatePage( pageAPI[search_str] );
		$tbody.html( regAPI[search_str] );
		if ($regsubmit.length > 0) Bind();
	});
}

function ClickResponse() {
	if ($(this).hasClass('active') || $(this).hasClass('nothing'))
		return false;
	Query.page = $(this).attr('id');

	//检查缓存
	search_str = Query.search+'-'+Query.page;
	if (regAPI[search_str]) CacheResponse();
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

function buildRow(reg) {
	var html = '<tr class="';
	if (cnt % 2 == 1) html += 'odd';
	else html += 'even';

	if (reg.user == current_user) html += ' highlight';
	else if (reg.sex == '1') html += ' girllight'
	html += '">';

	html += '<td>'+reg.regID+'</td>';
	var pvl = parseInt(Users[reg.user]);
	html += '<td><a href="/user/'+reg.user+'" class="user user-';
	html += UserCol(pvl)+'" title="'+UserTitle(pvl)+'">'+reg.user+'</a></td>';
	html += '<td>'+reg.number+'</td>';
	html += '<td>'+reg.realname+'</td>';

	var sex = '男';
	if (reg.sex == '1') sex = '女';
	html += '<td>'+sex+'</td>';
	html += '<td>'+reg.college+'</td>';
	html += '<td>'+reg.grade+'</td>';
	html += '<td>'+reg.regTime+'</td>';
	if ($regsubmit.length > 0 && reg.status == '0') {
		html += '<td><input type="checkbox"/></td><td><input type="checkbox"/></td>'
	} else {
		html += '<td colspan="2" class="';
		var status = 'Pending...';
		if (reg.status == '2') {
			status = 'Accepted';
			html += 'success-text';
		} else if (reg.status == '1') {
			status = 'Rejected';
			html += 'error-text';
		} else html += 'info-text';
		if ($regsubmit.length > 0) html += ' colspan="2"';
		html += '">'+status+'</td>';
	}
	html += '</tr>';
	++cnt;
	return html;
}

function Response(json) {
	Users = json.pop();
	pageAPI[search_str] = json.pop();
	updatePage(pageAPI[search_str]);
	if (json.length == 0) {
		var cs = 9;
		if ($regsubmit.length > 0) ++cs;
		regAPI[search_str] = '<tr class="odd"><td class="error-text center" colspan="'+cs+'">No Records are found.</td></tr>';
	} else {
		cnt = 1;
		regAPI[search_str] = $.map(json, buildRow).join('');
	}
	$tbody.html( regAPI[search_str] );
	if ($regsubmit.length > 0) Bind();
}

$(document).ready(function(){
	Query.page = $pagehead.attr('id');
	Query.cid = cid;
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
			if (regAPI[search_str]) CacheResponse();
			else searchTimeout = setTimeout(post, 300);
		}
	});
});

$(document).ready(function(){
	var btn = '<div><button id="signup" class="error-text">';
	if ($info.length > 0) {
		var left = calTime(current_time, startTime) - 300;
		if (left > 0) {
			var html = '<span class="error-text" style="margin-right:10px;">报名火热进行中...</span>';
			html += '<img src="/img/hot.gif"/>';
			btn += '我要报名</button><span class="user-gray">（注：重复报名可修改信息并重新审核）</span></div>';
			$info.prepend(html);
			$search.parent().before(btn);
		} else $info.prepend('<span class="success-text">报名已结束</span>');
	} else {
		btn += '申请认证</button><span class="user-gray">（注：重复申请可修改信息并重新审核）</span></div>';
		$search.parent().before(btn);
	}

	if ($regsubmit.length > 0) {
		$regsubmit.click(function(){
			var names = new Array(), flg = false;
			$.each($checkbox, function(i, p){
				if (p.checked) {
					flg = true;
					var $td = $(this).parent().parent().children('td');
					var q = {rid:$td.eq(0).text()};
					if (i % 2 == 0) {
						q.status = '2';
						q.cid = cid;
						q.name = $td.eq(1).text();
						if (cid >= 1000) names.push('!'+q.name);
					} else q.status = '1';
					q.number = $td.eq(2).text();
					q.realname = $td.eq(3).text();
					var sex = $td.eq(4).text();
					if (sex == '男') q.sex = '0';
					else q.sex = '1';
					q.college = $td.eq(5).text();
					q.grade = $td.eq(6).text();
					$.post('/regUpdate', q);
				}
			});
			if (flg) {
				if (cid >= 1000) {
					$.post('/regContest', {names:names,cid:cid}, function(){
						window.location.reload(true);
					});
				}
			} else ShowMessage('无用的操作');
		});
		$('#accept').click(function(){
			$.each($checkbox, function(i, p){
				if (i % 2 == 0) p.checked = true;
				else p.checked = false;
			});
		});
		$('#reject').click(function(){
			$.each($checkbox, function(i, p){
				if (i % 2 == 1) p.checked = true;
				else p.checked = false;
			});
		});
	}

	if ($regcolog.length > 0) {
		$regcolog.jqm({
			overlay: 30,
			trigger: false,
			modal: true,
			closeClass: 'regc_close',
			onShow: function(h){
				h.o.fadeIn(200);
				h.w.fadeIn(200);
			},
			onHide: function(h){
				h.w.fadeOut(200);
				h.o.fadeOut(200);
			}
		}).jqDrag('.jqDrag').jqResize('.jqResize');
		$('button#signup').click(function(){
			var left = calTime(current_time, startTime) - 300;
			if (left <= 0) {
				window.location.reload(true);
				return false;
			}
			if ($logindialog.length > 0) {
				nextURL = '';
				$logindialog.jqmShow();
				return false;
			}
			if (current_user == 'admin') {
				ShowMessage('管理员无需注册。');
				return false;
			}
			$regcolog.jqmShow();
			$number.val($number.val());
			$regc_submit.click(function(){
				var num = $number.val();
				if (!num) {
					$regerror.text('学号不能为空!');
					return false;
				}
				var pattern = new RegExp('^[0-9]*$');
				if (!pattern.test(num)) {
					$regerror.text('学号只能由数字组成!');
					return false;
				}
				var name = $realname.val();
				if (!name) {
					$regerror.text('姓名不能为空!');
					return false;
				}
				pattern = new RegExp('^([\u3007\u3400-\u4DB5\u4E00-\u9FCB\uE815-\uE864]|[\uD840-\uD87F][\uDC00-\uDFFF])*$');
				if (!pattern.test(name)) {
					$regerror.text('姓名只能由汉字组成!');
					return false;
				}
				$.post('/doRegCon', {
					cid: cid,
				    number: num,
				    realname: name,
				    sex: $regcolog.find('#sex').val(),
				    college: $regcolog.find('#college').val(),
				    grade: $grade.val()
				}, function(){
					window.location.reload(true);
				});
			});
		});
		$number.keyup(function(e){
            if (e.keyCode == 13) {
                $regc_submit.click();
            }
            return false;
        });
        $realname.keyup(function(e){
            if (e.keyCode == 13) {
                $regc_submit.click();
            }
            return false;
        });
        $grade.keyup(function(e){
            if (e.keyCode == 13) {
                $regc_submit.click();
            }
            return false;
        });
	}
});

var $ch_div = $('div#change-grade');
var $ch_input = $ch_div.find('input');
var $ch_submit = $ch_div.find('a');

$(document).ready(function(){
	$ch_submit.click(function(){
		var user = $ch_input.eq(0).val();
		if (!user) {
			ShowMessage('The user cannot be empty.');
			return false;
		}
		var grade = $ch_input.eq(1).val();
		if (!grade) {
			ShowMessage('The grade cannot be empty.');
			return false;
		}
		$.post('/changeGrade', {cid:cid, name:user, grade:grade}, function(){
			window.location.reload(true);
		});
	});
});