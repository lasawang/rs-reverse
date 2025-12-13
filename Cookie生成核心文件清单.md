# Cookie生成核心文件清单

## 🎯 最小依赖文件（自己实现Cookie生成）

如果你只想要生成Cookie的核心逻辑，不需要完整的项目，以下是**必需的核心文件**：

---

## 📦 一、核心算法模块（必需）

### 1. Cookie生成主逻辑
```
src/handler/Cookie.js                    # Cookie生成器核心
```

### 2. 加密算法（必需）
```
src/handler/parser/common/numarrEncrypt.js      # 哈夫曼编码压缩
src/handler/parser/common/modeEncrypt.js        # AES加密（CBC模式）
src/handler/parser/common/uuid.js               # UUID/CRC32算法
src/handler/parser/common/numarr2string.js      # 数组转Base64变体字符串
```

### 3. 数据转换工具（必需）
```
src/handler/parser/common/numToNumarr2.js       # 数字转2字节数组
src/handler/parser/common/numToNumarr4.js       # 数字转4字节数组
src/handler/parser/common/numToNumarr8.js       # 数字转8字节数组
src/handler/parser/common/combine4.js           # 4字节合并
src/handler/parser/common/numarrAddTime.js      # 时间数组操作
src/handler/parser/common/numarrJoin.js         # 数组拼接
src/handler/parser/common/tools.js              # 工具函数（异或等）
```

### 4. 字符串处理（必需）
```
src/handler/parser/common/string2ascii.js       # 字符串转ASCII数组
src/handler/parser/common/ascii2string.js       # ASCII数组转字符串
src/handler/parser/common/decrypt.js            # 解密函数
src/handler/parser/common/decode.js             # 解码函数
```

### 5. 随机数和固定值（必需）
```
src/handler/parser/common/random.js             # 随机数生成
src/handler/parser/common/fixedValue20.js       # 固定值数组
```

### 6. basearr生成器（至少一个网站适配）
```
src/handler/basearr/index.js                    # 适配器管理
src/handler/basearr/len123.js                   # 示例：长度123的适配器
# 或其他 len*.js 文件，根据目标网站选择
```

### 7. 全局变量和配置（必需）
```
src/handler/globalVarible.js                    # 全局变量管理
src/handler/parser/index.js                     # 算法模块导出
src/handler/parser/common/index.js              # 通用算法导出
src/handler/parser/constData.js                 # 常量数据初始化
```

---

## 📦 二、如果需要完整功能（包含代码解析）

如果你还需要从 `$_ts` 解析虚拟机代码，额外需要：

### 1. 代码解析器
```
src/handler/Coder.js                            # 代码解析器
src/handler/initTs.js                           # $_ts初始化
src/handler/grenKeys.js                         # 密钥生成
src/handler/getScd.js                           # 随机种子生成
src/handler/globaltext.js                       # 全局文本操作
src/handler/dataOper.js                         # 数据操作
src/handler/arraySwap.js                        # 数组交换
src/handler/funcOper.js                         # 函数操作
```

### 2. 解析器相关
```
src/handler/parser/r2mka.js                     # 任务解析
src/handler/parser/tscp.js                      # cp参数解析
src/handler/parser/tscd.js                      # cd参数解析
src/handler/parser/meta.js                      # meta信息解析
src/handler/parser/task/index.js                # 任务处理
```

### 3. 入口文件
```
src/makeCookie.js                               # Cookie生成入口
src/makeCode.js                                 # 代码生成入口
```

---

## 📦 三、工具依赖

### 必需的工具文件
```
utils/logger.js                                 # 日志工具
utils/simpleCrypt.js                            # 简单加密（用于hostname加密）
utils/unescape.js                               # unescape函数
utils/paths.js                                  # 路径工具
```

---

## 🎯 最精简方案（30个文件左右）

### 只生成Cookie，不解析代码：

```
📁 核心文件（约30个）
├── src/handler/
│   ├── Cookie.js                           ⭐ 核心
│   ├── globalVarible.js                    ⭐ 必需
│   ├── basearr/
│   │   ├── index.js                        ⭐ 必需
│   │   └── len123.js                       ⭐ 至少一个
│   └── parser/
│       ├── index.js                        
│       ├── constData.js                    
│       └── common/
│           ├── index.js                    
│           ├── numarrEncrypt.js            ⭐ 核心算法
│           ├── modeEncrypt.js              ⭐ 核心算法
│           ├── uuid.js                     ⭐ 核心算法
│           ├── numarr2string.js            ⭐ 核心算法
│           ├── numToNumarr2.js             
│           ├── numToNumarr4.js             
│           ├── numToNumarr8.js             
│           ├── combine4.js                 
│           ├── numarrAddTime.js            
│           ├── numarrJoin.js               
│           ├── tools.js                    
│           ├── string2ascii.js             
│           ├── ascii2string.js             
│           ├── decrypt.js                  
│           ├── decode.js                   
│           ├── random.js                   
│           └── fixedValue20.js             
└── utils/
    ├── logger.js                           
    ├── simpleCrypt.js                      
    └── unescape.js                         
```

