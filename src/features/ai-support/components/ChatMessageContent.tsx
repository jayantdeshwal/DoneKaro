/**
 * ChatMessageContent
 * Renders AI assistant and user chat messages cleanly on mobile viewports:
 * - Sanitizes stray HTML tags (<br>, <b>, etc.) and accidental Markdown tables
 * - Uses a Unicode-safe state-machine tokenizer so **bold** works reliably around
 *   Devanagari/Hindi characters, colons (e.g. **स्टेप 1:**), punctuation, and single *
 * - Strips any stray unmatched ** markers so raw asterisks never appear
 * - Preserves blank-line paragraph separation (space-y-2.5) and clean bullet/numbered lists
 * - Uses React nodes directly (no dangerouslySetInnerHTML)
 */

import React from 'react'

interface ChatMessageContentProps {
  text: string
  variant?: 'user' | 'assistant'
}

function sanitizeRawChatText(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(?:b|strong|i|em|p|ul|ol|li|div|span|h[1-6]|table|thead|tbody|tr|th|td)[^>]*>/gi, '')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*$/gm, '')
    .replace(/^\s*\|(.+)\|\s*$/gm, (_match, row: string) =>
      `- ${row
        .split('|')
        .map(cell => cell.trim())
        .filter(Boolean)
        .join(' — ')}`
    )
    .replace(/\*{3}([^\n*]+?)\*{3}/g, '**$1**')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function renderInlineFormatting(text: string, variant: 'user' | 'assistant'): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const strongClass =
    variant === 'user'
      ? 'font-semibold text-slate-950'
      : 'font-semibold text-gray-900 dark:text-white'

  let pos = 0
  let keyIdx = 0

  const pushPlain = (segment: string) => {
    // Strip any stray unmatched double-asterisks so raw ** never leak into UI
    const cleaned = segment.replace(/\*\*/g, '')
    if (cleaned) {
      nodes.push(cleaned)
    }
  }

  while (pos < text.length) {
    const nextBoldStar = text.indexOf('**', pos)
    const nextBoldUnderscore = text.indexOf('__', pos)
    const nextCode = text.indexOf('`', pos)

    let nextIdx = -1
    let tokenType: 'star' | 'underscore' | 'code' | null = null

    if (nextBoldStar !== -1) {
      nextIdx = nextBoldStar
      tokenType = 'star'
    }
    if (nextBoldUnderscore !== -1 && (nextIdx === -1 || nextBoldUnderscore < nextIdx)) {
      nextIdx = nextBoldUnderscore
      tokenType = 'underscore'
    }
    if (nextCode !== -1 && (nextIdx === -1 || nextCode < nextIdx)) {
      nextIdx = nextCode
      tokenType = 'code'
    }

    if (nextIdx === -1 || tokenType === null) {
      pushPlain(text.slice(pos))
      break
    }

    if (nextIdx > pos) {
      pushPlain(text.slice(pos, nextIdx))
    }

    if (tokenType === 'star' || tokenType === 'underscore') {
      const marker = tokenType === 'star' ? '**' : '__'
      const contentStart = nextIdx + 2
      const closeIdx = text.indexOf(marker, contentStart)

      if (closeIdx === -1) {
        // Unmatched opener: strip the stray ** / __ marker cleanly and keep scanning
        pos = contentStart
        continue
      }

      const rawInner = text.slice(contentStart, closeIdx)
      const inner = rawInner.trim()

      if (!inner) {
        pos = closeIdx + 2
        continue
      }

      // Preserve exact leading/trailing spaces if the model wrote ** text **
      if (rawInner.startsWith(' ')) nodes.push(' ')
      nodes.push(
        <strong key={`b_${keyIdx++}`} className={strongClass}>
          {inner.replace(/\*\*/g, '')}
        </strong>
      )
      if (rawInner.endsWith(' ')) nodes.push(' ')

      pos = closeIdx + 2
    } else {
      const contentStart = nextIdx + 1
      const closeIdx = text.indexOf('`', contentStart)

      if (closeIdx === -1) {
        pushPlain(text.slice(nextIdx))
        break
      }

      const codeText = text.slice(contentStart, closeIdx)
      if (codeText) {
        nodes.push(
          <code
            key={`c_${keyIdx++}`}
            className={
              variant === 'user'
                ? 'px-1 py-0.5 rounded bg-black/10 text-[0.9em] font-mono'
                : 'px-1 py-0.5 rounded bg-slate-200/80 dark:bg-zinc-700 text-[0.9em] font-mono text-gray-900 dark:text-zinc-100'
            }
          >
            {codeText}
          </code>
        )
      }
      pos = closeIdx + 1
    }
  }

  return nodes.length > 0 ? nodes : [text.replace(/\*\*/g, '')]
}

