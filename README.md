# Identity credentials issuance prototype

## Overview

A Smart contract and API for issuing credentials on the blockchain.

The smart contract has:

- a whilelist of authorised Issuers
- a list of CredentialTypes that can be issued
- a credentials register with metadata for each Credential including an ipfs hash

Credentials are:

- JSON files containing credential details and a signature from the issuer
- encrypted with the holders public key and stored on IPFS

## Build

```
> truffle compile
> npm run lint
```

## Tests

```
> truffle develop
truffle(develop)> test

  api
    - should encrypt a string
    - should decrypt an Encrypted record
    - should get and decrypt and encrypted record on IPFS
    - should encrypt and push data to IPFS

  Contract: Credentials
    ✓ should add issuer (101ms)
    ✓ should add a credential type (162ms)
    ✓ should issue a credential and getters return correct data (310ms)
adding encrypted file to ipfs
credential ipfs hash: QmcKeSRmkiHtDQTVow4injnzT6pjKFTCM1pAiBPr7uFEvR
    ✓ should complete full cycle of issuing credentials including read and write from IPFS (2972ms)


  4 passing (4s)
  4 pending

```

NOTE: api tests are not yet complete however these are called inside the Credentials contract test.
