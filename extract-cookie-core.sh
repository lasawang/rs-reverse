#!/bin/bash

# Cookie生成核心文件提取脚本
# 用途：提取最小依赖文件用于独立的Cookie生成

set -e

CORE_DIR="cookie-core"
echo "🚀 开始提取Cookie生成核心文件..."

# 创建目录结构
mkdir -p ${CORE_DIR}/src/handler/{basearr,parser/{common,task}}
mkdir -p ${CORE_DIR}/src/config
mkdir -p ${CORE_DIR}/utils

echo "📁 创建目录结构完成"

# ========== 核心模块 ==========
echo "📦 复制核心模块..."

# Cookie生成器
cp src/handler/Cookie.js ${CORE_DIR}/src/handler/
cp src/handler/globalVarible.js ${CORE_DIR}/src/handler/

# basearr生成器
cp src/handler/basearr/index.js ${CORE_DIR}/src/handler/basearr/
cp src/handler/basearr/len123.js ${CORE_DIR}/src/handler/basearr/
cp src/handler/basearr/len127.js ${CORE_DIR}/src/handler/basearr/ 2>/dev/null || true
cp src/handler/basearr/len103.js ${CORE_DIR}/src/handler/basearr/ 2>/dev/null || true

# ========== 加密算法 ==========
echo "🔐 复制加密算法..."

cp src/handler/parser/index.js ${CORE_DIR}/src/handler/parser/
cp src/handler/parser/constData.js ${CORE_DIR}/src/handler/parser/

# 通用算法
cp src/handler/parser/common/index.js ${CORE_DIR}/src/handler/parser/common/
cp src/handler/parser/common/numarrEncrypt.js ${CORE_DIR}/src/handler/parser/common/
cp src/handler/parser/common/modeEncrypt.js ${CORE_DIR}/src/handler/parser/common/
cp src/handler/parser/common/uuid.js ${CORE_DIR}/src/handler/parser/common/
cp src/handler/parser/common/numarr2string.js ${CORE_DIR}/src/handler/parser/common/

# ========== 数据转换工具 ==========
echo "🔧 复制数据转换工具..."

cp src/handler/parser/common/numToNumarr2.js ${CORE_DIR}/src/handler/parser/common/
cp src/handler/parser/common/numToNumarr4.js ${CORE_DIR}/src/handler/parser/common/
cp src/handler/parser/common/numToNumarr8.js ${CORE_DIR}/src/handler/parser/common/
cp src/handler/parser/common/combine4.js ${CORE_DIR}/src/handler/parser/common/
cp src/handler/parser/common/numarrAddTime.js ${CORE_DIR}/src/handler/parser/common/
cp src/handler/parser/common/numarrJoin.js ${CORE_DIR}/src/handler/parser/common/
cp src/handler/parser/common/tools.js ${CORE_DIR}/src/handler/parser/common/

# ========== 字符串处理 ==========
echo "📝 复制字符串处理工具..."

cp src/handler/parser/common/string2ascii.js ${CORE_DIR}/src/handler/parser/common/
cp src/handler/parser/common/ascii2string.js ${CORE_DIR}/src/handler/parser/common/
cp src/handler/parser/common/decrypt.js ${CORE_DIR}/src/handler/parser/common/
cp src/handler/parser/common/decode.js ${CORE_DIR}/src/handler/parser/common/
cp src/handler/parser/common/extrace.js ${CORE_DIR}/src/handler/parser/common/

# ========== 其他算法 ==========
echo "⚙️ 复制其他算法..."

cp src/handler/parser/common/random.js ${CORE_DIR}/src/handler/parser/common/
cp src/handler/parser/common/fixedValue20.js ${CORE_DIR}/src/handler/parser/common/
cp src/handler/parser/common/getFixedNumber.js ${CORE_DIR}/src/handler/parser/common/
cp src/handler/parser/common/hexnum.js ${CORE_DIR}/src/handler/parser/common/
cp src/handler/parser/common/swap.js ${CORE_DIR}/src/handler/parser/common/ 2>/dev/null || true
cp src/handler/parser/common/bitwiseTwoNumarr.js ${CORE_DIR}/src/handler/parser/common/ 2>/dev/null || true

# ========== 配置文件 ==========
echo "⚙️ 复制配置文件..."

cp src/config/index.js ${CORE_DIR}/src/config/ 2>/dev/null || true
cp src/config/makecookieRuntimeConfig.js ${CORE_DIR}/src/config/

# ========== 工具文件 ==========
echo "🛠️ 复制工具文件..."

cp utils/logger.js ${CORE_DIR}/utils/
cp utils/simpleCrypt.js ${CORE_DIR}/utils/
cp utils/unescape.js ${CORE_DIR}/utils/ 2>/dev/null || true

# ========== 创建使用示例 ==========
echo "📄 创建使用示例..."

cat > ${CORE_DIR}/example-usage.js << 'EOF'
/**
 * Cookie生成核心模块使用示例
 * 
 * 前置条件：
 * 1. 已经通过 Coder.js 生成了完整的虚拟机代码
 * 2. 已经初始化了 gv.keys 和 gv.config
 */

const Cookie = require('./src/handler/Cookie');
const gv = require('./src/handler/globalVarible');

// ========== 方式1: 完整流程（需要Coder对象）==========
function generateCookieWithCoder(coder) {
  // 需要先运行 Coder 生成代码
  // const coder = new Coder(ts, immucfg);
  // const { code, $_ts } = coder.run();
  
  const cookie = new Cookie(coder).run();
  console.log('生成的Cookie:', cookie);
  return cookie;
}

