const EthCrypto = require('eth-crypto')
const {
  ipfsEncryptAndAdd,
  ipfsGetAndDecrypt
} = require('../src/api')
const VaccineCredentialJSON = require('./vaccine-credential.json')
const Credentials = artifacts.require("Credentials")

// Test Data
const CREDENTIAL_TYPE_NAME = "VaccineABC"
const IPFS_HASH = 'QmeYYwD4y4DgVVdAzhT7wW5vrvmbKPQj8wcV2pAzjbj886'

contract('Credentials', accounts => {

  // Credential / ID Holder Account - generate keys
  const holderIdentity = EthCrypto.createIdentity()
  const holderAddr = holderIdentity.address
  const holderPublicKey = holderIdentity.publicKey
  const holderPrivateKey = holderIdentity.privateKey

  // Contract owner - administrator
  const ownerAddr = accounts[0]

  // Credential Issuing party
  const issuerAddr = accounts[1]

  // Credentials smart contract handle (truffle-contract)
  let creds

  /**
   * Setup contract for testing.
   */
  beforeEach(async () => {
    web3.eth.defaultAccount = ownerAddr
    creds = await Credentials.new({ from: ownerAddr })
  })

  it("should add issuer", async () => {
    await creds.addIssuer(issuerAddr, { from: ownerAddr })
    assert.isTrue(await creds.issuers.call(issuerAddr))
  })

  it("should add a credential type", async () => {
    await creds.addIssuer(issuerAddr, { from: ownerAddr })
    const tx = await creds.addCredentialType(
      CREDENTIAL_TYPE_NAME,
      { from: issuerAddr }
    )
    const credTypeId = tx.logs[0].args.id
    const credType = await creds.credentialTypes.call(credTypeId)
    assert.equal(credType.issuer, issuerAddr, "expected issuer")
    assert.equal(credType.name, CREDENTIAL_TYPE_NAME, "expected name")
  })

  it("should issue a credential and getters return correct data", async () => {
    await creds.addIssuer(issuerAddr, { from: ownerAddr })
    const tx = await creds.addCredentialType(
      CREDENTIAL_TYPE_NAME,
      { from: issuerAddr }
    )
    const credTypeId = tx.logs[0].args.id

    const tx2 = await creds.issueCredential(
      credTypeId,
      holderAddr,
      IPFS_HASH,
      { from: issuerAddr }
    )
    const credId = tx2.logs[0].args.id

    const assertCred = cred => {
      assert.equal(cred.holder, holderAddr, "expected holder address")
      assert.equal(cred.credentialTypeId, credTypeId, "expected credential type id")
      assert.equal(cred.ipfsHash, IPFS_HASH, "expected ipfs hash")
    }

    const cred = await creds.getCredential.call(credId)
    assertCred(cred)

    const numCreds = await creds.getCredentialsByHolderCount.call(holderAddr)
    assert.equal(numCreds, 1, "should be 1 only")

    const credByHolder = await creds.getCredentialByHolder.call(holderAddr, 0)
    assertCred(credByHolder)
  })

  it("should complete full cycle of issuing credentials including read and write from IPFS", async () => {

    //
    // Setup issuer and credential type
    //
    await creds.addIssuer(issuerAddr, { from: ownerAddr })
    const tx = await creds.addCredentialType(
      CREDENTIAL_TYPE_NAME,
      { from: issuerAddr }
    )
    const credTypeId = tx.logs[0].args.id

    //
    // Issue a credential - Step 1
    //   create credential file
    //   encrypt it with the credential holders keys and push it to IPFS
    //

    const credJSON = { ...VaccineCredentialJSON }

    // set subject to the holders address
    credJSON.credentialSubject.id = `did:ethr:${holderAddr}`

    // TODO: issuer signs and updates the jws in the json
    //      for now just a dummy signature is included

    // encrypt with holders public key and add to ipfs
    const ipfsHash = await ipfsEncryptAndAdd(JSON.stringify(credJSON), holderPublicKey)
    console.log(`credential ipfs hash: ${ipfsHash}`)

    //
    // Issue a credential - Step 2
    //   add entry on the blockchain
    //
    const tx2 = await creds.issueCredential(
      credTypeId,
      holderAddr,
      ipfsHash,
      { from: issuerAddr }
    )
    const credId = tx2.logs[0].args.id
    const cred = await creds.getCredential.call(credId)
    assert.equal(cred.holder, holderAddr, "expected holder address")
    assert.equal(cred.credentialTypeId, credTypeId, "expected credential type id")
    assert.equal(cred.ipfsHash, ipfsHash, "expected ipfs hash")

    //
    // Finally test a holder can retrieve the credential from IPFS
    // using the api function
    //
    const decryptedStr = await ipfsGetAndDecrypt(ipfsHash, holderPrivateKey)
    const credentialRecord = JSON.parse(decryptedStr)
    assert.equal(credentialRecord.id, credJSON.id, "ids should match")
  })

})
