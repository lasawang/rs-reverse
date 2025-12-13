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
