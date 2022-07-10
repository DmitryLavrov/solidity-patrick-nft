//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

//import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

    error RandomIpfsNft__RndOutOfBounds();
    error RandomIpfsNft__NeedMoreEthSend();
    error RandomIpfsNft__TransferFailed();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {

    // Chainlink VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinatorV2;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // VRF Helpers
    mapping(uint => address) public s_requestIdToSender;

    // NFT Variables
    uint public s_tokenCounter;
    uint public constant MAX_CHANCE_VALUE = 100;
    enum Breed {
        PUG,
        SHIBA_INU,
        ST_BERNARD
    }
    string[] s_dogTokenUris;
    uint immutable i_mintFee;

    //Events
    event NftRequested(uint indexed requestId, address requester);
    event NftMinted(Breed dogBreed, address minter);

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane,    // gasHash
        uint32 callbackGasLimit,
        string[3] memory dogTokenUris,
        uint mintFee
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random IPFS NFT", "RIN") {
        i_vrfCoordinatorV2 = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        s_dogTokenUris = dogTokenUris;
        i_mintFee = mintFee;
    }

    function requestNft() public payable returns (uint requestId) {
        if (msg.value < i_mintFee) {
            revert RandomIpfsNft__NeedMoreEthSend();
        }
        requestId = i_vrfCoordinatorV2.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_requestIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
        return requestId;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) override internal {
        address dogOwner = s_requestIdToSender[requestId];
        uint newTokenId = s_tokenCounter;
        s_tokenCounter += 1;

        uint moddedRnd = randomWords[0] % MAX_CHANCE_VALUE;
        Breed dogBreed = getBreedFromModdedRnd(moddedRnd);
        _safeMint(dogOwner, newTokenId);
        _setTokenURI(newTokenId, s_dogTokenUris[uint(dogBreed)]);
        emit NftMinted(dogBreed, dogOwner);
    }

    function withdraw() public onlyOwner {
        uint amount = address(this).balance;
        (bool success,) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert RandomIpfsNft__TransferFailed();
        }
    }

    function getBreedFromModdedRnd(uint moddedRnd) public pure returns (Breed) {
        uint minValue = 0;
        uint[3] memory chanceArray = getChanceArray();
        for (uint i = 0; i < chanceArray.length; i++) {
            if (moddedRnd >= minValue && moddedRnd <= chanceArray[i]) {
                return Breed(i);
            }
            minValue = chanceArray[i];
        }
        revert RandomIpfsNft__RndOutOfBounds();
    }

    function getChanceArray() public pure returns (uint[3] memory) {
        return [10, 30, MAX_CHANCE_VALUE];
    }

    function getTokenCounter() public view returns (uint) {
        return s_tokenCounter;
    }

    function getDogTokenUris(uint index) public view returns (string memory) {
        return s_dogTokenUris[index];
    }

    function getMintFee() public view returns (uint) {
        return i_mintFee;
    }
}
