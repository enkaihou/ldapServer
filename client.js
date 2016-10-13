var ldap = require('ldapjs');
const assert = require('assert');

var client = ldap.createClient({
	url: 'ldap://localhost:389'
});

var opts = {
	filter: '(uid=0002)',
	scope: 'sub'
};

client.bind('cn=root', 'secret', function(err) {
	assert.ifError(err);
});

var dn = null;
client.search('o=nikkei', opts, function(err, res) {
	assert.ifError(err);

	res.on('searchEntry', function(entry) {
		// console.log('entry: ' + JSON.stringify(entry.object));
		dn = entry.dn;
		// console.log('[Client] DN:' + dn);
		// console.log('[Client] CN:' + entry.object.cn);
		// When you have the DN, try to bind with it to check the password
		var userClient = ldap.createClient({
			url: 'ldap://localhost:389'
		});

		userClient.bind(dn, '0002', function(err) {
			if (err === null) {
				console.log('[Client] Logon success!');
			} else
				console.log('[Client] You are not 0001 ---' + err)
		});
	});
	res.on('searchReference', function(referral) {
		console.log('[Client] referral: ' + referral.uris.join());
	});
	res.on('error', function(err) {
		console.error('[Client] error: ' + err.message);
	});
	res.on('end', function(result) {
		console.log('[Client] status: ' + result.status);
	});
});
