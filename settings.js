
var Tag = ['','beginner','brute force','binary search','ternary search','constructive',
'dp','games','geometry','graphs','greedy','hashing','implementation',
'math','matrices','number theory','probabilities','dfs', 'bfs',
'shortest paths','sortings','string suffix structures','strings',
'combinatorics', 'divide and conquer', 'flow', 'STL', 'segment tree',
'树状数组', 'data structures'];

var ProTil = ['','简单题，入门题','暴力枚举法','二分检索','三分检索','构造法','动态规划','组合博弈，SG定理',
'几何学、计算几何学','图论','贪心算法','散列，哈希表','模拟题，编程技术','基础数学、公式推导、微积分、微分方程等',
'矩阵乘法、矩阵快速幂、克拉默法则、线性方程组等','整除、素数、欧拉函数、欧几里德算法、中国剩余定理等',
'概率、数学期望、统计学、随机变量等','深度优先搜索','广度优先搜索','最短路','排序','后缀树、后缀数组、后缀自动机等',
'字符串处理','排列、组合、计数原理等','分治算法','网络流，最大流，费用流','标准模板库(C++)、集合框架(Java)',
'线段树','树状数组','栈、队列、链表、树等数据结构'];

module.exports = {
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
  data_path           : '../OJ/judge/data/',
  T                   : Tag,
  P                   : ProTil
};