module.exports = {
  branches: ['main'],
  tagFormat: 'v${version}',
  plugins: [
    ['@semantic-release/commit-analyzer', { releaseRules: [{ type: '*', release: 'minor' }] }],
    ['@semantic-release/exec', { prepareCmd: 'mkdir -p public && echo ${nextRelease.version} > public/version.txt' }],
  ],
}
