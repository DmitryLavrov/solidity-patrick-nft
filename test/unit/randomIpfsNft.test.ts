import {developmentChains} from '../../hardhat-helper.config'
import {deployments, ethers, getNamedAccounts, network} from 'hardhat'
import {RandomIpfsNft, VRFCoordinatorV2Mock} from '../../typechain'
import {assert, expect} from 'chai'

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('Random IPFS NFT Unit Tests', () => {
    let contractRandomIpfsNft: RandomIpfsNft
    let contractVRFCoordinatorV2Mock: VRFCoordinatorV2Mock
    let deployer: string

    beforeEach(async () => {
      deployer = (await getNamedAccounts()).deployer
      await deployments.fixture(['randomIpfsNft', 'mocks'])
      contractRandomIpfsNft = await ethers.getContract('RandomIpfsNft', deployer)
      contractVRFCoordinatorV2Mock = await ethers.getContract('VRFCoordinatorV2Mock', deployer)
    })

    describe('constructor', () => {
      it('initialize the RandomIpfsNft correctly', async () => {
        const dogTokenUriZero = await contractRandomIpfsNft.getDogTokenUris(0)
        assert(dogTokenUriZero.includes('ipfs://'))
      })
    })

    describe('requestNft', () => {
      it('fails if payment isn\'t sent with the request', async () => {
        await expect(contractRandomIpfsNft.requestNft()).to.be.revertedWith('RandomIpfsNft__NeedMoreEthSend')
      })
      it('emits an event and kicks off a random word request', async () => {
        const mintFee = await contractRandomIpfsNft.getMintFee()
        await expect(contractRandomIpfsNft.requestNft({value: mintFee.toString()}))
          .to.emit(contractRandomIpfsNft, 'NftRequested')
      })
    })

    describe('fulfillRandomWords', () => {
      it('mints NFT after random number returned', async function () {
        await new Promise(async (resolve, reject) => {
          contractRandomIpfsNft.once('NftMinted', async () => {
            try {
              const tokenUri = await contractRandomIpfsNft.getDogTokenUris('0')
              const tokenCounter = await contractRandomIpfsNft.getTokenCounter()
              assert.equal(tokenUri.toString().includes('ipfs://'), true)
              assert.equal(tokenCounter.toString(), '1')
              resolve('')
            } catch (e) {
              console.log(e)
              reject(e)
            }
          })

          try {
            const mintFee = await contractRandomIpfsNft.getMintFee()
            const tx = await contractRandomIpfsNft.requestNft({
              value: mintFee.toString(),
            })
            const txReceipt = await tx.wait(1)
            const requestId = txReceipt.events && txReceipt.events[1].args?.requestId
            await contractVRFCoordinatorV2Mock.fulfillRandomWords(requestId, contractRandomIpfsNft.address)
          } catch (e) {
            console.log(e)
            reject(e)
          }
        })
      })
    })
  })
