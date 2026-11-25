<script setup lang="ts">
import { computed } from 'vue'
import { parseMarkdown, type InlineToken } from '@/lib/markdown'

const props = defineProps<{ content: string }>()

const blocks = computed(() => parseMarkdown(props.content))

const headingClass: Record<number, string> = {
  1: 'mt-4 mb-1.5 text-base font-bold text-ink',
  2: 'mt-4 mb-1.5 text-[15px] font-bold text-ink',
  3: 'mt-3 mb-1 text-[14px] font-semibold text-ink',
  4: 'mt-3 mb-1 text-[13.5px] font-semibold text-ink',
  5: 'mt-3 mb-1 text-[13px] font-semibold text-ink',
  6: 'mt-3 mb-1 text-[13px] font-semibold text-ink',
}

function inlineTokens(tokens: InlineToken[]) {
  return tokens
}
</script>

<template>
  <template v-for="(block, index) in blocks" :key="index">
    <component
      :is="`h${block.level}`"
      v-if="block.type === 'heading'"
      :class="headingClass[block.level]"
    >
      <template v-for="(token, tokenIndex) in inlineTokens(block.tokens)" :key="tokenIndex">
        <code v-if="token.code" class="rounded bg-ink-100 px-1 py-0.5 font-mono text-[0.9em]">{{ token.text }}</code>
        <strong v-else-if="token.bold" class="font-semibold text-ink">{{ token.text }}</strong>
        <em v-else-if="token.italic">{{ token.text }}</em>
        <span v-else>{{ token.text }}</span>
      </template>
    </component>

    <p v-else-if="block.type === 'paragraph'" class="my-1 break-words">
      <template v-for="(token, tokenIndex) in inlineTokens(block.tokens)" :key="tokenIndex">
        <code v-if="token.code" class="rounded bg-ink-100 px-1 py-0.5 font-mono text-[0.9em]">{{ token.text }}</code>
        <strong v-else-if="token.bold" class="font-semibold text-ink">{{ token.text }}</strong>
        <em v-else-if="token.italic">{{ token.text }}</em>
        <span v-else>{{ token.text }}</span>
      </template>
    </p>

    <ul v-else-if="block.type === 'list' && !block.ordered" class="my-2 list-disc space-y-1.5 pl-5 marker:text-muted">
      <li v-for="(item, itemIndex) in block.items" :key="itemIndex" class="break-words">
        <template v-for="(token, tokenIndex) in inlineTokens(item)" :key="tokenIndex">
          <code v-if="token.code" class="rounded bg-ink-100 px-1 py-0.5 font-mono text-[0.9em]">{{ token.text }}</code>
          <strong v-else-if="token.bold" class="font-semibold text-ink">{{ token.text }}</strong>
          <em v-else-if="token.italic">{{ token.text }}</em>
          <span v-else>{{ token.text }}</span>
        </template>
      </li>
    </ul>

    <ol v-else-if="block.type === 'list'" class="my-2 list-decimal space-y-1.5 pl-5 marker:text-muted">
      <li v-for="(item, itemIndex) in block.items" :key="itemIndex" class="break-words">
        <template v-for="(token, tokenIndex) in inlineTokens(item)" :key="tokenIndex">
          <code v-if="token.code" class="rounded bg-ink-100 px-1 py-0.5 font-mono text-[0.9em]">{{ token.text }}</code>
          <strong v-else-if="token.bold" class="font-semibold text-ink">{{ token.text }}</strong>
          <em v-else-if="token.italic">{{ token.text }}</em>
          <span v-else>{{ token.text }}</span>
        </template>
      </li>
    </ol>

    <div v-else-if="block.type === 'table'" class="my-3 overflow-x-auto rounded-xl border border-ink-100">
      <table class="w-full border-collapse text-left text-[12.5px]">
        <thead class="bg-surface text-[11.5px] font-semibold text-ink-soft">
          <tr>
            <th v-for="(cell, cellIndex) in block.headers" :key="cellIndex" class="whitespace-nowrap px-3 py-2">
              <template v-for="(token, tokenIndex) in inlineTokens(cell)" :key="tokenIndex">
                <strong v-if="token.bold" class="font-semibold">{{ token.text }}</strong>
                <span v-else>{{ token.text }}</span>
              </template>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-ink-100/70">
          <tr v-for="(row, rowIndex) in block.rows" :key="rowIndex" class="align-top">
            <td v-for="(cell, cellIndex) in row" :key="cellIndex" class="px-3 py-2">
              <template v-for="(token, tokenIndex) in inlineTokens(cell)" :key="tokenIndex">
                <code v-if="token.code" class="rounded bg-ink-100 px-1 py-0.5 font-mono text-[0.9em]">{{ token.text }}</code>
                <strong v-else-if="token.bold" class="font-semibold text-ink">{{ token.text }}</strong>
                <em v-else-if="token.italic">{{ token.text }}</em>
                <span v-else>{{ token.text }}</span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <hr v-else-if="block.type === 'hr'" class="my-3 border-ink-100" />

    <pre v-else-if="block.type === 'code'" class="my-3 overflow-x-auto rounded-xl bg-surface p-3 font-mono text-[12px] leading-relaxed text-ink-soft"><code>{{ block.text }}</code></pre>
  </template>
</template>
