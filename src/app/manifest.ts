import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '부모님 케어 플랫폼',
    short_name: '부모님케어',
    description: '부모님 안심케어를 쉽게 시작하는 부모님 케어 플랫폼',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    background_color: '#F7FCFB',
    theme_color: '#19B99A',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/parents-care-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icons/parents-care-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable'
      }
    ],
    shortcuts: [
      {
        name: '앱 선택',
        short_name: '앱 선택',
        description: '부모님·자녀·매니저 앱을 선택합니다.',
        url: '/app',
        icons: [
          {
            src: '/icons/parents-care-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      },
      {
        name: '부모님앱',
        short_name: '부모님',
        description: '부모님 오늘 안심 화면을 엽니다.',
        url: '/parent/today',
        icons: [
          {
            src: '/icons/parents-care-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      },
      {
        name: '자녀앱',
        short_name: '자녀',
        description: '부모님 안심케어 신청 화면을 엽니다.',
        url: '/care-request',
        icons: [
          {
            src: '/icons/parents-care-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      },
      {
        name: '매니저앱',
        short_name: '매니저',
        description: '매니저 제안과 배정 화면을 엽니다.',
        url: '/manager',
        icons: [
          {
            src: '/icons/parents-care-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      },
      {
        name: '홈 화면에 추가하기',
        short_name: '홈 화면에 추가하기',
        description: '부모님 안심케어를 간단히 시작합니다.',
        url: '/care-request',
        icons: [
          {
            src: '/icons/parents-care-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      },
      {
        name: '케어파트너 앱',
        short_name: '매니저앱',
        description: '매니저가 일감을 확인하고 현장을 체크합니다.',
        url: '/manager',
        icons: [
          {
            src: '/icons/parents-care-manager-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      },
      {
        name: '오늘 현장 체크',
        short_name: '현장 체크',
        description: '매니저 현장 진행 상황을 체크합니다.',
        url: '/manager/today',
        icons: [
          {
            src: '/icons/parents-care-manager-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    ],
    categories: ['health', 'family', 'lifestyle']
  }
}
