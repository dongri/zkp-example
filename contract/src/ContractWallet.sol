//SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

interface PlonkVerifierInterface {
    function verifyProof(uint256[24] calldata _proof, uint256[2] calldata _pubSignals) external view returns (bool);
}

contract ContractWallet {
    PlonkVerifierInterface verifierContract;

    constructor(address verifierContractAddress) {
        verifierContract = PlonkVerifierInterface(verifierContractAddress);
    }

    mapping(address => uint256) public balance;
    mapping(address => uint) public registered_passwd_hash;
    bytes32[] private used_proof;

    function registerPasswdHash(uint passwd_hash) public {
        registered_passwd_hash[msg.sender] = passwd_hash;
    }

    function deposit() public payable {
        require(msg.value > 0, "Deposit amount must be greater than zero");
        balance[msg.sender] += msg.value;
    }

    function getTotalBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function transfer(
        address payable send_to,
        uint256 amount,
        uint256[24] calldata _proof,
        uint256[2] calldata _pubSignals
    ) public {
        bytes32 hash_of_proof = keccak256(abi.encodePacked(_proof));
        for (uint256 i = 0; i < used_proof.length; i++) {
            if (used_proof[i] == hash_of_proof) {
                revert("This proof is already used.");
            }
        }

        address from = address(uint160(_pubSignals[1]));
        require(msg.sender == from, "You are not prover.");

        uint password_hash = uint(_pubSignals[0]);
        require(registered_passwd_hash[from] == password_hash, "Invalid password.");

        bool validProof = verifierContract.verifyProof(_proof, _pubSignals);
        require(validProof, "Invalid proof.");

        require(balance[msg.sender] >= amount, "Not enough money");

        balance[msg.sender] -= amount;
        send_to.transfer(amount);

        used_proof.push(keccak256(abi.encodePacked(_proof)));
    }
}
