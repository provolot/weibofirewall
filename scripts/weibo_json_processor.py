import codecs
import json
import datetime
from dateutil.parser import parse
import sys
import weibo_settings
import weibo_module
import weibo_accesstokens
import hashlib
import pprint
import gibberish
import chinese_name_generator
import os

def json_process(oldfilename, newfilename):

	oldjson = []
	with codecs.open(oldfilename, "rt") as f:
		oldjson = json.load(f)
			

	newf = codecs.open(newfilename, "wb")
#	print oldjson

	newf.write("[ " + "\n")


	#get list of users
	alluserids = [x["user_id"] for x in oldjson]

	#generate gibberish words, key = userid, value = dict
	gibberishdict = dict(zip(alluserids, gibberishlist))


	sameuserposts = {}
	for thisjson in oldjson:
		thisuserid = str(thisjson["user_id"])

		if thisuserid in sameuserposts:
			sameuserposts[thisuserid]["posts"].append(thisjson)
		else:
			sameuserposts[thisuserid] = {}
			sameuserposts[thisuserid]["posts"] = []
			sameuserposts[thisuserid]["posts"].append(thisjson)
	

	for thisuserid in alluserids:
		thisuser = sameuserposts[str(thisuserid)]
		totallifespan = reduce(lambda a, thispost: a+thispost["post_lifespan"], thisuser["posts"], 0)
		numotherposts = len(thisuser["posts"])
		lifespan_avg = totallifespan * 1.0 / numotherposts
		mintimestamp = min(map(lambda x: x["started_tracking_at_epoch"], thisuser["posts"]))
		maxtimestamp = max(map(lambda x: x["last_checked_at_epoch"], thisuser["posts"]))

		thisuser["info"] = {}
		thisuser["info"]["totallifespan"] = int(totallifespan)
		thisuser["info"]["numotherposts"] = int(numotherposts)
		thisuser["info"]["lifespan_avg"] = lifespan_avg
		thisuser["info"]["mintimestamp"] = int(mintimestamp)
		thisuser["info"]["maxtimestamp"] = int(maxtimestamp)

	#iterate through posts
	postno = 0
	for thisjson in oldjson:

		postno += 1

		prevpostid = thisjson['post_id']

		#### add user info - redundant, but hey, makes the data file one large monolithic one
		### do before obfuscation
		thisjson['user_info'] = sameuserposts[thisjson['user_id']]["info"]
		#### obfuscate
		thisjson['user_name'] = gibberishdict[thisjson['user_id']]
		thisjson['user_id'] = weibo_module.obfuscate_hashmod(thisjson['user_id'], weibo_accesstokens.salt, weibo_accesstokens.user_id_mod)
#		thisjson['user_name'] = weibo_module.obfuscate_username(thisjson['user_id'], weibo_accesstokens.salt)
		thisjson['post_id'] = weibo_module.obfuscate_hashmod(thisjson['post_id'], weibo_accesstokens.salt, weibo_accesstokens.post_id_mod)

		print thisjson['user_name']
		thisext = os.path.splitext(thisjson['post_original_pic'])[1]
#		print "cp " + weibo_settings.imgblurdir + prevpostid + thisext + " " + weibo_settings.imghashdir + thisjson['post_id'] + thisext
		#wf.write(json.dumps(thisjson, ensure_ascii=False))
		newf.write(json.dumps(thisjson))

		if postno != len(oldjson):
			newf.write(", ")

		newf.write("\n")

	newf.write(" ]" + "\n")
	
	newf.close()


#json_process(weibo_settings.deleted_log_json_filename, weibo_settings.deleted_log_json_obfuscated_filename)
json_process(weibo_settings.scriptroot + "data/deleted_weibo_log_launch_v1.json", weibo_settings.deleted_log_json_obfuscated_filename)

