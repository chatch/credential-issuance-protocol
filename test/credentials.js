const Credentials = artifacts.require("Credentials")

contract('Credentials', accounts => {

  const CREDENTIAL_TYPE_NAME = "VaccineABC"
  const IPFS_HASH = 'QmeYYwD4y4DgVVdAzhT7wW5vrvmbKPQj8wcV2pAzjbj886'

  const ownerAddr = accounts[0]
  const issuerAddr = accounts[1]
  const holderAddr = accounts[2]

  let creds

  /**
   * Setup contracts for testing.
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

})
