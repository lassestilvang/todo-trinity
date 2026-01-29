import { auth } from 'next-auth/react'
import { useEffect } from 'react'

export default function SignOut() {
  const { data: session, signOut } = auth()

  useEffect(() => {
    if (session) {
      signOut()
    }
  }, [session, signOut])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Signing Out...
        </h1>
        <p className="text-gray-600 mb-6">
          You are being signed out of your account.
        </p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  )
}