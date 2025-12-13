# 瑞数Cookie加密核心实现技术文档

## 📖 文档说明

本文档详细说明了瑞数（RiverSecurity）VMP虚拟机保护技术的Cookie生成核心算法实现原理，用于学习和研究目的。

---

## 📑 目录

- [1. 项目概述](#1-项目概述)
- [2. 核心架构](#2-核心架构)
- [3. 核心模块详解](#3-核心模块详解)
- [4. Cookie生成流程](#4-cookie生成流程)
- [5. 加密算法详解](#5-加密算法详解)
- [6. 网站适配机制](#6-网站适配机制)
- [7. 实现要点](#7-实现要点)
- [8. 使用示例](#8-使用示例)

---

## 1. 项目概述

### 1.1 项目简介

这是一个瑞数VMP算法逆向项目（rs-reverse），主要功能：
- 解析瑞数加密的JavaScript虚拟机代码
- 还原动态生成的内层虚拟机代码
- 生成可用的Cookie字符串

### 1.2 技术栈

- **语言**: Node.js (需要 >=18)
- **核心依赖**: lodash, log4js, cheerio, request-promise
- **算法**: AES加密、哈夫曼编码、UUID算法、异或加密

### 1.3 关键概念

- **$_ts**: 瑞数的核心数据结构，包含 `nsd` 和 `cd` 等加密参数
- **外层虚拟机**: 浏览器加载的混淆JS代码
- **内层虚拟机**: 动态生成的执行代码
- **basearr**: 基础数字数组，包含浏览器环境指纹信息

---

## 2. 核心架构

### 2.1 项目结构

```
rs-reverse/
├── main.js                     # 命令行入口
├── src/
│   ├── makeCode.js            # 生成动态代码
│   ├── makeCookie.js          # 生成Cookie
│   ├── makeCodeHigh.js        # 高级代码生成
│   ├── basearrParse.js        # basearr解析
│   ├── index.js               # 模块导出
│   ├── config/                # 配置文件
│   │   ├── index.js
│   │   └── makecookieRuntimeConfig.js  # Cookie运行时配置
│   └── handler/               # 核心处理模块
│       ├── Coder.js           # 🔥 代码解析器（核心）
│       ├── Cookie.js          # 🔥 Cookie生成器（核心）
│       ├── globalVarible.js   # 全局变量管理
│       ├── initTs.js          # $_ts初始化
│       ├── grenKeys.js        # 密钥生成
│       ├── getScd.js          # 随机种子生成
│       ├── basearr/           # 🔥 网站适配模块（核心）
│       │   ├── index.js       # 适配器管理
│       │   ├── len123.js      # 长度123的basearr生成
│       │   ├── len127.js      # 长度127的basearr生成
│       │   ├── len103.js      # 其他长度适配
│       │   └── ...
│       └── parser/            # 🔥 解析算法模块（核心）
│           ├── index.js
│           ├── r2mka.js       # 任务解析
│           ├── tscp.js        # cp参数解析
│           ├── tscd.js        # cd参数解析
│           ├── meta.js        # meta信息解析
│           └── common/        # 通用算法
│               ├── numarrEncrypt.js     # 🔥 哈夫曼编码加密
│               ├── modeEncrypt.js       # 🔥 AES加密模式
│               ├── uuid.js              # UUID算法
│               ├── numarrAddTime.js     # 时间数组操作
│               ├── numarr2string.js     # 数组转字符串
│               ├── numToNumarr4.js      # 数字转4字节数组
│               ├── combine4.js          # 4字节合并
│               ├── decrypt.js           # 解密算法
│               └── tools.js             # 工具函数
└── utils/                     # 工具模块
    ├── logger.js              # 日志
    ├── simpleCrypt.js         # 简单加密
    └── ...
```

### 2.2 模块依赖关系

```
main.js
  ↓
makeCookie.js
  ↓
├─→ Coder.js (生成虚拟机代码)
│     ↓
│   ├─→ initTs.js
│   ├─→ getScd.js
│   ├─→ globaltext.js
│   ├─→ dataOper.js
│   └─→ arraySwap.js
│
└─→ Cookie.js (生成Cookie)
      ↓
    ├─→ basearr/index.js (选择适配器)
    │     ↓
    │   └─→ len123.js / len127.js / ... (生成basearr)
    │
    └─→ parser/common/ (加密算法)
          ├─→ numarrEncrypt.js
          ├─→ modeEncrypt.js
          └─→ uuid.js
```

---

## 3. 核心模块详解

### 3.1 Coder.js - 代码解析器

**功能**: 解析 `$_ts` 数据，生成完整的内层虚拟机代码

**关键方法**:

```javascript
class Coder {
  constructor(ts, immucfg) {
    this.$_ts = initTs(ts, immucfg);      // 初始化$_ts
    this.scd = getScd(this.$_ts.nsd);     // 生成随机种子
    this.keynames = this.$_ts.cp[1];      // 关键字名称数组
    this.keycodes = [];                   // 关键字代码数组
    this.optext = globaltext();           // 全局文本操作
    this.opmate = this.mateOper();        // 匹配操作
    this.opdata = dataOper();             // 数据操作
  }

  run(config = {}) {
    const codeArr = this.parseGlobalText1();  // 解析第一部分
    codeArr.push(this.parseGlobalText2());    // 解析第二部分
    const codeStr = codeArr.join('');
    this.parseTs(codeStr);                    // 计算代码特征
    this.code = codeStr;
    return this;
  }

  parseGlobalText1(codeArr = []) {
    // 解析nsd/cd生成代码段
    // 处理虚拟机的主要逻辑
  }

  gren(current, codeArr) {
    // 生成每个代码段
    // 包含函数定义、变量声明、控制流等
  }

  functionsSort(current, functionsNameMap) {
    // 函数排序，用于计算代码特征码
  }
}
```

**工作原理**:
1. 从 `$_ts.nsd` 和 `$_ts.cd` 中提取加密的代码信息
2. 使用随机种子 `scd` 解密代码结构
3. 动态生成JavaScript代码字符串
4. 计算代码特征值（用于后续Cookie生成）

### 3.2 Cookie.js - Cookie生成器

**功能**: 基于浏览器环境信息生成瑞数Cookie

**核心代码**:

```javascript
class Cookie {
  constructor(coder) {
    this.coder = coder;
    parser.init(coder);
    this.config = { ...gv.makecookieRuntimeConfig };
    if (!this.config.codeUid) this.config.codeUid = this.getCodeUid();
    if (!this.config.r2mkaTime) this.config.r2mkaTime = +ascii2string(gv.keys[21]);
  }

  run() {
    // 1. 生成基础数组（包含浏览器指纹）
    const basearr = getBasearr(this.config, gv);
    
    // 2. 对基础数组进行哈夫曼编码压缩
    const basearrEncrypt = encryptMode1(
      xor(
        numarrEncrypt(basearr),  // 哈夫曼编码
        gv.keys[2],              // 异或密钥
        16
      ),
      numarrAddTime(gv.keys[17], this.config.runTime, this.config.random)[0],
      0
    );
    
    // 3. 构建下一层数组
    const nextarr = numarrJoin(
      numarrJoin(
        2,
        numToNumarr4([this.config.r2mkaTime, this.config.startTime]),
        gv.keys[2]
      ),
      gv.config.adapt?.hasDebug ? basearrEncrypt.length >> 8 & 255 | 128 : undefined,
      basearrEncrypt,
    );
    
    // 4. 最终加密并转换为Cookie字符串
    return '0' + numarr2string(
      encryptMode1(
        [
          ...numToNumarr4(uuid(nextarr)),
          ...nextarr
        ],
        numarrAddTime(gv.keys[16], this.config.runTime, this.config.random)[0],
        1,
        this.config.random
      )
    );
  }

  getCodeUid() {
    // 计算代码唯一标识符
    const mainFunctionCode = this.coder.code.slice(...this.coder.mainFunctionIdx);
    const one = uuid(this.coder.functionsNameSort[ascii2string(gv.keys[33])].code);
    const len = parseInt(mainFunctionCode.length / 100);
    const start = len * ascii2string(gv.keys[34]);
    const two = uuid(mainFunctionCode.substr(start, len));
    return (one ^ two) & 65535;
  }
}
```

### 3.3 basearr 生成器 (以 len123.js 为例)

**功能**: 根据网站特征生成对应的基础数组

**核心代码**:

```javascript
function getBasearr(hostname, config) {
  if (!gv.config.adapt?.flag) throw new Error('适配器配置项flag值未定义');
  
  return numarrJoin(
    3,  // 数组标识
    numarrJoin(
      1,  // 浏览器信息段
      config['window.navigator.maxTouchPoints'],           // 触摸点数
      config['window.eval.toString().length'],             // eval长度
      128,                                                  // 固定值
      ...numToNumarr4(uuid(config['window.navigator.userAgent'])),  // UA的UUID
      string2ascii(config['window.navigator.platform']),   // 平台信息
      ...numToNumarr4(config.execNumberByTime),            // 时间相关
      ...execRandomByNumber(98, config.random),            // 随机数
      0,
      0,
      ...numToNumarr4(Number(hexnum('3136373737323136'))), // 固定魔数
      ...numToNumarr4(0),
      ...numToNumarr2(config['window.innerHeight']),       // 窗口内高
      ...numToNumarr2(config['window.innerWidth']),        // 窗口内宽
      ...numToNumarr2(config['window.outerHeight']),       // 窗口外高
      ...numToNumarr2(config['window.outerWidth']),        // 窗口外宽
      ...numToNumarr8(0),
    ),
    10,  // 时间戳段
    (() => {
      const flag = +ascii2string(gv.keys[24]);
      return [
        flag > 0 && flag < 8 ? 1 : 0,
        13,
        ...numToNumarr4(config.r2mkaTime + config.runTime - config.startTime),
        ...numToNumarr4(+ascii2string(gv.keys[19])),
        ...numToNumarr8(Math.floor((config.random || Math.random()) * 1048575) * 4294967296 + 
                       (((config.currentTime + 0) & 4294967295) >>> 0)),
        flag,
      ];
    })(),
    7,  // 代码特征段
    [
      ...numToNumarr4(16777216),
      ...numToNumarr4(0),
      ...numToNumarr2(gv.config.adapt.flag),  // 网站标识flag
      ...numToNumarr2(config.codeUid),         // 代码唯一ID
    ],
    0,
    [0],
    6,  // 文档信息段
    [
      1,
      ...numToNumarr2(0),
      ...numToNumarr2(0),
      config['window.document.hidden'] ? 0 : 1,
      ...encryptMode2(decrypt(ascii2string(gv.keys[22])), 
                     numarrAddTime(gv.keys[16])[0]),
      ...numToNumarr2(+decode(decrypt(ascii2string(gv.keys[22])))),
    ],
    2,
    fixedValue20(),  // 固定的20个值
    9,  // 连接信息段
    (() => {
      const { connType } = config['window.navigator.connection'];
      const { charging, chargingTime, level } = config['window.navigator.battery'];
      const connTypeIdx = ['bluetooth', 'cellular', 'ethernet', 'wifi', 'wimax'].indexOf(connType) + 1;
      let oper = 0;
      if (level) oper |= 2;
      if (charging) oper |= 1;
      if (connTypeIdx !== undefined) oper |= 8;
      return [
        oper,
        level * 100,
        ...numToNumarr2(chargingTime),
        connTypeIdx,
      ];
    })(),
    13,
    [0],
  );
}

// 适配配置
Object.assign(getBasearr, {
  adapt: ["XFRKF1pWVBdaVw==", "U18XWlpbF1pWVA=="],  // 加密的hostname
  "XFRKF1pWVBdaVw==": {
    lastWord: 'P',      // Cookie键的最后字母
    flag: 4114,         // 网站标识号
    devUrl: 'UU1NSUoDFhZOTk4XXFRKF1pWVBdaVxY='
  },
  "U18XWlpbF1pWVA==": {
    lastWord: 'T',
    flag: 4113,
    devUrl: "UU1NSUoDFhZTXxdaWlsXWlZUFlxBWlFYV15cWlxXTVxLFkpcWEtaURZJS1ZdTFpNF1NRTVRV",
  },
  lens: 123,  // basearr长度
  example: [3,49,1,0,33,128,159,173,0,238,8,77,97,99,73,110,116,101,108,...]
});
```

**basearr结构分析**:

basearr是一个包含多个信息段的数组，每个段以标识符开头：
- **段1 (标识3)**: 浏览器基本信息
- **段2 (标识10)**: 时间戳信息
- **段3 (标识7)**: 代码特征信息
- **段4 (标识6)**: 文档状态信息
- **段5 (标识2)**: 固定值数组
- **段6 (标识9)**: 网络连接信息
- **段7 (标识13)**: 结束标记

---

## 4. Cookie生成流程

### 4.1 完整流程图

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 输入阶段                                                   │
├─────────────────────────────────────────────────────────────┤
│  - $_ts (包含 nsd, cd)                                       │
│  - immucfg (静态配置)                                         │
│  - 浏览器环境信息                                             │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Coder 阶段 - 代码还原                                      │
├─────────────────────────────────────────────────────────────┤
│  ① initTs(): 初始化 $_ts 结构                                │
│  ② getScd(): 生成随机种子                                    │
│  ③ parseGlobalText1(): 解析第一部分代码                       │
│  ④ parseGlobalText2(): 解析第二部分代码                       │
│  ⑤ parseTs(): 计算代码特征值 (cp[3], cp[4])                  │
│  ⑥ functionsSort(): 函数排序                                 │
│     → 输出: 完整的内层虚拟机代码                              │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Cookie 阶段 - Cookie生成                                  │
├─────────────────────────────────────────────────────────────┤
│  ① parser.init(): 初始化解析器                               │
│  ② getCodeUid(): 计算代码唯一标识                            │
│     └─ uuid(函数代码) XOR uuid(主代码片段)                    │
│                                                              │
│  ③ getBasearr(): 生成基础数组                                │
│     ├─ 浏览器指纹 (UA, platform, innerHeight等)              │
│     ├─ 时间信息 (startTime, runTime等)                       │
│     ├─ 代码特征 (flag, codeUid)                             │
│     └─ 设备信息 (battery, connection等)                      │
│                                                              │
│  ④ 第一次加密:                                               │
│     numarrEncrypt(basearr)  → 哈夫曼编码压缩                 │
│     ↓                                                         │
│     xor(密文, keys[2])      → 异或加密                       │
│     ↓                                                         │
│     encryptMode1(...)       → AES-CBC加密                    │
│                                                              │
│  ⑤ 构建中间数组:                                             │
│     nextarr = [时间信息 + 加密后的basearr]                    │
│                                                              │
│  ⑥ 第二次加密:                                               │
│     [uuid(nextarr) + nextarr]  → 添加校验码                  │
│     ↓                                                         │
│     encryptMode1(...)          → AES-CBC加密                 │
│     ↓                                                         │
│     numarr2string(...)         → 转换为Base64变体字符串       │
│                                                              │
│  ⑦ 输出: Cookie字符串 (以'0'开头，长度约257字符)              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 详细步骤说明

#### 步骤1: 初始化

```javascript
// 1. 初始化$_ts
const $_ts = initTs(ts, immucfg);
// 结构: {
//   nsd: 随机种子,
//   cd: 压缩数据,
//   jf: 检测标志,
//   cp: [cp0, cp1, cp2, null, null, null, ''],
//   aebi: [],
//   scj: []
// }

// 2. 生成密钥数组
gv.keys = [...];  // 从cp[0]中提取的密钥数组
```

#### 步骤2: 代码还原

```javascript
const coder = new Coder(ts, immucfg);
const { code, $_ts } = coder.run();
// code: 还原后的JS代码字符串
// $_ts: 更新后的$_ts对象，包含计算出的cp[3]和cp[4]
```

#### 步骤3: 生成basearr

```javascript
const basearr = getBasearr(config, gv);
// basearr示例 (len=123):
// [3, 49, 1, 0, 33, 128, 159, 173, 0, 238, 8, 77, 97, 99, 73, 110, 
//  116, 101, 108, 0, 0, 6, 74, 52, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 
//  3, 190, 0, 150, 4, 55, 6, 192, 0, 0, 0, 0, 0, 0, 0, 0, 10, 19, 1, 
//  13, 104, 247, 77, 223, 132, 182, 40, 134, 0, 8, 94, 52, 6, 14, 91, 
//  114, 4, 7, 12, 1, 0, 0, 0, 0, 0, 0, 0, 16, 18, 246, 60, 0, 1, 0, 6, 
//  16, 1, 0, 0, 0, 0, 1, 127, 21, 128, 139, 16, 104, 13, 0, 0, 0, 2, 4, 
//  181, 203, 11, 102, 9, 5, 11, 100, 0, 0, 0, 13, 1, 0]
```

#### 步骤4: 哈夫曼编码

```javascript
const compressed = numarrEncrypt(basearr);
// 使用哈夫曼树压缩数组，减小数据大小
// 根据字节频率构建最优编码树
```

#### 步骤5: 多层加密

```javascript
// 第一层：异或
const xored = xor(compressed, gv.keys[2], 16);

// 第二层：AES-CBC加密
const encrypted1 = encryptMode1(xored, keyarr, 0);

// 第三层：添加UUID校验 + 再次AES加密
const final = encryptMode1(
  [...numToNumarr4(uuid(nextarr)), ...nextarr],
  keyarr2,
  1,
  random
);
```

#### 步骤6: 转换为Cookie字符串

```javascript
const cookieValue = '0' + numarr2string(final);
// 使用自定义Base64字符集转换
// 字符集: 'qrcklmDoExthWJiHAp1sVYKU3RFMQw8IGfPO92bvLNj.7zXBaSnu0TC6gy_4Ze5d'
```

---

## 5. 加密算法详解

### 5.1 哈夫曼编码 (numarrEncrypt.js)

**原理**: 根据字节出现频率构建最优编码树，高频字节使用短编码

**实现**:

```javascript
function numarrEncrypt(numarr) {
  // 1. 构建哈夫曼树
  let arr = [];
  for (let i = 1; i < 255; i++) {
    arr.push({ total: 1, idx: i });
  }
  arr.push({ total: 6, idx: 255 }, { total: 45, idx: 0 });
  
  // 2. 合并节点直到只剩一个根节点
  while (arr.length > 1) {
    const [one, two] = arr.slice(0, 2);
    arr = arr.slice(2);
    parse({
      total: one.total + two.total,
      first: one,
      second: two
    });
  }
  
  // 3. 生成编码配置
  const encryptConfig = getEncryptConfig(arr[0]);
  
  // 4. 使用编码配置压缩数据
  const ans = [];
  let one = 0, two = 0;
  for (let i = 0; i < numarr.length; i++) {
    const cfg = encryptConfig[0][numarr[i]];
    one = one << cfg.val | cfg.key;
    two += cfg.val;
    while (two >= 8) {
      ans.push(one >> two - 8);
      one &= ~(255 << two - 8);
      two -= 8;
    }
  }
  
  return ans;
}
```

**特点**:
- 字节0的权重最高（45），使用最短编码
- 字节255的权重较高（6）
- 其他字节权重为1
- 压缩率约为原始大小的60-70%

### 5.2 AES加密模式 (modeEncrypt.js)

**encryptMode1 - CBC模式**:

```javascript
function encryptMode1(valarr, keyarr, flag = 1, random) {
  // 1. 生成密钥调度
  const cfg = getCfg(keyarr);
  
  // 2. 生成随机IV (初始化向量)
  let iv = flag ? new Array(4).fill(4294967295).map(
    it => Math.floor((random || Math.random()) * it)
  ) : null;
  
  // 3. 填充数据 (PKCS7)
  const fill = 16 - valarr.length % 16;
  const paddedData = [...valarr, ...new Array(fill).fill(fill)];
  
  // 4. CBC模式加密
  let ans = flag ? [...iv] : [];
  let prevBlock = iv;
  const blocks = numToNumarr4.reverse_sign(paddedData);
  
  for (let i = 0; i < blocks.length / 4; i++) {
    let currentBlock = blocks.slice(i * 4, (i + 1) * 4);
    
    // CBC: 当前块与前一个密文块异或
    if (prevBlock) {
      currentBlock = currentBlock.map((val, idx) => val ^ prevBlock[idx]);
    }
    
    // AES加密
    const encrypted = encode(cfg, currentBlock, 0, gv.cfgnum[0]);
    ans.push(...encrypted);
    prevBlock = encrypted;
  }
  
  return numToNumarr4(ans);
}
```

**encryptMode2 - 解密模式**:

```javascript
function encryptMode2(valarr, keyarr, flag = 1) {
  const cfg = getCfg(keyarr);
  const arr = [];
  let arrcom = combine4(valarr);
  let arrsub = flag ? arrcom.slice(0, 4) : [];  // 提取IV
  arrcom = arrcom.slice(4);
  
  // CBC解密
  for (let i = 0; i < arrcom.length / 4; i++) {
    const currentBlock = arrcom.slice(i * 4, (i + 1) * 4);
    let decrypted = encode(cfg, currentBlock, 1, gv.cfgnum[1]);
    
    // 与前一个密文块异或
    if (arrsub.length) {
      decrypted = decrypted.map((val, idx) => val ^ arrsub[idx]);
    }
    
    arr.push(...decrypted);
    arrsub = currentBlock;
  }
  
  // 去除填充
  const result = arr.reduce((ans, it) => ([...ans, ...numToNumarr4(it)]), []);
  return result.slice(0, result.length - result[result.length - 1]);
}
```

**AES核心加密函数**:

```javascript
function encode(cfg, val, idx, cfgnum) {
  const list = cfg[idx];
  const arr = [0, 0, 0, 0];
  let one = val[0] ^ list[0];
  let two = val[idx ? 3 : 1] ^ list[1];
  let three = val[2] ^ list[2];
  let four = val[idx ? 1 : 3] ^ list[3];
  let cursor = 4;
  
  // AES轮函数
  for (let i = 0; i < list.length / 4 - 2; i++) {
    const none = cfgnum[0][one >>> 24] ^ 
                 cfgnum[1][two >> 16 & 255] ^ 
                 cfgnum[2][three >> 8 & 255] ^ 
                 cfgnum[3][four & 255] ^ 
                 list[cursor];
    // ... 其他轮操作
    cursor += 4;
    [one, two, three] = [none, ntwo, nthree];
  }
  
  // 最后一轮
  for (let i = 0; i < 4; i++) {
    arr[idx ? 3 & -i : i] = 
      cfgnum[4][one >>> 24] << 24 ^ 
      cfgnum[4][two >> 16 & 255] << 16 ^ 
      cfgnum[4][three >> 8 & 255] << 8 ^ 
      cfgnum[4][four & 255] ^ 
      list[cursor++];
    [one, two, three, four] = [two, three, four, one];
  }
  
  return arr;
}
```

### 5.3 UUID算法 (uuid.js)

**功能**: 计算数据的CRC32校验码

```javascript
function uuid(numarr) {
  if (typeof numarr === 'string') {
    numarr = str2code(numarr);  // 字符串转字节数组
  }
  
  let val = 0 ^ -1;  // 初始值：-1
  for (let i = 0; i < numarr.length; i++) {
    val = val >>> 8 ^ gv.bignum[(val ^ numarr[i]) & 255];
  }
  
  return (val ^ -1) >>> 0;  // 返回无符号32位整数
}
```

**用途**:
- 计算代码特征码 (codeUid)
- 生成Cookie校验码
- 确保数据完整性

### 5.4 数组转字符串 (numarr2string.js)

**功能**: 使用自定义字符集将字节数组转换为字符串

```javascript
function numarr2string(numarr) {
  const basestr = gv.basestr;  
  // 'qrcklmDoExthWJiHAp1sVYKU3RFMQw8IGfPO92bvLNj.7zXBaSnu0TC6gy_4Ze5d'
  
  let ans = '';
  let one = 0, two = 0;
  
  for (let i = 0; i < numarr.length; i++) {
    one = one << 8 | numarr[i];
    two += 8;
    
    while (two >= 6) {
      ans += basestr[one >> two - 6 & 63];
      two -= 6;
    }
  }
  
  if (two > 0) {
    ans += basestr[(one & (1 << two) - 1) << 6 - two];
  }
  
  return ans;
}
```

**特点**:
- 类似Base64编码，但使用自定义字符集
- 每3个字节转换为4个字符
- 输出长度约为输入的4/3倍

---

## 6. 网站适配机制

### 6.1 适配器管理 (basearr/index.js)

```javascript
// 1. 自动加载所有适配器
const modMap = fs.readdirSync(__dirname)
  .filter(f => f.endsWith('.js') && f !== 'index.js')
  .map(f => require(path.join(__dirname, f)))
  .reduce((ans, mod) => {
    mod.adapt?.forEach(it => {
      ans[it] = {
        ...mod,
        ...(mod[it] || {}),
        key: it,
        func: mod.bind(null, simpleDecrypt(it)),
      };
    });
    return ans;
  }, {});

// 2. 根据hostname选择适配器
module.exports = (config, gv) => {
  const mod = modMap[gv.config.hostname] || 
              modMap[simpleEncrypt(gv.config.hostname)];
  
  if (mod) {
    logger.debug(`使用【${simpleDecrypt(mod.key)}】生成basearr`);
    return getBasearr(mod.func, config);
  }
  
  // 默认适配器
  return getBasearr(modMap['Q1FYVklQVxdKXlpaF1pWVBdaVw=='].func, config);
}
```

### 6.2 适配器配置

每个网站需要配置以下参数：

```javascript
Object.assign(getBasearr, {
  // 必需配置
  adapt: ["加密的hostname数组"],  // 使用simpleEncrypt加密
  
  // 每个hostname的配置
  "加密hostname": {
    lastWord: 'T',      // Cookie键的最后字母 (T或P)
    flag: 4113,         // 网站标识号 (4位数字)
    devUrl: '开发URL'   // 用于记录
  },
  
  // 可选配置
  encryptLens: 111,     // 加密后数组长度
  hasDebug: false,      // 是否添加额外debugger
  
  // 协助开发
  lens: 123,            // basearr长度
  example: [...]        // 示例数组
});
```

### 6.3 已适配网站

根据README.md，以下网站已适配：

| 网站 | makecode | makecookie | makecode-high |
|------|----------|------------|---------------|
| riversecurity.com | ✅ | ✅ | ✅ |
| epub.cnipa.gov.cn | ✅ | ✅ | ✅ |
| zhaopin.sgcc.com.cn | ✅ | ✅ | ✅ |
| njnu.edu.cn | ✅ | ✅ | ✅ |
| ems.com.cn | ✅ | ✅ | ✅ |
| jf.ccb.com | ✅ | ✅ | ✅ |
| customs.gov.cn | ✅ | ✅ | ✅ |
| fangdi.com.cn | ✅ | ✅ | ✅ |
| nmpa.gov.cn | ✅ | ✅ | ✅ |

### 6.4 适配新网站步骤

1. **获取样本数据**:
   ```bash
   node main.js makecode -u https://目标网站
   ```

2. **分析basearr结构**:
   - 使用浏览器开发者工具断点调试
   - 找到basearr生成位置
   - 记录数组长度和结构

3. **创建适配文件** (如 `len133.js`):
   ```javascript
   const parser = require('../parser/');
   const gv = require('../globalVarible');
   
   function getBasearr(hostname, config) {
     // 根据分析结果实现basearr生成逻辑
     return numarrJoin(...);
   }
   
   Object.assign(getBasearr, {
     adapt: [simpleEncrypt("目标hostname")],
     [simpleEncrypt("目标hostname")]: {
       lastWord: 'T',  // 通过浏览器Cookie查看
       flag: 4115,     // 需要逆向分析获取
     },
     lens: 133,
     encryptLens: 111,  // 可选
   });
   
   module.exports = getBasearr;
   ```

4. **测试验证**:
   ```bash
   node main.js makecookie -u https://目标网站
   ```

---

## 7. 实现要点

### 7.1 关键技术点

#### 1. 随机数控制

```javascript
// Cookie生成过程中，随机数需要可控
Math.random = () => 0.1253744220839037;  // 固定随机数

// 配置中传入
config.random = 0.1253744220839037;
```

#### 2. 时间同步

```javascript
config.startTime = Date.now();           // 开始时间
config.runTime = Date.now() - startTime; // 运行时长
config.currentTime = Date.now();         // 当前时间
config.r2mkaTime = +ascii2string(gv.keys[21]);  // 密钥时间
```

#### 3. 代码特征计算

```javascript
// cp[3]: 代码特征值
let flag = 0;
for (let i = 0; i < codeStr.length; i += 100) {
  flag += codeStr.charCodeAt(i);
}
$_ts.cp[3] = flag;

// cp[4]: 代码生成时长
$_ts.cp[4] = new Date().getTime() - startTime;

// codeUid: 代码唯一标识
const one = uuid(函数代码);
const two = uuid(主代码片段);
codeUid = (one ^ two) & 65535;
```

#### 4. 密钥提取

```javascript
// 从cp[0]中提取密钥数组
const keys = [];
for (let i = 0; i < cp[0].length; i += 96) {
  keys.push(cp[0].slice(i, i + 96));
}
gv._setAttr('keys', keys);
```

### 7.2 常见问题

#### 问题1: Cookie长度不对

**原因**: basearr长度错误或加密后长度不匹配

**解决**:
```javascript
// 设置encryptLens参数
Object.assign(getBasearr, {
  encryptLens: 111,  // 指定加密后长度
});

// 会自动重试直到长度正确
function getBasearr(func, config, deep = 0) {
  if (deep >= 1000) throw new Error('生成cookie尝试次数过多');
  const basearr = func(config);
  if (func.encryptLens && numarrEncrypt(basearr).length !== func.encryptLens) {
    return getBasearr(func, config, deep + 1);
  }
  return basearr;
}
```

#### 问题2: Cookie验证失败

**原因**: flag值错误或lastWord不匹配

**解决**:
1. 在浏览器中查看Cookie键，确认最后一个字母
2. 逆向分析获取正确的flag值（4位数字）

#### 问题3: 网站风控

**原因**: 连续请求触发瑞数风控

**解决**:
- 控制请求频率
- 避免使用makecode-high命令连续请求
- 使用代理IP轮换

### 7.3 性能优化

#### 1. 哈夫曼树缓存

```javascript
let encryptConfig = undefined;

module.exports = function (numarr) {
  if (!encryptConfig) encryptConfig = getEncryptConfig(getTree());
  // 只构建一次哈夫曼树
  // ...
}
```

#### 2. 密钥配置缓存

```javascript
// 密钥配置只生成一次
function getCfg(numarr) {
  const ret = combine4(numarr.length % 16 !== 0 ? 
    numarrAddTime.reverse(numarr)[0] : numarr);
  // ...生成AES密钥调度
  return [ret, arr];
}
```

#### 3. 适配器懒加载

```javascript
// 只在需要时加载对应的适配器模块
const mod = modMap[gv.config.hostname];
if (mod) {
  return getBasearr(mod.func, config);
}
```

---

## 8. 使用示例

### 8.1 基本使用

#### 示例1: 生成Cookie（使用内置样例）

```bash
node main.js makecookie
```

输出:
```
成功生成cookie（长度：257），用时：496ms
cookie值: NOh8RTWx6K2dT=0aVFQWz9TfBZEx_EGQe8fpVBBOkDIQGjOpbzYQIWlwicb3GLeojY7FT_iq0fqpSVIt._yUpsnu2h9jX1copSnJWwcqwMW7awhErC.OWPMB6H1j.0hGxOLsPpvf7rrhaSNTowR.IKzW8ZldpXsThD69So3MEQ7_qbc99iyczvsp5l4_gOxdq1s43qOdp7OOHxj86WrZjCDljtGJexbDZc2ug_yAH_PHZSIX4XSFwoLd0MB4MMAVjA1.BhA4OXk2cM2
```

#### 示例2: 从URL生成Cookie

```bash
node main.js makecookie -u https://www.riversecurity.com/
```

#### 示例3: 使用本地文件

```bash
node main.js makecookie -j ./example/codes/main.js -f ./example/codes/\$_ts.json
```

### 8.2 代码集成

#### 示例1: 在Node.js中使用

```javascript
const { makeCookie } = require('./src/');
const gv = require('./src/handler/globalVarible');

// 1. 准备$_ts数据
const ts = {
  nsd: "...",  // 从网站响应中提取
  cd: "..."    // 从网站响应中提取
};

// 2. 配置环境信息
gv._setAttr('makecookieRuntimeConfig', {
  'window.navigator.userAgent': 'Mozilla/5.0...',
  'window.navigator.platform': 'MacIntel',
  'window.innerHeight': 969,
  'window.innerWidth': 1920,
  'window.outerHeight': 1080,
  'window.outerWidth': 1920,
  'window.navigator.maxTouchPoints': 0,
  'window.eval.toString().length': 33,
  'window.document.hidden': false,
  'window.navigator.connection': { connType: 'wifi' },
  'window.navigator.battery': { 
    charging: true, 
    chargingTime: 0, 
    level: 1 
  },
  random: 0.1253744220839037,
  startTime: Date.now(),
  currentTime: Date.now(),
});

// 3. 生成Cookie
const cookie = makeCookie(ts, () => './output');
console.log('生成的Cookie:', cookie);
```

#### 示例2: 自定义配置

```javascript
const config = {
  // 浏览器配置
  'window.navigator.userAgent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  'window.navigator.platform': 'MacIntel',
  'window.innerHeight': 969,
  'window.innerWidth': 1920,
  'window.outerHeight': 1080,
  'window.outerWidth': 1920,
  'window.navigator.maxTouchPoints': 0,
  'window.eval.toString().length': 33,
  'window.document.hidden': false,
  
  // 网络信息
  'window.navigator.connection': {
    connType: 'wifi'  // bluetooth, cellular, ethernet, wifi, wimax
  },
  
  // 电池信息
  'window.navigator.battery': {
    charging: true,
    chargingTime: 0,
    level: 1.0
  },
  
  // 时间控制
  random: Math.random(),
  startTime: Date.now(),
  currentTime: Date.now(),
  runTime: 0,
  
  // 可选：自定义codeUid
  codeUid: 12345,
  
  // 可选：自定义r2mkaTime
  r2mkaTime: 1757038222,
};

gv._setAttr('makecookieRuntimeConfig', config);
```

### 8.3 调试技巧

#### 1. 启用调试日志

```bash
node main.js makecookie -l debug
```

#### 2. 查看basearr生成过程

```javascript
const logger = require('./utils/logger');
logger.level = 'debug';

const basearr = getBasearr(config, gv);
console.log('basearr长度:', basearr.length);
console.log('basearr内容:', basearr);

const compressed = numarrEncrypt(basearr);
console.log('压缩后长度:', compressed.length);
```

#### 3. 验证代码特征

```bash
node main.js exec -c 'gv.cp0' -f ./example/codes/\$_ts.json
node main.js exec -c 'gv.keys' -f ./example/codes/\$_ts.json
node main.js exec -c '+ascii2string(gv.keys[21])' -f ./example/codes/\$_ts.json
```

### 8.4 常用命令

```bash
# 1. 生成代码
node main.js makecode
node main.js makecode -u https://www.riversecurity.com/
node main.js makecode -j ./path/to/main.js -f ./path/to/ts.json

# 2. 生成Cookie
node main.js makecookie
node main.js makecookie -u https://www.riversecurity.com/
node main.js makecookie -c '{"random":0.123}'

# 3. 高级代码生成（两次请求）
node main.js makecode-high -u https://zhaopin.sgcc.com.cn/sgcchr/static/home.html

# 4. 执行代码片段
node main.js exec -c 'gv.cp2'
node main.js exec -c '+ascii2string(gv.keys[21])'

# 5. 解析basearr
node main.js basearr -b '[3,49,...,125]'
```

---

## 9. 总结

### 9.1 核心文件清单

| 文件路径 | 功能 | 重要性 |
|---------|------|--------|
| `src/makeCookie.js` | Cookie生成入口 | ⭐⭐⭐⭐⭐ |
| `src/handler/Cookie.js` | Cookie生成核心逻辑 | ⭐⭐⭐⭐⭐ |
| `src/handler/Coder.js` | 代码解析器 | ⭐⭐⭐⭐⭐ |
| `src/handler/basearr/index.js` | 适配器管理 | ⭐⭐⭐⭐⭐ |
| `src/handler/basearr/len*.js` | 各网站适配器 | ⭐⭐⭐⭐⭐ |
| `src/handler/parser/common/numarrEncrypt.js` | 哈夫曼编码 | ⭐⭐⭐⭐⭐ |
| `src/handler/parser/common/modeEncrypt.js` | AES加密 | ⭐⭐⭐⭐⭐ |
| `src/handler/parser/common/uuid.js` | UUID算法 | ⭐⭐⭐⭐ |
| `src/handler/parser/common/numarr2string.js` | 数组转字符串 | ⭐⭐⭐⭐ |
| `src/handler/globalVarible.js` | 全局变量管理 | ⭐⭐⭐⭐ |
| `src/handler/initTs.js` | $_ts初始化 | ⭐⭐⭐ |
| `src/handler/grenKeys.js` | 密钥生成 | ⭐⭐⭐ |

### 9.2 技术要点

1. **虚拟机代码还原**: 从加密的 `$_ts` 数据中还原JavaScript代码
2. **哈夫曼编码**: 使用自定义权重的哈夫曼树压缩数据
3. **AES加密**: CBC模式的AES加密，支持加密和解密
4. **浏览器指纹**: 收集UA、屏幕尺寸、电池、网络等信息
5. **代码特征计算**: 通过代码内容计算唯一标识
6. **多层加密**: 哈夫曼编码 → 异或 → AES → Base64变体
7. **网站适配**: 每个网站需要单独的basearr生成逻辑

### 9.3 学习建议

1. **从简单到复杂**:
   - 先理解整体流程（Cookie.js）
   - 再深入加密算法（parser/common/）
   - 最后学习网站适配（basearr/）

2. **实践调试**:
   - 使用 `exec` 命令查看中间变量
   - 启用 debug 日志查看详细过程
   - 对比浏览器实际生成的Cookie

3. **适配新网站**:
   - 使用浏览器开发者工具断点调试
   - 记录basearr的结构和长度
   - 参考已有适配器编写新适配器

### 9.4 注意事项

1. **法律合规**: 本项目仅用于学习研究，请勿用于非法用途
2. **风控问题**: 频繁请求可能触发风控，需要控制频率
3. **版本差异**: 不同版本的瑞数可能有差异，需要适配
4. **时间同步**: Cookie生成依赖时间戳，确保时间同步
5. **随机数控制**: 调试时使用固定随机数，生产环境使用真随机数

---

## 10. 参考资源

### 博客文章

1. [瑞数vmp-代码格式化后无法正常运行原因分析](https://blog.howduudu.tech/article/420dc80bfb66280ddbb93d87864cadd1/)
2. [瑞数vmp-动态代码生成原理](https://blog.howduudu.tech/article/95f60638eaa0647bcf327fb4f2c2887c/)
3. [补环境-document.all的c++方案1](https://blog.howduudu.tech/article/00bb5f4a997c39858e25fa962e8cd5b8/)
4. [补环境-document.all的c++方案2](https://blog.howduudu.tech/article/de942bdea377f7f3ce6878fc04a8c76c/)

### 相关项目

- [sdenv](https://github.com/pysunday/sdenv) - 补环境框架
- [rs-reverse](https://github.com/pysunday/rs-reverse) - 本项目

### 技术交流

- 作者微信: `howduudu_tech`
- 订阅号: 码功

---

**文档版本**: v1.0.0  
**最后更新**: 2025-12-13  
**项目版本**: rs-reverse v1.15.1
