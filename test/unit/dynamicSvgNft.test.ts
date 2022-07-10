import {developmentChains} from '../../hardhat-helper.config'
import {deployments, ethers, getNamedAccounts, network} from 'hardhat'
import {DynamicSvgNft, MockV3Aggregator, RandomIpfsNft, VRFCoordinatorV2Mock} from '../../typechain'
import {assert, expect} from 'chai'

const highSvgImageUri = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgd2lkdGg9IjQwMCIgIGhlaWdodD0iNDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogICAgPGRlZnM+CiAgICAgICAgPHJhZGlhbEdyYWRpZW50IGlkPSJncmFkMSIgY3g9IjUwJSIgY3k9IjUwJSIgcj0iNTAlIiBmeD0iNTAlIiBmeT0iNTAlIj4KICAgICAgICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I0ZGMCIgLz4KICAgICAgICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRkMwIiAvPgogICAgICAgIDwvcmFkaWFsR3JhZGllbnQ+CiAgICA8L2RlZnM+CiAgICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIGZpbGw9InVybCgjZ3JhZDEpIiByPSI3OCIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjMiLz4KICAgIDxnIGNsYXNzPSJleWVzIiBmaWxsPSIjMjIyIj4KICAgICAgICA8Y2lyY2xlIGN4PSI2MiIgY3k9IjgyIiByPSIxMiIvPgogICAgICAgIDxjaXJjbGUgY3g9IjEzOCIgY3k9IjgyIiByPSIxMiIvPgogICAgPC9nPgogICAgPHBhdGggZD0ibTY1IDExNiBjMCA0MCA3MCA0MCA3MCAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMyMjIiIHN0cm9rZS13aWR0aD0iMyIvPgo8L3N2Zz4K'
const lowSvgImageUri = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgd2lkdGg9IjQwMCIgIGhlaWdodD0iNDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogICAgPGRlZnM+CiAgICAgICAgPHJhZGlhbEdyYWRpZW50IGlkPSJncmFkMSIgY3g9IjUwJSIgY3k9IjUwJSIgcj0iNTAlIiBmeD0iNTAlIiBmeT0iNTAlIj4KICAgICAgICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I0ZGMCIgLz4KICAgICAgICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRkMwIiAvPgogICAgICAgIDwvcmFkaWFsR3JhZGllbnQ+CiAgICA8L2RlZnM+CiAgICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIGZpbGw9InVybCgjZ3JhZDEpIiByPSI3OCIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjMiLz4KICAgIDxnIGNsYXNzPSJleWVzIiBmaWxsPSIjMjIyIj4KICAgICAgICA8Y2lyY2xlIGN4PSI3NSIgY3k9IjgyIiByPSIxMiIvPgogICAgICAgIDxjaXJjbGUgY3g9IjEyNSIgY3k9IjgyIiByPSIxMiIvPgogICAgPC9nPgogICAgPHBhdGggZD0ibTY1IDExNiBjMCA0MCA3MCAtNDAgNzAgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjMiLz4KPC9zdmc+Cg=='

