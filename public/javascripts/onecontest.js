var $div = $('#thumbnail');

//deal with overflow rank table
$(document).ready(function(){
    $div.width($('#xbody').width());
});

//截流响应
var interceptorTime = 300
,	cnt;	//行号

var $contest = $('#contest')
,	ctype = parseInt($contest.attr('ctype'), 10)
,	pageNum = $contest.attr('pageNum')
,	display = $contest.attr('display')
,	contest_private = $contest.attr('psw')
,	startTime = parseInt($contest.attr('startTime'), 10)
,	status = parseInt($contest.attr('status'), 10)
,	pending = $contest.attr('pending')
,	TotalTime = parseInt($contest.attr('len'), 10)*60
,	cid = $contest.attr('cid')
,	passTime = -pending;

var $progress = $('#progress')
,	$bar = $progress.children('div.bar')
,	$info = $('#contest-info')
,	$contain = $('#info-contain')
,	$lefttime = $('#lefttime');

function buildPager(page, n) {
    var cp = 5, html = '<ul>';
    var i = page - 2; if (i <= 0) i = 1;

    html += '<li id="1"';
    if (page == 1) html += ' class="disabled"';
    html += '><a href="javascript:;">&lt&lt</a></li>';
    if (i > 1) {
    	html += '<li class="disabled"><a href="javascript:;">...</a></li>';
    }
    while (i < page)
    {
        html += '<li id="'+i+'"><a href="javascript:;">'+i+'</a></li>';
		++i; --cp;
    }
    html += '<li class="active"><a href="javascript:;">'+i+'</a></li>';
    while (i < n && cp > 1)
    {
    	++i; --cp;
        html += '<li id="'+i+'"><a href="javascript:;">'+i+'</a></li>';
    }
    if (i < n) html += '<li class="disabled"><a href="javascript:;">...</a></li>';
    html += '<li id="'+n+'"';
    if (n == 0 || page == n) html += ' class="disabled"';
    html += '><a href="javascript:;">&gt&gt</a></li></ul>';
    return html;
}

var $status = $div.find('#statustab')
,	$list = $('#list')
,	$list_a
,	$tablebg = $('div.tablebg')
,	$tbody = $tablebg.find('#statustable tbody')
,	$search = $('#search')
,	$pid = $('#pid')
,	$result = $('#result')
,	$Filter = $('#fil')
,	$plink
,	statusQ = { cid:cid, page:1 }
,	searchTimeout
,	Users;

function bindstatusQ() {
	var $af = $('a[res]');
	$af.unbind('click');
	$af.click(function(){
		$pid.val(F.charAt($(this).attr('pid')));
		$result.val($(this).attr('res'));
		$tablink.eq(2).click();
	});
}

function buildRow(sol) {
	var html = '<tr class="';
	if (cnt % 2 == 1) html += 'odd';
	else html += 'even';
	++cnt;
	if (sol.userName == current_user) html += ' highlight';
	html += '">';

	html += '<td>'+sol.runID+'</td>';
	var pvl = parseInt(Users[sol.userName], 10);
	html += '<td><a href="/user/'+sol.userName+'" class="user user-';
	html += UserCol(pvl)+'" title="'+UserTitle(pvl)+'">'+sol.userName+'</a></td>';
	html += '<td><a class="plink" href="#problem-'+pmap[sol.problemID]+'">'+pmap[sol.problemID]+'</a></td>';

	html += '<td rid="'+sol.runID+'"';
	if (sol.result == 8 && (sol.userName == current_user || current_user == 'admin')) {
		html += ' class="bold"><a href="javascript:;" rid="'+sol.runID+'" class="CE special-text">Compilation Error</a>';
	} else {
		html += ' class="bold '+Col(sol.result);
		if (sol.result == 0) html += ' unknow';
		html += '">'+Res(sol.result);
	}
	html += '</td>';

	var tpstr, tmp = '<span class="user user-gray">---</span>';
	if (sol.result == 0) {
		tpstr = '<img src="/img/pending.gif" width="16px" height="16px"/>';
	} else if (sol.result == 1) {
		tpstr = '<img src="/img/running.gif" width="16px" height="16px"/>';
	} else if (parseInt(sol.time, 10) >= 0) {
		tpstr = sol.time+' MS';
	} else {
		tpstr = tmp;
	}
	html += '<td>'+tpstr+'</td>';

	if (parseInt(sol.memory, 10) >= 0) {
		tpstr = sol.memory+' KB';
	} else {
		tpstr = tmp;
	}
	html += '<td>'+tpstr+'</td>';

	var lang = sol.language, str = 'C';
	if (lang == 2) str = 'C++';
	else if (lang == 3) str = 'Java';
	
	html += '<td><a target="_blank" href="/sourcecode/'+sol.runID+'">'+str+'</a></td>'

	if (parseInt(sol.length, 10) >= 0) {
		tpstr = sol.length+' B';
	} else {
		tpstr = tmp;
	}
	html += '<td>'+tpstr+'</td>';
	html += '<td>'+sol.inDate+'</td>';
	html += '</tr>';
	return html;
}

