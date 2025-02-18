import type { Libp2p, Stream, Connection } from '@libp2p/interface';
import { pipe } from 'it-pipe';
import * as lp from 'it-length-prefixed';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { forComponent } from '../logger';
import { FILE_EXCHANGE_PROTOCOL } from '../constants';

const log = forComponent('libp2p:stream');

export class StreamManager {
  private libp2p: Libp2p;

  constructor(libp2p: Libp2p) {
    this.libp2p = libp2p;
  }

  async setupFileProtocolHandler(getFileById: (id: string) => Promise<Uint8Array>): Promise<void> {
    this.libp2p.handle(FILE_EXCHANGE_PROTOCOL, ({ stream }) => {
      pipe(
        stream.source,
        (source) => lp.decode(source),
        (source) => this.handleFileRequest(source, getFileById),
        (source) => lp.encode(source),
        stream.sink
      );
    });
  }

  private async *handleFileRequest(source: AsyncIterable<Uint8Array>, getFileById: (id: string) => Promise<Uint8Array>) {
    for await (const msg of source) {
      const fileId = uint8ArrayToString(msg.subarray());
      try {
        const fileBody = await getFileById(fileId);
        yield fileBody;
      } catch (err) {
        log.error('Failed to retrieve file:', err);
        yield new Uint8Array(); // Empty response on error
      }
    }
  }

  async sendFile(connection: Connection, fileId: string, fileData: Uint8Array): Promise<void> {
    const stream = await connection.newStream(FILE_EXCHANGE_PROTOCOL);
    try {
      await pipe(
        [fileId],
        (source) => map(source, str => uint8ArrayFromString(str)),
        stream,
        async (source) => {
          const chunks: Uint8Array[] = [];
          for await (const chunk of source) {
            chunks.push(chunk);
          }
          return chunks;
        }
      );
    } finally {
      await stream.close();
    }
  }

  async cleanup(): Promise<void> {
    await this.libp2p.unhandle(FILE_EXCHANGE_PROTOCOL);
  }
}

async function map<T, U>(source: AsyncIterable<T>, fn: (item: T) => U): AsyncIterable<U> {
  const results = [];
  for await (const item of source) {
    results.push(fn(item));
  }
  return results;
}