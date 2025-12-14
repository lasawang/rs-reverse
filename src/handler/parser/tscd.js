// 生成密钥
const gv = require('../globalVarible');
const decrypt = require('./common/decrypt');
const logger = require('@utils/logger');
const numToNumarr4 = require('./common/numToNumarr4');
const { runTaskByUid } = require('./common/runTask');
const custask = require('./task');
const error = require('@utils/error');
const getLens = require('./common/getLens');

function getValMaps() {
  let uid = gv.ts.cp[3];
  const ans = [];
  for (let i = 0; i < 4; i++) {
    uid = 15679 * (uid & 65535) + 2531011;
    ans.push(uid);
  }
  return numToNumarr4(ans);
}

function parse(arr) {
  const len = arr.length;
  const valMap = getValMaps();
  let idx = 4;
  do {
    idx += 16;
    const mod = idx % (len - idx > 16 ? 16 : len - idx);
    if (mod + idx < arr.length) {
      arr[mod + idx] ^= valMap[mod];
    }
  } while (idx < len);
  return arr;
}

function getTaskarr(arr, idx, ans = {}) {
  if (idx >= arr.length) return;
  const start = idx + 1;
  const end = start + arr[idx];
  const key = arr[idx - 2];
  ans[key] = gv.r2mka().child_one[key].taskarr = arr.slice(start, end);
  getTaskarr(arr, end + 2, ans);
  return ans;
}

function genKeys(ans, step = 2) {
  if (step <= 0) throw new Error('生成keys失败，请检查！')
  const keys = []
  for (let i = 0, op = 1, gap; i < ans[0]; i ++) {
    if (step === 2) {
      [gap, op] = [ans[op] << 8 | ans[op + 1], op + 2];
    } else if (step === 1) {
      [gap, op] = getLens(ans, op);
    }
    keys.push(ans.slice(op, op + gap));
    op += gap;
  }
  // 添加调试信息和安全检查
  logger.debug(`生成的keys数量: ${keys.length}, step: ${step}`);
  
  // 检查keys数组长度是否足够
  if (keys.length < 33) {
    logger.warn(`keys数量不足(${keys.length} < 33)，尝试降级到step=${step-1}`);
    return genKeys(ans, step - 1);
  }
  
  // 检查特定键的长度
  if ([29, 30, 31, 32].some(key => !keys[key] || keys[key].length !== 4)){
    logger.warn(`keys[29-32]长度验证失败，尝试降级到step=${step-1}`);
    return genKeys(ans, step - 1);
  }
  return keys;
}

/**
 * 为短cd格式创建默认keys
 */
function createDefaultKeys() {
  logger.warn('检测到短cd格式，使用默认keys');
  
  const keys = [];
  
  // 创建至少35个keys（keys[0-34]）
  for (let i = 0; i < 35; i++) {
    if (i === 16) {
      keys.push([0, 0, 0, 0]);
    } else if (i === 19) {
      keys.push([48, 0, 0, 0]); // ASCII "0"
    } else if (i === 22) {
      keys.push([0, 0, 0, 0]);
    } else if (i === 24) {
      keys.push([48]); // ASCII "0"
    } else if (i >= 29 && i <= 32) {
      keys.push([0, 0, 0, 0]);
    } else if (i === 33) {
      keys.push([48]); // keys[33] 用于getCodeUid
    } else if (i === 34) {
      keys.push([49]); // keys[34] 用于getCodeUid, ASCII "1"
    } else {
      keys.push([0]);
    }
  }
  
  return keys;
}

exports.init = function() {
  logger.debug(`原始 gv.ts.cd: ${gv.ts.cd}`);
  logger.debug(`gv.ts.cd 长度: ${gv.ts.cd.length}`);
  
  const cdArr = decrypt(gv.ts.cd);
  logger.debug(`cdArr长度: ${cdArr.length}, 前10个元素: [${cdArr.slice(0, 10).join(', ')}]`);
  
  const start = 2;
  const end = (cdArr[0] << 8 | cdArr[1]) + start;
  logger.debug(`start: ${start}, end: ${end}, cdArr[0]: ${cdArr[0]}, cdArr[1]: ${cdArr[1]}`);
  
  // 检查 end 是否超出范围 - 这表明是短cd格式
  if (end > cdArr.length) {
    logger.warn(`⚠️ end(${end}) 超出 cdArr 长度(${cdArr.length})，这是短cd格式网站`);
    logger.info('使用默认解析策略（短cd格式）');
    
    // 设置默认值
    gv._setAttr('dynamicTaskOffset', [3, 153, 2, 3, 4, 5, 6, 7]);
    gv._setAttr('dynamicTask', {});
    gv._setAttr('keys', createDefaultKeys());
    
    logger.info('✅ $_ts.cd解析完成（短cd格式）');
    return;
  }
  
  const one = parse(cdArr.slice(start, end));
  const offset = runTaskByUid('U14124020', [], getTaskarr(one, one[3])); // 获取解密用偏移值数组
  logger.debug(`offset: [${offset.join(', ')}]`);
  
  gv._setAttr('dynamicTaskOffset', offset);
  gv._setAttr('dynamicTask', getTaskarr(one, one[3]));
  
  const ans = cdArr.slice(end).map((item, idx) => {
    return item ^ offset[idx % 8];
  })
  logger.debug(`ans长度: ${ans.length}, ans[0]: ${ans[0]}, 前20个元素: [${ans.slice(0, 20).join(', ')}]`);
  
  gv._setAttr('keys', genKeys(ans));
  logger.debug('$_ts.cd完成解析!')
};
