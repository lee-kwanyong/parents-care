import { redirect } from 'next/navigation'

export default function LoginSuccessPage() {
  redirect('/onboarding?source=login-success')
}
