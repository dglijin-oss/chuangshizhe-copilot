import httpx
from app.config import settings


STYLE_PROMPTS = {
    "grounded": "用通俗易懂、接地气的口语化风格重写，适当加入生活化的比喻和场景，让内容更贴近普通读者。",
    "professional": "用专业严谨的风格重写，保持逻辑清晰、用词准确，适合知识分享和行业分析场景。",
    "emotional": "用富有感染力和情绪张力的风格重写，善用故事化表达和情感共鸣，激发读者互动欲望。",
}

MODE_INSTRUCTIONS = {
    "style_transfer": "在保留原文核心观点和信息的基础上，进行风格转换。",
    "rewrite": "对原文进行同义改写、结构调整，保持原风格不变。",
    "expand": "在原文基础上扩展细节、补充案例和背景信息，使内容更丰富。",
}


class RewriteEngine:
    """AI-powered content rewriting engine."""

    def __init__(self):
        self.llm_config = settings.llm_config

    def _build_prompt(self, original_text: str, mode: str, style: str) -> str:
        style_instruction = STYLE_PROMPTS.get(style, STYLE_PROMPTS["grounded"])
        mode_instruction = MODE_INSTRUCTIONS.get(mode, MODE_INSTRUCTIONS["style_transfer"])

        return (
            f"你是一名资深内容创作者，擅长各平台内容创作。\n\n"
            f"【任务】{mode_instruction}{style_instruction}\n\n"
            f"【要求】\n"
            f"- 保留原文的核心观点和关键信息\n"
            f"- 不要改变事实性内容（数据、名称、引用等）\n"
            f"- 输出纯文本，不要使用markdown格式\n"
            f"- 长度与原文相近\n\n"
            f"【原文】\n{original_text}\n\n"
            f"【改写后】"
        )

    async def rewrite(self, text: str, mode: str = "style_transfer", style: str = "grounded") -> dict:
        """Rewrite content using LLM.

        Args:
            text: Original content text
            mode: rewrite mode (style_transfer, rewrite, expand)
            style: style preset (grounded, professional, emotional)

        Returns:
            dict with 'title', 'rewritten_text', 'prompt_used'
        """
        prompt = self._build_prompt(text, mode, style)

        async with httpx.AsyncClient(timeout=self.llm_config["timeout"]) as client:
            resp = await client.post(
                f"{self.llm_config['base_url']}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.llm_config['api_key']}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.llm_config["model"],
                    "temperature": self.llm_config["temperature"],
                    "max_tokens": self.llm_config["max_tokens"],
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                },
            )
            resp.raise_for_status()
            data = resp.json()

        content = data["choices"][0]["message"]["content"].strip()
        title = content.split("\n")[0][:50] if "\n" in content else content[:50]

        return {
            "title": title,
            "rewritten_text": content,
            "prompt_used": prompt,
        }
