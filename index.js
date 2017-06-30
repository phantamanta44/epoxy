'use strict';
const rfy = require('restify');
const request = require('request-promise-native');

// Epoxy config
const xyApp = {
  name: 'epoxy',
  version: '1.0.0',
  url: 'https://president-george-14344.netlify.com/'
};

// Utility methods
function repoUrl(endpoint) {
  return xyApp.url + endpoint;
}

function modUrl(mod, path) {
  return repoUrl('mods/' + mod + '/' + path);
}

function modFileUrl(mod, version) {
  return modUrl(mod, version + '/' + mod + '-' + version + '.zip');
}

async function getModMeta(modId) {
  return JSON.parse(await request(modUrl(modId, 'mod.json')).catch(console.log));
}

function packUrl(slug, path) {
  return repoUrl('packs/' + slug + '/' + path);
}

async function getPackMeta(slug) {
  return JSON.parse(await request(packUrl(slug, 'pack.json')).catch(console.log));
}

async function parseModChecksum(mod) {
  switch (mod.source.toLowerCase()) {
    case 'local':
      return (await getModMeta(mod.id)).versions[mod.version].md5;
    case 'remote':
      return mod.md5;
  }
  return null;
}

function parseModSource(mod) {
  switch (mod.source.toLowerCase()) {
    case 'local':
      return modFileUrl(mod.id, mod.version);
    case 'remote':
      return mod.url
  }
  return null;
}

function parseModpackResource(slug, name, resource) {
  switch (resource.source.toLowerCase()) {
    case 'local':
      return repoUrl('packs/' + slug + '/' + name);
    case 'remote':
      return resource.url;
  }
}

function modResponse(id, mod) {
  let res = {
    name: id,
    pretty_name: mod.name,
    author: mod.author,
    description: mod.description,
    link: mod.url,
    donate: mod.donate,
    versions: []
  };
  for (let key in mod.versions) {
    if (mod.versions.hasOwnProperty(key))
      res.versions.push(key);
  }
  return res;
}

function versionResponse(modId, versionId, version) {
  return {
    md5: version.md5,
    url: modFileUrl(modId, versionId)
  };
}

async function modpacksResponse() {
  let packs = JSON.parse(await request(repoUrl('packs/packs.json')));
  let res = {
    modpacks: {},
    mirror_url: xyApp.url
  };
  for (let key in packs) {
    if (packs.hasOwnProperty(key))
      res.modpacks[key] = packs[key];
  }
  return res;
}

function modpackResponse(slug, pack) {
  let res = {
    name: slug,
    display_name: pack.name,
    url: pack.url,
    icon: parseModpackResource(slug, 'icon.png', pack.icon),
    icon_md5: pack.icon.md5,
    logo: parseModpackResource(slug, 'logo.png', pack.logo),
    logo_md5: pack.logo.md5,
    background: parseModpackResource(slug, 'bg.png', pack.background),
    background_md5: pack.background.md5,
    recommended: pack.builds.recommended,
    latest: pack.builds.latest,
    builds: []
  };
  for (let key in pack.builds.all) {
    if (pack.builds.all.hasOwnProperty(key))
      res.builds.push(key);
  }
  return res;
}

function buildResponse(slug, build) {
  let res = {
    minecraft: build.minecraft.version,
    minecraft_md5: build.minecraft.md5,
    forge: build.forge,
    mods: []
  };
  for (let key in build.mods) {
    if (build.mods.hasOwnProperty(key)) {
      res.mods.push({
        name: build.mods[key].id,
        version: build.mods[key].version,
        md5: parseModChecksum(build.mods[key]),
        url: parseModSource(build.mods[key])
      });
    }
  }
  return res;
}

// Build api
const server = rfy.createServer({
  name: xyApp.name,
  version: xyApp.version
});

server.use(function(req, res, next) {
  res.setHeader('content-type', 'application/json');
  return next();
});

server.get('/api', async function(req, res, next) {
  res.send({
    api: xyApp.name,
    version: xyApp.version,
    stream: 'DEV'
  });
  next();
});

server.get('/api/mod/:modname', async function(req, res, next) {
  if (!req.params.modname) {
    res.send(400, {
      error: 'No mod requested'
    });
  } else {
    let mod = await getModMeta(req.params.modname);
    if (!mod) {
      res.send(404, {
        error: 'Mod does not exist'
      });
    } else {
      res.send(modResponse(req.params.modname, mod));
    }
  }
  next();
});

server.get('/api/mod/:modname/:modversion', async function(req, res, next) {
  if (!req.params.modname) {
    res.send(400, {
      error: 'No mod requested'
    });
  } else {
    let mod = await getModMeta(req.params.modname);
    if (!mod) {
      res.send(404, {
        error: 'Mod does not exist'
      });
    } else {
      if (!req.params.modversion) {
        res.send(modResponse(req.params.modname, mod));
      } else {
        let version = mod.versions[req.params.modversion];
        if (!version) {
          res.send(404, {
            error: 'Mod version does not exist'
          });
        } else {
          res.send(versionResponse(req.params.modname, req.params.modversion, version));
        }
      }
    }
  }
  next();
});

server.get('/api/modpack', async function(req, res, next) {
  res.send(await modpacksResponse());
  next();
});

server.get('/api/modpack/:slug', async function(req, res, next) {
  if (!req.params.slug) {
    res.send(await modpacksResponse());
  } else {
    let pack = await getPackMeta(req.params.slug);
    if (!pack) {
      res.send(404, {
        error: 'Modpack does not exist'
      });
    } else {
      res.send(modpackResponse(req.params.slug, pack));
    }
  }
  next();
});

server.get('/api/modpack/:slug/:build', async function(req, res, next) {
  if (!req.params.slug) {
    res.send(await modpacksResponse());
  } else {
    let pack = await getPackMeta(req.params.slug);
    if (!pack) {
      res.send(404, {
        error: 'Modpack does not exist'
      });
    } else {
      if (!req.params.build) {
        res.send(modpackResponse(req.params.slug, pack));
      } else {
        let build = pack.builds.all[req.params.build];
        if (!build) {
          res.send({
            error: 'Build does not exist'
          });
        } else {
          res.send(buildResponse(req.params.slug, build));
        }
      }
    }
  }
  next();
});

// Deploy server
server.listen(8080);