const highTokenUri = 'data:application/json;base64,eyJuYW1lIjoiRHluYW1pYyBTVkcgTkZUIiwgImRlc2NyaXB0aW9uIjoiQW4gTkZUIHRoYXQgY2hhbmdlcyBiYXNlZCBvbiB0aGUgQ2hhaW5saW5rIEZlZWQiLCAiYXR0cmlidXRlcyI6IFt7InRyYWl0X3R5cGUiOiAiY29vbG5lc3MiLCAidmFsdWUiOiAxMDB9XSwgImltYWdlIjoiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlCMmFXVjNRbTk0UFNJd0lEQWdNakF3SURJd01DSWdkMmxrZEdnOUlqUXdNQ0lnSUdobGFXZG9kRDBpTkRBd0lpQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaVBnb2dJQ0FnUEdSbFpuTStDaUFnSUNBZ0lDQWdQSEpoWkdsaGJFZHlZV1JwWlc1MElHbGtQU0puY21Ga01TSWdZM2c5SWpVd0pTSWdZM2s5SWpVd0pTSWdjajBpTlRBbElpQm1lRDBpTlRBbElpQm1lVDBpTlRBbElqNEtJQ0FnSUNBZ0lDQWdJQ0FnUEhOMGIzQWdiMlptYzJWMFBTSXdKU0lnYzNSNWJHVTlJbk4wYjNBdFkyOXNiM0k2STBaR01DSWdMejRLSUNBZ0lDQWdJQ0FnSUNBZ1BITjBiM0FnYjJabWMyVjBQU0l4TURBbElpQnpkSGxzWlQwaWMzUnZjQzFqYjJ4dmNqb2pSa013SWlBdlBnb2dJQ0FnSUNBZ0lEd3ZjbUZrYVdGc1IzSmhaR2xsYm5RK0NpQWdJQ0E4TDJSbFpuTStDaUFnSUNBOFkybHlZMnhsSUdONFBTSXhNREFpSUdONVBTSXhNREFpSUdacGJHdzlJblZ5YkNnalozSmhaREVwSWlCeVBTSTNPQ0lnYzNSeWIydGxQU0lqTWpJeUlpQnpkSEp2YTJVdGQybGtkR2c5SWpNaUx6NEtJQ0FnSUR4bklHTnNZWE56UFNKbGVXVnpJaUJtYVd4c1BTSWpNakl5SWo0S0lDQWdJQ0FnSUNBOFkybHlZMnhsSUdONFBTSTJNaUlnWTNrOUlqZ3lJaUJ5UFNJeE1pSXZQZ29nSUNBZ0lDQWdJRHhqYVhKamJHVWdZM2c5SWpFek9DSWdZM2s5SWpneUlpQnlQU0l4TWlJdlBnb2dJQ0FnUEM5blBnb2dJQ0FnUEhCaGRHZ2daRDBpYlRZMUlERXhOaUJqTUNBME1DQTNNQ0EwTUNBM01DQXdJaUJtYVd4c1BTSnViMjVsSWlCemRISnZhMlU5SWlNeU1qSWlJSE4wY205clpTMTNhV1IwYUQwaU15SXZQZ284TDNOMlp6NEsifQ=='
const lowTokenUri = 'data:application/json;base64,eyJuYW1lIjoiRHluYW1pYyBTVkcgTkZUIiwgImRlc2NyaXB0aW9uIjoiQW4gTkZUIHRoYXQgY2hhbmdlcyBiYXNlZCBvbiB0aGUgQ2hhaW5saW5rIEZlZWQiLCAiYXR0cmlidXRlcyI6IFt7InRyYWl0X3R5cGUiOiAiY29vbG5lc3MiLCAidmFsdWUiOiAxMDB9XSwgImltYWdlIjoiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlCMmFXVjNRbTk0UFNJd0lEQWdNakF3SURJd01DSWdkMmxrZEdnOUlqUXdNQ0lnSUdobGFXZG9kRDBpTkRBd0lpQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaVBnb2dJQ0FnUEdSbFpuTStDaUFnSUNBZ0lDQWdQSEpoWkdsaGJFZHlZV1JwWlc1MElHbGtQU0puY21Ga01TSWdZM2c5SWpVd0pTSWdZM2s5SWpVd0pTSWdjajBpTlRBbElpQm1lRDBpTlRBbElpQm1lVDBpTlRBbElqNEtJQ0FnSUNBZ0lDQWdJQ0FnUEhOMGIzQWdiMlptYzJWMFBTSXdKU0lnYzNSNWJHVTlJbk4wYjNBdFkyOXNiM0k2STBaR01DSWdMejRLSUNBZ0lDQWdJQ0FnSUNBZ1BITjBiM0FnYjJabWMyVjBQU0l4TURBbElpQnpkSGxzWlQwaWMzUnZjQzFqYjJ4dmNqb2pSa013SWlBdlBnb2dJQ0FnSUNBZ0lEd3ZjbUZrYVdGc1IzSmhaR2xsYm5RK0NpQWdJQ0E4TDJSbFpuTStDaUFnSUNBOFkybHlZMnhsSUdONFBTSXhNREFpSUdONVBTSXhNREFpSUdacGJHdzlJblZ5YkNnalozSmhaREVwSWlCeVBTSTNPQ0lnYzNSeWIydGxQU0lqTWpJeUlpQnpkSEp2YTJVdGQybGtkR2c5SWpNaUx6NEtJQ0FnSUR4bklHTnNZWE56UFNKbGVXVnpJaUJtYVd4c1BTSWpNakl5SWo0S0lDQWdJQ0FnSUNBOFkybHlZMnhsSUdONFBTSTNOU0lnWTNrOUlqZ3lJaUJ5UFNJeE1pSXZQZ29nSUNBZ0lDQWdJRHhqYVhKamJHVWdZM2c5SWpFeU5TSWdZM2s5SWpneUlpQnlQU0l4TWlJdlBnb2dJQ0FnUEM5blBnb2dJQ0FnUEhCaGRHZ2daRDBpYlRZMUlERXhOaUJqTUNBME1DQTNNQ0F0TkRBZ056QWdNQ0lnWm1sc2JEMGlibTl1WlNJZ2MzUnliMnRsUFNJak1qSXlJaUJ6ZEhKdmEyVXRkMmxrZEdnOUlqTWlMejRLUEM5emRtYytDZz09In0='


