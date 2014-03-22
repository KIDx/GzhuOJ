
var getDate = function(date) {
  var Y = date.getFullYear();
  var M = date.getMonth()+1;
  if (M < 10) M = '0' + M;
  var D = date.getDate();
  if (D < 10) D = '0' + D;
  var h = date.getHours();
  if (h < 10) h = '0' + h;
  var m = date.getMinutes();
  if (m < 10) m = '0' + m;
  var s = date.getSeconds();
  if (s < 10) s = '0' + s;
  return (Y+'-'+M+'-'+D+' '+h+':'+m+':'+s);
};

var Tag = ['','beginner','brute force','binary search','ternary search','constructive',
'dp','games','geometry','graphs','greedy','hashing','implementation',
'math','matrices','number theory','probabilities','dfs', 'bfs',
'shortest paths','sortings','string suffix structures','strings',
'combinatorics', 'divide and conquer', 'flow', 'STL', 'segment tree',
'树状数组', 'data structures', 'kmp', '编译原理', '离散化', 'manacher', 'rmq', 'big number'];

var ProTil = ['','简单题，入门题','暴力枚举','二分','三分','构造法','动态规划','组合博弈，SG定理',
'几何学、计算几何学','图论','贪心','散列，哈希表','模拟题，编程技巧','基础数学、公式推导、微积分、微分方程等',
'矩阵乘法、矩阵快速幂、克拉默法则、线性方程组等','整除、素数、欧拉函数、欧几里德算法、中国剩余定理等',
'概率、数学期望、统计学、随机变量等','深度优先搜索','广度优先搜索','最短路','排序','后缀树、后缀数组、后缀自动机等',
'字符串处理','排列、组合、计数原理等','分治算法','网络流，最大流，费用流','标准模板库',
'线段树','树状数组','栈、队列、链表、树等数据结构', 'KMP', '编译原理', '离散化', 'Manacher算法', 'RMQ算法', '大数（高精度）'];

var easy_tips = ['未设置', 'very hard', 'hard', 'medium', 'easy', 'very easy'];

var College = ['其他学院', '计算机科学与教育软件学院', '数学与信息科学学院', '土木工程学院', '物理与电子工程学院', '机械与电气工程学院'];

var fs = require('fs')
,   errlog = fs.createWriteStream(__dirname+'/error.log', {flags: 'a'});

function getpos() {
  try {
    throw new Error();
  } catch(e) {
    return e.stack.split('\n')[3].split(process.cwd()+'/')[1].replace(')', '');
  }
}

module.exports = {
  outputErr: function(err) {
    console.log(err);
    errlog.write(getDate(new Date())+' ['+getpos()+']\n'+err+'\n\n');
  },
  getDate: getDate,
  cookie_secret: 'gzhu',
  db: 'gzhu_db',
  dburl: 'mongodb://127.0.0.1:27017/gzhu_db',
  problemset_pageNum 	: 50,
  status_pageNum		  : 20,
  ranklist_pageNum		: 20,
  contest_pageNum     : 20,
  course_pageNum      : 20,
  regform_pageNum     : 20,
  stats_pageNum       : 20,
  contestRank_pageNum	: 50,
  topic_pageNum       : 15,
  comment_pageNum     : 20,
  root_path           : __dirname+'/',
  data_path           : __dirname+'/Data/',
  College             : College,
  T: Tag,
  P: ProTil,
  easy_tips: easy_tips,
  C: function(n) {    //return status' color
    switch(n) {
      case 0:
      case 1: return 'info-text';
      case 2: return 'accept-text';
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 9:
      case 10:
      case 11:
      case 12:
      case 15: return 'wrong-text';
      default: return 'special-text';
    }
  },
  R: function(n) {    //return status' result
    switch(n) {
      case 0: return 'Pending...';
      case 1: return 'Running...';
      case 2: return 'Accepted';
      case 3: return 'Presentation Error';
      case 4: return 'Time Limit Exceeded';
      case 5: return 'Memory Limit Exceeded';
      case 6: return 'Wrong Answer';
      case 7: return 'Output Limit Exceeded';
      case 8: return 'Compilation Error';
      case 13: return 'Dangerous Code';
      case 14: return 'System Error';
      default: return 'Runtime Error';
    }
  },
  UC: function(n) {   //return user color style
    n = parseInt(n, 10);
    if (!n) return 'black';
    switch(n) {
        case 73:
        case 99: return 'red';
        case 81: return 'violet';
        case 82: return 'orange';
        case 72: return 'blue';
        case 71: return 'cyan';
        case 70: return 'green';
    }
  },
  UT: function(n) {   //return user title
    n = parseInt(n, 10);
    if (!n) return 'Normal-普通用户';
    switch(n) {
        case 99: return 'Administrator-创界者';
        case 82: return 'Teacher-老师';
        case 81: return 'Captain-队长';
        case 73: return 'Visitant-贵宾';
        case 72: return 'Expert-资深队员';
        case 71: return 'Specialist-普通队员';
        case 70: return 'Student-本校学生';
    }
  }
};
