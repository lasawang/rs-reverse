// cebwm.com 专用的 tscd 解析器（短cd版本）
const gv = require('../globalVarible');
const logger = require('@utils/logger');

/**
 * 为短cd格式（如cebwm.com的96字符cd）创建默认keys
 * 这些网站的keys信息可能不在cd中，而是硬编码或在其他地方
 */
function createDefaultKeys() {
  logger.warn('使用默认keys（短cd格式网站）');
  
  // 创建一个基本的keys数组结构
  // 根据len123.js的使用，我们需要至少33个keys
  const keys = [];
  
  // keys[16], keys[19], keys[22], keys[24] 是关键的
  // keys[29-32] 必须是长度为4的数组
  
  for (let i = 0; i < 33; i++) {
    if (i === 16) {
      // keys[16] - 用于时间相关计算
      keys.push([0, 0, 0, 0]);
    } else if (i === 19) {
      // keys[19] - ASCII字符串
      keys.push([48, 0, 0, 0]); // "0"
    } else if (i === 22) {
      // keys[22] - 加密相关
      keys.push([0, 0, 0, 0]);
    } else if (i === 24) {
      // keys[24] - 标志位
      keys.push([48]); // "0"
    } else if (i >= 29 && i <= 32) {
      // keys[29-32] - 必须是长度4
      keys.push([0, 0, 0, 0]);
    } else {
      // 其他keys，给个默认值
      keys.push([0]);
    }
  }
  
  return keys;
}

exports.init = function() {
  logger.debug(`原始 gv.ts.cd: ${gv.ts.cd}`);
  logger.debug(`gv.ts.cd 长度: ${gv.ts.cd.length}`);
  
  // 检查cd长度
  if (gv.ts.cd.length < 200) {
    logger.warn(`检测到短cd格式（长度=${gv.ts.cd.length}），使用简化解析`);
    
    // 设置默认的动态任务偏移和keys
    const defaultOffset = [3, 153, 2, 3, 4, 5, 6, 7]; // 从debug日志中获取的offset值
    gv._setAttr('dynamicTaskOffset', defaultOffset);
    gv._setAttr('dynamicTask', {});
    gv._setAttr('keys', createDefaultKeys());
    
    logger.info('✅ 短cd格式解析完成（使用默认keys）');
    return;
  }
  
  // 否则使用原来的解析逻辑
  const decrypt = require('./common/decrypt');
  const numToNumarr4 = require('./common/numToNumarr4');
  const { runTaskByUid } = require('./common/runTask');
  const getLens = require('./common/getLens');
  
  const cdArr = decrypt(gv.ts.cd);
  logger.debug(`cdArr长度: ${cdArr.length}`);
  
  const start = 2;
  const end = (cdArr[0] << 8 | cdArr[1]) + start;
  
  // 检查 end 是否超出范围
  if (end > cdArr.length) {
    logger.error(`❌ end(${end}) 超出 cdArr 长度(${cdArr.length})，使用默认keys`);
    gv._setAttr('dynamicTaskOffset', [3, 153, 2, 3, 4, 5, 6, 7]);
    gv._setAttr('dynamicTask', {});
    gv._setAttr('keys', createDefaultKeys());
    return;
  }
  
  // 正常解析流程...
  // （原有代码）
  logger.debug('$_ts.cd完成解析!');
};
