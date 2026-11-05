#!/usr/bin/env python3
"""
NEAR Chain Signatures MPC EVM Address Derivation Script
Order 3 — Branch: antigravity/mpc-derive

Derives the deterministic EVM foreign address for a NEAR account ID
using derivation path ethereum-1 and the NEAR MPC root key.
No EVM private key is ever created or stored.

Usage:
    python3 scripts/derive-mpc-address.py <account_id> [--path ethereum-1] [--network mainnet]
    python3 scripts/derive-mpc-address.py --test
"""

import argparse
import hashlib
import sys

# secp256k1 curve parameters
P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
Gx = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798
Gy = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8

# NEAR MPC Root Public Keys (secp256k1)
ROOT_PUBLIC_KEYS = {
    "mainnet": {
        "contract": "v1.signer",
        "key_b58": "3tFRbMqmoa6AAALMrEFAYCEoHcqKxeW38YptwowBVBtXK1vo36HDbUWuR6EZmoK4JcH6HDkNMGGqP1ouV7VZUWya"
    },
    "testnet": {
        "contract": "v1.signer-prod.testnet",
        "key_b58": "4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3"
    }
}

B58_CHARS = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

def b58decode(v: str) -> bytes:
    num = 0
    for c in v:
        num = num * 58 + B58_CHARS.index(c)
    return num.to_bytes(64, "big")

def inv(n: int, m: int = P) -> int:
    return pow(n, m - 2, m)

def point_add(p1, p2):
    if p1 is None: return p2
    if p2 is None: return p1
    x1, y1 = p1
    x2, y2 = p2
    if x1 == x2 and y1 != y2: return None
    if x1 == x2:
        m = (3 * x1 * x1) * inv(2 * y1) % P
    else:
        m = (y2 - y1) * inv(x2 - x1) % P
    x3 = (m * m - x1 - x2) % P
    y3 = (m * (x1 - x3) - y1) % P
    return (x3, y3)

def point_mul(k: int, p):
    res = None
    addend = p
    while k:
        if k & 1:
            res = point_add(res, addend)
        addend = point_add(addend, addend)
        k >>= 1
    return res

