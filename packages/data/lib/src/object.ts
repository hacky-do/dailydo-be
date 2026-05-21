function getAllKeys(obj: Record<string, any>, prefix = '') {
  let keys = []
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newPrefix = prefix ? `${prefix}.${key}` : key
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys = keys.concat(getAllKeys(obj[key], newPrefix))
      } else {
        keys.push(newPrefix)
      }
    }
  }
  return keys
}

function toNestedObject(obj: Record<string, any>): any {
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const keys = key.split('_') // 언더스코어 기준으로 분리
    let current = result

    keys.forEach((k, index) => {
      if (index === keys.length - 1) {
        current[k] = value // 마지막 키에 값을 설정
      } else {
        current[k] = current[k] || {} // 중간 키에 객체 생성
        current = current[k]
      }
    })
  }
  return result
}

export { getAllKeys, toNestedObject }
