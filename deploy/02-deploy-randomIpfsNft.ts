import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/dist/types'
import {ethers, network} from 'hardhat'
import {developmentChains, networkConfig} from '../hardhat-helper.config'
import {verify} from '../utils/verify'
import {storeImages, storeTokenUriMetadata} from '../utils/uploadToPinata'

const IMAGES_LOCATION = './images/randomNFT'
const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther('2')

const metadataTemplate = {
  name: '',
  description: '',
  image: '',
  attributes: [
    {
      trait_type: 'Cuteness',
      value: 100,
    },
  ],
}

let tokenUris: (string | undefined)[] = [
  'ipfs://QmesMCtksLXWM1uDBA2L55mVKVV2cenQujZ53VtxPYZggB',
  'ipfs://QmeZmZ1EJHNVdqE6JHA31g1vyFjyusqU95o7erKattPYjR',
  'ipfs://QmXeDv1ymVRPgH4CDUmU5TeffVG9UHi394YR7EqUCaY9gJ'
]

const deployRandomIpfsNft: DeployFunction = async ({deployments, getNamedAccounts}: HardhatRuntimeEnvironment) => {
  const {deploy, log} = deployments
  const {deployer} = await getNamedAccounts()
  const chainId = network.config.chainId || 31337
  let vrfCoordinatorV2Address, subscriptionId

  if (process.env.UPLOAD_TO_PINATA === 'true') {
    tokenUris = await handleTokenUris()
  }

  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorV2Mock = await ethers.getContract('VRFCoordinatorV2Mock')
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
    const txResponse = await vrfCoordinatorV2Mock.createSubscription()
    const txReceipt = await txResponse.wait(1)
    subscriptionId = txReceipt.events[0].args.subId
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)

  } else {
    vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
    subscriptionId = networkConfig[chainId].subscriptionId
  }

  const args: string[] = [
    vrfCoordinatorV2Address,
    subscriptionId,
    networkConfig[chainId].gasLane,
    networkConfig[chainId].callbackGasLimit,
    tokenUris,
    networkConfig[chainId].mintFee
  ]

  const contractRandomIpfsNft = await deploy('RandomIpfsNft', {
    from: deployer,
    args,
    log: true,
    waitConfirmations: networkConfig[chainId].blockConfirmations || 1
  })

  log('RandomIpfsNft Deployed!')

  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    console.log('Verifying...')
    await verify(contractRandomIpfsNft.address, args)
  }
  log('------------------------------------------------')
}

const handleTokenUris = async (): Promise<(string | undefined)[]> => {
  const tokenUris = []

  const {responses: imageUploadResponses, files} = await storeImages(IMAGES_LOCATION)
  for (const i in imageUploadResponses) {
    const tokenUriMetadata = {...metadataTemplate}
    tokenUriMetadata.name = files[i].replace('.png', '')
    tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`
    tokenUriMetadata.image = `ipfs://${imageUploadResponses[i].IpfsHash}`

    console.log(`Uploading metadata ${tokenUriMetadata.name}...`,)
    const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
    tokenUris.push(`ipfs://${metadataUploadResponse?.IpfsHash}`)
  }

  console.log('Token URIs uploaded. They are: ')
  console.log(tokenUris)

  return tokenUris
}

export default deployRandomIpfsNft
deployRandomIpfsNft.tags = ['all', 'randomIpfsNft', 'main']
