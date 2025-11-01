// 访问所有环境变量

/**
 * 打印环境变量信息
 * @param label 标签
 * @param value 变量值
 */
function printEnv(label: string, value: string | undefined) {
  console.log(`${label}: ${value ?? '未设置'}`);
}

console.log('==== 常用环境变量示例 ====');
printEnv('操作系统临时目录', process.env.TEMP || process.env.TMP);
printEnv('用户主目录', process.env.HOME || process.env.USERPROFILE);
printEnv('当前工作目录', process.cwd()); // 不是环境变量，但常用
printEnv('PATH 变量', process.env.PATH);
printEnv('用户名称', process.env.USER || process.env.USERNAME);
printEnv('节点环境', process.env.NODE_ENV);

console.log('\n==== 检查自定义变量 ====');
printEnv('自定义变量 MY_CUSTOM_VAR', process.env.MY_CUSTOM_VAR);

console.log('\n==== 设置并显示临时变量 ====');
process.env.MY_TEMP_VAR = '这是一个临时变量';
printEnv('新设置的临时变量', process.env.MY_TEMP_VAR);

// 如需查看所有环境变量，可取消下行注释
// console.log('\n==== 所有环境变量 ====');
// console.log(process.env);