function Response(json) {
	if (!json) return ;
	Users = json.pop();
	var n = json.pop(), sols = json.pop();
	$list.html(buildPager(statusQ.page, n));
	var html;
	if (!sols || sols.length == 0) {
		html = '<tr class="odd"><td class="error-text center" colspan="9">No Status are matched.</td></tr>';
	} else {
		cnt = 1;
		html = $.map(sols, buildRow).join('');
	}
	if ($list_a && $list_a.length) {
		$list_a.unbind('click');
	}
	if ($plink && $plink.length) {
		$plink.unbind('click');
	}
	$tbody.html( html );
	$list_a = $list.find('a');
	$list_a.click(function(){
		if ($(this).parent().hasClass('active') || $(this).parent().hasClass('disabled'))
			return false;
		statusQ.page = $(this).parent().attr('id');
		GetStatus();
	});
	$plink = $('a.plink');
	$plink.click(function(){
		$tablink.eq(1).attr('href', $(this).attr('href'));
		$tablink.eq(1).click();
	});
	BindCE();
	$status.fadeIn(100, function(){
		clearTimeout(updateInterval);
		updateInterval = setInterval(getStatus, A);
	});
}

function GetStatus() {
	clearTimeout(searchTimeout);
	searchTimeout = setTimeout(function(){
		var ts = JudgeString($search.val()), tp = $pid.val(), tr = $result.val();
		window.location.hash = '#status-' + ts + '-' + tp + '-' + tr;
		if (statusQ.page) window.location.hash += '-' + statusQ.page;
		if (tp == 'nil') tp = '';
		else tp = fmap[tp];
		if (tr == 'nil') tr = '';
		statusQ.name = ts;
		statusQ.pid = tp;
		statusQ.result = tr;
		$.ajax({
			type: 'POST',
			url: '/getStatus',
			dataType: 'json',
			data: statusQ,
			timeout: 5000
		})
		.done(Response);
	}, interceptorTime);
}

//pmap[pid]='A, B, C...', fmap['A, B, C...'] = pid
var pmap = {}, fmap = {};

function index(pid) {
	return pmap[pid].charCodeAt(0)-65;
}

var $hid = $('div.hidden, li.hidden')
,	$tablink = $div.find('a[data-toggle="tab"]')
,	WATCH = 0;

//overview
var $overview = $div.find('#overviewtab')
,	$o_index = $overview.find('td.o_index')
,	$o_sol = $overview.find('td.o_sol')
,	$pidtext = $('span.cpid')
,	$clone = $('#clone')
,	prob_num = $pidtext.length
,	overviewTimeout;

function OverviewResponse(json) {
	if (!json) return ;
	var sols = json.pop(), res = json.pop();
	if (sols) {
		$.each(sols, function(i, p){
			var $oi = $o_index.eq(index(p._id));
			if (p.result == 2) {
				$oi.addClass('AC');
				$oi.next().next().addClass('AC-fill');
			} else {
				$oi.addClass('WA');
				$oi.next().next().addClass('WA-fill');
			}
		});
	}

	if (res) {
		$.each(res, function(i, p){
			var $oi = $o_sol.eq(pmap[p._id].charCodeAt(0)-65), idx = index(p._id)
			,	_ac = '<a href="javascript:;" res="2" pid="'+idx+'">'+p.value.AC+'</a>'
			,	_all = '<a href="javascript:;" res="nil" pid="'+idx+'">'+p.value.all+'</a>';
			$oi.html(_ac+'&nbsp/&nbsp'+_all);
		});
	}
	if ($clone.length) {
		$clone.unbind('click');
		$clone.click(function(){
			if ($logindialog.length > 0) {
				nextURL = '/addcontest?cID=-'+cid+'&type=1';
				$logindialog.jqmShow();
			} else {
				window.location.href = '/addcontest?cID=-'+cid+'&type=1';
			}
		});
	}
	bindstatusQ();
}

