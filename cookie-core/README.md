# Cookie生成核心模块

这是从 rs-reverse 项目中提取的Cookie生成核心代码，包含最小依赖。

## 📦 包含内容

### 核心模块
- `src/handler/Cookie.js` - Cookie生成器
- `src/handler/globalVarible.js` - 全局变量管理
- `src/handler/basearr/` - 浏览器指纹生成器

### 加密算法
- `numarrEncrypt.js` - 哈夫曼编码压缩
- `modeEncrypt.js` - AES-CBC加密
- `uuid.js` - CRC32校验码
- `numarr2string.js` - Base64变体转换

### 工具函数
- 数字转换：`numToNumarr2/4/8.js`
- 字符串处理：`string2ascii.js`, `ascii2string.js`
- 数组操作：`combine4.js`, `numarrJoin.js`
- 其他工具：`tools.js`, `random.js`等

## 🚀 使用方法

查看 `example-usage.js` 了解详细使用方法。

### 快速开始

```javascript
const Cookie = require('./src/handler/Cookie');
const gv = require('./src/handler/globalVarible');

// 1. 配置环境
gv._setAttr('makecookieRuntimeConfig', {
  'window.navigator.userAgent': '...',
  // ... 其他配置
});

// 2. 生成Cookie
const cookie = new Cookie(coder).run();
```

## 📝 注意事项

1. **依赖Coder对象**: 需要先使用 Coder.js 解析虚拟机代码
2. **全局变量初始化**: 必须正确初始化 gv.keys 和 gv.config
3. **网站适配**: 不同网站需要不同的basearr生成器
4. **时间同步**: Cookie生成依赖准确的时间戳

## 📊 文件统计

- 总文件数：约30个
- 核心算法：4个
- 工具函数：15个
- 配置文件：3个

## 🔗 完整项目

https://github.com/pysunday/rs-reverse
