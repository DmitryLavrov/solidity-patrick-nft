import {DeployFunction} from 'hardhat-deploy/dist/types'
import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {BasicNft, DynamicSvgNft, RandomIpfsNft} from '../typechain'
import {ethers, network} from 'hardhat'
import {developmentChains} from '../hardhat-helper.config'

const mintNft: DeployFunction = async ({getNamedAccounts}: HardhatRuntimeEnvironment) => {
  const {deployer} = await getNamedAccounts()

  console.log('\nMinting NFT...')

  // Basic NFT
  const contractBasicNft: BasicNft = await ethers.getContract('BasicNft', deployer)
  const txBasicNft = await contractBasicNft.mintNft()
  await txBasicNft.wait(1)
  console.log('\nBasic NFT index 0 has token URI: ', await contractBasicNft.tokenURI(0))

  //Random IPFS NFT
  const contractRandomIpfsNft: RandomIpfsNft = await ethers.getContract('RandomIpfsNft', deployer)
  const mintFee = await contractRandomIpfsNft.getMintFee()

  await new Promise(async (resolve, reject) => {
    setTimeout(resolve, 300000) // 5 minutes

    contractRandomIpfsNft.once('NftMinted', async () => {
      resolve('')
    })

    const txRandomIpfsNft = await contractRandomIpfsNft.requestNft({value: mintFee.toString()})
    const txRandomIpfsNftReceipt = await txRandomIpfsNft.wait(1)

    if (developmentChains.includes(network.name)) {
      const requestId = txRandomIpfsNftReceipt.events && txRandomIpfsNftReceipt.events[1].args?.requestId
      const contractVRFCoordinatorV2Mock = await ethers.getContract('VRFCoordinatorV2Mock', deployer)
      await contractVRFCoordinatorV2Mock.fulfillRandomWords(requestId, contractRandomIpfsNft.address)
    }
  })
  console.log('\nRandom IPFS NFT index 0 has token URI: ', await contractRandomIpfsNft.tokenURI(0))

  // Dynamic SVG NFT
  const highValue = ethers.utils.parseEther("4000") // 4000 dollar per ether
  const contractDynamicSvgNft: DynamicSvgNft = await ethers.getContract('DynamicSvgNft', deployer)
  const txDynamicSvgNft = await contractDynamicSvgNft.mintNft(highValue.toString())
  await txDynamicSvgNft.wait(1)
  console.log('\nDynamic SVG NFT index 0 has token URI: ', await contractDynamicSvgNft.tokenURI(0))
  console.log('------------------------------------------------')

}

export default mintNft
mintNft.tags = ['all', 'mintNft']
