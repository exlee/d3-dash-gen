require! fs

md = require("marked")
Sequelize = require("sequelize")


# Starting point
files = ["API-reference"]
notFound = []

regexps = [
  /\[\[(.*?)\|(.*?)(#(.*))?\]\]/
  /\[(.*?)\]\((.*?)(#(.*))?\)/
]
counter = 0
while counter < files.length
  try
    result = fs.readFileSync("d3.wiki/#{files[counter]}.md", 'utf-8')
  catch e
    notFound.push(e.path)
    counter++
    continue
  counter++
  try
    lines =  result.split("\n")
  catch
    console.log files[counter]
    console.log e
    return
  for line in lines
    for regexp in regexps
      if regexp.test(line)
        result =  regexp.exec(line)
        page = result[2]
        if page not in files and page.indexOf(\http) != 0
          files.push(page.replace(" ", "-"))

# if it fails it means it's already done
prev = ""
for dir in "D3JS.docset/Contents/Resources/Documents/css".split("/")
  fs.mkdirSync(prev + dir)
  prev = prev + dir + "/"

for file in files
  if fs.existsSync("d3.wiki/#file.md")
    md_data = "" + fs.readFileSync("d3.wiki/#file.md", 'utf-8')
    md_data = md_data.replace(/\[\[([\w-_]+?)\s+([\w-_]+?)\]\]/g, "[$1 $2]($1-$2)")
    md_data = md_data.replace(/\[\[(svg:\w+)\|(.*?)\]\]/g, "[$1]($2)")
    md_data = md_data.replace(/\[(.*?)\]\((.*?)(#(.*))?\)/g, "[$1]($2.html$3)")
    md_data = md_data.replace(/\[\[(.*?)\|(.*?)(#(.*))?\]\]/g, "[$1]($2.html$3)")
    md_data = md_data.replace(/\[\[(.*?)\]\]/g, "[$1]($1.html)")
    md_data = md_data.replace(/"([\w-]+)#([\w-]*)"/g, '"$1.html#$2"')
    html_data = md(md_data)
    try
      html_data = html_data.split("\n").slice(3).join("\n")
    catch e
      console.log(md_data)
      console.log(html_data)
      console.log e
      return
    html_data = html_data.replace(/a(.*)name="(\w*?)"/g, 'a$1name="wiki-$2"')
    html_data = html_data.replace(/src="([\w\.]+)\.html"/g, 'src="$1"')
    final_data = """
<!-- single file version -->
<!DOCTYPE html>
<html>
<head>
  <link href="css/github.css" rel="stylesheet" type="text/css">
  <meta charset="utf-8" />
</head>
<body>
<h1>#{file.replace("-", " ")}</h1>
#html_data
</body>
</html>

    """
    fs.writeFileSync("D3JS.docset/Contents/Resources/Documents/#file.html", final_data, 'utf-8')

# Extracting informations, I assume everything is in API-Reference.md
api = fs.readFileSync("d3.wiki/API-Reference.md", 'utf-8')
link_1st = /\[\[([\w\.-]+)\|([\w-]+)(#([\w-\.]+))?\]\]/g
link_2nd = /\[([\w\.-]+)\]\(([\w-]+)(#([\w-\.]+))?\)/g

full_results = []
while result = link_1st.exec(api)
  full_results.push result
while result = link_2nd.exec(api)
  full_results.push result

obj =
  Section: []
  Namespace: []
  Method: []
  
objectify = (x) -> name: x[1], path: x[2]+".html"+( x[3] ? "")
for result in full_results
  if result[1].indexOf("d3.") == 0 and result[1].match(/\./g).length == 1
    obj.Namespace.push objectify result
  else if not result[3]?
    obj.Section.push objectify result
  else if result[1].indexOf(".") != -1
    obj.Method.push objectify result
  else if result[1].indexOf(".") == -1
    0 # This looks weird, not including

# Copying files
fs.createReadStream('github.css').pipe(fs.createWriteStream('D3JS.docset/Contents/Resources/Documents/css/github.css'));
fs.createReadStream('Info.plist').pipe(fs.createWriteStream('D3JS.docset/Contents/Info.plist'));
fs.createReadStream('icon.png').pipe(fs.createWriteStream('D3JS.docset/icon.png'));

for file in fs.readdirSync("d3.wiki/")
  if file.indexOf('.png') != -1
    fs.createReadStream("d3.wiki/#file").pipe(fs.createWriteStream("D3JS.docset/Contents/Resources/Documents/#file"));


# Creating SQLite index

seq = new Sequelize('database', 'username', 'password', 
  dialect: 'sqlite'
  storage: 'D3JS.docset/Contents/Resources/docSet.dsidx'
)

SearchIndex = seq.define \searchIndex,
  * id:
      type: Sequelize.INTEGER
      autoIncrement: true
    name:
      type: Sequelize.STRING
    type: 
      type: Sequelize.STRING
    path: 
      type: Sequelize.STRING
  * freezeTableName: true
    timestamps: false

SearchIndex.sync().success ->
  for key, items of obj
    for item in items
      si = SearchIndex.build(name: item.name, type: key, path: item.path)
      si.save()


