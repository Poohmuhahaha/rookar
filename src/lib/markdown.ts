export type InlineToken = {
  text: string
  bold?: boolean
  italic?: boolean
  code?: boolean
}

export type MarkdownBlock =
  | { type: 'paragraph'; tokens: InlineToken[] }
  | { type: 'heading'; level: number; tokens: InlineToken[] }
  | { type: 'list'; ordered: boolean; items: InlineToken[][] }
  | { type: 'table'; headers: InlineToken[][]; rows: InlineToken[][][] }
  | { type: 'hr' }
  | { type: 'code'; text: string }

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  const regex = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: text.slice(lastIndex, match.index) })
    }
    const raw = match[0]
    if (raw.startsWith('**')) {
      tokens.push({ text: raw.slice(2, -2), bold: true })
    } else if (raw.startsWith('`')) {
      tokens.push({ text: raw.slice(1, -1), code: true })
    } else {
      tokens.push({ text: raw.slice(1, -1), italic: true })
    }
    lastIndex = match.index + raw.length
  }
  if (lastIndex < text.length) tokens.push({ text: text.slice(lastIndex) })
  return tokens.length > 0 ? tokens : [{ text: '' }]
}

function splitTableRow(line: string): string[] {
  return line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{2,}/.test(line) && line.includes('|')
}

function isListLine(line: string): boolean {
  return /^([-*•]|\d+[.)])\s+/.test(line)
}

function isSpecialLine(line: string): boolean {
  return (
    !line ||
    /^#{1,6}\s+/.test(line) ||
    /^```/.test(line) ||
    /^---+$/.test(line) ||
    isListLine(line) ||
    (line.includes('|') && isTableSeparator(line))
  )
}

export function parseMarkdown(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: MarkdownBlock[] = []
  let index = 0

  while (index < lines.length) {
    const rawLine = lines[index]
    const line = rawLine.trim()

    if (!line) {
      index += 1
      continue
    }

    if (/^```/.test(line)) {
      const codeLines: string[] = []
      index += 1
      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        codeLines.push(lines[index])
        index += 1
      }
      if (index < lines.length) index += 1
      blocks.push({ type: 'code', text: codeLines.join('\n') })
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, tokens: parseInline(heading[2]) })
      index += 1
      continue
    }

    if (/^---+$/.test(line)) {
      blocks.push({ type: 'hr' })
      index += 1
      continue
    }

    if (line.includes('|') && index + 1 < lines.length && isTableSeparator(lines[index + 1].trim())) {
      const headers = splitTableRow(line).map(parseInline)
      index += 2
      const rows: InlineToken[][][] = []
      while (index < lines.length) {
        const rowLine = lines[index].trim()
        if (!rowLine || !rowLine.includes('|')) break
        rows.push(splitTableRow(rowLine).map(parseInline))
        index += 1
      }
      blocks.push({ type: 'table', headers, rows })
      continue
    }

    if (isListLine(line)) {
      const ordered = /^\d+[.)]\s+/.test(line)
      const items: InlineToken[][] = []
      while (index < lines.length) {
        const itemLine = lines[index].trim()
        const match = itemLine.match(/^([-*•]|\d+[.)])\s+(.*)$/)
        if (!match) break
        if (/^\d+[.)]/.test(match[1]) !== ordered) break
        items.push(parseInline(match[2]))
        index += 1
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    const paragraph: string[] = [line]
    index += 1
    while (index < lines.length) {
      const nextLine = lines[index].trim()
      if (isSpecialLine(nextLine)) break
      paragraph.push(nextLine)
      index += 1
    }
    blocks.push({ type: 'paragraph', tokens: parseInline(paragraph.join(' ')) })
  }

  return blocks
}
