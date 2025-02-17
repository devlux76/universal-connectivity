import { AppWrapper } from '@/context/ctx'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useAutoSubscribeToNewTopics } from '@/lib/libp2p'

export default function App({ Component, pageProps }: AppProps) {
  useAutoSubscribeToNewTopics()
  return (
    <AppWrapper>
      <Component {...pageProps} />
    </AppWrapper>
  )
}
