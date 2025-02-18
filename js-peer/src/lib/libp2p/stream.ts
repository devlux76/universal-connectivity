import type { Libp2p, Connection } from '@libp2p/interface'
import { pipe } from 'it-pipe'
import * as lp from 'it-length-prefixed'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { forComponent } from '../logger'
import { FILE_EXCHANGE_PROTOCOL } from '../constants'

const log = forComponent('libp2p:stream')

export class StreamManager {
  private libp2p: Libp2p

  constructor(libp2p: Libp2p) {
    this.libp2p = libp2p
  }

  async setupFileProtocolHandler(getFileById: (id: string) => Promise<Uint8Array>): Promise<void> {
    this.libp2p.handle(FILE_EXCHANGE_PROTOCOL, ({ stream }) => {
      void pipe(
        stream.source,
        lp.decode,
        async function* (source) {
          for await (const chunk of source) {
            if (chunk instanceof Uint8Array) {
              yield chunk
            }
          }
        },
        (source) => this.handleFileRequest(source, getFileById),
        lp.encode,
        stream.sink
      )
    })
  }

  private async *handleFileRequest(
    source: AsyncIterable<Uint8Array>,
    getFileById: (id: string) => Promise<Uint8Array>,
  ) {
    for await (const msg of source) {
      const fileId = uint8ArrayToString(msg.subarray())
      try {
        const fileBody = await getFileById(fileId)
        yield fileBody
      } catch (err) {
        log.error('Failed to retrieve file:', err)
        yield new Uint8Array() // Empty response on error
      }
    }
  }

  async sendFile(connection: Connection, fileId: string, _fileData: Uint8Array): Promise<void> {
    const stream = await connection.newStream(FILE_EXCHANGE_PROTOCOL)
    try {
      await pipe(
        [uint8ArrayFromString(fileId)],
        lp.encode,
        stream,
        lp.decode,
        async function* (source) {
          for await (const chunk of source) {
            if (chunk instanceof Uint8Array) {
              yield chunk
            }
          }
        }
      )
    } finally {
      await stream.close()
    }
  }

  async cleanup(): Promise<void> {
    await this.libp2p.unhandle(FILE_EXCHANGE_PROTOCOL)
  }
}