function GetOverview() {
	clearTimeout(overviewTimeout);
	overviewTimeout = setTimeout(function(){
		$.ajax({
			type 		: 'POST',
			url 		: '/getOverview',
			dataType 	: 'json',
			data 		: {cid: cid},
			timeout 	: 5000
		})
		.done(OverviewResponse);
		$overview.fadeIn(100);
	}, interceptorTime);
}

//problem
//标记之前浏览页是否为problem页
var PreTab = 0;

var $problem = $div.find('#problemtab')
,	$probcontain = $problem.children('#prob-contain')
,	$problemlink = $problem.find("li.problemlink")
,	$title = $problem.find('h3#problem_title > span')
,	$limit = $problem.find('span.limit')
,	$link = $('a.splink')
,	F = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
,	ID, problemTimeout
,	ProblemAPI = {};

var $content = $('#content');

var S = ['Problem Description', 'Input', 'Output', 'Sample Input', 'Sample Output', 'Hint', 'Source']
,	$probsubmit = $('#probsubmit')
,	$probsubmit2 = $('#probsubmit2')
,	$rejudge = $('#rejudge');

function ProblemsResponse(prob) {
	if (!ProblemAPI[ID]) ProblemAPI[ID] = prob;
	$title.eq(0).text( F.charAt(ID) );
	$title.eq(1).text( $pidtext.eq(ID).text() );
	$limit.eq(0).text( 2*prob.timeLimit+'/'+prob.timeLimit );
	$limit.eq(1).text( 2*prob.memoryLimit+'/'+prob.memoryLimit );
	if (prob.spj === 1) {
		$limit.eq(2).html('&nbsp;&nbsp;&nbsp;&nbsp; Special Judge');
	} else {
		$limit.eq(2).html('');
	}
	var q = [prob.description, prob.input, prob.output, prob.sampleInput,
	prob.sampleOutput, prob.hint];
	$content.html('');
	for (i = 0; i < 7; i++) {
		if (!q[i]) continue;
		var tcon = '<h4>'+S[i]+'</h4><div class="accordion-inner">';
		if (i === 3 || i === 4) {
			tcon += '<pre class="sample">'+q[i]+'</pre>';
		} else {
			tcon += q[i];
		}
		tcon += '</div>';
		$content.append(tcon);
	}
	$problemlink.each(function() {
		$(this).removeClass('active');
	});
	$problemlink.eq(ID).addClass('active');

	//增加题号,题目属性
	$probsubmit.attr('pid', pid_index); $probsubmit2.attr('pid', pid_index);
	$probsubmit.next().attr('pid', ID); $probsubmit2.next().attr('pid', ID);
	$probsubmit.attr('tname', pid_name); $probsubmit2.attr('tname', pid_name);
	if ($rejudge.length) {
		$rejudge.unbind('click');
		$rejudge.click(function(){
			$.post('/rejudge', {pid:pid_index, cid:'1'}, function(res){
				$pid.val(F.charAt(ID));
				if (res == '0') ShowMessage('Failed! You have no permission to Rejudge.');
				else if (res == '1') ShowMessage('Problem '+F.charAt(ID)+' has been Rejudged successfully!');
				$tablink.eq(2).click();
			});
		});
	}
	if (PreTab == 1) $probcontain.fadeIn(200);
	else $problem.fadeIn(200);
	PreTab = 1;
}

function GetProblem() {
	clearTimeout(problemTimeout);
	problemTimeout = setTimeout(function(){
		if (!ID || ID < 0) ID = 0;
		pid_index = $pidtext.eq(ID).attr('id');
		pid_name = $pidtext.eq(ID).text();
		if (ProblemAPI[ID]) {
			ProblemsResponse(ProblemAPI[ID]);
		} else {
			$.ajax({
				type: 'POST',
				url: '/getProblem',
				dataType: 'json',
				data: {
					curl: 'problem/'+F.charAt(ID),
					cid: cid,
					pid: pid_index,
					all: true
				},
				timeout: 5000
			})
			.done(ProblemsResponse);
		}
	}, interceptorTime);
}

