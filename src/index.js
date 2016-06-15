/* eslint-disable no-unused-vars */
import merkletree, { verifyProof } from 'merkletree'
import { createHash } from 'crypto'
import axios from 'axios'

const blockaiVerify = (_proof) => {
  const proof = _proof.proof ? _proof.proof : _proof
  const {
    header: {
      hash_type,
      merkle_root,
      tx_id,
      timestamp,
    },
    target: {
      target_hash,
      target_proof,
    },
    extras,
  } = proof

  const dataUrl = extras.dataUrl
  const hashAlgorithm = (hash_type || 'sha256').replace('-', '')

  // For backward compatibility datahash uses sha1 before sha-256
  const sha1 = (input) => createHash('sha1').update(input).digest('hex')
  const computeHash = (input) => createHash(hashAlgorithm).update(input).digest('hex')

  // Sync method to check if target hash is valid with respect to
  // extras.leaves
  const isTargetHashValid = () => {
    const leaves = extras.leaves.map((maybeLeaf) => {
      const leaf = typeof maybeLeaf === 'string'
        ? maybeLeaf
        : computeHash(maybeLeaf.data)
      return leaf
    })
    const tree = merkletree(leaves)
    const root = tree.root()
    return root === target_hash
  }

  // Sync method to check if merkle root is valid with respect
  // to target_proof
  const isMerkleRootValid = () => verifyProof(target_hash, merkle_root, target_proof)

  // Async method to verify if downloading dataUrl produces
  // expected hash
  const isDataHashValid = () => Promise.resolve()
    .then(() => axios({
      method: 'GET',
      url: dataUrl,
      responseType: 'arraybuffer',
    }))
    .then((response) => {
      // console.log(response)
      const { data } = response
      // first leaf is data hash by convention...
      const expectedDataHash = computeHash(extras.leaves[0].data)
      // Due to backward compatibility we need to do a double hash
      const hash = computeHash(sha1(data))
      return hash === expectedDataHash
    })

  // Async method that checks how many confirmations transaction
  // holding merkle root has
  const getConfirmations = () => {

  }

  // Combines method above to give detailed report about proof
  const analyze = () => {

  }

  return {
    isTargetHashValid,
    isMerkleRootValid,
    isDataHashValid,
    getConfirmations,
    analyze,
  }
}

export default blockaiVerify
