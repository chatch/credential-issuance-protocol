const EthCrypto = require('eth-crypto')
const IPFS = require('ipfs-http-client')


/**
 * API module containing functions for:
 * - interfacing with the Credentials smart contract
 * - encrypting / decrypting credential files
 * - fetching / pushing credential files
 * 
 * @module api
 */

/**************************************************
 * EthCrypto - Encryption/Decryption helpers
 *************************************************/

/**
 * Given a Buffer of an Encrypted record, decrypt the content with the given
 * private key and return the contents as a string.
 *
 * @param privateKey String private key
 * @param buf Buffer to an EthCrypto Encrypted record
 * @return Buffer decrypted and converted to a string
 */
const decryptBuffer = (privateKey, buf) => {
  const encryptedRec = JSON.parse(buf.toString())
  return EthCrypto.decryptWithPrivateKey(
    privateKey,
    encryptedRec,
  )
}

/**
 * Given a data string and a public key, encrypt the data string
 * and return a buffer to the Encrypted record.
 *
 * @param publicKey String public key to encrypt with
 * @param dataStr String to encrypt
 * @return Buffer of Encrypted record
 */
const encryptString = async (publicKey, dataStr) => {
  const encrypted = await EthCrypto.encryptWithPublicKey(
    publicKey,
    dataStr,
  )

  // publish the encrypted creds to ipfs and save the hash
  const encryptedBuf = Buffer.from(JSON.stringify(encrypted), 'utf8')
  console.log(`adding encrypted file to ipfs`)

  return encryptedBuf
}

/**************************************************
 * IPFS helpers
 *************************************************/

const ipfs = IPFS('ipfs.infura.io', '5001', { protocol: 'https' })

/**
 * Retrieve Buffer of content for a given IPFS hash
 *
 * @param hash IPFS content hash
 */
const ipfsGet = (hash) => ipfs.get(hash).then(
  (ipfsRsp) => ipfsRsp[0].content,
)

/**
 * Given an ipfs hash for an EthCrypto Encrypted record, fetch the content and
 * decrypt it using the given private key. Then return the contents as a string.
 * @param hash ipfs hash to Encrypted record
 * @param privateKey String private key
 * @return string of decrypted content
 */
const ipfsGetAndDecrypt = async (hash, privateKey) => {
  const buf = await ipfsGet(hash)
  return decryptBuffer(privateKey, buf)
}

/**
 * Given a public key and a data string, encrypt the string with the public key
 * and add the contents to ipfs.
 * @param dataStr string to encrypt and store
 * @param publicKey String public key
 * @return IPFS hash of content
 */
const ipfsEncryptAndAdd = async (dataStr, publicKey) => {
  const encryptedBuf = await encryptString(publicKey, dataStr)
  return (await ipfs.add(encryptedBuf))[0].path
}

module.exports = {
  decryptBuffer,
  encryptString,
  ipfsEncryptAndAdd,
  ipfsGetAndDecrypt
}