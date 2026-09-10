import { ethers } from 'ethers';
import ABI from './abi.json';

const CONTRACT_ADDRESS = '0xa66febBfAa405DFbD30738677f86d6f06b60D27f';

export async function getContract() {
    if (!window.ethereum) {
        alert('Please install MetaMask!');
        return null;
    }
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
}

export async function getCurrentAddress() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return await signer.getAddress();
}