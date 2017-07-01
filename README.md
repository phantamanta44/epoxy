Epoxy: The Lazy Man's Solder
=====
Have you ever wanted to stick two things together, but didn't have the time or patience to figure out how soldering irons work? Here's a fun protip: glue sticks things together too!

**Epoxy** is a sort of thermosetting polymer (French for glue) that sticks things together. It's also an alternative Technic Solder implementation that doesn't require PHP and doesn't require a database. It's written on the Node.js platform and uses [Restify](https://github.com/restify/node-restify) and [Request](https://github.com/request/request) to handle fancy networking stuff.

You might have also heard of the [SolderJS](https://github.com/TechnicPack/SolderJS) project, and you're probably wondering why you should choose Epoxy instead of something officially developed by Technic. Unlike SolderJS, Epoxy doesn't require you to have a database from an existing install of PHP Solder -- indeed, Epoxy doesn't use a database at all! Instead, data is stored in and read from JSON files stored in your Solder repository. More information can be found below.

## Installation ##
To install Epoxy on a server, you'll need to first install the following:

* [NodeJS](https://nodejs.org) (Preferably at least v7)

Then, you'll want to download this repository and extract it to your designated install location (or clone it if you have Git installed). Open a terminal and navigate to the install location, then have NPM install the necessary dependencies:
```sh
$ npm install
```
To configure Epoxy, you'll need to set some environment variables. It's recommended you do this by creating a script to launch Epoxy. For instance, here's a `foobar.sh` script that might work on *nix servers:
```sh
export XY_URL="https://example.com/repo/";
export XY_KEYS="{\"abcdefghijkl\":{\"name\":\"master\",\"timestamp\":1234567890}}";
export XY_LOG="true";
node index.js;
```
A similar `foobar.bat` script for Windows servers might look like this:
```batch
set XY_URL="https://example.com/repo/"
set XY_KEYS="{\"abcdefghijkl\":{\"name\":\"master\",\"timestamp\":1234567890}}"
set XY_LOG="true"
node index.js
```
The `XY_URL` variable denotes the mod repository URL, which will be covered below. The `XY_KEYS` variable is a JSON document listing valid Technic Platform API keys and their properties. The format of the document is as follows:
```json
{
  "abcdefghijkl": { // The API key
    "name": "master", // A name identifying the key
    "timestamp": 1234567890 // Epoch millis timestamp of the key's creation
  },
  "mnopqrstuvwx": {
    "name": "another-key",
    "timestamp": 3141592653
  }
}
```
Finally, the `XY_LOG` variable tells Epoxy to enable logging (which is disabled by default). Upon execution of this script, a Node instance should start, which indicates that the Epoxy server is running!

## The Mod Repository ##
Epoxy reads mods and metadata from an external repository of some sort. Usually this is a webserver serving the mod and metadata files over HTTP. Potentially, this server could even be running on the same machine as the Epoxy server, given the right configuration. The repository's directory structure should be formatted as such:

* mods
  * modid (some mod ID)
    * version (some version)
      * modid-version.zip
    * mod.json
* packs
  * slug (some pack's slug)
    * bg.png
    * icon.png
    * logo.png
    * pack.json
  * packs.json
  
For an idea of what this looks like in application, check out [this repository](https://github.com/phantamanta44/solder-repo).

### Mod Format ###
In the mods folder, you find several subfolders, each representing a mod. Inside of the each folder, you find several more subfolders, each representing a distinct version of the mod. Additionally, you find a meta file called `mod.json`, which should look something like this:
```json
{
  "author": "Team CoFH", // The mod's author(s)
  "description": "The foundation of a Thermally enhanced world!", // A short description of the mod
  "donate": null, // A donation link, or null if none exists
  "name": "Thermal Foundation", // The human-readable name of the mod (doesn't necessarily have to be the mod ID)
  "url": "http://www.teamcofh.com", // A link to the mod's website, or an empty string ("") if none exists
  "versions": { // A collection of the mod's versions
    "2.1.0.82": { // A version number
      "md5": "e8baba28a95db7c9b81de6e7257beb12" // The MD5 checksum of the version's zipfile
    }
  }
}
```
For each version, a subfolder with a matching name should exist in the mod's folder. For example, in the case of Thermal Foundation 2.1.0.82, the directory structure should look something like this:

* thermalfoundation
  * 2.1.0.82
    * thermalfoundation-2.1.0.82.zip
  * mod.json

It's also important to note the name of the zipfile, which is always formatted as such: `modid-version.zip`. The contents of the zipfile should conform to the [standard Solder zip format](http://docs.solder.io/docs/zip-file-structure).

### Modpack Format ###
In the packs folder, you find several more subfolders, each representing a modpack. Additionally, you'll find a file called `packs.json`, which indexes all of the packs available in the repository. The file should look like this:
```json
{
  "mod-slug": "Mod Name",
  "a-final-voyage": "A Final Voyage"
}
```
This file should list every pack in the packs folder, mapping each pack's slug to its human-readable name.

Each individual pack folder must be named the slug of the modpack it represents. Inside the folder should be a `pack.json` file, which is formatted as follows:
```json
{
  "name": "A Final Voyage", // The pack's human-readable name
  "author": "phantamanta44", // The pack's developer
  "description": "We're all lost now.", // A short description of the pack
  "url": "https://github.com/phantamanta44/finalvoyage", // A link to the mod's website, or an empty string ("") if none exists
  "icon": { // The pack icon
    "source": "local",
    "md5": "2569a6bd6894283454ca6d340845627d"
  },
  "logo": { // The pack logo banner
    "source": "local",
    "md5": "8afee9780564a45dc132a8b790144806"
  },
  "background": { // The pack background image
    "source": "local",
    "md5": "7531ad830f3ef4fbca1ba71282a0836d"
  },
  "builds": {
    "recommended": "1.0.0", // The recommended build
    "latest": "1.0.0", // The latest build
    "all": { // A list of all builds
      "1.0.0": { // A build number
        "minecraft": { // Minecraft properties
          "version": "1.10.2", // The Minecraft version
          "md5": null // This is ignored, so just leave it null
        },
        "forge": null, // The forge version (dunno why it's null here)
        "mods": [ // A list of mods inlcluded in this build
          {
            "id": "thermalfoundation", 
            "source": "local",
            "version": "2.1.0.82"
          }
        ]
      }
    }
  }
}
```
The icon, logo, and background image are pack "resources", and their objects determine the location of the resource. The `source` element can either be `local` or `remote`. Their respective formats are as follows:
```json
{
  "local": {
    "source": "local",
    "md5": "abcdefghijklmnopqrst" // The resource file's MD5 checksum
  },
  "remote": {
    "source": "remote",
    "url": "http://example.com/file.png", // The path to the resource
    "md5": "abcdefghijklmnopqrst" // The resource file's MD5 checksum
  }
}
```
For local resources, the path is assigned to a file in the modpack's folder. For the icon, logo, and background, those files would be:

Resource   | File
---------- | ----
icon       | `icon.png`
logo       | `logo.png`
background | `bg.png`

The mods have a similar format. For each mod, the `mods` array should contain an element as such:
```json
{
  "local": {
    "source": "local",
    "id": "thermalfoundation", // The mod ID
    "version": "2.1.0.82" // The mod version
  },
  "remote": {
    "source": "remote",
    "id": "Mekanism", // The mod ID
    "version": "1.10.2-9.2.2.301", // The mod version
    "url": "http://example.com/Mekanism-1.10.2-9.2.2.301.zip", // A link to the mod zipfile
    "md5": "asdfghjkl" // The mod zipfile's MD5 checksum
  }
}
```
For local resources, the mod's URL and MD5 checksum are pulled from the respective mod meta file in the repository. Remotely-sourced mods are only for mods that aren't in the repository.

## Support ##
Find an issue? Report it using that big "Issues" button up there.