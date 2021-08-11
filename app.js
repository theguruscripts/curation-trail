const { Hive } = require('@splinterlands/hive-interface');
const colors = require('colors');
const config = require('./config.json');
const schedule = require('node-schedule');
 
const hive = new Hive({
  logging_level: 0,
  rpc_nodes: config.rpc_nodes
});

var voteQueue = [];

const VOTERACCNAME = config.voter_account;

var TIMEOUT = config.timeout;
TIMEOUT = parseInt(TIMEOUT) || 0;
var RECTIMEOUT = config.rec_timeout;
RECTIMEOUT = parseInt(RECTIMEOUT) || 0;
var MINVP = config.min_vp;
MINVP = parseInt(MINVP) || 0;

const processTx = async(...[op, block_num,,, transaction_id, block_time]) => {	
	try
	{
		const {
			0: type,
			1: data
		} = op;
		
		if (type === 'vote') 
		{
			const {
				voter,
				author,
				permlink,
				weight,
			} = data;			
			
			if(voter == VOTERACCNAME)
			{				
				voteQueue.push(data);
			}	
		}
	}
	catch(error)
	{
		console.log("Error at processTx : ", error);
	}
};

hive.stream({on_op: processTx});

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const readVoteQueue = async() => {
	try
	{
		if(voteQueue.length > 0)
		{
			console.log(voteQueue[0]);
			var authorName = voteQueue[0].author;
			var permLink = voteQueue[0].permlink;
			var voteWeight = voteQueue[0].weight;

			var trailStatus = await trailDataProcess(authorName, permLink, voteWeight);
			if(trailStatus == true)
			{
				console.log("TRAIL VOTES COMPLETED".green);	
				await clearVoteQueue();
			}
			else
			{
				console.log("TRAIL VOTES FAILED".red);	
				await clearVoteQueue();
			}
		}
		else
		{
			await timeout(TIMEOUT);
			readVoteQueue();
		}
	}
	catch(error)
	{
		console.log("Error at readVoteQueue() : ", error);
	}
};

const clearVoteQueue = async() => {
	try
	{
		voteQueue.splice(0, 1);		
		await timeout(TIMEOUT);
		readVoteQueue();
	}
	catch(error)
	{
		console.log("Error at clearVoteQueue() : ", error);	
	}	
};

const trailDataProcess = async(authorName, permLink, voteWeight) => {
	var trailStatus = false;
	try
	{
		var trailList = config.trails;
		if(trailList.length > 0)
		{			
			async function recursive(n)
			{				
				if (n <= trailList.length - 1) 
				{
					console.log("TRAIL NAME : ", trailList[n][0]);
					var accName = trailList[n][0];
					var accPostingKey = trailList[n][1];
					var vpVal = await getVP(trailList[n][0]);
					console.log("VOTE POWER : ",vpVal);
					if(vpVal > MINVP)
					{
						var voteStatus = await votePost(accName, accPostingKey, authorName, permLink, voteWeight);
						if(voteStatus == true)
						{
							console.log(accName.yellow, "UPVOTED SUCCESSFULLY".green);
						}
						else
						{
							console.log(accName.yellow, "UPVOTE FAILED".red);
						}
						await timeout(RECTIMEOUT);
						await recursive(n + 1);
					}
					else
					{
						await timeout(RECTIMEOUT);
						await recursive(n + 1);
					}					
				}
				else
				{
					console.log("ALL TRAIL ACCOUNTS PROCESSED".blue);
					trailStatus = true;
				}
			}
			await recursive(0);		
		}
		return trailStatus;	
	}
	catch(error)
	{
		console.log("Error at trailDataProcess() : ", error);
		return trailStatus;
	}
};

const getVP = async(accName) => {
	
	let current_power = 0;
	
	try
	{
		const { 0: account } = await hive.api('get_accounts', [[accName]]);
				
		const {
			voting_power
		} = account;
		
		if (voting_power === 0) 
		{
			current_power = 10000;
		} 
		else 
		{
			// calculate current voting power
			const last_vote_time = new Date(`${account.last_vote_time}Z`);
			const current_time = new Date();
			const elapsed_seconds = (current_time - last_vote_time) / 1000;
			const regenerated_power = Math.round((10000 * elapsed_seconds) / 432000);
			current_power = Math.min(voting_power + regenerated_power, 10000);
		}	

		return current_power;
	}
	catch(error)
	{
		console.log("Error at getVP() : ", error);
		return current_power;
	}
};

const votePost = async(accName, accPostingKey, authorName, permLink, voteWeight) => {													
	let broadCastStatus = false;							
	try
	{
		const voteBroadCast = await hive.broadcast('vote', {
										voter : accName,
										author : authorName,
										permlink : permLink,
										weight : voteWeight
									}, accPostingKey);						
		
		if(voteBroadCast.id != "")
		{
			broadCastStatus = true;
		}		
		return broadCastStatus;
	}
	catch(error)
	{
		//console.log("Error at votePost() : ", error);
		return broadCastStatus;
	}
};

const trailClaimRewards = async() => {
	try
	{
		console.log("CLAIM CURATION REWARDS PROCESS BEGIN".blue);
		var trailList = config.trails;
		if(trailList.length > 0)
		{
			async function recursive(n)
			{
				if (n <= trailList.length - 1) 
				{
					var accName = trailList[n][0];
					var accPostingKey = trailList[n][1];
					
					var claimStatus = await claimRewards(accName, accPostingKey);
					if(claimStatus == true)
					{
						console.log(accName.yellow, "CURATION CLAIMED SUCCESSFULLY".green);
					}
					else
					{
						console.log(accName.yellow, "CURATION CLAIM FAILED".red);
					}
					await timeout(RECTIMEOUT);
					await recursive(n + 1);
				}
				else
				{
					console.log("ALL TRAIL ACCOUNTS CURATION CLAIMS PROCESSED".blue);
				}
			}
			await recursive(0);
		}
	}
	catch(error)
	{
		console.log("Error at trailClaimRewards() : ", error);		
	}
};

const claimRewards = async(accName, accPostingKey) => {
	var claimStatus = false;	
	try
	{
		const res = await hive.api('get_accounts', [[accName]]);
		const {
			reward_hbd_balance,
			reward_hive_balance,
			reward_vesting_balance,
		} = res[0];

		// check if there are any unclaimed rewards
		if (parseFloat(reward_hbd_balance.split(' ')[0]) > 0
			|| parseFloat(reward_hive_balance.split(' ')[0]) > 0
			|| parseFloat(reward_vesting_balance.split(' ')[0]) > 0) 
		{
			let claimBroadCast = await hive.broadcast('claim_reward_balance', {
				account: accName,
				reward_hbd: reward_hbd_balance,
				reward_hive: reward_hive_balance,
				reward_vests: reward_vesting_balance,
			}, accPostingKey);
			console.log("CLAIMED BROADCAST : ", claimBroadCast);
			
			if(claimBroadCast.id != "")
			{
				claimStatus = true;
			}				
		}
		return claimStatus;
	}
	catch(error)
	{
		//console.log("Error at claimRewards() : ", error);
		return claimStatus;
	}
};

readVoteQueue();

const rule = "0 0 */2 * * *";
schedule.scheduleJob(rule, trailClaimRewards);
