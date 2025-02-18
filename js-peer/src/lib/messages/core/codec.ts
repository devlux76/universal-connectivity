import { Codec, decodeMessage, DecodeOptions, encodeMessage, enumeration, message } from 'protons-runtime'
import { Uint8ArrayList } from 'uint8arraylist'
import { DirectMessageRequest, DirectMessageResponse, Metadata, Status, StatusValues } from '../types/direct-message'

export namespace dm {
  function createMetadataCodec(): Codec<Metadata> {
    let _codec: Codec<Metadata>
    return () => {
      if (_codec == null) {
        _codec = message<Metadata>(
          (obj, w, opts = {}) => {
            if (opts.lengthDelimited !== false) {
              w.fork()
            }

            if (obj.clientVersion != null && obj.clientVersion !== '') {
              w.uint32(10)
              w.string(obj.clientVersion)
            }

            if (obj.timestamp != null && obj.timestamp !== 0n) {
              w.uint32(16)
              w.int64(obj.timestamp)
            }

            if (opts.lengthDelimited !== false) {
              w.ldelim()
            }
          },
          (reader, length, _opts = {}) => {
            const obj: Metadata = {
              clientVersion: '',
              timestamp: 0n,
            }

            const end = length == null ? reader.len : reader.pos + length
            while (reader.pos < end) {
              const tag = reader.uint32()
              switch (tag >>> 3) {
                case 1:
                  obj.clientVersion = reader.string()
                  break
                case 2:
                  obj.timestamp = reader.int64()
                  break
                default:
                  reader.skipType(tag & 7)
                  break
              }
            }
            return obj
          }
        )
      }
      return _codec
    }
  }

  export const Metadata = {
    codec: createMetadataCodec(),
    encode: (obj: Partial<Metadata>): Uint8Array => encodeMessage(obj, createMetadataCodec()()),
    decode: (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Metadata>): Metadata => 
      decodeMessage(buf, createMetadataCodec()(), opts)
  }

  export const Status = {
    codec: (): Codec<Status> => enumeration<Status>(StatusValues)
  }

  function createRequestCodec(): Codec<DirectMessageRequest> {
    let _codec: Codec<DirectMessageRequest>
    return () => {
      if (_codec == null) {
        _codec = message<DirectMessageRequest>(
          (obj, w, opts = {}) => {
            if (opts.lengthDelimited !== false) {
              w.fork()
            }

            if (obj.metadata != null) {
              w.uint32(10)
              Metadata.codec().encode(obj.metadata, w)
            }

            if (obj.content != null && obj.content !== '') {
              w.uint32(18)
              w.string(obj.content)
            }

            if (obj.type != null && obj.type !== '') {
              w.uint32(26)
              w.string(obj.type)
            }

            if (opts.lengthDelimited !== false) {
              w.ldelim()
            }
          },
          (reader, length, _opts = {}) => {
            const obj: DirectMessageRequest = {
              metadata: undefined,
              content: '',
              type: '',
            }

            const end = length == null ? reader.len : reader.pos + length
            while (reader.pos < end) {
              const tag = reader.uint32()
              switch (tag >>> 3) {
                case 1:
                  obj.metadata = Metadata.codec().decode(reader, reader.uint32(), {
                    limits: _opts.limits?.metadata,
                  })
                  break
                case 2:
                  obj.content = reader.string()
                  break
                case 3:
                  obj.type = reader.string()
                  break
                default:
                  reader.skipType(tag & 7)
                  break
              }
            }
            return obj
          }
        )
      }
      return _codec
    }
  }

  export const Request = {
    codec: createRequestCodec(),
    encode: (obj: Partial<DirectMessageRequest>): Uint8Array => encodeMessage(obj, createRequestCodec()()),
    decode: (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<DirectMessageRequest>): DirectMessageRequest =>
      decodeMessage(buf, createRequestCodec()(), opts)
  }

  function createResponseCodec(): Codec<DirectMessageResponse> {
    let _codec: Codec<DirectMessageResponse>
    return () => {
      if (_codec == null) {
        _codec = message<DirectMessageResponse>(
          (obj, w, opts = {}) => {
            if (opts.lengthDelimited !== false) {
              w.fork()
            }

            if (obj.metadata != null) {
              w.uint32(10)
              Metadata.codec().encode(obj.metadata, w)
            }

            if (obj.status != null && StatusValues[obj.status] !== 0) {
              w.uint32(16)
              Status.codec().encode(obj.status, w)
            }

            if (obj.statusText != null) {
              w.uint32(26)
              w.string(obj.statusText)
            }

            if (opts.lengthDelimited !== false) {
              w.ldelim()
            }
          },
          (reader, length, _opts = {}) => {
            const obj: DirectMessageResponse = {
              metadata: undefined,
              status: Status.UNKNOWN,
              statusText: undefined,
            }

            const end = length == null ? reader.len : reader.pos + length
            while (reader.pos < end) {
              const tag = reader.uint32()
              switch (tag >>> 3) {
                case 1:
                  obj.metadata = Metadata.codec().decode(reader, reader.uint32(), {
                    limits: _opts.limits?.metadata,
                  })
                  break
                case 2:
                  obj.status = Status.codec().decode(reader)
                  break
                case 3:
                  obj.statusText = reader.string()
                  break
                default:
                  reader.skipType(tag & 7)
                  break
              }
            }
            return obj
          }
        )
      }
      return _codec
    }
  }

  export const Response = {
    codec: createResponseCodec(),
    encode: (obj: Partial<DirectMessageResponse>): Uint8Array => encodeMessage(obj, createResponseCodec()()),
    decode: (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<DirectMessageResponse>): DirectMessageResponse =>
      decodeMessage(buf, createResponseCodec()(), opts)
  }
}