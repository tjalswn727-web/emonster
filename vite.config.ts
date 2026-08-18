import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 프로젝트 사이트는 https://<user>.github.io/<repo>/ 하위 경로로 서비스되므로
  // 정적 자산 경로가 그 경로를 기준으로 만들어지도록 base를 저장소 이름으로 지정한다.
  base: '/emonster/',
  plugins: [react()],
})
