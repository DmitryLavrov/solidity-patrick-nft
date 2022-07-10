import {DeployFunction} from 'hardhat-deploy/types'
import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {developmentChains, networkConfig} from '../hardhat-helper.config'
import {network} from 'hardhat'
import {ethers} from 'ethers'

const BASE_FEE = ethers.utils.parseEther('0.25') // Premium 0.25 LINK for Rinkeby // https://docs.chain.link/docs/vrf-contracts/#rinkeby-testnet
const GAS_PRICE_LINK = 1e9 // Calculated (Depends on GAS price)
const DECIMALS = 18
const INITIAL_PRICE = ethers.utils.parseUnits('2000', 'ether')

const deployMocks: DeployFunction = async function ({getNamedAccounts, deployments}: HardhatRuntimeEnvironment) {
  const {deploy, get, log} = deployments
  const {deployer} = await getNamedAccounts()

  log('')

  if (developmentChains.includes(network.name)) {
    log('Local network detected! Deploying mocks...')

    await deploy('VRFCoordinatorV2Mock', {
      contract: 'VRFCoordinatorV2Mock',
      from: deployer,
      log: true,
      args: [BASE_FEE, GAS_PRICE_LINK]
    })

    await deploy('MockV3Aggregator', {
      contract: 'MockV3Aggregator',
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_PRICE]
    })

    log('Mocks Deployed!')
    log('------------------------------------------------')
  }
}

export default deployMocks
deployMocks.tags = ["all", "mocks"]
