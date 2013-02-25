(function(){
  var fs, async, md, Sequelize, files, notFound, regexps, counter, result, e, lines, i$, len$, line, j$, len1$, regexp, page, prev, ref$, dir, file, md_data, html_data, final_data, api, link_1st, link_2nd, full_results, obj, objectify, seq, SearchIndex;
  fs = require('fs');
  async = require('async');
  md = require("marked");
  Sequelize = require("sequelize");
  files = ["API-reference"];
  notFound = [];
  regexps = [/\[\[(.*?)\|(.*?)(#(.*))?\]\]/, /\[(.*?)\]\((.*?)(#(.*))?\)/];
  counter = 0;
  while (counter < files.length) {
    try {
      result = fs.readFileSync("d3.wiki/" + files[counter] + ".md", 'utf-8');
    } catch (e$) {
      e = e$;
      notFound.push(e.path);
      counter++;
      continue;
    }
    counter++;
    try {
      lines = result.split("\n");
    } catch (e$) {
      e = e$;
      console.log(files[counter]);
      console.log(e);
      return;
    }
    for (i$ = 0, len$ = lines.length; i$ < len$; ++i$) {
      line = lines[i$];
      for (j$ = 0, len1$ = regexps.length; j$ < len1$; ++j$) {
        regexp = regexps[j$];
        if (regexp.test(line)) {
          result = regexp.exec(line);
          page = result[2];
          if (!in$(page, files) && page.indexOf('http') !== 0) {
            files.push(page.replace(" ", "-"));
          }
        }
      }
    }
  }
  prev = "";
  for (i$ = 0, len$ = (ref$ = "D3JS.docset/Contents/Resources/Documents/css".split("/")).length; i$ < len$; ++i$) {
    dir = ref$[i$];
    fs.mkdirSync(prev + dir);
    prev = prev + dir + "/";
  }
  for (i$ = 0, len$ = files.length; i$ < len$; ++i$) {
    file = files[i$];
    if (fs.existsSync("d3.wiki/" + file + ".md")) {
      md_data = "" + fs.readFileSync("d3.wiki/" + file + ".md", 'utf-8');
      md_data = md_data.replace(/\[\[([\w-_]+?)\s+([\w-_]+?)\]\]/g, "[$1 $2]($1-$2)");
      md_data = md_data.replace(/\[\[(svg:\w+)\|(.*?)\]\]/g, "[$1]($2)");
      md_data = md_data.replace(/\[(.*?)\]\((.*?)(#(.*))?\)/g, "[$1]($2.html$3)");
      md_data = md_data.replace(/\[\[(.*?)\|(.*?)(#(.*))?\]\]/g, "[$1]($2.html$3)");
      md_data = md_data.replace(/\[\[(.*?)\]\]/g, "[$1]($1.html)");
      md_data = md_data.replace(/"([\w-]+)#([\w-]*)"/g, '"$1.html#$2"');
      html_data = md(md_data);
      try {
        html_data = html_data.split("\n").slice(3).join("\n");
      } catch (e$) {
        e = e$;
        console.log(md_data);
        console.log(html_data);
        console.log(e);
        return;
      }
      html_data = html_data.replace(/a(.*)name="(\w*?)"/g, 'a$1name="wiki-$2"');
      html_data = html_data.replace(/src="([\w\.]+)\.html"/g, 'src="$1"');
      final_data = "<!-- single file version -->\n<!DOCTYPE html>\n<html>\n<head>\n  <link href=\"css/github.css\" rel=\"stylesheet\" type=\"text/css\">\n  <meta charset=\"utf-8\" />\n</head>\n<body>\n<h1>" + file.replace("-", " ") + "</h1>\n" + html_data + "\n</body>\n</html>\n";
      fs.writeFileSync("D3JS.docset/Contents/Resources/Documents/" + file + ".html", final_data, 'utf-8');
    }
  }
  api = fs.readFileSync("d3.wiki/API-Reference.md", 'utf-8');
  link_1st = /\[\[([\w\.-]+)\|([\w-]+)(#([\w-\.]+))?\]\]/g;
  link_2nd = /\[([\w\.-]+)\]\(([\w-]+)(#([\w-\.]+))?\)/g;
  full_results = [];
  while (result = link_1st.exec(api)) {
    full_results.push(result);
  }
  while (result = link_2nd.exec(api)) {
    full_results.push(result);
  }
  obj = {
    Section: [],
    Namespace: [],
    Method: []
  };
  objectify = function(x){
    var ref$;
    return {
      name: x[1],
      path: x[2] + ".html" + ((ref$ = x[3]) != null ? ref$ : "")
    };
  };
  for (i$ = 0, len$ = full_results.length; i$ < len$; ++i$) {
    result = full_results[i$];
    if (result[1].indexOf("d3.") === 0 && result[1].match(/\./g).length === 1) {
      obj.Namespace.push(objectify(result));
    } else if (result[3] == null) {
      obj.Section.push(objectify(result));
    } else if (result[1].indexOf(".") !== -1) {
      obj.Method.push(objectify(result));
    } else if (result[1].indexOf(".") === -1) {
      0;
    }
  }
  fs.createReadStream('github.css').pipe(fs.createWriteStream('D3JS.docset/Contents/Resources/Documents/css/github.css'));
  fs.createReadStream('Info.plist').pipe(fs.createWriteStream('D3JS.docset/Contents/Info.plist'));
  fs.createReadStream('icon.png').pipe(fs.createWriteStream('D3JS.docset/icon.png'));
  for (i$ = 0, len$ = (ref$ = fs.readdirSync("d3.wiki/")).length; i$ < len$; ++i$) {
    file = ref$[i$];
    if (file.indexOf('.png') !== -1) {
      fs.createReadStream("d3.wiki/" + file).pipe(fs.createWriteStream("D3JS.docset/Contents/Resources/Documents/" + file));
    }
  }
  seq = new Sequelize('database', 'username', 'password', {
    dialect: 'sqlite',
    storage: 'D3JS.docset/Contents/Resources/docSet.dsidx'
  });
  SearchIndex = seq.define('searchIndex', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING
    },
    type: {
      type: Sequelize.STRING
    },
    path: {
      type: Sequelize.STRING
    }
  }, {
    freezeTableName: true,
    timestamps: false
  });
  SearchIndex.sync().success(function(){
    var key, ref$, items, lresult$, i$, len$, item, si, results$ = [];
    for (key in ref$ = obj) {
      items = ref$[key];
      lresult$ = [];
      for (i$ = 0, len$ = items.length; i$ < len$; ++i$) {
        item = items[i$];
        si = SearchIndex.build({
          name: item.name,
          type: key,
          path: item.path
        });
        lresult$.push(si.save());
      }
      results$.push(lresult$);
    }
    return results$;
  });
  function in$(x, arr){
    var i = -1, l = arr.length >>> 0;
    while (++i < l) if (x === arr[i] && i in arr) return true;
    return false;
  }
}).call(this);
