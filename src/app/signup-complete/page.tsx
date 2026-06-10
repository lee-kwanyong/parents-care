import { redirect } from 'next/navigation'

export default function SignupCompletePage() {
  redirect('/onboarding?source=signup-complete')
}
