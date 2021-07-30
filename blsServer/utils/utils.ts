import { randomBytes, hexlify, hexZeroPad } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';

export const FIELD_ORDER = BigNumber.from('0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47');

export const ZERO = BigNumber.from('0');
export const ONE = BigNumber.from('1');
export const TWO = BigNumber.from('2');

export function toBig(n: any): BigNumber {
  return BigNumber.from(n);
}

export function randHex(n: number): string {
  return hexlify(randomBytes(n));
}

export function randBig(n: number): BigNumber {
  return toBig(randomBytes(n));
}

export function bigToHex(n: BigNumber): string {
  return hexZeroPad(n.toHexString(), 32);
}

export function randFs(): BigNumber {
  const r = randBig(32);
  return r.mod(FIELD_ORDER);
}

export function randFsHex(): string {
  const r = randBig(32);
  return bigToHex(r.mod(FIELD_ORDER));
}

export const P_PLUS1_OVER4 = BigNumber.from('0xc19139cb84c680a6e14116da060561765e05aa45a1c72a34f082305b61f3f52');
// export const P_MINUS3_OVER4 = BigNumber.from('0xc19139cb84c680a6e14116da060561765e05aa45a1c72a34f082305b61f3f51');
// export const P_MINUS1_OVER2 = BigNumber.from('0x183227397098d014dc2822db40c0ac2ecbc0b548b438e5469e10460b6c3e7ea3');
function exp(a: BigNumber, e: BigNumber): BigNumber {
  let z = BigNumber.from(1);
  let path = BigNumber.from('0x8000000000000000000000000000000000000000000000000000000000000000');
  for (let i = 0; i < 256; i++) {
    z = z.mul(z).mod(FIELD_ORDER);
    if (!e.and(path).isZero()) {
      z = z.mul(a).mod(FIELD_ORDER);
    }
    path = path.shr(1);
  }
  return z;
}

export function sqrt(nn: BigNumber): { n: BigNumber; found: boolean } {
  const n = exp(nn, P_PLUS1_OVER4);
  const found = n.mul(n).mod(FIELD_ORDER).eq(nn);
  return { n, found };
}

export function inverse(a: BigNumber): BigNumber {
  const z = FIELD_ORDER.sub(TWO);
  return exp(a, z);
}

export function mulmod(a: BigNumber, b: BigNumber): BigNumber {
  return a.mul(b).mod(FIELD_ORDER);
}
