const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// 提供静态文件
app.use(express.static(__dirname));

// 所有路由都返回index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 