// ========== 方式2: 手动配置（如果已知所有参数）==========
function generateCookieManually() {
  // 1. 配置全局变量
  gv._setAttr('keys', [
    // keys数组，从cp[0]中提取
    [...], [...], [...], // keys[0], keys[1], keys[2]...
  ]);
  
  gv._setAttr('config', {
    hostname: 'encoded_hostname',  // 使用simpleCrypt加密的hostname
    adapt: {
      flag: 4113,      // 网站标识
      lastWord: 'T',   // Cookie键最后字母
      hasDebug: false
    }
  });
  
  // 2. 配置运行时参数
  gv._setAttr('makecookieRuntimeConfig', {
    // 浏览器环境
    'window.navigator.userAgent': 'Mozilla/5.0...',
    'window.navigator.platform': 'MacIntel',
    'window.innerHeight': 969,
    'window.innerWidth': 1920,
    'window.outerHeight': 1080,
    'window.outerWidth': 1920,
    'window.navigator.maxTouchPoints': 0,
    'window.eval.toString().length': 33,
    'window.document.hidden': false,
    
    // 网络和电池
    'window.navigator.connection': { connType: 'wifi' },
    'window.navigator.battery': { 
      charging: true, 
      chargingTime: 0, 
      level: 1 
    },
    
    // 时间和随机数
    random: 0.1253744220839037,
    startTime: Date.now(),
    currentTime: Date.now(),
    runTime: 0,
    
    // 代码特征（需要从Coder中获取）
    codeUid: 12345,              // 代码唯一标识
    r2mkaTime: 1757038222,       // 从keys[21]中提取
    execNumberByTime: 123456,    // 时间相关数字
  });
  
  // 3. 模拟Coder对象
  const fakeCoder = {
    code: '/* 虚拟机代码 */',
    mainFunctionIdx: [0, 1000],
    functionsNameSort: {
      // 函数排序信息
    },
    $_ts: {
      cp: [
        /* cp[0]: keys数组 */,
        /* cp[1]: keynames */,
        /* cp[2]: basestr */
      ]
    }
  };
  
  // 4. 生成Cookie
  const cookie = new Cookie(fakeCoder).run();
  console.log('生成的Cookie:', cookie);
  return cookie;
}

// ========== 方式3: 使用核心算法自己实现 ==========
function generateCookieDIY() {
  const parser = require('./src/handler/parser');
  const getBasearr = require('./src/handler/basearr');
  const gv = require('./src/handler/globalVarible');
  
  const {
    numarrEncrypt,
    encryptMode1,
    uuid,
    xor,
    numarrAddTime,
    numarrJoin,
    numToNumarr4,
    numarr2string,
  } = parser;
  
  // 1. 生成basearr（浏览器指纹）
  const config = gv.makecookieRuntimeConfig;
  const basearr = getBasearr(config, gv);
  console.log('basearr长度:', basearr.length);
  
  // 2. 哈夫曼压缩
  const compressed = numarrEncrypt(basearr);
  
  // 3. 异或加密
  const xored = xor(compressed, gv.keys[2], 16);
  
  // 4. 第一次AES加密
  const encrypted1 = encryptMode1(
    xored,
    numarrAddTime(gv.keys[17], config.runTime, config.random)[0],
    0
  );
  
  // 5. 构建下一层数组
  const nextarr = numarrJoin(
    numarrJoin(
      2,
      numToNumarr4([config.r2mkaTime, config.startTime]),
      gv.keys[2]
    ),
    gv.config.adapt?.hasDebug ? encrypted1.length >> 8 & 255 | 128 : undefined,
    encrypted1,
  );
  
  // 6. 第二次AES加密（添加UUID校验）
  const final = encryptMode1(
    [
      ...numToNumarr4(uuid(nextarr)),
      ...nextarr
    ],
    numarrAddTime(gv.keys[16], config.runTime, config.random)[0],
    1,
    config.random
  );
  
  // 7. 转换为Cookie字符串
  const cookie = '0' + numarr2string(final);
  console.log('生成的Cookie:', cookie);
  return cookie;
}

// 导出
module.exports = {
  generateCookieWithCoder,
  generateCookieManually,
  generateCookieDIY,
};
EOF

# ========== 创建README ==========
cat > ${CORE_DIR}/README.md << 'EOF'
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
EOF

# ========== 创建package.json ==========
cat > ${CORE_DIR}/package.json << 'EOF'
{
  "name": "rs-reverse-cookie-core",
  "version": "1.0.0",
  "description": "瑞数Cookie生成核心模块（从rs-reverse提取）",
  "main": "example-usage.js",
  "dependencies": {
    "lodash": "^4.17.21",
    "log4js": "^6.9.1"
  },
  "keywords": ["rs-reverse", "cookie", "encryption"],
  "author": "extracted from rs-reverse",
  "license": "BSD-3-Clause"
}
EOF

echo ""
echo "✅ 核心文件提取完成！"
echo ""
echo "📁 输出目录: ${CORE_DIR}/"
echo "📊 文件统计:"
find ${CORE_DIR} -type f -name "*.js" | wc -l | xargs echo "   JavaScript文件:"
echo ""
echo "📖 使用说明:"
echo "   1. 查看 ${CORE_DIR}/README.md"
echo "   2. 参考 ${CORE_DIR}/example-usage.js"
echo ""
echo "🚀 快速开始:"
echo "   cd ${CORE_DIR}"
echo "   npm install"
echo "   node example-usage.js"
echo ""