var $rank = $div.find('#ranktab')
,	$ranktbody = $rank.find('table tbody')
,	$ranklist = $('#ranklist')
,	$ranklist_a
,	$rplink
,	rankQ = {cid:cid, page:1}
,	rank = 1
,	rankTimeout
,	FB = {};

function buildRank(U) {
	var user = U.value, html = '<tr class="';

	if (cnt % 2 == 1) html += 'odd';
	else html += 'even';
	if (U.name == current_user) html += ' highlight';

	html += '"><td';
	if (user.solved > 0) {
		if (rank < 31) {
			html += ' class="';
			if (rank < 6) html += 'gold';
			else if (rank < 16) html += 'silver';
			else html += 'bronze';
			html += '"';
		}
	}

	html += '>';
	if (U.star) {
		html += '*';
	} else {
		html += rank++;
	}
	html += '</td>';

	var pvl = parseInt(Users[U.name], 10);
	html += '<td><a href="/user/'+U.name+'" class="user user-'+UserCol(pvl);
	html += '" title="'+UserTitle(pvl)+'">';
	html += U.name+'</a>';
	html += '</div></td><td>';
	if (display == '1') {
		if (I[U.name] && I[U.name].gde && I[U.name].name) {
			html += '<span class="u-info user-gray ellipsis">'+I[U.name].gde+'<br/>'+I[U.name].name+'</span></td>';
		}
	} else if (I[U.name]) {
		html += '<span title="'+I[U.name]+'" class="u-info user-gray ellipsis">'+I[U.name]+'</span>';
	}
	html += '</td><td>'+user.solved+'</td>';
	html += '<td>'+(user.penalty-user.solved*startTime)+'</td>';
	
	for (i = 0; i < prob_num; i++) {
		var pid = fmap[F.charAt(i)];
		html += '<td';
		if (user.status && user.status[pid]) {
			var WA = user.status[pid].wa, st, pt;
			if (WA >= 0) {
				if (FB[pid] == U.name) {
					style = 'fb-text'; st = 'first_blood'; pt = 'fb-cell-time';
				} else {
					style = 'accept-text'; st = 'accept'; pt = 'cell-time';
				}
				html += ' class="'+st+'">'
				
				html += '<span class="'+style+'">+';
				if (WA > 0) html += WA;
				html += '</span>';
				html += '<span class="'+pt+'">'+deal((user.status[pid].inDate-startTime)*60, 1)+'</span>';
			} else if (WA < 0) {
				html += '><span class="failed">'+WA+'</span>';
			}
		} else {
			html += '>';
		}
		html += '</td>';
	}

	++cnt;

	html += '</tr>';
	return html;
}

function RankResponse(json) {
	if (!json) return ;
	rank = parseInt(json.pop(), 10);
	FB = json.pop();
	$ranklist.html( buildPager(rankQ.page, json.pop()) );
	I = json.pop();
	Users = json.pop();
	var users = json.pop();
	if (!users || users.length == 0) {
		html = '<tr class="odd"><td class="error-text center" colspan="'+(5+prob_num)+'">No Submits till Now.</tr>';
	} else {
		cnt = 1;
		html = $.map(users, buildRank).join('');
	}
	if ($ranklist_a && $ranklist_a.length) {
		$ranklist_a.unbind('click');
	}
	if ($rplink && $rplink.length) {
		$rplink.unbind('click');
	}
	$ranktbody.html(html);
	$ranklist_a = $ranklist.find('a');
	$ranklist_a.click(function(){
		if ($(this).parent().hasClass('active') || $(this).parent().hasClass('disabled'))
			return false;
		rankQ.page = $(this).parent().attr('id');
		GetRanklist();
	});
	$rplink = $('a.rplink');
	$rplink.click(function(){
		$tablink.eq(1).attr('href', $(this).attr('href'));
		$tablink.eq(1).click();
	});
	$rank.fadeIn(100);
}

function GetRanklist() {
	clearTimeout(rankTimeout);
	rankTimeout = setTimeout(function(){
		if (rankQ.page) {
			window.location.hash = '#rank-'+rankQ.page;
		}
		$.ajax({
			type: 'POST',
			url: '/getRanklist',
			dataType: 'json',
			data: rankQ,
			timeout: 5000
		})
		.done(RankResponse);
	}, interceptorTime);
}