def keccak256(data: bytes) -> bytes:
    RC = [
        0x0000000000000001, 0x0000000000008082, 0x800000000000808A, 0x8000000080008000,
        0x000000000000808B, 0x0000000080000001, 0x8000000080008081, 0x8000000000008009,
        0x000000000000008A, 0x0000000000000088, 0x0000000080008009, 0x000000008000000A,
        0x000000008000808B, 0x800000000000008B, 0x8000000000008089, 0x8000000000008003,
        0x8000000000008002, 0x8000000000000080, 0x000000000000800A, 0x800000008000000A,
        0x8000000080008081, 0x8000000000008080, 0x0000000080000001, 0x8000000080008008
    ]
    ROTL64 = lambda x, n: ((x << (n % 64)) & 0xFFFFFFFFFFFFFFFF) | (x >> (64 - (n % 64)))
    R = [
        [ 0, 36,  3, 41, 18],
        [ 1, 44, 10, 45,  2],
        [62,  6, 43, 15, 61],
        [28, 55, 25, 21, 56],
        [27, 20, 39,  8, 14]
    ]

    rate = 136
    padlen = rate - (len(data) % rate)
    padded = data + (b"\x81" if padlen == 1 else b"\x01" + b"\x00" * (padlen - 2) + b"\x80")
    state = [[0] * 5 for _ in range(5)]

    for block_start in range(0, len(padded), rate):
        block = padded[block_start:block_start + rate]
        for i in range(17):
            state[i % 5][i // 5] ^= int.from_bytes(block[i * 8:i * 8 + 8], "little")

        for round_idx in range(24):
            C = [state[x][0] ^ state[x][1] ^ state[x][2] ^ state[x][3] ^ state[x][4] for x in range(5)]
            D = [C[(x - 1) % 5] ^ ROTL64(C[(x + 1) % 5], 1) for x in range(5)]
            for x in range(5):
                for y in range(5):
                    state[x][y] ^= D[x]

            B = [[0] * 5 for _ in range(5)]
            for x in range(5):
                for y in range(5):
                    B[y][(2 * x + 3 * y) % 5] = ROTL64(state[x][y], R[x][y])

            for x in range(5):
                for y in range(5):
                    state[x][y] = B[x][y] ^ ((~B[(x + 1) % 5][y]) & B[(x + 2) % 5][y])

            state[0][0] ^= RC[round_idx]

    out = bytearray()
    for y in range(5):
        for x in range(5):
            out += state[x][y].to_bytes(8, "little")
            if len(out) >= 32:
                break
    return bytes(out[:32])

def to_checksum_address(raw_hex: str) -> str:
    addr = raw_hex.lower().replace("0x", "")
    h = keccak256(addr.encode("ascii")).hex()
    return "0x" + "".join(c.upper() if int(h[i], 16) >= 8 else c for i, c in enumerate(addr))

def derive_evm_address(account_id: str, path: str = "ethereum-1", network: str = "mainnet") -> dict:
    config = ROOT_PUBLIC_KEYS.get(network.lower(), ROOT_PUBLIC_KEYS["mainnet"])
    raw_pub = b58decode(config["key_b58"])
    rx = int.from_bytes(raw_pub[:32], "big")
    ry = int.from_bytes(raw_pub[32:], "big")

    # Additive tweak derivation formula per NEAR Chain Signatures specification:
    # tweak = sha3_256("near-mpc-recovery v0.1.0 epsilon derivation:<account_id>,<path>")
    tweak_str = f"near-mpc-recovery v0.1.0 epsilon derivation:{account_id},{path}".encode("utf-8")
    tweak_int = int.from_bytes(hashlib.sha3_256(tweak_str).digest(), "big")

    tweak_pt = point_mul(tweak_int, (Gx, Gy))
    child_pt = point_add((rx, ry), tweak_pt)
    cx, cy = child_pt

    uncompressed_pub = cx.to_bytes(32, "big") + cy.to_bytes(32, "big")
    addr_bytes = keccak256(uncompressed_pub)[12:]
    address = to_checksum_address(addr_bytes.hex())

    return {
        "account_id": account_id,
        "path": path,
        "network": network,
        "mpc_contract": config["contract"],
        "derived_public_key": "04" + uncompressed_pub.hex(),
        "address": address
    }

def run_tests():
    print("Running Chain Signatures derivation verification tests...")

    # Mainnet test vector
    mainnet_res = derive_evm_address("example.near", "ethereum-1", "mainnet")
    expected_mainnet = "0xEF4Ea05e5c11057DeCC8E1bd6F5369f2acD91fA5"
    assert mainnet_res["address"] == expected_mainnet, f"Mainnet mismatch: {mainnet_res['address']} != {expected_mainnet}"
    print(f"  [PASS] Mainnet example.near + ethereum-1 -> {mainnet_res['address']}")

    # Testnet test vector
    testnet_res = derive_evm_address("example.near", "ethereum-1", "testnet")
    expected_testnet = "0x6787a751B4592A3871267c320C19cA01e5aBAec4"
    assert testnet_res["address"] == expected_testnet, f"Testnet mismatch: {testnet_res['address']} != {expected_testnet}"
    print(f"  [PASS] Testnet example.near + ethereum-1 -> {testnet_res['address']}")

    print("All derivation tests passed successfully!")

def main():
    parser = argparse.ArgumentParser(description="Derive EVM address for NEAR Chain Signatures MPC")
    parser.add_argument("account_id", nargs="?", help="NEAR Account ID (e.g., alice.near)")
    parser.add_argument("--path", default="ethereum-1", help="Derivation path (default: ethereum-1)")
    parser.add_argument("--network", default="mainnet", choices=["mainnet", "testnet"], help="NEAR network (default: mainnet)")
    parser.add_argument("--test", action="store_true", help="Run internal verification test suite")
    parser.add_argument("--raw", action="store_true", help="Print only the derived EVM address")

    args = parser.parse_args()

    if args.test:
        run_tests()
        return

    if not args.account_id:
        parser.print_help()
        sys.exit(1)

    result = derive_evm_address(args.account_id, args.path, args.network)

    if args.raw:
        print(result["address"])
        return

    print("==================================================")
    print("  NEAR Chain Signatures — MPC Derived Relayer Address")
    print("==================================================")
    print(f"  NEAR Account ID : {result['account_id']}")
    print(f"  Derivation Path : {result['path']}")
    print(f"  Network         : {result['network']} ({result['mpc_contract']})")
    print(f"  Derived EVM     : {result['address']}")
    print("==================================================")
    print(f"Constructor argument for LicenseRegistry deploy:")
    print(f"  {result['address']}")
    print("==================================================")

if __name__ == "__main__":
    main()
