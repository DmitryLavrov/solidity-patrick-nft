import {DeployFunction} from 'hardhat-deploy/dist/types'
import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {ethers, network} from 'hardhat'
import {developmentChains, networkConfig} from '../hardhat-helper.config'
import {verify} from '../utils/verify'
import fs from 'fs'

const deployDynamicSvgNft: DeployFunction = async ({deployments, getNamedAccounts}: HardhatRuntimeEnvironment) => {
  const {deploy, log} = deployments
  const {deployer} = await getNamedAccounts()
  const chainId = network.config.chainId || 31337
  let ethUsdPriceFeedAddress

  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await ethers.getContract('MockV3Aggregator')
    ethUsdPriceFeedAddress = ethUsdAggregator.address
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed
  }

  const lowSvg = fs.readFileSync('./images/dynamicNft/frown.svg', 'utf8')
  const highSvg = fs.readFileSync('./images/dynamicNft/happy.svg', 'utf8')

  const args: (string | undefined)[] = [ethUsdPriceFeedAddress, lowSvg, highSvg]

  const contractDynamicSvgNft = await deploy('DynamicSvgNft', {
    from: deployer,
    args,
    log: true,
    waitConfirmations: networkConfig[chainId].blockConfirmations || 1
  })
  log('DynamicSvgNft Deployed!')

  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    console.log('Verifying...')
    await verify(contractDynamicSvgNft.address, args)
  }
  log('------------------------------------------------')
}

export default deployDynamicSvgNft
deployDynamicSvgNft.tags = ['all', 'dynamicSvgNft', 'main']