function clearTimer() {
	clearTimeout(overviewTimeout);
	clearTimeout(problemTimeout);
	clearTimeout(searchTimeout);
	clearTimeout(rankTimeout);
}

var $discuss = $div.find('#discusstab')
,	$distbody = $discuss.find('table tbody')
,	$dislist = $('#dislist')
,	$dislist_a
,	discussQ = {cid:cid, page:1}
,	discussTimeout
,	Imgtype;

function buildDiscuss(p) {
	var html = '<tr', img;
	if (p.user == current_user) {
		html += ' class="highlight"';
	}
	html += '><td>';
	html += '<a target="_blank" title="'+p.user+'" href="/user/'+p.user+'">';
	if (Imgtype[p.user]) {
		img = '/img/avatar/'+p.user+'/4.'+Imgtype[p.user];
	} else {
		img = '/img/avatar/%3Ddefault%3D/4.jpeg';
	}
	html += '<img class="img_s topic_img" alt="avatar" src="'+img+'" />'
	html += '</a></td><td>';
	html += '<span class="user-green">'+p.reviewsQty+'</span><span class="user-gray">/'+p.browseQty+'</span>';
	html += '</td><td style="text-align:left;" class="ellipsis">';
	html += '<a href="/topic/'+p.id+'">'+p.title+'</a></td>';
	html += '<td></td></tr>';
	return html;
}

function DiscussResponse(json) {
	if (!json) return ;
	Imgtype = json.pop();
	var n = json.pop(), tps = json.pop();
	$dislist.html(buildPager(discussQ.page, n));
	var html;
	if (!tps || tps.length == 0) {
		html = '<tr><td class="error-text" colspan="6">No Records are matched.</td></tr>';
	} else {
		cnt = 1;
		html = $.map(tps, buildDiscuss).join('');
	}
	if ($dislist_a && $dislist_a.length) {
		$dislist_a.unbind('click');
	}
	$distbody.html( html );
	$dislist_a = $dislist.find('a');
	$dislist_a.click(function(){
		if ($(this).parent().hasClass('active') || $(this).parent().hasClass('disabled'))
			return false;
		discussQ.page = $(this).parent().attr('id');
		GetDiscuss();
	});
	$discuss.fadeIn(100);
}

function GetDiscuss() {
	clearTimeout(discussTimeout);
	discussTimeout = setTimeout(function(){
		if (discussQ.page) {
			window.location.hash = '#discuss-'+discussQ.page;
		}
		$.ajax({
			type: 'POST',
			url: '/getTopic',
			dataType: 'json',
			data: discussQ,
			timeout: 5000
		})
		.done(DiscussResponse);
	}, interceptorTime);
}

function run(str, key) {
	if (!str) str = 'overview'
	window.location.hash = '#'+str;
	var sp = str.split('-');
	var a = sp[0], b = sp[1], c = sp[2], d = sp[3], e = sp[4];
	ID = 0;
	clearTimer();
	switch(a) {
		case 'problem': {
			if (WATCH == 0) break;
			if (b) ID = b.charCodeAt(0)-65;
			if (key == 1) {
				$overview.hide();
				$tablink.eq(1).parent().addClass('active');
				$problem.addClass('active');
			}
			if (PreTab == 1) $probcontain.hide();
			else $problem.hide();
			GetProblem();
			break;
		}
		case 'status': {
			if (WATCH == 0) break;
			if (key == 1) {
				$overview.hide();
				$tablink.eq(2).parent().addClass('active');
				$status.addClass('active');
			}
			$status.hide();
			if (b) $search.val(b);
			if (c) $pid.val(c);
			if (d) $result.val(d);
			if (e) statusQ.page = parseInt(e, 10);
			GetStatus();
			PreTab = 0;
			break;
		}
		case 'rank': {
			if (WATCH == 0) break;
			if (key == 1) {
				$overview.hide();
				$tablink.eq(3).parent().addClass('active');
				$rank.addClass('active');
			}
			$rank.hide();
			if (b) rankQ.page = parseInt(b, 10);
			GetRanklist();
			PreTab = 0;
			break;
		}
		case 'discuss': {
			if (WATCH == 0) break;
			if (key == 1) {
				$overview.hide();
				$tablink.eq(4).parent().addClass('active');
				$discuss.addClass('active');
			}
			$discuss.hide();
			GetDiscuss();
			PreTab = 0;
			break;
		}
		default: {
			if (key == 1) {
				$tablink.eq(0).parent().addClass('active');
				$overview.addClass('active');
			}
			$overview.hide();
			if (key == 1 && WATCH == 0) {
				$overview.fadeIn(100);
				PreTab = -1;
			} else {
				GetOverview();
				PreTab = 0;
			}
			break;
		}
	}
}

