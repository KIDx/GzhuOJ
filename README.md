# Gzhu Online Judge v5.5

* 上传数据时把所有'\r'去掉，避免gets会PE
* 增加404页面
* 修改了模态框的样式
* 去掉删除contest时的确认模态框，用js的window.confirm代替
* 修复了普通contest不能打星的bug
* 重构了弹窗message的逻辑
* 重构了addcontest的前端以及后台逻辑，并且增强用户体验
* contest新增把题目"显示到题库/隐藏"功能 (for admin)
* 修复因部分res.header没设置而导致firefox下不正确显示返回内容的bug
* 修复addcontest的alias部分 (post后数组中空的数据被忽略的bug)