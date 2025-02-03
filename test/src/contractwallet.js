const { ethers } = require('ethers');
const fs = require('fs');
const snarkjs = require('snarkjs');

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

const provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
const wallet = new ethers.Wallet(config.account.privateKey, provider);

const contractAddress = config.contract.address;
const abi = [
    "function transfer(address payable send_to, uint amount, uint256[24] calldata _proof, uint256[2] calldata _pubSignals) public",
    "function deposit() public payable",
    "function getTotalBalance() public view returns (uint256)",
    "function registerPasswdHash(uint passwd_hash) public"
];

const contract = new ethers.Contract(contractAddress, abi, wallet);

async function getTotalBalance() {
    try {
        const result = await contract.getTotalBalance();

        console.log(`getTotalBalance() result: ${result.toString()}`);

    } catch (error) {
        console.error('Transaction failed:', error);
    }
}

async function executeTransfer(sendTo, amountInEth, proof, pubSignals) {
    try {
        const amountInWei = ethers.parseEther(amountInEth);
        const gasLimit = 1000000;
        const maxFeePerGas = ethers.parseUnits('2', 'gwei');
        const maxPriorityFeePerGas = ethers.parseUnits('1', 'gwei');

        const tx = await contract.transfer(sendTo, amountInWei, proof, pubSignals, {
            gasLimit: gasLimit,
            maxFeePerGas: maxFeePerGas,
            maxPriorityFeePerGas: maxPriorityFeePerGas
        });
        console.log(`Transfer transaction sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`Transfer confirmed in block: ${receipt.blockNumber}`);
    } catch (error) {
        console.error('Transfer failed:', error);
    }
}

async function registerPasswdHash(passwordHash) {
    try {
        const gasLimit = 1000000;
        const maxFeePerGas = ethers.parseUnits('2', 'gwei');
        const maxPriorityFeePerGas = ethers.parseUnits('1', 'gwei');

        const tx = await contract.registerPasswdHash(passwordHash);
        console.log(`RegisterPasswdHash transaction sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`RegisterPasswdHash confirmed in block: ${receipt.blockNumber}`);
    } catch (error) {
        console.error('RegisterPasswdHash failed:', error);
    }
}

async function executeTransferByFile(sendTo, amountInEth, proofFilePath, pubSignalsFilePath) {
    try {
        const proofJSON = fs.readFileSync(proofFilePath, 'utf8');
        const publicSignalsJSON = fs.readFileSync(pubSignalsFilePath, 'utf8');

        const proof = JSON.parse(proofJSON);
        const publicSignals = JSON.parse(publicSignalsJSON);

        const rawCalldata = await snarkjs.plonk.exportSolidityCallData(proof, publicSignals);
        const s = rawCalldata.split("][");

        const ss_proof = s[0].replace("[", "")
            .replace("]", "")
            .replace("\\", "")
            .replace(/0x/g, "")
            .replace(/"/g, "")
            .replace(" ", "")
            .split(",");

        const ss_pub = s[1].replace("[", "")
            .replace("]", "")
            .replace("\\", "")
            .replace(/0x/g, "")
            .replace(/"/g, "")
            .replace(" ", "")
            .split(",");

        const proofForContract = [];
        for (let i = 0; i < ss_proof.length; i++) {
            const s = ss_proof[i];
            proofForContract.push(BigInt("0x" + s));
        }

        const publicSignalsForContract = [];
        for (let i = 0; i < ss_pub.length; i++) {
            const s = ss_pub[i];
            console.log("s: " + s);
            publicSignalsForContract.push(BigInt("0x" + s));
        }

        console.log("proofForContract: " + proofForContract.length + " " + proofForContract)
        console.log("publicSignalsForContract: " + publicSignalsForContract.length + " " + publicSignalsForContract)

        await executeTransfer(sendTo, amountInEth, proofForContract, publicSignalsForContract);
    } catch (error) {
        console.error('Failed to load proof or public signals:', error);
        throw error;
    }
}

async function getBalance(address) {
    try {
        const balance =await provider.getBalance(address);
        console.log(`Balance of ${address}: ${ethers.formatEther(balance)} ETH`);
    } catch (error) {
        console.error('Failed to get balance:', error);
    } 
}

async function depositEther(amountInEth) {
    try {
        const amountInWei = ethers.parseEther(amountInEth);

        const tx = await contract.deposit({
            value: amountInWei,
            gasLimit: 100000
        });

        console.log(`Deposit transaction sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`Deposit confirmed in block: ${receipt.blockNumber}`);
    } catch (error) {
        console.error('Deposit failed:', error);
    }
}

alice = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
bob = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

async function main() {
  await getBalance(alice); // anvil account first
  await getBalance(bob); // anvil account second
  
  await depositEther("100");
  await getTotalBalance();
  
  await registerPasswdHash("9627991198915864505483325328123466813840867255700822858612450669559302123886");
  await executeTransferByFile(bob, "10", "../circom/output/auth/proof.json", "../circom/output/auth/public.json");
  
  await getTotalBalance();

  process.exit(0);
}

main();
