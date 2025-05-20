# 3D Visualization Website

3D visualization of Lithography APP System Components.

## 项目描述

这是一个用于可视化光刻APP系统组件关系的交互式3D网站，支持中英文切换。

## 功能特点

- 3D/2D视图切换
- 组件高亮和过滤
- 详细的组件信息展示
- 多语言支持（中文/英文）
- 响应式设计
- 键盘快捷键支持

## 技术栈

- Three.js - 3D渲染
- D3.js - 2D力导向图
- Express - 服务器

## 本地运行

```bash
# 安装依赖
npm install

# 启动服务器
npm start
```

然后访问 http://localhost:3000

## 部署到Render

1. 在Render.com创建一个新的Web Service
2. 连接到包含此项目的GitHub仓库
3. 使用以下设置：
   - Build Command: `npm install`
   - Start Command: `npm start`
4. 点击"Create Web Service"

## 文件结构

- `index.html` - 主页面
- `styles.css` - 样式表
- `data.js` - 可视化数据
- `visualization.js` - 可视化逻辑
- `translations.js` - 多语言支持
- `server.js` - Express服务器
- `icons/` - 图标目录 