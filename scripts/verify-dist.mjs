import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { getBuildNumber } from './build-version.ts'

const root = process.cwd()
const tagList = execFileSync('git', ['tag', '--points-at', 'HEAD'], { encoding: 'utf8' })
  .trim().split('\n').filter(tag => /^v\d+\.\d+\.\d+$/.test(tag))
assert.equal(tagList.length, 1, 'HEAD에는 정식 릴리스 태그가 정확히 하나 있어야 합니다.')
const expected = tagList[0].slice(1)
const productVersion = JSON.parse(readFileSync('package.json', 'utf8')).version
const versionFile = readFileSync('dist/version.txt', 'utf8').trim()
const html = readFileSync('dist/index.html', 'utf8')
const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://build-test.invalid/' })
try {
  const scripts = [...dom.window.document.querySelectorAll('script[type="module"][src]')]
  assert.ok(scripts.length, '빌드된 JS가 필요합니다.')
  for (const script of scripts) {
    const url = new URL(script.src)
    const file = path.resolve('dist', '.' + url.pathname)
    assert.ok(file.startsWith(path.resolve('dist') + path.sep))
    dom.window.eval(readFileSync(file, 'utf8'))
  }
  const text = id => dom.window.document.getElementById(id).textContent
  assert.equal(text('build-number'), expected)
  assert.equal(text('product-version'), productVersion)
  assert.equal(text('udi-pi'), `(10)${productVersion}`)
  assert.equal(versionFile, expected)
  assert.equal(getBuildNumber(root), expected)
  const result = {
    status: 'passed',
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    headTag: tagList[0],
    calculatedBuildNumber: getBuildNumber(root),
    renderedBuildNumber: text('build-number'),
    versionFile,
    productVersion: text('product-version'),
    udiPi: text('udi-pi'),
  }
  writeFileSync('dist/verification.json', JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result, null, 2))
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Prod 빌드 검증 성공\n\n| 항목 | 값 |\n|---|---|\n` +
      Object.entries(result).map(([key, value]) => `| ${key} | ${value} |`).join('\n') + '\n')
  }
} finally {
  dom.window.close()
}
