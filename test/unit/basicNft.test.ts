import {developmentChains} from '../../hardhat-helper.config'
import {deployments, ethers, getNamedAccounts, network} from 'hardhat'
import {BasicNft} from '../../typechain'
import {assert} from 'chai'

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('Basic NFT Unit Tests', () => {
    let contractBasicNft: BasicNft
    let deployer: string


    beforeEach(async () => {
      deployer = (await getNamedAccounts()).deployer
      await deployments.fixture(['basicNft'])
      contractBasicNft = await ethers.getContract('BasicNft', deployer)
    })

    it('allows user to mint NFT', async () => {
      const tx = await contractBasicNft.mintNft()
      await tx.wait(1)

      const tokenUri = await contractBasicNft.tokenURI(0)
      const TOKEN_URI = await contractBasicNft.TOKEN_URI()
      const tokenCounter = await contractBasicNft.getTokenCounter()

      assert.equal(tokenUri, TOKEN_URI)
      assert.equal(tokenCounter.toString(), '1')
    })
  })