!developmentChains.includes(network.name)
  ? describe.skip
  : describe('Dynamic SVG NFT Unit Tests', () => {
    let contractDynamicSvgNft: DynamicSvgNft
    let contractMockV3Aggregator: MockV3Aggregator
    let deployer: string

    beforeEach(async () => {
      deployer = (await getNamedAccounts()).deployer
      await deployments.fixture(['dynamicSvgNft', 'mocks'])
      contractDynamicSvgNft = await ethers.getContract('DynamicSvgNft', deployer)
      contractMockV3Aggregator = await ethers.getContract('MockV3Aggregator', deployer)
    })

    describe('constructor', () => {
      it('initialize the DynamicSvgNft correctly', async () => {
        const lowSvg = await contractDynamicSvgNft.getLowSVG()
        const highSvg = await contractDynamicSvgNft.getHighSVG()
        const priceFeed = await contractDynamicSvgNft.getPriceFeed()
        //--------------------------
        // console.log('lowSvg',lowSvg)
        // console.log('highSvg',highSvg)
        //--------------------------
        assert.equal(lowSvg, lowSvgImageUri)
        assert.equal(highSvg, highSvgImageUri)
        assert.equal(priceFeed, contractMockV3Aggregator.address)
      })
    })

    describe('mintNft', () => {
      it('emits an event and creates the NFT', async () => {
        const highValue = ethers.utils.parseEther("1") // 1 dollar per ether
        await expect(contractDynamicSvgNft.mintNft(highValue)).to.emit(
          contractDynamicSvgNft,
          "CreatedNFT"
        )
        const tokenCounter = await contractDynamicSvgNft.getTokenCounter()
        assert.equal(tokenCounter.toString(), "1")
        const tokenURI = await contractDynamicSvgNft.tokenURI(0)
        //--------------------------
        // console.log('tokenURI',tokenURI)
        //--------------------------
        assert.equal(tokenURI, highTokenUri)
      })

      it('shifts the token uri to lower when the price doesn\'t surpass the highvalue', async () => {
        const highValue = ethers.utils.parseEther("100000") // 100000 dollar per ether
        await expect(contractDynamicSvgNft.mintNft(highValue)).to.emit(
          contractDynamicSvgNft,
          "CreatedNFT"
        )
        const tokenCounter = await contractDynamicSvgNft.getTokenCounter()
        assert.equal(tokenCounter.toString(), "1")
        const tokenURI = await contractDynamicSvgNft.tokenURI(0)
        //--------------------------
        // console.log('tokenURI',tokenURI)
        //--------------------------
        assert.equal(tokenURI, lowTokenUri)
      })
    })

  })
