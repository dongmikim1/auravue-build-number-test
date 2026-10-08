import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { getBuildNumber, verifyProductionBuildNumber } from '../scripts/build-version.ts'

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'build-number-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' })
  const commit = () => git('-c', 'user.name=Version Test', '-c', 'user.email=test@example.invalid', 'commit', '--allow-empty', '-m', 'test commit')
  git('init')
  commit()
  git('tag', 'v1.12.0')
  commit()
  mkdirSync(path.join(root, 'public'))
  return { root, git, file: path.join(root, 'public/version.txt') }
}

test('dev/stage: latest prod 1.12.0 predicts 1.13.0; prereleases are ignored', (t) => {
  const { root, git } = fixture(t)
  for (const tag of ['v1.99.0-dev.1', 'v1.99.0-stage.1', 'v1.99.0-rc.1', '9.0.0']) git('tag', tag)
  assert.equal(getBuildNumber(root), '1.13.0')
})

test('new prod: HEAD v1.13.0 is excluded; build number stays 1.13.0', (t) => {
  const { root, git, file } = fixture(t)
  git('tag', 'v1.13.0')
  writeFileSync(file, '1.13.0\n')
  assert.equal(getBuildNumber(root), '1.13.0')
  verifyProductionBuildNumber(root, getBuildNumber(root))
})

test('prod rerun: HEAD tag validates the version and recreates version.txt', (t) => {
  const { root, git, file } = fixture(t)
  git('tag', 'v1.13.0')
  verifyProductionBuildNumber(root, getBuildNumber(root))
  assert.equal(readFileSync(file, 'utf8'), '1.13.0\n')
})

test('prod mismatch stops the build', (t) => {
  const { root, file } = fixture(t)
  writeFileSync(file, '1.14.0\n')
  assert.throws(() => verifyProductionBuildNumber(root, getBuildNumber(root)), /빌드를 중단/)
})

test('prod without version.txt or a HEAD release tag stops the build', (t) => {
  const { root } = fixture(t)
  assert.throws(() => verifyProductionBuildNumber(root, getBuildNumber(root)), /버전을 확인할 수 없어/)
})

test('invalid version.txt is rejected even when HEAD has a valid release tag', (t) => {
  const { root, git, file } = fixture(t)
  git('tag', 'v1.13.0')
  writeFileSync(file, '1.13.0-stage.1\n')
  assert.throws(() => verifyProductionBuildNumber(root, getBuildNumber(root)), /버전을 확인할 수 없어/)
})
