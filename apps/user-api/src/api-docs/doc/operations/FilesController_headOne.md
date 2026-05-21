파일을 다운로드 하지 않고 파일 정보 조회

- HEAD 메서드는 응답 본문이 없고, 헤더에서 원하는 정보를 조회함.
- Content-Type : 파일 타입
- Content-Length : 파일 크기
- Content-Disposition : 파일명

**파일명 추출예시(typescript)**

```typescript
function extractFilename(contentDisposition: string): string | null {
  const match = contentDisposition.match(/filename="([^"]+)"/)
  return match ? match[1] : null
}
```
