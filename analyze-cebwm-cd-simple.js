/**
 * 简化版 cebwm.com $_ts.cd 数据分析
 * 不依赖项目的decrypt函数，直接分析Base64解码后的数据
 */

// 从测试中获取的真实cd值
const testCd = "PuPWDgOhmUM_cr_0shtpAmEqbmc6dpop7YfVTaRZcOgD7DoGAovEAY9CFzcntV0oAFsqw87JNPDbVUMYXUbTc4Cewl5thjO1";

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  cebwm.com $_ts.cd 数据结构分析（简化版）             ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log('🔹 原始 cd 数据:');
console.log(`  长度: ${testCd.length} 字符`);
console.log(`  内容: ${testCd}\n`);

// Base64变种解码（项目使用的alphabet）
const alphabet = 'Uwbm7KscGnqxypftdHe.3QZi_RSY8TVkXBDPhzNCu6FIoa1WJ0g5A9jM4rOvLlE2';

function customBase64Decode(str) {
  const standardAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const mapping = {};
  for (let i = 0; i < alphabet.length; i++) {
    mapping[alphabet[i]] = standardAlphabet[i];
  }
  
  let standardBase64 = '';
  for (const char of str) {
    standardBase64 += mapping[char] || char;
  }
  
  // 添加padding
  while (standardBase64.length % 4 !== 0) {
    standardBase64 += '=';
  }
  
  const decoded = Buffer.from(standardBase64, 'base64');
  return Array.from(decoded);
}

const cdArr = customBase64Decode(testCd);

console.log('🔹 Base64解码后的数据:');
console.log(`  长度: ${cdArr.length} 字节`);
console.log(`  前30字节: [${cdArr.slice(0, 30).join(', ')}]`);
console.log(`  后30字节: [${cdArr.slice(-30).join(', ')}]\n`);

console.log('🔹 数据结构分析:\n');

// 分析第一个字节（可能是密钥数量或section长度）
console.log(`cdArr[0] = ${cdArr[0]} (0x${cdArr[0].toString(16).padStart(2, '0')})`);
console.log(`cdArr[1] = ${cdArr[1]} (0x${cdArr[1].toString(16).padStart(2, '0')})`);

// 尝试双字节长度
const twoByteLength = (cdArr[0] << 8) | cdArr[1];
console.log(`  双字节解释 (Big-Endian): ${twoByteLength}`);
console.log(`  判断: ${twoByteLength > cdArr.length ? '❌ 超出范围' : '✅ 在范围内'}\n`);

// 方案1: 如果cdArr[0]是密钥数量
console.log('【方案1】cdArr[0]作为密钥数量:');
const keyCount = cdArr[0];
console.log(`  密钥数量: ${keyCount}`);

if (keyCount > 0 && keyCount < 100) {
  // 尝试双字节长度解析
  console.log('  尝试双字节长度格式...');
  let op = 1;
  const keys = [];
  let success = true;
  
  for (let i = 0; i < keyCount && op < cdArr.length - 1; i++) {
    const gap = (cdArr[op] << 8) | cdArr[op + 1];
    op += 2;
    if (op + gap <= cdArr.length) {
      keys.push(cdArr.slice(op, op + gap));
      op += gap;
    } else {
      console.log(`    密钥${i}: 长度${gap}超出范围（op=${op}, gap=${gap}, cdArr.length=${cdArr.length}）`);
      success = false;
      break;
    }
  }
  
  if (success) {
    console.log(`  ✅ 成功解析: ${keys.length} 个密钥`);
    console.log(`  密钥长度分布: [${keys.slice(0, 15).map(k => k.length).join(', ')}${keys.length > 15 ? '...' : ''}]`);
    
    if (keys.length >= 33) {
      console.log('\n  关键密钥检查:');
      [16, 19, 22, 24, 29, 30, 31, 32].forEach(idx => {
        if (keys[idx]) {
          console.log(`    keys[${idx}]: 长度=${keys[idx].length}, 内容=[${keys[idx].slice(0, 10).join(', ')}${keys[idx].length > 10 ? '...' : ''}]`);
        }
      });
    }
  } else {
    // 尝试单字节长度
    console.log('\n  尝试单字节长度格式...');
    op = 1;
    const singleByteKeys = [];
    success = true;
    
    for (let i = 0; i < keyCount && op < cdArr.length; i++) {
      const gap = cdArr[op];
      op += 1;
      if (op + gap <= cdArr.length) {
        singleByteKeys.push(cdArr.slice(op, op + gap));
        op += gap;
      } else {
        console.log(`    密钥${i}: 长度${gap}超出范围（op=${op}, gap=${gap}, cdArr.length=${cdArr.length}）`);
        success = false;
        break;
      }
    }
    
    if (success) {
      console.log(`  ✅ 成功解析: ${singleByteKeys.length} 个密钥`);
      console.log(`  密钥长度分布: [${singleByteKeys.slice(0, 15).map(k => k.length).join(', ')}${singleByteKeys.length > 15 ? '...' : ''}]`);
      
      if (singleByteKeys.length >= 33) {
        console.log('\n  关键密钥检查:');
        [16, 19, 22, 24, 29, 30, 31, 32].forEach(idx => {
          if (singleByteKeys[idx]) {
            console.log(`    keys[${idx}]: 长度=${singleByteKeys[idx].length}, 内容=[${singleByteKeys[idx].slice(0, 10).join(', ')}${singleByteKeys[idx].length > 10 ? '...' : ''}]`);
          }
        });
      }
    }
  }
}

// 十六进制Dump
console.log('\n【完整数据 Hex Dump】:');
for (let i = 0; i < cdArr.length; i += 16) {
  const hex = cdArr.slice(i, i + 16)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
  const ascii = cdArr.slice(i, i + 16)
    .map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.')
    .join('');
  console.log(`  ${i.toString().padStart(4, '0')}: ${hex.padEnd(48, ' ')} | ${ascii}`);
}

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║  分析完成                                              ║');
console.log('╚════════════════════════════════════════════════════════╝');
