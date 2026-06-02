import type { Module, ModuleConfig, NavGroup } from './types'

// 动态导入所有模块配置
const moduleConfigs: Record<string, ModuleConfig> = {
  'ip-copilot': require('./ip-copilot/config').default,
  'xuanxue': require('./xuanxue/config').default,
}

// 动态导入所有模块路由
const moduleRoutesMap: Record<string, { navGroups: NavGroup[] }> = {
  'ip-copilot': require('./ip-copilot/routes'),
  'xuanxue': require('./xuanxue/routes'),
}

/**
 * 加载所有已启用的模块
 * @returns 模块列表
 */
export function loadModules(): Module[] {
  return Object.entries(moduleConfigs)
    .filter(([_, config]) => config.enabled)
    .map(([id, config]) => ({
      config,
      routes: moduleRoutesMap[id] || { navGroups: [] },
    }))
}

/**
 * 根据模块 ID 获取模块配置
 * @param moduleId 模块 ID
 * @returns 模块配置
 */
export function getModuleConfig(moduleId: string): ModuleConfig | undefined {
  return moduleConfigs[moduleId]
}

/**
 * 获取所有导航分组（合并所有模块的导航）
 * @returns 所有导航分组
 */
export function getAllNavGroups(): NavGroup[] {
  return loadModules().flatMap(m => m.routes.navGroups)
}
