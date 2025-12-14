/**
 * cebwm.com 专用 basearr 生成器
 * 特点：cd长度仅96字符（短cd格式）
 */

const parser = require('../parser/');
const gv = require('../globalVarible');

const {
  numToNumarr2,
  numToNumarr4,
  numToNumarr8,
  uuid,
  string2ascii,
  numarrJoin,
  execRandomByNumber,
} = parser;

function getBasearr(hostname, config) {
  // cebwm.com 的简化basearr
  // 由于cd数据不完整，我们使用简化的特征值生成
  
  return numarrJoin(
    3,
    numarrJoin(
      1,
      config['window.navigator.maxTouchPoints'] || 0,
      config['window.eval.toString().length'] || 33,
      128,
      ...numToNumarr4(uuid(config['window.navigator.userAgent'])),
      string2ascii(config['window.navigator.platform']),
      ...numToNumarr4(config.execNumberByTime || 0),
      ...execRandomByNumber(98, config.random),
      0,
      0,
      ...numToNumarr4(0),
      ...numToNumarr4(0),
      ...numToNumarr2(config['window.innerHeight'] || 800),
      ...numToNumarr2(config['window.innerWidth'] || 1440),
      ...numToNumarr2(config['window.outerHeight'] || 900),
      ...numToNumarr2(config['window.outerWidth'] || 1440),
      ...numToNumarr8(0),
    ),
    10,
    [
      0, // 简化的flag
      13,
      ...numToNumarr4(config.r2mkaTime + config.runTime - config.startTime),
      ...numToNumarr4(0), // 简化的keys[19]
      ...numToNumarr8(Math.floor((config.random || Math.random()) * 1048575) * 4294967296 + (((config.currentTime + 0) & 4294967295) >>> 0)),
      0,
    ],
    7,
    [
      ...numToNumarr4(16777216),
      ...numToNumarr4(0),
      ...numToNumarr2(4096), // 默认flag值
      ...numToNumarr2(config.codeUid),
    ],
    0,
    [0],
    6,
    [
      1,
      ...numToNumarr2(0),
      ...numToNumarr2(0),
      config['window.document.hidden'] ? 0 : 1,
      ...numToNumarr4(0), // 简化的加密值
      ...numToNumarr2(0),
    ],
    2,
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // fixedValue20
    9,
    [
      0, // 简化的连接信息
      0,
      ...numToNumarr2(0),
      0,
    ],
    13,
    [0],
  );
}

Object.assign(getBasearr, {
  adapt: ["Tk5OF1pcW05UF1pWVA=="], // www.cebwm.com 加密后的域名
  "Tk5OF1pcW05UF1pWVA==": {
    lastWord: 'm',
    flag: 4096,
    devUrl: "UU1NSUoDFhZOTk4XWlxbTlQXWlZU"  // https://www.cebwm.com
  },
  lens: 96, // 特殊的cd长度标识
  example: [] // 示例basearr（暂时为空）
});

module.exports = getBasearr;
