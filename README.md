# Photo Manager

一个 Web 端个人照片管理系统，支持浏览本地文件夹中的图片，并提供标签、相册和时间线三种分类方式。

## 功能特性

- **照片浏览** - 网格视图展示照片，支持分页
- **时间线筛选** - 按拍摄时间查看照片，点击月份快速筛选
- **收藏与评分** - 支持收藏照片和 5 星评分
- **照片预览** - 大图预览，支持旋转、收藏、评分
- **快速导航** - 预览时支持左右箭头切换照片
- **响应式设计** - 适配桌面端各种屏幕尺寸

## 技术栈

### 前端
- React 19 + TypeScript
- Tailwind CSS
- Vite
- Axios

### 后端
- Node.js + Express
- SQLite + better-sqlite3
- exif-reader (EXIF 读取)

## 项目结构

```
image-manager/
├── client/                 # 前端应用
│   ├── src/
│   │   ├── api/           # API 客户端
│   │   ├── components/    # React 组件
│   │   │   ├── Album/     # 相册相关
│   │   │   ├── Common/    # 通用组件
│   │   │   ├── Layout/    # 布局组件
│   │   │   ├── Photo/     # 照片相关
│   │   │   ├── Tag/       # 标签相关
│   │   │   └── Timeline/  # 时间线相关
│   │   ├── hooks/         # 自定义 Hooks
│   │   └── types/         # TypeScript 类型
│   └── package.json
├── server/                 # 后端服务
│   ├── src/
│   │   ├── db/           # 数据库相关
│   │   ├── routes/       # API 路由
│   │   ├── services/     # 业务逻辑
│   │   └── utils/        # 工具函数
│   └── package.json
├── docs/                   # 设计文档
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 2. 启动服务

```bash
# 终端1: 启动后端 (端口 3001)
cd server
npm run dev

# 终端2: 启动前端 (端口 5173)
cd client
npm run dev
```

### 3. 使用应用

1. 打开浏览器访问 http://127.0.0.1:5174
2. 点击右上角「扫描照片」按钮
3. 输入照片目录路径（如 `/Users/xxx/Pictures`）
4. 系统会扫描目录下的所有图片文件

## API 接口

### 照片管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/photos` | 获取照片列表（分页、筛选） |
| GET | `/api/photos/:id` | 获取单张照片详情 |
| PUT | `/api/photos/:id` | 更新照片信息 |
| POST | `/api/photos/scan` | 扫描照片目录 |
| GET | `/api/photos/:id/thumbnail` | 获取缩略图 |
| GET | `/api/photos/:id/file` | 获取原图 |
| POST | `/api/photos/update-exif` | 更新照片 EXIF 信息 |

### 搜索

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/search` | 综合搜索 |
| GET | `/api/search/timeline` | 获取时间线数据 |
| GET | `/api/search/favorites` | 获取收藏照片 |
| POST | `/api/search/photos/:id/favorite` | 设置/取消收藏 |
| POST | `/api/search/photos/:id/rating` | 设置评分 |

### 其他

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/albums` | 获取相册列表 |
| GET | `/api/tags` | 获取标签列表 |
| GET | `/api/health` | 健康检查 |

## 数据库

- SQLite 数据库位于 `server/data/database.sqlite`
- 主要表：`photos`, `tags`, `albums`, `photo_tags`, `album_photos`

## 时间线说明

时间线按照片拍摄时间分组显示。系统会按以下优先级获取拍摄时间：

1. EXIF DateTimeOriginal 数据
2. 文件夹名称（如 `2019_07_03`）
3. 文件名日期（如 `IMG_20190703.jpg`）
4. 文件修改时间

## 许可

MIT License