type Block =
  | { type: 'ul'; items: Array<{ text: string; nested?: boolean }> }
  | { type: 'ol'; items: string[] }
  | { type: 'p'; lines: string[] }

function parseChatBlocks(text: string): Block[] {
  const lines = text.split('\n')
  const blocks: Block[] = []
  let activeBlock: Block | null = null

  const bulletRegex = /^(\s*)[-*•◦▪]\s+(.+)$/
  const numberedRegex = /^\s*[\d\u0966-\u096F]+[.)]\s+(.+)$/
  const headingRegex = /^\s*#{1,4}\s+(.+)$/

  for (const rawLine of lines) {
    const trimmed = rawLine.trim()

    // Blank line ends the current paragraph/list so paragraphs separate cleanly
    if (!trimmed) {
      activeBlock = null
      continue
    }

    const headingMatch = trimmed.match(headingRegex)
    if (headingMatch) {
      blocks.push({ type: 'p', lines: [`**${headingMatch[1].trim()}**`] })
      activeBlock = null
      continue
    }

    const bulletMatch = rawLine.match(bulletRegex)
    if (bulletMatch) {
      const indentLen = bulletMatch[1].length
      const itemText = bulletMatch[2].trim()
      const nested = indentLen >= 2

      if (activeBlock && activeBlock.type === 'ul') {
        activeBlock.items.push({ text: itemText, nested })
      } else {
        const nextBlock: Block = { type: 'ul', items: [{ text: itemText, nested: false }] }
        blocks.push(nextBlock)
        activeBlock = nextBlock
      }
      continue
    }

    const numberedMatch = trimmed.match(numberedRegex)
    if (numberedMatch) {
      const itemText = numberedMatch[1].trim()
      if (activeBlock && activeBlock.type === 'ol') {
        activeBlock.items.push(itemText)
      } else {
        const nextBlock: Block = { type: 'ol', items: [itemText] }
        blocks.push(nextBlock)
        activeBlock = nextBlock
      }
      continue
    }

    if (activeBlock && activeBlock.type === 'p') {
      activeBlock.lines.push(trimmed)
    } else {
      const nextBlock: Block = { type: 'p', lines: [trimmed] }
      blocks.push(nextBlock)
      activeBlock = nextBlock
    }
  }

  return blocks
}

export function ChatMessageContent({ text, variant = 'assistant' }: ChatMessageContentProps) {
  const cleaned = sanitizeRawChatText(text)
  const blocks = parseChatBlocks(cleaned)

  return (
    <div className="space-y-2.5 break-words text-[13px] leading-relaxed">
      {blocks.map((block, idx) => {
        if (block.type === 'ul') {
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1.5">
              {block.items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className={`leading-relaxed ${item.nested ? 'ml-3 list-[circle]' : ''}`}
                >
                  {renderInlineFormatting(item.text, variant)}
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === 'ol') {
          return (
            <ol key={idx} className="list-decimal pl-5 space-y-1.5">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="leading-relaxed">
                  {renderInlineFormatting(item, variant)}
                </li>
              ))}
            </ol>
          )
        }

        return (
          <p key={idx} className="leading-relaxed">
            {block.lines.map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {lineIdx > 0 && <br />}
                {renderInlineFormatting(line, variant)}
              </React.Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
