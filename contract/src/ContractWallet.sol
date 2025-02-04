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
    bytes32[] private used_proof;

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

        bool validProof = verifierContract.verifyProof(_proof, _pubSignals);
        require(validProof, "Invalid proof.");

        require(balance[msg.sender] >= amount, "Not enough money");

        balance[msg.sender] -= amount;
        send_to.transfer(amount);

        used_proof.push(keccak256(abi.encodePacked(_proof)));
    }
}
