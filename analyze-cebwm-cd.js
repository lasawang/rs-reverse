/**
 * 分析 cebwm.com 的 $_ts.cd 数据结构
 */

// 设置模块别名
require('module-alias/register');

const decrypt = require('@src/handler/parser/common/decrypt');

// 从测试中获取的真实cd值
const testCd = "PuPWDgOhmUM_cr_0shtpAmEqbmc6dpop7YfVTaRZcOgD7DoGAovEAY9CFzcntV0oAFsqw87JNPDbVUMYXUbTc4Cewl5thjO1";

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  cebwm.com $_ts.cd 数据结构分析                        ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log('🔹 原始 cd 数据:');
console.log(`  长度: ${testCd.length} 字符`);
console.log(`  内容: ${testCd}\n`);

const cdArr = decrypt(testCd);

console.log('🔹 解密后的 cdArr:');
console.log(`  长度: ${cdArr.length} 字节`);
console.log(`  前20字节: [${cdArr.slice(0, 20).join(', ')}]`);
console.log(`  后20字节: [${cdArr.slice(-20).join(', ')}]\n`);

console.log('🔹 尝试不同的解析方案:\n');

// 方案1: 尝试将整个cdArr作为密钥数据
console.log('【方案1】整个cdArr作为密钥数据:');
console.log(`  如果cdArr[0]是密钥数量: ${cdArr[0]} 个密钥`);
console.log(`  剩余数据: ${cdArr.length - 1} 字节`);

// 方案2: 检查是否是简化格式（没有section1）
console.log('\n【方案2】简化格式（直接密钥数据）:');
if (cdArr.length >= 4) {
  const possibleKeyCount = cdArr[0];
  console.log(`  可能的密钥数量: ${possibleKeyCount}`);
  
  // 尝试解析密钥
  if (possibleKeyCount > 0 && possibleKeyCount < 50) {
    console.log(`  尝试解析 ${possibleKeyCount} 个密钥...`);
    let op = 1;
    const keys = [];
    try {
      for (let i = 0; i < possibleKeyCount && op < cdArr.length; i++) {
        if (op + 1 < cdArr.length) {
          const gap = cdArr[op] << 8 | cdArr[op + 1];
          op += 2;
          if (op + gap <= cdArr.length) {
            keys.push(cdArr.slice(op, op + gap));
            op += gap;
          } else {
            console.log(`    密钥${i}: 长度${gap}超出范围，停止解析`);
            break;
          }
        }
      }
      console.log(`  成功解析: ${keys.length} 个密钥`);
      if (keys.length > 0) {
        console.log(`  密钥长度: [${keys.slice(0, 10).map(k => k.length).join(', ')}${keys.length > 10 ? '...' : ''}]`);
      }
    } catch (e) {
      console.log(`  解析失败: ${e.message}`);
    }
  }
}

// 方案3: 检查是否是单字节长度格式
console.log('\n【方案3】单字节长度格式:');
if (cdArr.length >= 2) {
  const possibleKeyCount = cdArr[0];
  console.log(`  可能的密钥数量: ${possibleKeyCount}`);
  
  if (possibleKeyCount > 0 && possibleKeyCount < 50) {
    console.log(`  尝试单字节长度解析...`);
    let op = 1;
    const keys = [];
    try {
      for (let i = 0; i < possibleKeyCount && op < cdArr.length; i++) {
        const gap = cdArr[op];
        op += 1;
        if (op + gap <= cdArr.length) {
          keys.push(cdArr.slice(op, op + gap));
          op += gap;
        } else {
          console.log(`    密钥${i}: 长度${gap}超出范围，停止解析`);
          break;
        }
      }
      console.log(`  成功解析: ${keys.length} 个密钥`);
      if (keys.length > 0) {
        console.log(`  密钥长度: [${keys.slice(0, 10).map(k => k.length).join(', ')}${keys.length > 10 ? '...' : ''}]`);
        
        // 检查关键密钥
        if (keys.length >= 33) {
          console.log('\n  ✅ 密钥数量足够（>=33）');
          console.log(`  检查keys[29-32]长度:`);
          console.log(`    keys[29]: ${keys[29] ? keys[29].length : 'undefined'}`);
          console.log(`    keys[30]: ${keys[30] ? keys[30].length : 'undefined'}`);
          console.log(`    keys[31]: ${keys[31] ? keys[31].length : 'undefined'}`);
          console.log(`    keys[32]: ${keys[32] ? keys[32].length : 'undefined'}`);
        }
      }
    } catch (e) {
      console.log(`  解析失败: ${e.message}`);
    }
  }
}

// 方案4: 十六进制dump
console.log('\n【方案4】完整十六进制 Dump:');
console.log('  前64字节:');
const hexDump = cdArr.slice(0, Math.min(64, cdArr.length))
  .map((b, i) => {
    const hex = b.toString(16).padStart(2, '0');
    return i % 16 === 0 ? `\n  ${i.toString().padStart(4, '0')}: ${hex}` : hex;
  })
  .join(' ');
console.log(hexDump);

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║  分析完成                                              ║');
console.log('╚════════════════════════════════════════════════════════╝');
