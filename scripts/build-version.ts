import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import semver from 'semver'

const PRODUCTION_TAG_PATTERN = /^v\d+\.\d+\.\d+$/

/**
 * 최신 정식 릴리스 버전의 minor 버전을 1 올려 전 환경의 Build Number를 계산한다.
 * prod CI가 생성한 새 태그에 버전을 중복해서 올리지 않도록 HEAD 태그는 제외한다.
 * releaserc-prod.js의 minor 증가 규칙과 vX.Y.Z 태그 형식을 기준으로 한다.
 *
 * @param projectRoot 프로젝트 루트 경로 (e.g. '/project/auravue')
 * @returns 계산한 버전 문자열. 기준 태그가 없거나 조회에 실패하면 '0.0.0'.
 */
export function getBuildNumber(projectRoot: string) {
  try {
    const headVersions = new Set(getBuildNumberCandidates(projectRoot, true))
    const [latestRelease] = semver.rsort(
      getBuildNumberCandidates(projectRoot).filter((version) => !headVersions.has(version)),
    )

    return (latestRelease && semver.inc(latestRelease, 'minor')) ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

/**
 * 계산한 Build Number가 실제 production 릴리스 버전과 일치하는지 검증한다.
 * 일치하지 않으면 오류를 발생시켜 잘못된 버전이 배포되지 않도록 빌드를 중단한다.
 *
 * 새 릴리스에서는 semantic-release가 작성한 public/version.txt를 기준으로 검증한다.
 * 같은 커밋으로 CI를 재실행하면 새 릴리스가 없어 이 파일이 생성되지 않을 수 있다.
 * 파일이 없으면 현재 커밋(HEAD)에 붙은 정식 버전 태그가 정확히 하나인지 확인하고,
 * 해당 버전으로 검증한다. 검증을 통과하면 version.txt도 생성해 빌드 산출물에 포함한다.
 * 파일이 있지만 내용이 잘못된 경우에는 태그로 대체하지 않고 빌드를 중단한다.
 *
 * @param projectRoot 프로젝트 루트 경로 (e.g. '/project/auravue')
 * @param buildNumber getBuildNumber로 계산한 버전 문자열 (e.g. '1.13.0')
 * @throws 실제 버전이 없거나 정식 버전 형식이 아닌 경우, 또는 계산값과 다른 경우.
 * 파일 읽기·쓰기나 Git 조회가 실패한 경우에도 오류가 발생한다.
 */
export function verifyProductionBuildNumber(projectRoot: string, buildNumber: string) {
  const releasedVersionFile = path.resolve(projectRoot, 'public/version.txt')

  const hasReleasedVersionFile = existsSync(releasedVersionFile)
  const headVersions = hasReleasedVersionFile ? [] : getBuildNumberCandidates(projectRoot, true)
  const releasedVersion = hasReleasedVersionFile
    ? readFileSync(releasedVersionFile, 'utf8').trim()
    : headVersions.length === 1 ? headVersions[0] : undefined

  if (!releasedVersion || semver.valid(releasedVersion) !== releasedVersion || semver.prerelease(releasedVersion) !== null) {
    throw new Error('production 버전을 확인할 수 없어 빌드를 중단합니다. public/version.txt에 정식 버전(예: 1.13.0)이 기록되어 있는지 확인하세요. 파일이 없는 재배포라면 현재 커밋(HEAD)에 정식 버전 태그(예: v1.13.0)가 정확히 하나 있어야 합니다.')
  }

  if (releasedVersion !== buildNumber) {
    throw new Error(`계산한 Build Number(${buildNumber})와 실제 production 버전(${releasedVersion})이 달라 빌드를 중단합니다. releaserc-prod.js의 버전 증가 규칙과 scripts/build-version.ts의 getBuildNumber 계산 방식이 일치하는지 확인하세요.`)
  }

  // 재배포에서도 기존 버전 조회 기능이 사용하는 파일을 산출물에 포함한다.
  if (!hasReleasedVersionFile) writeFileSync(releasedVersionFile, `${releasedVersion}\n`)
}

/**
 * vX.Y.Z 형식의 정식 릴리스 태그에서 Build Number 계산에 사용할 버전 목록 조회
 *
 * @param projectRoot 프로젝트 루트 경로 (e.g. '/project/auravue')
 * @param onlyHeadTags true이면 현재 커밋(HEAD)에 직접 붙은 태그만 조회한다.
 * @returns 정렬하지 않은 버전 목록 (예: ['1.12.0', '1.13.0']).
 */
function getBuildNumberCandidates(projectRoot: string, onlyHeadTags = false): string[] {
  return execFileSync('git', ['tag', '--list', 'v*', ...(onlyHeadTags ? ['--points-at', 'HEAD'] : [])], {
    cwd: projectRoot,
    encoding: 'utf8',
  })
    .split('\n')
    .filter((tag) => PRODUCTION_TAG_PATTERN.test(tag))
    .map((tag) => semver.clean(tag))
    .filter((version): version is string => version !== null && semver.prerelease(version) === null)
}
