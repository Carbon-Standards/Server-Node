import { CarbonMeta } from "@carbon-standards/types";

export function encode(
  meta: CarbonMeta,
  id: string,
  body: ArrayBuffer
): Uint8Array[] {
  const usableBytes = meta.maxPacketSize - 18;
  const packets: Uint8Array[] = [];

  for (let i = 0; i < Math.ceil(body.byteLength / usableBytes); i++) {
    packets.push(
      new Uint8Array([
        ...id.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
        ...[(i >> 8) & 0xff, i & 0xff],
        ...new Uint8Array(body.slice(i * usableBytes, (i + 1) * usableBytes))
      ])
    );
  }

  return packets;
}

export function getId(data: Uint8Array): string {
  return Array.from(data.slice(0, 16))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function getIndex(data: Uint8Array): number {
  return ((data[16] & 0xff) << 8) | (data[17] & 0xff);
}

export function decode(packets: Uint8Array[]): ArrayBuffer {
  const decodedPackets: Map<number, Uint8Array> = new Map();

  for (const packet of packets) {
    decodedPackets.set(getIndex(packet), packet.slice(18));
  }

  let body: ArrayBuffer = new ArrayBuffer(0);

  for (let i = 0; i < decodedPackets.size; i++) {
    if (decodedPackets.has(i)) {
      const packet = decodedPackets.get(i)!;
      const packetBody = packet.slice(18);

      const newBody = new Uint8Array(body.byteLength + packetBody.byteLength);
      newBody.set(new Uint8Array(body), 0);
      newBody.set(packetBody, body.byteLength);

      body = newBody.buffer;
    } else {
      throw new Error(`Missing packet ${i}`);
    }
  }

  return body;
}