function pendingTimer() {
	var left = deal(pending);
	var infoleft = '-'+left;
	if (infoleft != $info.text()) {
		$info.text(infoleft);
	}
	if ($lefttime.length) {
		if (left != $lefttime.text()) $lefttime.text(left);
	}
	--pending;
	if (pending < 0) {
		window.location.reload(true);
	}
}

function runningTimer() {
	if (passTime > TotalTime) {
		window.location.reload(true);
	} else {
		var tp = passTime*100.0/TotalTime;
		if (tp > 50) $contain.css({'text-align':'left'});
		$bar.css({width:tp+'%'});
		$info.css({width:(100<=tp+2.5)?'100%':tp+2.5+'%'});
		$info.text('-'+deal(TotalTime - passTime));
		++passTime;
	}
}

function runContest() {
	//bulid map pmap and fmap
	$.each($pidtext, function(i) {
		var tpid = $(this).attr('id'), tch = F.charAt(i);
		pmap[tpid] = tch;
		fmap[tch] = tpid;
	});

	$link.click(function(){
		if ($(this).parent().hasClass('active')) {
			return false;
		}
		$tablink.eq(1).attr('href', $(this).attr('href'));
		$tablink.eq(1).click();
		run($(this).attr('href').split('#')[1], 2);
	});

	$tablink.on('show', function(e){
		//e.target;			// activated tab
		//e.relatedTarget	// previous tab
		var href;
		if (e.relatedTarget) {
			href = $(e.relatedTarget).attr('href').split('#')[1].split('-')[0];
		}
		switch(href) {
			case 'problem': {
				$problem.hide();
				break;
			}
			case 'status': {
				$status.hide();
				break;
			}
			case 'rank': {
				$rank.hide();
				break;
			}
			case 'discuss': {
				$discuss.hide();
				break;
			}
			default: {
				$overview.hide();
				break;
			}
		}
		run($(e.target).attr('href').split('#')[1], 2);
	});

	if (status > 0 || $contest.attr('watch')) {
		WATCH = 1;
		$hid.removeClass('hidden');
		run(window.location.hash.split('#')[1], 1);
	} else {
		run('overview', 1);
	}
}

//run contest
$(document).ready(function(){
	if (status == 0) {
		pendingTimer();
		setInterval(pendingTimer, 1000);
	} else if (status == 1) {
		runningTimer();
		setInterval(runningTimer, 1000);
	}
	runContest();
});

function statusInit() {
	$search.val('');
	$pid.val('nil');
	$result.val('nil');
	statusQ.page = 1;
}

//bind status
$(document).ready(function(){
	$Filter.click(function(){
		statusQ.page = 1;
		GetStatus();
	});
	$('#reset').click(function(){
		statusInit();
		GetStatus();
	});
	$search.keyup(function(e){
		if (e.keyCode == 13) {
			$Filter.click();
		}
	});
	bindstatusQ();
});

//bind submit
var $SubmitDialog = $('#submitdialog')
,	$sublink = $('a.consubmit');

