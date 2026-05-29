import { redirect } from 'next/navigation'

export const metadata = {
  title: '로그인 | 부모님 안심케어'
}

export default function GuardianSignupRedirectPage() {
  redirect('/login')
}
