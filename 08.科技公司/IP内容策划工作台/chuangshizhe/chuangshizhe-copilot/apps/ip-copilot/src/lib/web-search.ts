/**
 * Web search utility.
 *
 * Uses a simple DuckDuckGo HTML search (free, no API key needed).
 * Falls back gracefully if search fails.
 */

const SEARCH_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

export async function webSearch(query: string, maxResults = 3): Promise<string> {
  try {
    const encodedQuery = encodeURIComponent(query)
    const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`

    const res = await fetch(url, {
      headers: { "User-Agent": SEARCH_USER_AGENT },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return ""

    const html = await res.text()

    // Extract result snippets from DuckDuckGo HTML results
    const results: { title: string; snippet: string; url: string }[] = []
    const aTagRegex = /<a class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g
    const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g
    const urlRegex = /<a class="result__url"[^>]*>([\s\S]*?)<\/a>/g

    let match
    const titles: string[] = []
    const links: string[] = []
    const snippets: string[] = []

    while ((match = aTagRegex.exec(html)) !== null) {
      links.push(match[1])
      titles.push(match[2].replace(/<[^>]*>/g, "").trim())
    }
    while ((match = snippetRegex.exec(html)) !== null) {
      snippets.push(match[1].replace(/<[^>]*>/g, "").trim())
    }

    for (let i = 0; i < Math.min(maxResults, titles.length); i++) {
      results.push({
        title: titles[i],
        snippet: snippets[i] || "",
        url: links[i] || "",
      })
    }

    if (results.length === 0) return ""

    return (
      "【联网搜索结果】\n" +
      results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}`).join("\n")
    )
  } catch {
    return ""
  }
}