---

## 💡 使用建议

### 方案A: 直接复制核心文件（推荐）

**适合场景**: 你已经有了完整的虚拟机代码和 `gv.keys`

```javascript
// 只需要这几个核心函数
const { numarrEncrypt } = require('./numarrEncrypt');
const { encryptMode1 } = require('./modeEncrypt');
const { uuid } = require('./uuid');
const { numarr2string } = require('./numarr2string');
const { xor } = require('./tools');
// ... 其他工具函数

// 手动生成basearr
const basearr = [...];  // 你自己实现

// 加密流程
const compressed = numarrEncrypt(basearr);
const xored = xor(compressed, keys[2], 16);
const encrypted1 = encryptMode1(xored, keyarr, 0);
// ...
const cookie = '0' + numarr2string(final);
```

### 方案B: 使用完整的Cookie模块

**适合场景**: 需要完整功能，包括代码解析

```javascript
const { makeCookie } = require('./src/makeCookie');
const gv = require('./src/handler/globalVarible');

// 配置环境
gv._setAttr('makecookieRuntimeConfig', {
  'window.navigator.userAgent': '...',
  // ... 其他配置
});

// 生成Cookie
const cookie = makeCookie(ts, outputResolve);
```

### 方案C: 自己实现简化版（最灵活）

**核心逻辑**:
```javascript
function generateCookie(config) {
  // 1. 生成basearr（浏览器指纹）
  const basearr = buildBasearr(config);
  
  // 2. 哈夫曼压缩
  const compressed = huffmanEncode(basearr);
  
  // 3. 异或加密
  const xored = xorEncrypt(compressed, key);
  
  // 4. AES加密
  const encrypted = aesEncrypt(xored, keySchedule);
  
  // 5. 添加UUID校验
  const withChecksum = [uuid(encrypted), ...encrypted];
  
  // 6. 再次AES加密
  const final = aesEncrypt(withChecksum, keySchedule2);
  
  // 7. 转Base64变体
  return '0' + arrayToString(final);
}
```

---

## 📊 文件重要性评级

### ⭐⭐⭐⭐⭐ 绝对核心（缺一不可）
- `Cookie.js` - Cookie生成主逻辑
- `numarrEncrypt.js` - 哈夫曼编码
- `modeEncrypt.js` - AES加密
- `uuid.js` - 校验码生成
- `numarr2string.js` - 最终输出转换
- `basearr/index.js` + 至少一个 `len*.js` - basearr生成

### ⭐⭐⭐⭐ 重要工具
- `numToNumarr*.js` - 数字转换
- `combine4.js` - 字节合并
- `numarrAddTime.js` - 时间处理
- `tools.js` - 异或等操作
- `globalVarible.js` - 全局变量

### ⭐⭐⭐ 辅助功能
- `string2ascii.js` / `ascii2string.js` - 字符串处理
- `decrypt.js` / `decode.js` - 解密解码
- `random.js` - 随机数
- `fixedValue20.js` - 固定值

### ⭐⭐ 可选（调试用）
- `logger.js` - 日志输出
- `simpleCrypt.js` - hostname加密

---

## 🚀 快速提取脚本

```bash
#!/bin/bash
# 提取Cookie生成核心文件

mkdir -p cookie-core/{src/handler/{basearr,parser/common},utils}

# 核心文件
cp src/handler/Cookie.js cookie-core/src/handler/
cp src/handler/globalVarible.js cookie-core/src/handler/

# basearr
cp src/handler/basearr/index.js cookie-core/src/handler/basearr/
cp src/handler/basearr/len123.js cookie-core/src/handler/basearr/

# parser
cp src/handler/parser/index.js cookie-core/src/handler/parser/
cp src/handler/parser/constData.js cookie-core/src/handler/parser/

# 算法
cp src/handler/parser/common/*.js cookie-core/src/handler/parser/common/

# 工具
cp utils/logger.js cookie-core/utils/
cp utils/simpleCrypt.js cookie-core/utils/
cp utils/unescape.js cookie-core/utils/

echo "核心文件已提取到 cookie-core/ 目录"
```

---

## 📝 总结

### 最小核心（自己实现）
**约15个文件**，只要加密算法部分：
- 4个核心加密算法
- 8个数据转换工具
- 3个辅助工具

### 完整Cookie生成（使用项目代码）
**约30个文件**，包含：
- 核心加密算法
- basearr生成器
- 全局变量管理
- 工具函数

### 包含代码解析
**约50个文件**，额外包含：
- Coder.js 及相关解析器
- $_ts 处理模块
- 任务解析模块

**推荐**: 如果只是学习Cookie生成算法，提取30个核心文件即可。如果要实际使用，建议保留完整项目结构，方便维护和扩展。
