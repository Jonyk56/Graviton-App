/*
########################################
              MIT License

Copyright (c) 2019 Marc Espín Sanz

License > https://github.com/Graviton-Code-Editor/Graviton-App/blob/master/LICENSE.md

#########################################
*/


let plugins_list = [],
    plugins_dbs = [];

const default_plugins = [
  "Graviton-Code-Editor/Dark",
  "Graviton-Code-Editor/Arctic"
]; //Plugins which are installed in the setup process

function detectPlugins(call) {
  if (!fs.existsSync(plugins_folder)) {
    //If the plugins folder doesn't exist
    document.getElementById("g_bootanimation").innerHTML += `
    <div>
      <p>Installing themes...</p>
    </div>`;
    fs.mkdirSync(plugins_folder);
    const github = require("octonode");
    const client = github.client();
    const request = require("request");
    let loaded = 0;
    let  _old_error = false;
    for (i = 0; i < default_plugins.length; i++) {
      const i_t = i;
      client.repo(default_plugins[i]).info(function(err, data) {
        if(_old_error) return;
        if (err) {
          new Notification("Graviton", getTranslation("SetupError1"));
          _old_error = true;
          return call != undefined ? call() : "";
        }
        const nodegit = require("nodegit");
        request(
          `https://raw.githubusercontent.com/${data.owner.login}/${data.name}/${
            data.default_branch
          }/package.json`,
          function(error, response, body2) {
            if (err) {
              new Notification("Graviton", getTranslation("SetupError1"));
              return call != undefined ? call() : "";
            }
            const config = JSON.parse(body2);
            nodegit
              .Clone(
                data.clone_url,
                path.join(plugins_folder.replace(/\\/g, "\\\\"), config.name)
              )
              .then(function(repository) {
                plugins.install(config, function() {
                  loaded++;
                  if (loaded == default_plugins.length) {
                    return call != undefined ? call() : "";
                  }
                });
              });
          }
        );
      });
    }
  } else {
    //If the plugins folder already exist
    fs.readdir(plugins_folder, (err, paths) => {
      let loaded = 0;
      if(paths.length == 0) return call != undefined ? call() : "";
      for (i = 0; i < paths.length; i++)   {
        const direct = fs.statSync(path.join(plugins_folder, paths[i]));
        if (!fs.existsSync(path.join(plugins_folder, paths[i], "package.json"))) {
          loaded++;
        }
        if (!direct.isFile()) {
          fs.readFile(
            path.join(plugins_folder, paths[i], "package.json"),
            "utf8",
            function(err, data) {
              if (err) {
                console.warn("An error occurred while loading a plugin.")
                if (loaded == paths.length) {
                  return call != undefined ? call() : "";
                }

              };
              try{
                JSON.parse(data)
              }catch{
                if (loaded == paths.length) {
                  return call != undefined ? call() : "";
                }else{
                  return;
                }
              }
              const config = JSON.parse(data);
              plugins.install(config, function() {
                loaded++;
                if (loaded == paths.length) {
                  return call != undefined ? call() : "";
                }
              });
            }
          );
        }
      }
    });
  }
}

/*

installing a plugin from a local source:

*/
const installFromLocal = function() {
  dialog.showOpenDialog({ properties: ["openDirectory"] }, selectedFiles => {
    if (selectedFiles === undefined) return;
    const folder_name = path
      .basename(selectedFiles[0])
      .split(".")
      .pop();
    fs.copy(selectedFiles[0], path.join(plugins_folder, folder_name), function(
      err
    ) {
      if (err) {
        graviton.throwError("An error occured while copying the folder.");
        return console.error(err);
      }
      console.log("Installed on" + path.join(plugins_folder, folder_name));
    });
  });
};
