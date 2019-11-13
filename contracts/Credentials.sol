pragma solidity >=0.5.8 <0.6.0;

import "@openzeppelin/contracts/ownership/Ownable.sol";

/**
 * @title Credentials store for the Identity system..
 * @notice All CredentialTypes are registered here along with each issued credential.
 */
contract Credentials is Ownable {

    /* ------------------------------------------------------
\    *  CredentialType - a registered credential type that
     *  can be issued by a single issuer. NOTE: This could
     *  be changed later to allow a single type to have
     *  multiple issuers.
     * ------------------------------------------------------ */

    struct CredentialType {
        address issuer;
        string name;
    }

    /* ------------------------------------------------------
     *  Credential - a credential issued to a holder. The
     *  signed credential is stored encrypted on ipfs.
     * ------------------------------------------------------ */

    struct Credential {
        bytes32 credentialTypeId;
        address holder;
        string ipfsHash;
    }


    /* ------------------------------------------------------
     *  Events
     * ------------------------------------------------------ */

    event LogCredentialTypeAdded(
        bytes32 indexed id,
        address indexed issuer,
        string indexed name
    );

    event LogCredentialIssued(
        bytes32 indexed id,
        bytes32 indexed credentialTypeId,
        address indexed holder,
        string ipfsHash
    );


    /* ------------------------------------------------------
     *  State variables
     * ------------------------------------------------------ */

    mapping(address => bool) public issuers;

    mapping(bytes32 => CredentialType) public credentialTypes;

    mapping(bytes32 => Credential) credentials;

    mapping(address => bytes32[]) credentialsByHolder;


    /**
     * @dev Throws if called by an account that is not a registered issuer.
     */
    modifier onlyIssuer() {
        require(
            issuers[msg.sender] == true,
            "Only an issuer can call this function"
        );
        _;
    }

    /// @notice Add an issuer to the registered issuers map.
    /// @param _issuer Address of the Issuer
    function addIssuer(address _issuer)
        external
        onlyOwner
    {
        issuers[_issuer] = true;
    }

    /// @notice Add a new CredentialTyoe for a calling issuer.
    /// @param _name Name of the CredentialType
    /// @return credentialTypeId Id for later reference
    function addCredentialType(
        string calldata _name
    )
        external
        onlyIssuer()
        returns(bytes32 credentialTypeId)
    {
        credentialTypeId = keccak256(abi.encodePacked(msg.sender, _name));
        credentialTypes[credentialTypeId] = CredentialType(msg.sender, _name);
        emit LogCredentialTypeAdded(credentialTypeId, msg.sender, _name);
    }

    /// @notice Issue a credential to a holder.
    /// @param _credentialTypeId CredentialType issuing
    /// @param _holder Issuing to this address
    /// @param _ipfsHash IPFS hash of the encrypted credential file
    /// @return credentialTypeId Id for later reference
    function issueCredential(
        bytes32 _credentialTypeId,
        address _holder,
        string calldata _ipfsHash
    )
        external
        onlyIssuer()
        returns(bytes32 id)
    {
        id = keccak256(abi.encodePacked(_credentialTypeId, _holder));
        credentials[id] = Credential(
            _credentialTypeId,
            _holder,
            _ipfsHash
        );
        credentialsByHolder[_holder].push(id);
        emit LogCredentialIssued(
            id,
            _credentialTypeId,
            _holder,
            _ipfsHash
        );
    }

    /// @notice Get credentials record for given id.
    /// @param _id Credential ID
    /// @return Credential record
    function getCredential(
        bytes32 _id
    )
        public
        view
        returns(
            bytes32 credentialTypeId,
            address holder,
            string memory ipfsHash
        )
    {
        Credential storage cred = credentials[_id];
        return (cred.credentialTypeId, cred.holder, cred.ipfsHash);
    }

    /// @notice Get number of credentials for a given holder
    /// @param _holder Holder address to lookup
    /// @return Number of credentials for _holder
    function getCredentialsByHolderCount(
        address _holder
    )
        public
        view
        returns(uint256 credentialsCount)
    {
        return credentialsByHolder[_holder].length;
    }

    /// @notice Get credential record at idx for holder.
    /// @param _holder Holder address
    /// @param _idx Index into credentialsByHolder
    /// @return Credential record
    function getCredentialByHolder(
        address _holder,
        uint256 _idx
    )
        public
        view
        returns(
            bytes32 credentialTypeId,
            address holder,
            string memory ipfsHash
        )
    {
        return getCredential(credentialsByHolder[_holder][_idx]);
    }

}