$(document).ready(function(){
	$.each($sublink, function(i, p) {
		$(p).click(function(){
			if ($logindialog.length) {
				nextURL = '';
				$logindialog.jqmShow();
				return false;
			}
			if (!$SubmitDialog.length) {
				ShowMessage('You can not submit because you have not registered the contest yet!');
				return false;
			}
			$SubmitDialog.find('#error').html('&nbsp;');
			$SubmitDialog.find('#lang').val(2);
			$SubmitDialog.find('textarea').val('');
			pid_index = $(this).attr('pid');
			$SubmitDialog.find('span#pid').text(pmap[pid_index]+' - '+$(this).attr('tname'));
			$SubmitDialog.jqmShow();
		});
	});

	if ($SubmitDialog.length) {
		$SubmitDialog.jqm({
			overlay: 30,
			trigger: false,
			modal: true,
			closeClass: 'submitclose',
			onShow: function(h) {
				h.o.fadeIn(200);
				h.w.fadeIn(200, function(){$SubmitDialog.find('textarea').focus();});
			},
			onHide: function(h) {
				h.w.fadeOut(200);
				h.o.fadeOut(200);
			}
		}).jqDrag('.jqDrag').jqResize('.jqResize');
		var $submit_code = $SubmitDialog.find('textarea')
		,	$submit_err = $SubmitDialog.find('span#error');
		$SubmitDialog.find('a#jqcodesubmit').click(function(){
			var code = $submit_code.val();
			if (code.length < 50 || code.length > 65536) {
				errAnimate($submit_err, 'the length of code must be between 50B to 65535B');
				return false;
			}
			$.post('/submit', {
				pid: pid_index,
				cid: cid,
				code: code,
				lang: $SubmitDialog.find('select').val()
			}, function(err){
				if (err == '1') {
					window.location.reload(true);
					return ;
				}
				$SubmitDialog.jqmHide();
				if (!err) {
					ShowMessage('Your code for problem '+pmap[pid_index]+' has been submited successfully!');
				} else if (err == '2'){
					ShowMessage('You can not submit because you have not registered the contest yet!');
				} else if (err == '3') {
					ShowMessage('系统错误！');
				}
				statusInit();
				if (ctype == 2 && current_user) {
					$search.val(current_user);
				}
				$tablink.eq(2).click();
			});
		});
	}
});

var $Delete = $('#deletedialog');

$(document).ready(function(){
	//delete the contest
	if ($Delete.length > 0) {
		$Delete.jqm({
			overlay: 30,
			trigger: $('a#delete'),
			modal: true,
			closeClass: 'deleteclose',
			onShow: function(h) {
				h.o.fadeIn(200);
				h.w.fadeIn(200);
			},
			onHide: function(h) {
				h.w.fadeOut(200);
				h.o.fadeOut(200);
			}
		}).jqDrag('.jqDrag');
		$Delete.find('a#sure').click(function(){
			$.post('/contestDelete', {cid:cid}, function(){
				window.location.href = '/contest/'+ctype;
			});
		});
	}
});

//show problems in problemset
var $show = $('#show');

$(document).ready(function(){
	if ($show.length) {
		$show.click(function(){
			$.post('/show', {cid:cid}, function(res){
				if (res) {
					ShowMessage('系统错误！');
				} else {
					ShowMessage('Problems have been Updated successfully!');
				}
			});
		});
	}
});

//add user
var $adduser = $('#user-add')
,	$userstr = $('#userstr')
,	$adderr = $('#adderr');

$(document).ready(function(){
	if ($adduser.length) {
		$adduser.click(function(){
			var name = JudgeString($userstr.val());
			if (!name) {
				errAnimate($adderr, '用户名不能为空！');
				return false;
			}
			$.post('/regContestAdd', {cid:cid,name:name}, function(){
				window.location.reload(true);
			});
		});
	}
});

//toggle star
var $star = $('#star')
,	$starstr = $('#starstr')
,	$starerr = $('#starerr');

$(document).ready(function(){
	if ($star.length) {
		$star.click(function(){
			var str = JudgeString($starstr.val());
			if (!str) {
				errAnimate($starerr, '用户名不能为空！');
				return false;
			}
			$.post('/toggleStar', {cid:cid,str:str,type:$('#type').val()}, function(){
				window.location.reload(true);
			});
		});
	}
});

//add discuss
var $publish = $('#publish')
,	$publish_pid = $('#publish_pid')
,	$publish_err = $('#publish_err')
,	$publish_title = $('#publish_title')
,	$publish_content = $('#publish_content');

$(document).ready(function(){
	$publish.click(function(){
		var title = JudgeString($publish_title.val());
		if (!title) {
			errAnimate($publish_err, '标题不能为空！');
			return false;
		}
		var content = JudgeString($publish_content.attr('value'));
		if (!content) {
			errAnimate($publish_err, '内容不能为空！');
			return false;
		}
		if ($publish.hasClass('disabled')) {
			return false;
		}
		$publish.addClass('disabled');
		$.post('/addDiscuss', {cid: cid, title:$publish_pid.val()+'题：'+title, content:content}, function(res){
			if (!res) {
				GetDiscuss();
				ShowMessage('发表成功！');
			} else if (res == '1') {
				ShowMessage('系统错误！');
			} else if (res == '2') {
				window.location.href = '/';
			}
		});
	});
});