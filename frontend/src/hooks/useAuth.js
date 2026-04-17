import { useAuth } from '../context/AuthContext'

/**
 * Simple re-export hook for backward compatibility.
 * Primary auth logic lives in AuthContext.
 */
export default function useAuthHook() {
  return useAuth()
}
