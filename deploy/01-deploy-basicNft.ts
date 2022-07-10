import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/dist/types'
import {network} from 'hardhat'
import {developmentChains, networkConfig} from '../hardhat-helper.config'
import {verify} from '../utils/verify'

const deployBasicNft: DeployFunction = async ({deployments, getNamedAccounts}: HardhatRuntimeEnvironment) => {
  const {deploy, log} = deployments
  const {deployer} = await getNamedAccounts()
  const chainId = network.config.chainId || 31337

  const args: string[] = []

  const contractBasicNft = await deploy('BasicNft', {
    from: deployer,
    args,
    log: true,
    waitConfirmations: networkConfig[chainId].blockConfirmations || 1
  })
  log('BasicNft Deployed!')

  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    console.log('Verifying...')
    await verify(contractBasicNft.address, args)
  }
  log('------------------------------------------------')
}

export default deployBasicNft
deployBasicNft.tags = ['all', 'basicNft', 'main']
