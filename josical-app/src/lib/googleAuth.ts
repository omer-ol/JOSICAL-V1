import { makeRedirectUri, type AuthSessionResult } from 'expo-auth-session'
import { useIdTokenAuthRequest } from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'

WebBrowser.maybeCompleteAuthSession()

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? ''
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? ''

export function useGoogleAuth() {
  const redirectUri = makeRedirectUri({ scheme: 'josical' })

  const [request, response, promptAsync] = useIdTokenAuthRequest({
    webClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    redirectUri,
  })

  return {
    request,
    response,
    promptAsync,
  } as const
}

export function getGoogleIdToken(
  response: AuthSessionResult | null,
): string | null {
  if (response?.type !== 'success') return null
  return response.params.id_token ?? null
}
