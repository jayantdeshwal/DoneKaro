/**
 * ChatMessageContent
 * Renders AI assistant and user chat messages cleanly on mobile viewports:
 * - Sanitizes stray HTML tags (<br>, <b>, etc.) and accidental Markdown tables
 * - Renders bullet lists (-, *, •), numbered lists, paragraphs, and inline **bold** spans
 * - Uses React nodes directly (no dangerouslySetInnerHTML)
 */

import React from 'react'

interface ChatMessageContentProps {
  text: string
}

function sanitizeRawChatText(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(?:b|strong|i|em|p|ul|ol|li|div|span|h[1-6]|table|thead|tbody|tr|th|td)[^>]*>/gi, '')
    .replace(/^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*$/gm, '')
    .replace(/^\s*\|(.+)\|\s*$/gm, (_match, row: string) =>
      `- ${row
        .split('|')
        .map(cell => cell.trim())
        .filter(Boolean)
        .join(' — ')}`
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const tokenRegex = /(\*\*[^*\n]+\*\*|`[^`\n]+`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    const token = match[0]
    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={`b_${match.index}`} className="font-semibold">
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={`c_${match.index}`}
          className="px-1 py-0.5 rounded bg-black/10 text-[0.88em] font-mono"
        >
          {token.slice(1, -1)}
        </code>
      )
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length > 0 ? nodes : [text]
}

type Block =
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'p'; lines: string[] }

function parseChatBlocks(text: string): Block[] {
  const lines = text.split(/\r?\n/)
  const blocks: Block[] = []

  const bulletRegex = /^\s*[-*•]\s+(.+)$/
  const numberedRegex = /^\s*\d+[.)]\s+(.+)$/
  const headingRegex = /^\s*#{1,4}\s+(.+)$/

  for (const rawLine of lines) {
    const trimmed = rawLine.trim()
    if (!trimmed) {
      continue
    }

    const bulletMatch = trimmed.match(bulletRegex)
    if (bulletMatch) {
      const lastBlock = blocks[blocks.length - 1]
      if (lastBlock && lastBlock.type === 'ul') {
        lastBlock.items.push(bulletMatch[1].trim())
      } else {
        blocks.push({ type: 'ul', items: [bulletMatch[1].trim()] })
      }
      continue
    }

    const numberedMatch = trimmed.match(numberedRegex)
    if (numberedMatch) {
      const lastBlock = blocks[blocks.length - 1]
      if (lastBlock && lastBlock.type === 'ol') {
        lastBlock.items.push(numberedMatch[1].trim())
      } else {
        blocks.push({ type: 'ol', items: [numberedMatch[1].trim()] })
      }
      continue
    }

    const headingMatch = trimmed.match(headingRegex)
    const normalizedLine = headingMatch ? `**${headingMatch[1].trim()}**` : trimmed
    const lastBlock = blocks[blocks.length - 1]
    if (lastBlock && lastBlock.type === 'p') {
      lastBlock.lines.push(normalizedLine)
    } else {
      blocks.push({ type: 'p', lines: [normalizedLine] })
    }
  }

  return blocks
}

export function ChatMessageContent({ text }: ChatMessageContentProps) {
  const cleaned = sanitizeRawChatText(text)
  const blocks = parseChatBlocks(cleaned)

  return (
    <div className="space-y-1.5 break-words">
      {blocks.map((block, idx) => {
        if (block.type === 'ul') {
          return (
            <ul key={idx} className="list-disc pl-4 space-y-1">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="leading-relaxed">
                  {renderInlineFormatting(item)}
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === 'ol') {
          return (
            <ol key={idx} className="list-decimal pl-4 space-y-1">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="leading-relaxed">
                  {renderInlineFormatting(item)}
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
                {renderInlineFormatting(line)}
              </React.Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
