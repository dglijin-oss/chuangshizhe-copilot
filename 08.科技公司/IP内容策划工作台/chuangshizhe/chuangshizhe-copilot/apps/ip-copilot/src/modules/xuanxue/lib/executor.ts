import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// 技能路径映射
const SKILL_PATHS: Record<string, { entry: string; type: 'python' | 'node' }> = {
  bazi: { entry: 'scripts/bazi_pan.py', type: 'python' },
  qimen: { entry: 'scripts/qimen_pan_v2.py', type: 'python' },
  liuyao: { entry: 'scripts/liuyao_pan.py', type: 'python' },
  meihua: { entry: 'scripts/meihua_pan.py', type: 'python' },
  qizheng: { entry: 'scripts/qizheng_pan.py', type: 'python' },
  ziwei: { entry: 'index.js', type: 'node' },
  liuren: { entry: 'index.js', type: 'node' },
  taiyi: { entry: 'index.js', type: 'node' },
  fengshui: { entry: 'index.js', type: 'node' },
  'ze-ri': { entry: 'index.js', type: 'node' },
}

const SKILLS_DIR = path.join(__dirname, '..', 'skills')

/**
 * 构建命令行参数
 */
function buildArgs(args: Record<string, any>): string {
  return Object.entries(args)
    .filter(([_, v]) => v !== undefined && v !== null)
    .map(([key, value]) => {
      if (typeof value === 'boolean' && value) return `--${key}`
      if (typeof value === 'boolean' && !value) return ''
      return `--${key} ${JSON.stringify(value)}`
    })
    .filter(Boolean)
    .join(' ')
}

/**
 * 执行技能
 */
export async function runSkill(
  skillId: string,
  args: Record<string, any>
): Promise<any> {
  const skillConfig = SKILL_PATHS[skillId]
  if (!skillConfig) {
    throw new Error(`Unknown skill: ${skillId}`)
  }

  const skillPath = path.join(SKILLS_DIR, `${skillId}-skill`)
  const entryPath = path.join(skillPath, skillConfig.entry)

  if (skillConfig.type === 'python') {
    return await runPythonSkill(entryPath, args)
  } else {
    return await runNodeSkill(entryPath, args)
  }
}

/**
 * 执行 Python 技能
 */
async function runPythonSkill(entryPath: string, args: Record<string, any>): Promise<any> {
  const cmdArgs = buildArgs({ ...args, json: true })
  const cmd = `python "${entryPath}" ${cmdArgs}`

  try {
    const { stdout, stderr } = await execAsync(cmd, {
      encoding: 'utf-8',
      timeout: 30000, // 30秒超时
      cwd: path.dirname(entryPath)
    })

    if (stderr && !stderr.includes('DeprecationWarning')) {
      console.error(`Python skill stderr: ${stderr}`)
    }

    // 尝试解析 JSON 输出
    try {
      const jsonMatch = stdout.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      // 如果没有 JSON，返回原始文本
      return { formatted: stdout, raw: stdout }
    } catch {
      return { formatted: stdout, raw: stdout }
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`Python 未安装或路径不正确，请确保服务器已安装 Python 3.8+`)
    }
    throw new Error(`技能执行失败: ${error.message}`)
  }
}

/**
 * 执行 Node.js 技能
 */
async function runNodeSkill(entryPath: string, args: Record<string, any>): Promise<any> {
  try {
    // 直接 require 模块调用（比子进程更高效）
    const skill = require(entryPath)

    // 根据不同技能的入口函数调用
    const skillId = path.basename(path.dirname(entryPath)).replace('-skill', '')
    const functionName = `${skillId}_pan`

    if (typeof skill[functionName] === 'function') {
      return skill[functionName](args)
    }

    // 如果找不到特定函数，尝试默认导出
    if (typeof skill === 'function') {
      return skill(args)
    }

    // 最后尝试 CLI 方式
    return await runNodeCLI(entryPath, args)
  } catch (error: any) {
    console.error(`Node skill error: ${error.message}`)
    // 回退到 CLI 方式
    return await runNodeCLI(entryPath, args)
  }
}

/**
 * 以 CLI 方式执行 Node.js 技能
 */
async function runNodeCLI(entryPath: string, args: Record<string, any>): Promise<any> {
  const cmdArgs = buildArgs({ ...args, json: true })
  const cmd = `node "${entryPath}" ${cmdArgs}`

  try {
    const { stdout } = await execAsync(cmd, {
      encoding: 'utf-8',
      timeout: 30000,
    })

    try {
      const jsonMatch = stdout.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return { formatted: stdout, raw: stdout }
    } catch {
      return { formatted: stdout, raw: stdout }
    }
  } catch (error: any) {
    throw new Error(`Node 技能执行失败: ${error.message}`)
  }
}

/**
 * 获取技能列表
 */
export function getSkillList(): { id: string; type: 'python' | 'node'; entry: string }[] {
  return Object.entries(SKILL_PATHS).map(([id, config]) => ({
    id,
    type: config.type,
    entry: config.entry,
  }))
}
