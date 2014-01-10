# Gzhu Online Judge v6.0.3

* 修复批量注册会出现系统错误的bug(index.js)
* contest的题目不再缓存，每次都去服务器拿最新的(onecontest.js)
* 对网站增加静态资源缓存(app.js)
* 合并某些js文件，减少客户端发送响应次数
* 压缩某些不改动的js文件
* 修复admin不能为别人的contest打星的bug(index.js)
* 修复ckeditor插入表情路径太绝对导致服务器一旦改变地址就显示不了的bug
* 修复nginx+websocket出错的bug(app.js: io.set('transports', ...))