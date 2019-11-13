const Credentials = artifacts.require("Credentials")

contract('Credentials', accounts => {

  const CREDENTIAL_TYPE_NAME = "VaccineABC";

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
    const tx = await creds.addCredentialType(CREDENTIAL_TYPE_NAME, { from: issuerAddr })
    const credTypeId = tx.logs[0].args.id
    const credType = await creds.credentialTypes.call(credTypeId)
    assert.equal(credType.issuer, issuerAddr, "expected issuer")
    assert.equal(credType.name, CREDENTIAL_TYPE_NAME, "expected name")
  })

})
