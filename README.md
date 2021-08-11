# curation-trail
This script can be used to create your own curation trails.

***

## Configuration
```javascript
{
	"voter_account" : "CURATION_LEAD_ACCOUNT_NAME",     //Add the curation lead account name
	"timeout" : 5000,                                   //Queue reading timeout. Better keep 5000 ms
	"rec_timeout" : 1000,
	"min_vp" : 9300,                                    //Minimum Vote Power of Curation Trails
	"trails" : [
		["TRAIL_ACCOUNT_NAME_1", "TRAIL_1_POSTING_KEY"],  //If you have more than 1 trail you can add then into this array
		["TRAIL_ACCOUNT_NAME_2", "TRAIL_2_POSTING_KEY"],  //Trail User Name, Trail Posting Key
		["TRAIL_ACCOUNT_NAME_3", "TRAIL_3_POSTING_KEY"]   //This will claim your curation rewards automatically too
	],
	"rpc_nodes" : [
		"https://api.hive.blog",                          //RPC Nodes, you can add or remove nodes here.
		"https://anyx.io",                                //Better check the latest post => https://peakd.com/@fullnodeupdate/posts
		"https://api.openhive.network",                   //Before change nodes from this array
		"https://hived.privex.io",
		"https://api.hivekings.com",
		"https://hive-api.arcange.eu/",
		"https://rpc.ausbit.dev/",
		"https://api.deathwing.me/",
		"https://rpc.ecency.com/",
		"https://api.pharesim.me/",
		"https://hive.roelandp.nl/",
		"https://hived.hive-engine.com/",
		"https://techcoderx.com/",
		"https://api.followbtcnews.com/",
		"https://hived.emre.sh",
		"https://api.c0ff33a.uk"
	]
}
```
