import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {isInTags} from '../../utils/network';
import hre from 'hardhat';

const func: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const {deployments, getNamedAccounts} = hre;
  const {deployer} = await getNamedAccounts();
  const Pool = await deployments.get('OpenSandRewardPool');

  await deployments.deploy('OpenSandRewardCalculator', {
    from: deployer,
    // TODO: Review which one we want.
    contract: 'TwoPeriodsRewardCalculator',
    args: [Pool.address],
    log: true,
    skipIfAlreadyDeployed: true,
  });
};

export default func;
func.tags = ['OpenSandRewardPool', 'OpenSandRewardCalculator_deploy'];
func.dependencies = ['OpenSandRewardPool_deploy'];
func.skip = async () => !isInTags(hre, 'L2');