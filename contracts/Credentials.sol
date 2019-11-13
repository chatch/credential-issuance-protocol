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
        CredentialType credentialType;
        address issuer;
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


    /* ------------------------------------------------------
     *  State variables
     * ------------------------------------------------------ */

    mapping(address => bool) public issuers;

    mapping(bytes32 => CredentialType) public credentialTypes;

    // mapping(address => Credential[]) public credentials;


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
}
