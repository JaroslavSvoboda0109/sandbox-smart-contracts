import {setupPolygonAsset} from './fixtures';
import {waitFor, getAssetChainIndex, expectEventWithArgs} from '../../utils';
import {expect} from '../../chai-setup';
import {sendMetaTx} from '../../sendMetaTx';
import {ethers} from 'hardhat';
import {constants} from 'ethers';

const zeroAddress = constants.AddressZero;

// PolygonAssetERC1155 tests for 'Asset'

// Notes on collections:
// The ERC1155 `collectionIndex` increments by 1 for each tokenId within that pack (using mintMultiple)
// The ERC1155 `collectionIndexOf` are all the same as each other within that packID (using mintMultiple)
// The ERC721 `collectionIndexOf` is 1 more than the ERC1155 index that it was extracted from
// The ERC721 `collectionIndexOf` increments by 1 for each new extraction from that ERC1155's supply

describe('PolygonAssetERC1155.sol', function () {
  describe('PolygonAsset: general', function () {
    it('user sending asset to itself keep the same balance', async function () {
      const {PolygonAssetERC1155, users, mintAsset} = await setupPolygonAsset();
      const tokenId = await mintAsset(users[0].address, 10);
      await waitFor(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(users[0].address)
        ).safeTransferFrom(
          users[0].address,
          users[0].address,
          tokenId,
          10,
          '0x'
        )
      );
      const balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        users[0].address,
        tokenId
      );
      expect(balance).to.be.equal(10);
    });

    it('user batch sending asset to itself keep the same balance', async function () {
      const {PolygonAssetERC1155, users, mintAsset} = await setupPolygonAsset();
      const tokenId = await mintAsset(users[0].address, 20);
      await waitFor(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(users[0].address)
        ).safeBatchTransferFrom(
          users[0].address,
          users[0].address,
          [tokenId],
          [10],
          '0x'
        )
      );
      const balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        users[0].address,
        tokenId
      );
      expect(balance).to.be.equal(20);
    });

    it('user batch sending in series whose total is more than its balance', async function () {
      const {PolygonAssetERC1155, users, mintAsset} = await setupPolygonAsset();
      const tokenId = await mintAsset(users[0].address, 20);
      await waitFor(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(users[0].address)
        ).safeBatchTransferFrom(
          users[0].address,
          users[0].address,
          [tokenId, tokenId, tokenId],
          [10, 20, 20],
          '0x'
        )
      );
      const balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        users[0].address,
        tokenId
      );
      expect(balance).to.be.equal(20);
    });

    it('user batch sending more asset than it owns should fails', async function () {
      const {users, mintAsset, PolygonAssetERC1155} = await setupPolygonAsset();
      const tokenId = await mintAsset(users[0].address, 20);
      await expect(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(users[0].address)
        ).safeBatchTransferFrom(
          users[0].address,
          users[0].address,
          [tokenId],
          [30],
          '0x'
        )
      ).to.be.revertedWith(`BALANCE_TOO_LOW`);
    });

    it('can get the chainIndex from the tokenId', async function () {
      const {users, mintAsset} = await setupPolygonAsset();
      const tokenId = await mintAsset(users[1].address, 11);
      const chainIndex = getAssetChainIndex(tokenId);
      expect(chainIndex).to.be.equal(1);
    });

    it('can get the URI for an asset with amount 1', async function () {
      const {PolygonAssetERC1155, users, mintAsset} = await setupPolygonAsset();
      const tokenId = await mintAsset(users[1].address, 1);
      const URI = await PolygonAssetERC1155.callStatic.tokenURI(tokenId);
      expect(URI).to.be.equal(
        'ipfs://bafybeidyxh2cyiwdzczgbn4bk6g2gfi6qiamoqogw5bxxl5p6wu57g2ahy/0.json'
      );
    });

    it('can get the URI for a FT', async function () {
      const {PolygonAssetERC1155, users, mintAsset} = await setupPolygonAsset();
      const tokenId = await mintAsset(users[1].address, 11);
      const URI = await PolygonAssetERC1155.callStatic.tokenURI(tokenId);
      expect(URI).to.be.equal(
        'ipfs://bafybeidyxh2cyiwdzczgbn4bk6g2gfi6qiamoqogw5bxxl5p6wu57g2ahy/0.json'
      );
    });

    it('fails get the URI for an invalid tokeId', async function () {
      const {PolygonAssetERC1155} = await setupPolygonAsset();
      const tokenId = 42;
      await expect(
        PolygonAssetERC1155.callStatic.tokenURI(tokenId)
      ).to.be.revertedWith('NFT_!EXIST_||_FT_!MINTED');
    });

    it('can burn ERC1155 asset', async function () {
      const {PolygonAssetERC1155, users, mintAsset} = await setupPolygonAsset();
      const tokenId = await mintAsset(users[0].address, 20);
      await waitFor(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(users[0].address)
        ).burnFrom(users[0].address, tokenId, 10)
      );
      const balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        users[0].address,
        tokenId
      );
      expect(balance).to.be.equal(10);
    });

    it('can mint and burn asset of amount 1', async function () {
      const {PolygonAssetERC1155, users, mintAsset} = await setupPolygonAsset();
      const tokenId = await mintAsset(users[0].address, 1);
      let balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        users[0].address,
        tokenId
      );
      expect(balance).to.be.equal(1);
      await waitFor(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(users[0].address)
        ).burnFrom(users[0].address, tokenId, 1)
      );
      balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        users[0].address,
        tokenId
      );
      expect(balance).to.be.equal(0);
    });
    it('can mint repeatedly', async function () {
      const {PolygonAssetERC1155, users, mintAsset} = await setupPolygonAsset();
      const tokenId = await mintAsset(users[0].address, 10);
      const balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        users[0].address,
        tokenId
      );
      expect(balance).to.be.equal(10);
      const newTokenId = await mintAsset(users[0].address, 10);
      const secondBalance = await PolygonAssetERC1155[
        'balanceOf(address,uint256)'
      ](users[0].address, newTokenId);
      expect(secondBalance).to.be.equal(10);
    });
  });

  describe('PolygonAsset: MetaTransactions', function () {
    it('can transfer by metaTx', async function () {
      const {
        PolygonAssetERC1155,
        users,
        mintAsset,
        trustedForwarder,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(users[1].address, 11);

      const {to, data} = await PolygonAssetERC1155.populateTransaction[
        'safeTransferFrom(address,address,uint256,uint256,bytes)'
      ](users[1].address, users[2].address, tokenId, 10, '0x');

      await sendMetaTx(to, trustedForwarder, data, users[1].address);

      const balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        users[2].address,
        tokenId
      );
      expect(balance).to.be.equal(10);
    });

    it('fails to transfer someone else token by metaTx', async function () {
      const {
        PolygonAssetERC1155,
        users,
        mintAsset,
        trustedForwarder,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(users[1].address, 11);

      const {to, data} = await PolygonAssetERC1155.populateTransaction[
        'safeTransferFrom(address,address,uint256,uint256,bytes)'
      ](users[1].address, users[2].address, tokenId, 10, '0x');

      await sendMetaTx(to, trustedForwarder, data, users[2].address);

      const balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        users[2].address,
        tokenId
      );
      expect(balance).to.be.equal(0);
    });

    it('can batch-transfer by metaTx', async function () {
      const {
        PolygonAssetERC1155,
        users,
        mintAsset,
        trustedForwarder,
      } = await setupPolygonAsset();
      const tokenId1 = await mintAsset(users[1].address, 7);
      const tokenId2 = await mintAsset(users[1].address, 3);
      const tokenIds = [tokenId1, tokenId2];
      const values = [7, 3];

      const {to, data} = await PolygonAssetERC1155.populateTransaction[
        'safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)'
      ](users[1].address, users[2].address, tokenIds, values, '0x');

      await sendMetaTx(to, trustedForwarder, data, users[1].address);

      const balance1 = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        users[2].address,
        tokenId1
      );
      const balance2 = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        users[2].address,
        tokenId2
      );
      expect(balance1).to.be.equal(7);
      expect(balance2).to.be.equal(3);
    });
  });

  describe('PolygonAsset: extractERC721From and collection information', function () {
    it('cannot extract ERC721 for ERC1155 supply == 1', async function () {
      const {
        PolygonAssetERC1155,
        mintAsset,
        extractor,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 1);
      const balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        extractor,
        tokenId
      );
      expect(balance).to.be.equal(1);

      await expect(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(extractor)
        ).extractERC721From(extractor, tokenId, extractor)
      ).to.be.revertedWith('UNIQUE_ERC1155');
    });
    it('can extract ERC721 if ERC1155 supply > 1', async function () {
      const {
        PolygonAssetERC1155,
        PolygonAssetERC721,
        extractor,
        mintAsset,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 100);
      let balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        extractor,
        tokenId
      );
      expect(balance).to.be.equal(100);
      const result = await waitFor(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(extractor)
        ).extractERC721From(extractor, tokenId, extractor)
      );
      const event = await expectEventWithArgs(
        PolygonAssetERC1155,
        result,
        'Extraction'
      );

      balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        extractor,
        tokenId
      );
      const owner = await PolygonAssetERC721.ownerOf(event.args[1]);
      expect(owner).to.be.equal(extractor);

      expect(balance).to.be.equal(99);
      const nftBal = await PolygonAssetERC721.balanceOf(extractor);
      expect(nftBal).to.be.equal(1);
    });
    it('can extract to own address if sender == _msgSender() and supply > 1', async function () {
      // require(sender == _msgSender() || isApprovedForAll(sender, _msgSender()), "!AUTHORIZED");
      const {
        PolygonAssetERC1155,
        extractor,
        mintAsset,
        PolygonAssetERC721,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 10);
      let balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        extractor,
        tokenId
      );
      expect(balance).to.be.equal(10);
      await waitFor(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(extractor)
        ).extractERC721From(extractor, tokenId, extractor)
      );
      balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        extractor,
        tokenId
      );
      expect(balance).to.be.equal(9);
      const nftBal = await PolygonAssetERC721.balanceOf(extractor);
      expect(nftBal).to.be.equal(1);
    });
    it('can extract to other address if sender == _msgSender() and supply > 1', async function () {
      // require(sender == _msgSender() || isApprovedForAll(sender, _msgSender()), "!AUTHORIZED");
      const {
        PolygonAssetERC1155,
        users,
        extractor,
        mintAsset,
        PolygonAssetERC721,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 10);
      let balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        extractor,
        tokenId
      );
      expect(balance).to.be.equal(10);
      await waitFor(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(extractor)
        ).extractERC721From(extractor, tokenId, users[3].address)
      );
      balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        extractor,
        tokenId
      );
      expect(balance).to.be.equal(9);
      const nftBal = await PolygonAssetERC721.balanceOf(users[3].address);
      expect(nftBal).to.be.equal(1);
    });
    it('cannot extract to destination address if sender == _msgSender() but sender is not owner of ERC1155', async function () {
      const {
        PolygonAssetERC1155,
        extractor,
        users,
        mintAsset,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(users[1].address, 10);
      await expect(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(extractor)
        ).extractERC721From(extractor, tokenId, users[1].address)
      ).to.be.revertedWith("can't substract more than there is");
    });
    it('cannot extract to destination address if isApprovedForAll(sender, _msgSender()) but sender is not bouncer', async function () {
      // require(sender == _msgSender() || isApprovedForAll(sender, _msgSender()), "!AUTHORIZED");
      const {
        PolygonAssetERC1155,
        extractor,
        users,
        mintAsset,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 10);
      const balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        extractor,
        tokenId
      );
      expect(balance).to.be.equal(10);
      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).setApprovalForAllFor(extractor, users[4].address, true); // sender, operator, approved

      await expect(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(users[4].address)
        ).extractERC721From(extractor, tokenId, extractor)
      ).to.be.revertedWith('!BOUNCER');
    });
    it('can extract to destination address if isApprovedForAll(sender, _msgSender())', async function () {
      // require(sender == _msgSender() || isApprovedForAll(sender, _msgSender()), "!AUTHORIZED");
      const {
        PolygonAssetERC1155,
        extractor,
        users,
        mintAsset,
        PolygonAssetERC721,
        assetBouncerAdmin,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 10);
      let balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        extractor,
        tokenId
      );
      expect(balance).to.be.equal(10);
      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).setApprovalForAllFor(extractor, users[4].address, true); // sender, operator, approved

      // Set up users[4] as a bouncer
      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(assetBouncerAdmin)
      ).setBouncer(users[4].address, true);

      await waitFor(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(users[4].address)
        ).extractERC721From(extractor, tokenId, extractor)
      );
      balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        extractor,
        tokenId
      );
      expect(balance).to.be.equal(9);
      const nftBal = await PolygonAssetERC721.balanceOf(extractor);
      expect(nftBal).to.be.equal(1);
    });
    it('can extract to other destination address if isApprovedForAll(sender, _msgSender())', async function () {
      // require(sender == _msgSender() || isApprovedForAll(sender, _msgSender()), "!AUTHORIZED");
      const {
        PolygonAssetERC1155,
        users,
        extractor,
        mintAsset,
        PolygonAssetERC721,
        assetBouncerAdmin,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 10);
      let balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        extractor,
        tokenId
      );
      expect(balance).to.be.equal(10);

      // Set up users[4] as a bouncer
      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(assetBouncerAdmin)
      ).setBouncer(users[4].address, true);

      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).setApprovalForAllFor(extractor, users[4].address, true); // sender, operator, approved
      await waitFor(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(users[4].address)
        ).extractERC721From(extractor, tokenId, users[5].address)
      );
      balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        extractor,
        tokenId
      );
      expect(balance).to.be.equal(9);
      const nftBal = await PolygonAssetERC721.balanceOf(users[5].address);
      expect(nftBal).to.be.equal(1);
    });
    it('cannot extract to destination address if isApprovedForAll(sender, _msgSender()) but sender is not owner of ERC1155', async function () {
      // require(sender == _msgSender() || isApprovedForAll(sender, _msgSender()), "!AUTHORIZED");
      const {
        PolygonAssetERC1155,
        users,
        extractor,
        mintAsset,
        assetBouncerAdmin,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 10);
      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).setApprovalForAllFor(extractor, users[4].address, true);

      // Set up users[4] as a bouncer
      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(assetBouncerAdmin)
      ).setBouncer(users[4].address, true);

      await expect(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(users[4].address)
        ).extractERC721From(users[4].address, tokenId, extractor)
      ).to.be.revertedWith("can't substract more than there is");
    });
    it('cannot extract ERC721 if supply == 1 if sender == _msgSender()', async function () {
      const {
        PolygonAssetERC1155,
        users,
        extractor,
        mintAsset,
        assetBouncerAdmin,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 1);
      const balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        extractor,
        tokenId
      );
      expect(balance).to.be.equal(1);

      // Set up users[2] as a bouncer
      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(assetBouncerAdmin)
      ).setBouncer(users[2].address, true);

      await expect(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(extractor)
        ).extractERC721From(extractor, tokenId, extractor)
      ).to.be.revertedWith('UNIQUE_ERC1155');
    });
    it('cannot extract ERC721 if supply == 1 if msgSender() is not approved operator', async function () {
      const {
        PolygonAssetERC1155,
        users,
        extractor,
        mintAsset,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 1);
      const balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        extractor,
        tokenId
      );
      expect(balance).to.be.equal(1);

      await expect(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(users[1].address)
        ).extractERC721From(extractor, tokenId, extractor)
      ).to.be.revertedWith('!AUTHORIZED');
    });
    it('can retrieve Extraction event with ERC1155 id and new ERC721 id and they are not the same as each other', async function () {
      const {
        PolygonAssetERC1155,
        extractor,
        mintAsset,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 10);
      const receipt = await waitFor(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(extractor)
        ).extractERC721From(extractor, tokenId, extractor)
      );
      const extractionEvent = await expectEventWithArgs(
        PolygonAssetERC1155,
        receipt,
        'Extraction'
      );
      const args = extractionEvent.args;

      expect(args[0]).to.be.equal(tokenId);
      expect(args[1]).not.to.be.equal(tokenId);
    });
    it('cannot extract ERC721 if to == zeroAddress', async function () {
      const {
        PolygonAssetERC1155,
        extractor,
        mintAsset,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 10);
      await expect(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(extractor)
        ).extractERC721From(extractor, tokenId, zeroAddress)
      ).to.be.revertedWith('TO==0');
    });
    it('can correctly obtain ERC721 metadata after extraction', async function () {
      const {
        PolygonAssetERC1155,
        extractor,
        mintAsset,
        PolygonAssetERC721,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 10);
      const URI = await PolygonAssetERC1155.callStatic.tokenURI(tokenId);
      expect(URI).to.be.equal(
        'ipfs://bafybeidyxh2cyiwdzczgbn4bk6g2gfi6qiamoqogw5bxxl5p6wu57g2ahy/0.json'
      );
      const receipt = await waitFor(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(extractor)
        ).extractERC721From(extractor, tokenId, extractor)
      );

      const extractionEvent = await expectEventWithArgs(
        PolygonAssetERC1155,
        receipt,
        'Extraction'
      );
      const nftId = extractionEvent.args[1];

      const nftURI = await PolygonAssetERC721.callStatic.tokenURI(nftId);
      expect(nftURI).to.be.equal(
        'ipfs://bafybeidyxh2cyiwdzczgbn4bk6g2gfi6qiamoqogw5bxxl5p6wu57g2ahy/0.json'
      );
    });
    it('can extract more than once', async function () {
      const {
        PolygonAssetERC1155,
        extractor,
        mintAsset,
        PolygonAssetERC721,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 10);
      let balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        extractor,
        tokenId
      );
      expect(balance).to.be.equal(10);

      const receipt1 = await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenId, extractor);
      const extractionEvent1 = await expectEventWithArgs(
        PolygonAssetERC1155,
        receipt1,
        'Extraction'
      );
      const nftId1 = extractionEvent1.args[1];
      balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        extractor,
        tokenId
      );
      expect(balance).to.be.equal(9);
      let nftBal = await PolygonAssetERC721.balanceOf(extractor);
      expect(nftBal).to.be.equal(1);
      const receipt2 = await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenId, extractor);

      const extractionEvent2 = await expectEventWithArgs(
        PolygonAssetERC1155,
        receipt2,
        'Extraction'
      );
      const nftId2 = extractionEvent2.args[1];
      balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        extractor,
        tokenId
      );
      expect(balance).to.be.equal(8);
      nftBal = await PolygonAssetERC721.balanceOf(extractor);
      expect(nftBal).to.be.equal(2);
      expect(nftId1).to.be.not.equal(nftId2);
    });
    it('can get the new ERC721 ID returned from extraction event', async function () {
      const {
        PolygonAssetERC1155,
        extractor,
        mintAsset,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 10);
      const receipt = await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenId, extractor);
      const txEvent = await expectEventWithArgs(
        PolygonAssetERC1155,
        receipt,
        'Extraction'
      );
      const newId = txEvent.args.newId.toString();
      expect(tokenId).not.to.be.equal(newId);
    });
    it('can get the new ERC721 ID returned from extraction tx', async function () {
      const {
        PolygonAssetERC1155,
        extractor,
        mintAsset,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 10);
      const newId = await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).callStatic.extractERC721From(extractor, tokenId, extractor);
      expect(tokenId).not.to.be.equal(newId);
    });
    it('can check collectionOf for new ERC721', async function () {
      const {
        PolygonAssetERC1155,
        extractor,
        mintAsset,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 10);
      const receipt = await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenId, extractor);
      const txEvent = await expectEventWithArgs(
        PolygonAssetERC1155,
        receipt,
        'Extraction'
      );
      const newId = txEvent.args.newId.toString();
      expect(tokenId).not.to.be.equal(newId);
      const collectionOf = await PolygonAssetERC1155.collectionOf(tokenId);
      expect(collectionOf).not.to.be.equal(tokenId);
      const isCollection = await PolygonAssetERC1155.isCollection(tokenId);
      expect(isCollection).to.be.true;
      const collectionIndexOf = await PolygonAssetERC1155.collectionIndexOf(
        tokenId
      );
      expect(collectionIndexOf).to.be.equal(0);
      const nftCollection = await PolygonAssetERC1155.collectionOf(newId);
      expect(nftCollection).to.be.equal(collectionOf);
      const nftIsCollection = await PolygonAssetERC1155.isCollection(newId);
      expect(nftIsCollection).to.be.true;
      const nftCollectionIndexOf = await PolygonAssetERC1155.collectionIndexOf(
        newId
      );
      expect(nftCollectionIndexOf).to.be.equal(0);
    });
    it('can still check collectionOf for new ERC721 if I burn my ERC1155', async function () {
      const {
        PolygonAssetERC1155,
        extractor,
        mintAsset,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 10);
      const receipt = await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenId, extractor);
      const txEvent = await expectEventWithArgs(
        PolygonAssetERC1155,
        receipt,
        'Extraction'
      );
      const newId = txEvent.args.newId.toString();
      expect(tokenId).not.to.be.equal(newId);
      // Burn all remaining ERC1155
      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).burn(tokenId, 9);
      const collectionOf = await PolygonAssetERC1155.collectionOf(tokenId);
      const isCollection = await PolygonAssetERC1155.isCollection(tokenId);
      expect(isCollection).to.be.true;
      const collectionIndexOf = await PolygonAssetERC1155.collectionIndexOf(
        tokenId
      );
      expect(collectionIndexOf).to.be.equal(0);
      const nftCollection = await PolygonAssetERC1155.collectionOf(newId);
      expect(nftCollection).to.be.equal(collectionOf);
      const nftIsCollection = await PolygonAssetERC1155.isCollection(newId);
      expect(nftIsCollection).to.be.true;
      const nftCollectionIndexOf = await PolygonAssetERC1155.collectionIndexOf(
        newId
      );
      expect(nftCollectionIndexOf).to.be.equal(0);
    });
    it('can extract my last ERC1155 to an ERC721 (as long as supply was > 1 originally)', async function () {
      const {
        PolygonAssetERC1155,
        extractor,
        mintAsset,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 2);

      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenId, extractor);

      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenId, extractor);
    });
    it('cannot burn ERC1155 after extraction if there is no more supply', async function () {
      const {
        PolygonAssetERC1155,
        extractor,
        mintAsset,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 2);

      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenId, extractor);

      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenId, extractor);

      await expect(
        PolygonAssetERC1155.connect(ethers.provider.getSigner(extractor)).burn(
          tokenId,
          1
        )
      ).to.be.revertedWith("can't substract more than there is");
    });
    it('can check collectionOf for new ERC721 correctly increments by 1 compared to the ERC1155 it was extracted from', async function () {
      const {
        PolygonAssetERC1155,
        extractor,
        mintAsset,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 10);
      const receipt = await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenId, extractor);
      const txEvent = await expectEventWithArgs(
        PolygonAssetERC1155,
        receipt,
        'Extraction'
      );
      const newId = txEvent.args.newId.toString();
      expect(tokenId).not.to.be.equal(newId);
      const collectionOf = await PolygonAssetERC1155.collectionOf(tokenId);
      expect(collectionOf).not.to.be.equal(tokenId);
      const isCollection = await PolygonAssetERC1155.isCollection(tokenId);
      expect(isCollection).to.be.true;
      const collectionIndexOf = await PolygonAssetERC1155.collectionIndexOf(
        tokenId
      );
      expect(collectionIndexOf).to.be.equal(0);
      const nftCollection = await PolygonAssetERC1155.collectionOf(newId);
      expect(nftCollection).to.be.equal(collectionOf);
      const nftIsCollection = await PolygonAssetERC1155.isCollection(newId);
      expect(nftIsCollection).to.be.true;
      const nftCollectionIndexOf = await PolygonAssetERC1155.collectionIndexOf(
        newId
      );
      expect(nftCollectionIndexOf).to.be.equal(0);
    });
    it('can burn then extract and then burn some more', async function () {
      const {
        PolygonAssetERC1155,
        extractor,
        mintAsset,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 5);

      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).burn(tokenId, 1);

      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenId, extractor);

      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).burn(tokenId, 1);

      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).burn(tokenId, 1);
    });
    it('can mint multiple and extract from multiple IDs in a pack as long as the id has supply > 1', async function () {
      const {
        PolygonAssetERC1155,
        extractor,
        mintMultipleAsset,
      } = await setupPolygonAsset();
      const tokenIds = await mintMultipleAsset(extractor, [2, 4, 7, 1]);

      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenIds[1], extractor);
      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenIds[2], extractor);
      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenIds[2], extractor);
      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenIds[0], extractor);
      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenIds[0], extractor);
    });
    it('cannot extract from tokenId minted with mintMultiple if supply == 1', async function () {
      const {
        PolygonAssetERC1155,
        extractor,
        mintMultipleAsset,
      } = await setupPolygonAsset();
      const tokenIds = await mintMultipleAsset(extractor, [2, 4, 7, 1]);

      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenIds[1], extractor);
      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenIds[2], extractor);
      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenIds[2], extractor);
      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenIds[0], extractor);
      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenIds[0], extractor);
      await expect(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(extractor)
        ).extractERC721From(extractor, tokenIds[3], extractor)
      ).to.be.revertedWith('UNIQUE_ERC1155');
    });
    it('can mintMultiple and check collectionOf for a new ERC721 correctly increments by 1 compared to the ERC1155 it was extracted from', async function () {
      const {
        PolygonAssetERC1155,
        extractor,
        mintMultipleAsset,
      } = await setupPolygonAsset();
      const tokenIds = await mintMultipleAsset(extractor, [2, 4, 7, 1]);

      const receipt = await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenIds[2], extractor);

      const txEvent = await expectEventWithArgs(
        PolygonAssetERC1155,
        receipt,
        'Extraction'
      );
      const newId = txEvent.args.newId.toString();
      expect(tokenIds[2]).not.to.be.equal(newId);

      // [0]
      const collectionOf_0 = await PolygonAssetERC1155.collectionOf(
        tokenIds[0]
      );
      expect(collectionOf_0).not.to.be.equal(tokenIds[0]);
      expect(collectionOf_0).not.to.be.equal(tokenIds[1]);
      expect(collectionOf_0).not.to.be.equal(tokenIds[2]);
      expect(collectionOf_0).not.to.be.equal(tokenIds[3]);

      const isCollection_0 = await PolygonAssetERC1155.isCollection(
        tokenIds[0]
      );
      expect(isCollection_0).to.be.true;
      const collectionIndexOf_0 = await PolygonAssetERC1155.collectionIndexOf(
        tokenIds[0]
      );
      expect(collectionIndexOf_0).to.be.equal(0);

      // [1]
      const collectionOf_1 = await PolygonAssetERC1155.collectionOf(
        tokenIds[1]
      );
      expect(collectionOf_1).not.to.be.equal(tokenIds[1]);

      const isCollection_1 = await PolygonAssetERC1155.isCollection(
        tokenIds[1]
      );
      expect(isCollection_1).to.be.true;
      const collectionIndexOf_1 = await PolygonAssetERC1155.collectionIndexOf(
        tokenIds[1]
      );
      expect(collectionIndexOf_1).to.be.equal(1);

      // [2]
      const collectionOf_2 = await PolygonAssetERC1155.collectionOf(
        tokenIds[2]
      );
      expect(collectionOf_2).not.to.be.equal(tokenIds[2]);

      const isCollection_2 = await PolygonAssetERC1155.isCollection(
        tokenIds[2]
      );
      expect(isCollection_2).to.be.true;
      const collectionIndexOf_2 = await PolygonAssetERC1155.collectionIndexOf(
        tokenIds[2]
      );
      expect(collectionIndexOf_2).to.be.equal(2);

      // [3]
      const collectionOf_3 = await PolygonAssetERC1155.collectionOf(
        tokenIds[3]
      );
      expect(collectionOf_3).not.to.be.equal(tokenIds[3]);

      const isCollection_3 = await PolygonAssetERC1155.isCollection(
        tokenIds[3]
      );
      expect(isCollection_3).to.be.true;
      const collectionIndexOf_3 = await PolygonAssetERC1155.collectionIndexOf(
        tokenIds[3]
      );
      expect(collectionIndexOf_3).to.be.equal(3);

      // ERC721 - 1
      const nftCollection = await PolygonAssetERC1155.collectionOf(newId);
      expect(nftCollection).to.be.equal(collectionOf_2);
      const nftIsCollection = await PolygonAssetERC1155.isCollection(newId);
      expect(nftIsCollection).to.be.true;
      const nftCollectionIndexOf = await PolygonAssetERC1155.collectionIndexOf(
        newId
      );
      // The ERC1155 collectionIndex increments by 1 for each tokenId within that pack
      // The ERC1155 collectionIndexOf are all the same as each other (1)
      // The ERC721 collectionIndexOf is one more than the ERC1155 index that it was extracted from (2)
      expect(nftCollectionIndexOf).to.be.equal(collectionIndexOf_2);

      const receiptSecondExtraction = await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenIds[2], extractor);

      const txEvent2 = await expectEventWithArgs(
        PolygonAssetERC1155,
        receiptSecondExtraction,
        'Extraction'
      );
      const newId2 = txEvent2.args.newId.toString();
      expect(tokenIds[2]).not.to.be.equal(newId2);

      // ERC721 - 2
      const nftCollection2 = await PolygonAssetERC1155.collectionOf(newId2);
      expect(nftCollection2).to.be.equal(collectionOf_2);
      const nftIsCollection2 = await PolygonAssetERC1155.isCollection(newId2);
      expect(nftIsCollection2).to.be.true;
      const nftCollectionIndexOf2 = await PolygonAssetERC1155.collectionIndexOf(
        newId2
      );
      // The ERC721 collectionIndexOf increments by 1 for each new extraction
      expect(nftCollectionIndexOf2).to.be.equal(nftCollectionIndexOf);
    });
    it('can see the index of my token after burning another token in the pack', async function () {
      const {
        PolygonAssetERC1155,
        extractor,
        mintMultipleAsset,
      } = await setupPolygonAsset();
      const tokenIds = await mintMultipleAsset(extractor, [2, 4, 7, 1]);

      const receipt = await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenIds[2], extractor);

      const txEvent = await expectEventWithArgs(
        PolygonAssetERC1155,
        receipt,
        'Extraction'
      );
      const newId = txEvent.args.newId.toString();

      const collectionOf = await PolygonAssetERC1155.collectionOf(tokenIds[2]);
      const isCollection = await PolygonAssetERC1155.isCollection(tokenIds[2]);
      expect(isCollection).to.be.true;
      const collectionIndexOf = await PolygonAssetERC1155.collectionIndexOf(
        tokenIds[2]
      );
      expect(collectionIndexOf).to.be.equal(2);

      // ERC721
      const nftCollection = await PolygonAssetERC1155.collectionOf(newId);
      expect(nftCollection).to.be.equal(collectionOf);
      const nftIsCollection = await PolygonAssetERC1155.isCollection(newId);
      expect(nftIsCollection).to.be.true;
      const nftCollectionIndexOf = await PolygonAssetERC1155.collectionIndexOf(
        newId
      );

      // Burn ERC1155
      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).burn(tokenIds[2], 6);

      const nftCollectionAfterBurn = await PolygonAssetERC1155.collectionOf(
        newId
      );
      expect(nftCollectionAfterBurn).to.be.equal(collectionOf);
      const nftIsCollectionAfterBurn = await PolygonAssetERC1155.isCollection(
        newId
      );
      expect(nftIsCollectionAfterBurn).to.be.true;
      const nftCollectionIndexOfAfterBurn = await PolygonAssetERC1155.collectionIndexOf(
        newId
      );
      expect(nftCollectionIndexOfAfterBurn).to.be.equal(nftCollectionIndexOf);
    });
    it('can see my ERC721 collection information in PolygonAssetERC1155 contract even after I burn that ERC721', async function () {
      const {
        PolygonAssetERC1155,
        PolygonAssetERC721,
        extractor,
        mintMultipleAsset,
      } = await setupPolygonAsset();
      const tokenIds = await mintMultipleAsset(extractor, [2, 4, 7, 1]);

      const receipt = await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenIds[2], extractor);

      const txEvent = await expectEventWithArgs(
        PolygonAssetERC1155,
        receipt,
        'Extraction'
      );
      const newId = txEvent.args.newId.toString();

      const collectionOf = await PolygonAssetERC1155.collectionOf(tokenIds[2]);
      const isCollection = await PolygonAssetERC1155.isCollection(tokenIds[2]);
      expect(isCollection).to.be.true;
      const collectionIndexOf = await PolygonAssetERC1155.collectionIndexOf(
        tokenIds[2]
      );
      expect(collectionIndexOf).to.be.equal(2);

      // ERC721
      const nftCollection = await PolygonAssetERC1155.collectionOf(newId);
      expect(nftCollection).to.be.equal(collectionOf);
      const nftIsCollection = await PolygonAssetERC1155.isCollection(newId);
      expect(nftIsCollection).to.be.true;
      const nftCollectionIndexOf = await PolygonAssetERC1155.collectionIndexOf(
        newId
      );

      // Burn ERC721 (extractor has been granted BURNER_ROLE for testing)
      await PolygonAssetERC721.connect(
        ethers.provider.getSigner(extractor)
      ).burn(newId);

      const nftCollectionAfterBurn = await PolygonAssetERC1155.collectionOf(
        newId
      );
      expect(nftCollectionAfterBurn).to.be.equal(collectionOf);
      const nftIsCollectionAfterBurn = await PolygonAssetERC1155.isCollection(
        newId
      );
      expect(nftIsCollectionAfterBurn).to.be.true;
      const nftCollectionIndexOfAfterBurn = await PolygonAssetERC1155.collectionIndexOf(
        newId
      );
      expect(nftCollectionIndexOfAfterBurn).to.be.equal(nftCollectionIndexOf);
    });
    it('can see that my ERC1155 tokenId was minted even after I burn all ERC1155 in that pack', async function () {
      const {
        PolygonAssetERC1155,
        extractor,
        mintAsset,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 5);

      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).burn(tokenId, 5);

      const wasEverMinted = await PolygonAssetERC1155.wasEverMinted(tokenId);
      expect(wasEverMinted).to.be.true;
    });
    it('can see that my ERC1155 tokenId was minted even after I burn and extract all ERC1155 in that pack', async function () {
      const {
        PolygonAssetERC1155,
        extractor,
        mintAsset,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(extractor, 2);

      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).burn(tokenId, 1);

      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(extractor)
      ).extractERC721From(extractor, tokenId, extractor);

      const wasEverMinted = await PolygonAssetERC1155.wasEverMinted(tokenId);
      expect(wasEverMinted).to.be.true;
    });
  });
});
