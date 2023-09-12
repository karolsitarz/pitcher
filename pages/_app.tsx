import Head from 'next/head'
import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from 'react-query'

import 'styles/globals.css'

const queryClient = new QueryClient()

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Pitcher</title>
        <meta
          name="description"
          content="Change the pitch of a song. Quickly."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </>
  )
}
