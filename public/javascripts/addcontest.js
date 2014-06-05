//left
var $addcontest = $('#addcontest')
,	c_type = $addcontest.attr('type')
,	cid = $addcontest.attr('cid')
,	$date = $('#datepicker');

$(document).ready(function() {
	var date = $date.val();
	if (!date) date = getDate().split(' ')[0];
	$date.Zebra_DatePicker({
		show_icon	: false,
		offset		: [-20,270]
	}).val(date);
});

var $title = $('#Title')
,	$hour = $('#hour')
,	$min = $('#min')
,	$dd = $('#dd')
,	$hh = $('#hh')
,	$mm = $('#mm')
,	$psw = $('#psw')
,	$desc = $('#desc')
,	$anc = $('#anc')
,	$submit = $('#submit')
,	$err = $('#err');

function nan(n) {
  return n != n;
}

function limit($i) {
	$i.keyup(function(){
		var tp = parseInt($(this).val(), 10);
		if (nan(tp)) {
			tp = '';
		}
		$(this).val(tp);
	});
}

$(document).ready(function(){
	limit($hour);
	limit($min);
	limit($dd);
	limit($hh);
	limit($mm);
});

//right
var $add = $('#add')
,	$del = $('a.delete')
,	$pid_in = $('input.probnum')
,	$alias_in = $('input.alias')
,	$p_index = $('td.p_index')
,	$p_title = $('td.title')
,	$addprob = $('#addprob')
,	F = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function init() {
	$del.unbind();
	$pid_in.unbind();
	$del = $('a.delete');
	$pid_in = $('input.probnum');
	$alias_in = $('input.alias');
	$p_index = $('td.p_index');
	$p_title = $('td.title');
	$.each($p_index, function(i, p){
		$(p).text(F[i]);
	});
}

var timeout, ajax;

function getProblem($p, $t) {
	return ($.ajax({
		type : 'POST',
		url : '/getProblem',
		data : { pid: $p.val() },
		dataType : 'text',
		error: function() {
			$t.removeClass('success-text')
			.addClass('error-text')
			.text('无法连接到服务器！');
		}
	})
	.done(function(res){
		if (!res) {
			$t.removeClass('success-text')
			.addClass('error-text')
			.text('No Such Problem!');
		} else {
			$t.removeClass('error-text')
			.addClass('success-text')
			.text(res);
		}
	}));
}

function bind() {
	$.each($del, function(i, p){
		$(p).click(function(){
			$(this).parent().parent().remove();
			init();
			bind();
		});
	});
	$.each($pid_in, function(i, p){
		$(p).keyup(function(){
			clearTimeout(timeout);
			if (ajax)
				ajax.abort();
			timeout = setTimeout(function(){
				ajax = getProblem($(p), $p_title.eq(i));
			}, 100);
		});
	});
}

$(document).ready(function(){
	if ($add.length) {
		bind();
		$add.click(function(){
			if ($pid_in.length >= 26) {
				return false;
			}
			var html = '<tr><td>'
			html += '<a title="delete" href="javascript:;" class="img_link mc user user-red delete"></a>';
			html += '</td><td><input type="text" class="probnum input-mini"'
			if ($pid_in.length) {
				var pid = parseInt($pid_in.last().val(),10)+1;
				if (pid) {
					html += 'value="'+pid+'"';
				}
			}
			html += '/></td>';
			html += '<td><input type="text" class="alias input-medium" /></td>';
			html += '<td class="bold p_index"></td>';
			html += '<td class="error-text title" style="text-align:left;">';
			html += '</td></tr>';
			$addprob.append(html);
			init();
			bind();
			getProblem($pid_in.last(), $p_title.last());
		});
	}
});

//submit
$(document).ready(function(){
	$submit.click(function(){
		if ($(this).hasClass('disabled')) {
			return false;
		}
		var title = JudgeString($title.val());
		if (!title) {
			errAnimate($err, 'Contest title can not be empty!');
			return false;
		}
		var date = $date.val()
		,	hour = parseInt($hour.val(), 10)
		,	min = parseInt($min.val(), 10);
		if (!date ||
			nan(hour) || hour < 0 || hour > 23 ||
			nan(min) || min < 0 || min > 59) {
			errAnimate($err, 'The format of Begin Time is not Correct!');
			return false;
		}
		var dd = parseInt($dd.val(), 10)
		,	hh = parseInt($hh.val(), 10)
		,	mm = parseInt($mm.val(), 10);
		if (nan(dd) || nan(hh) || nan(mm) ||
			dd < 0 || hh < 0 || mm < 0) {
			errAnimate($err, 'The format of Length is not Correct!');
			return false;
		}
		var desc = JudgeString($desc.val())
		,	anc = JudgeString($anc.val())
		,	pids, alias
		,	psw;
		if ($psw.length) {
			psw = $psw.val();
		} else {
			psw = $('input[name="psw"]:checked').val();
		}

		if ($p_title.hasClass('error-text')) {
			errAnimate($err, 'one or more Valid problem has been found!');
			return false;
		}
		pids = new Array(); alias = new Array();
		$.each($pid_in, function(i, p){
			var tp = parseInt($(p).val(), 10);
			pids.push(tp);
			var tmp = JudgeString($alias_in.eq(i).val());
			if (!tmp) tmp = ' ';
			alias.push(tmp);
		});

		$(this).addClass('disabled');
		$.ajax({
			type: 'POST',
			url: '/addcontest',
			dataType: 'text',
			data: {
				cid 	: cid,
				type 	: c_type,
				title 	: title,
				date 	: date,
				hour 	: hour,
				min 	: min,
				dd 		: dd,
				hh 		: hh,
				mm 		: mm,
				psw 	: psw,
				desc 	: desc,
				anc 	: anc,
				pids 	: pids,
				alias 	: alias
			},
			timeout: 5000
		}).done(function(res){
			window.location.href = '/onecontest/' + res;
		});
	});
});