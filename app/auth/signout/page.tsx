import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SignOut() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const doSignOut = async () => {
      await signOut({ redirect: false })
      setLoading(false)
      router.push('/auth/signin')
    }

    doSignOut()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Signing Out...</h1>
        <p className="text-gray-600">You are being signed out of your account.</p>
      </div>
    </div>
  )
}