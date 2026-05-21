export function toPascalCase(input: string) {
  return input
    .toLowerCase()
    .split(/[^a-zA-Z0-9]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

export function compareVersions(version1: string, version2: string): number {
  const [major1, minor1 = '0'] = version1.split('.')
  const [major2, minor2 = '0'] = version2.split('.')

  const majorComparison = parseInt(major1) - parseInt(major2)
  if (majorComparison !== 0) {
    return Math.sign(majorComparison)
  }

  const minorComparison = parseInt(minor1) - parseInt(minor2)
  return Math.sign(minorComparison)
}
