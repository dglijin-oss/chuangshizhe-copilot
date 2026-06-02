"use client"

interface BaziResult {
  公历时间?: string
  农历时间?: string
  性别?: string
  四柱: {
    年柱: string
    月柱: string
    日柱: string
    时柱: string
  }
  十神: {
    年干十神?: string
    月干十神?: string
    日主?: string
    时干十神?: string
  }
  五行统计?: Record<string, number>
  大运?: Array<{
    起运年龄?: number
    干支: string
    十神: string
    起始年份?: number
  }>
  格局?: string
  用神?: string
  喜神?: string
  忌神?: string
  综合评分?: {
    总分: number
    五行平衡: number
    格局高低: number
    大运走势: number
  }
  趋吉避凶?: string
  断语?: string[]
  流年?: Array<{
    年份: number
    干支: string
    运势: string
  }>
}

export default function BaziResultDisplay({
  result,
  loading,
  onReset,
}: {
  result: BaziResult | null
  loading: boolean
  onReset: () => void
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">正在排盘分析中...</p>
        </div>
      </div>
    )
  }

  if (!result) return null

  const pillars = [
    { label: '年柱', value: result.四柱?.年柱, shishen: result.十神?.年干十神 },
    { label: '月柱', value: result.四柱?.月柱, shishen: result.十神?.月干十神 },
    { label: '日柱', value: result.四柱?.日柱, shishen: '日主' },
    { label: '时柱', value: result.四柱?.时柱, shishen: result.十神?.时干十神 },
  ]

  const wuxingColors: Record<string, string> = {
    '木': 'text-green-400',
    '火': 'text-red-400',
    '土': 'text-amber-400',
    '金': 'text-yellow-200',
    '水': 'text-blue-400',
  }

  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h3 className="text-sm font-bold text-purple-300 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-purple-500 rounded-full" />
          基本信息
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-gray-500">公历</span>
            <p className="text-white">{result.公历时间 || '-'}</p>
          </div>
          <div>
            <span className="text-gray-500">农历</span>
            <p className="text-white">{result.农历时间 || '-'}</p>
          </div>
          <div>
            <span className="text-gray-500">性别</span>
            <p className="text-white">{result.性别 || '-'}</p>
          </div>
          <div>
            <span className="text-gray-500">日主</span>
            <p className="text-white">{result.十神?.日主 || '-'}</p>
          </div>
        </div>
      </div>

      {/* 四柱排盘 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h3 className="text-sm font-bold text-purple-300 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-purple-500 rounded-full" />
          四柱排盘
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {pillars.map((pillar) => (
            <div key={pillar.label} className="text-center bg-white/5 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-2">{pillar.label}</div>
              <div className="text-lg font-bold text-white mb-1">{pillar.value || '-'}</div>
              <div className="text-xs text-purple-300">{pillar.shishen || ''}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 五行统计 */}
      {result.五行统计 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-bold text-purple-300 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-purple-500 rounded-full" />
            五行统计
          </h3>
          <div className="flex gap-4 justify-center flex-wrap">
            {Object.entries(result.五行统计).map(([wuxing, count]) => (
              <div key={wuxing} className="text-center">
                <div className={`text-2xl font-bold ${wuxingColors[wuxing] || 'text-white'}`}>
                  {count}
                </div>
                <div className="text-xs text-gray-400">{wuxing}</div>
              </div>
            ))}
          </div>
          {/* 五行条 */}
          <div className="mt-4 flex gap-1 h-3 rounded-full overflow-hidden">
            {Object.entries(result.五行统计).map(([wuxing, count]) => {
              const total = Object.values(result.五行统计!).reduce((a, b) => a + b, 0)
              const pct = total > 0 ? (count / total) * 100 : 0
              const colors: Record<string, string> = {
                '木': 'bg-green-500',
                '火': 'bg-red-500',
                '土': 'bg-amber-500',
                '金': 'bg-yellow-400',
                '水': 'bg-blue-500',
              }
              return (
                <div
                  key={wuxing}
                  className={`${colors[wuxing] || 'bg-gray-500'} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${wuxing}: ${count}`}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* 格局用神 */}
      {(result.格局 || result.用神 || result.喜神 || result.忌神) && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-bold text-purple-300 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-purple-500 rounded-full" />
            格局用神
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">格局</div>
              <div className="text-sm font-bold text-white">{result.格局 || '-'}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">用神</div>
              <div className="text-sm font-bold text-green-400">{result.用神 || '-'}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">喜神</div>
              <div className="text-sm font-bold text-blue-400">{result.喜神 || '-'}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">忌神</div>
              <div className="text-sm font-bold text-red-400">{result.忌神 || '-'}</div>
            </div>
          </div>
        </div>
      )}

      {/* 大运 */}
      {result.大运 && result.大运.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-bold text-purple-300 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-purple-500 rounded-full" />
            大运排盘
          </h3>
          <div className="overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {result.大运.map((dy, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-2 text-center min-w-[60px]">
                  <div className="text-xs text-gray-500">{dy.起运年龄}岁</div>
                  <div className="text-sm font-bold text-white my-1">{dy.干支}</div>
                  <div className="text-xs text-purple-300">{dy.十神}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 综合评分 */}
      {result.综合评分 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-bold text-purple-300 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-purple-500 rounded-full" />
            综合评分
          </h3>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${
                result.综合评分.总分 >= 80 ? 'text-green-400' :
                result.综合评分.总分 >= 60 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {result.综合评分.总分}
              </div>
              <div className="text-xs text-gray-400 mt-1">总分</div>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-sm text-white">{result.综合评分.五行平衡}</div>
                <div className="text-xs text-gray-500">五行平衡</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-sm text-white">{result.综合评分.格局高低}</div>
                <div className="text-xs text-gray-500">格局高低</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-sm text-white">{result.综合评分.大运走势}</div>
                <div className="text-xs text-gray-500">大运走势</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 断语/趋吉避凶 */}
      {(result.断语 || result.趋吉避凶) && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-bold text-purple-300 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-purple-500 rounded-full" />
            命理解析
          </h3>
          {result.趋吉避凶 && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-200">{result.趋吉避凶}</p>
            </div>
          )}
          {result.断语 && result.断语.length > 0 && (
            <ul className="space-y-2">
              {result.断语.map((d, i) => (
                <li key={i} className="text-sm text-gray-300 flex gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 流年 */}
      {result.流年 && result.流年.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-bold text-purple-300 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-purple-500 rounded-full" />
            流年运势
          </h3>
          <div className="overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {result.流年.map((ln, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-2 text-center min-w-[60px]">
                  <div className="text-xs text-gray-500">{ln.年份}</div>
                  <div className="text-sm font-bold text-white">{ln.干支}</div>
                  <div className="text-xs text-gray-400 truncate max-w-[80px]">{ln.运势}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex justify-center gap-3 pt-4">
        <button
          onClick={onReset}
          className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-2.5 rounded-full text-sm font-medium transition-colors"
        >
          重新排盘
        </button>
      </div>
    </div>
  )
}
