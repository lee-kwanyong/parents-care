import { redirect } from 'next/navigation'

export const metadata = {
  title: '보호자 회원가입 | 부모님 안심케어'
}

export default function GuardianSignupRedirectPage() {
  redirect('/family-link')
}
