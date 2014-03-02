# Node DNSimple Updater

Similar to a DynDNS updater, this updater works to update a domain in DNSimple with your current IP

## Usage

1. Clone this repository to a machine on your network
2. Run an `npm install` inside of the cloned directory
3. Re-name `config.json.example` to `config.json`
4. Edit the settings in `config.json` accordingly.
5. Run `update.js` from the command line or set it up on a schedule via crontab or similar

Alternative to using `config.json`, you may also set those variables via environment variables in your system. In that case, do not create a config.json file in the directory.

### Enjoy!