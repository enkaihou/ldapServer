var ldap = require('ldapjs');
var initUser = require('./initdata.json');

var server = ldap.createServer();

var users = {}
  // テスト用のユーザー情報を読み込み
function loadInitData(req, res, next) {
  users = {};
  for (var uidx in initUser) {
    users['cn=' + initUser[uidx].usr + ', ou=users, o=nikkei'] = {
      dn: 'cn=' + initUser[uidx].usr + ', ou=users, o=nikkei',
      attributes: {
        cn: initUser[uidx].usr,
        uid: initUser[uidx].uid,
        gid: initUser[uidx].gid,
        userpassword: initUser[uidx].userpassword,
        objectclass: 'demoUser'
      }
    }
  }
  console.log('[Server] init data readed.');
}

loadInitData();

server.bind('cn=root', function(req, res, next) {
  if (req.dn.toString() !== 'cn=root' || req.credentials !== 'secret')
    return next(new ldap.InvalidCredentialsError());

  res.end();
  return next();
});

// sub bind method
server.bind('o=nikkei', function(req, res, next) {
  // DNを取得する。
  var dn = req.dn.toString();
  // ユーザー名を違う
  if (!users[dn]) {
    // console.log(dn);
    // console.log(users);
    return next(new ldap.NoSuchObjectError(dn));
  }
  // パスワードが空き
  if (!users[dn].attributes.userpassword) {
    return next(new ldap.NoSuchAttributeError('userpassword'));
  }
  // パスワードを違う
  if (users[dn].attributes.userpassword.indexOf(req.credentials) === -1) {
    return next(new ldap.InvalidCredentialsError());
  }

  res.end();
  return next();
});

function useInitData(req, res, next) {
  req.users = users;
  return next();
}

// Admin認証
function authorize(req, res, next) {
  if (!req.connection.ldap.bindDN.equals('cn=root'))
    return next(new ldap.InsufficientAccessRightsError());

  return next();
}

var pre = [authorize, useInitData];

// Searchに答える。
server.search('o=nikkei', pre, function(req, res, next) {
  Object.keys(req.users).forEach(function(k) {
    if (req.filter.matches(req.users[k].attributes))
      res.send(req.users[k]);
  });

  res.end();
  return next();
});

// Listen
server.listen(389, 'localhost', function() {
  console.log('LDAP server listening at %s', server.url);
});