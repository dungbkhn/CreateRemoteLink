const path = require('path')
const http = require('http')
const https = require('https');
const find = require('find')
const fs = require('fs');
const Queue = require('./dungqueue.js');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};


const myday = require('./mydaymodule');
const crypto = require('./encryptionmodule');

let validtime = new Date().getTime() - 50000;
let logouttime = new Date().getTime();

//let stilldownload = false;
//let stilldel = false;
//console.log(stilldownload);

let currentcommand = 0;

//for upload
let numberupload = 0;
let numbercheckupload = 0;
let filesupload = new Array(31);
let exec_find = new Array(31);
let existedfile = new Array(31);
let currentpathupload = '';
let currentuploadfile = '';

let web_username="username";
let web_password="1234";
let read_password_flag = 0;

const rootDir = __dirname;

const resDir = './www';
// import express (after npm install express)
const express = require('express');

// create new express app and save it as "app"
const app = express();

// server configuration
const PORT = 29999; 

//parser
const bodyParser = require('body-parser');

const querystring = require('querystring');

const multer = require('multer');

//exec command
const sys = require('util')

const exec = require('child_process').exec;


//set express configuration
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

// make the server listen to requests
/*
app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}/`);
});
*/

const httpsServer = https.createServer(options, app);


httpsServer.listen(PORT, () => {
	try{
		const allFileContents = fs.readFileSync('../ChangeRemoteInfo/webinfo.txt', 'utf-8');
		var i=0;
		allFileContents.split(/\r?\n/).forEach(line =>  {
			//console.log(`Line from file: ${line}`);
			if(i==0) {
				web_password = line;
				read_password_flag = 1;
			}
			i++;
		});
	}	
	catch (e) {}
	console.log(`webuser:${web_username}`);
	console.log(`webpass:${web_password}`);
    console.log(`Server running at: http://localhost:${PORT}/`);
});


 

/********
 * GET IMAGE FILE *
 * **********/
/* 
app.get('/images/:fileName', function(req ,res) {
    var path = require('path');
    var file = path.join(rootDir + "/images/", req.params.fileName);
    res.sendFile(file);
});
*/

/********
 * LOG IN *
 * **********/
/* 
// create a route for the app
app.get('/', (req, res) => {
  fs.readFile(__dirname + '/index.html', function (err,html) {
    if (err) {
        res.send("Error occurred!");
		return;
    }  
    res.writeHeader(200, {"Content-Type": "text/html"});  
    res.write(html);  
    res.end();  
  });
});


function reponseToLogIn(req, res){
	//write log time to file for bash copy process
	updatelogtime(true);

	currentcommand = 0;

	fs.readFile(__dirname + '/content.html', function (err,html) {
		 if (err) {
			throw err; 
		 }  
		 validtime = new Date().getTime();
		
		 res.setHeader('content-type', 'text/html');
		 res.write(html);  
		 var output = myday.generatetoken();
		 writefirst(res,resDir,output.encryptedData,true,'','');
	});//end readfile

}

app.post('/',function(req,res){
    var username = req.body.username;
    var password = req.body.password;
    res.setHeader('content-type', 'text/html');
    
    if(read_password_flag == 0){
		res.send("Error because store password never changed!");
	}
    else if(username!==web_username||password!==web_password){
		res.send("Login invalid!");
    }
    else{
		reponseToLogIn(req,res);
	}

});
*/
/********
 * LOG OUT *
 * **********/
/* 
app.get('/logout', (req, res) => {
	try{
	  let p = querystring.parse(req.url)['/logout?p'];
	  let token = p.substring(0,p.indexOf(":"));
	  //console.log("logout token:" + token);
	  let cleartoken = crypto.decryptfromtext(token);
	  let s1 = cleartoken.substring(cleartoken.indexOf(":")+1,cleartoken.length);
	  logouttime = s1;

	  //currentcommand = 0;
	  
	  fs.readFile(__dirname + '/index.html', function (err,html) {
		if (err) {
			throw err; 
		}  
		res.writeHeader(200, {"Content-Type": "text/html"});  
		res.write(html);  
		res.end();  
	  });
	}
	catch(e){
		res.send("Error occurred!");
		return;
	}
});

*/
/**************
 * Download By Link *
 **************/
app.get('/startdownlink', function(req ,res) {
    let data = req.query.data;
    data = crypto.decryptfromtext(data);
    console.log('start download from link for File:' + data);
    
    let as = data.split(":");
    if(as.length != 2) {
		res.send("Data not match!");
		return;
	}
	
    let token = as[0];
    let fname = as[1];
    console.log("token:" + token);
    console.log("fname:" + fname);
    
    
    if(fname.trim() == ''){
		res.send("Filename is empty!");
		return;
	}
	
	//check valid token
	if(checkvalidtoken_downfromlink(token,res)===false){
		res.send("Token expired");
		return;
	}
		
	//const onefile = resDir + currentdir + '/'+fname;
	const onefile = fname;
	
	res.download(onefile, function (err) {
		if (err) {
			// Handle error, but keep in mind the response may be partially-sent
			// so check res.headersSent
			if(res.headersSent===true){
				console.log("finish download");
			}
			else{
				console.log("download not finished yet due to error occured!");
			}
		} else {
			// decrement a download credit, etc.
			console.log("finish download");
		}
	});
});



/***************
 * Back To Main Page
 * *************/
/*
app.get('/path', (req, res) => {
        try{
                let p = querystring.parse(req.url)['/path?p'];
                let abPath = '';
                let parentPath = '';
                let token = p.substring(0,p.indexOf(":"));
                p = p.substring(p.indexOf(":")+1,p.length);
                p = p.trim().hexDecode();

                console.log("path:" + p);
                console.log("token:" + token);

                //check valid token
                if(checkvalidtoken(token,res)===false)
                        return;

                //check valid time
                if(checkvalidtime(res)===false)
                        return;

                fs.readFile(__dirname + '/content.html', function (err,html) {
                                 if (err) {
                                        throw err; 
                                 }  
                                 res.setHeader('content-type', 'text/html');
                                 res.write(html); 
                                 //console.log("day");
                                 writefirst(res,resDir,token,true,'','');
                        });//end readfile
        }
        catch(e){
                res.send("Error occurred!");
                return;
		}
});

*/

/***************
 * Remote Link
 * *************/
/*
app.post('/trycrl',function(req,res){
	try{
		 console.log("trycrl with data:" + req.body.ipv6 + req.body.token + ":" + req.body.root + "/"+req.body.data);
		 console.dir(req.body);	 
		 var op = req.body.token + ":" + req.body.root + "/"+req.body.data;	
		 var output = myday.generatedownlink(op);	 
		 console.log("" + output.encryptedData);
		 
		 exec('test -f ' + req.body.root + "/" + req.body.data + ' && echo "file exists."', function(exec_err, stdout, stderr) {		 
			 fs.readFile('./linkinfo.txt', 'utf8', function(readfile_err, data){
				 if(readfile_err){	
					 if(readfile_err.code == 'ENOENT'){
						console.log(readfile_err);	
						if(exec_err){
							 res.setHeader('Content-Type', 'application/json');
							 res.end(JSON.stringify({ mid: 0, link:0, ok: "" }));
						}
						else {
							if(stdout.includes('file exists')){
							 let seconds = new Date().getTime();
							 let s = seconds + "#" + req.body.root + "/" + req.body.data + "\n";
							 fs.writeFileSync('./linkinfo.txt', s);
							 res.setHeader('Content-Type', 'application/json');
							 res.end(JSON.stringify({ mid: 1, link:1, ok: 'https://['+req.body.ipv6+']:'+PORT+'/startdownlink?data='+output.encryptedData }));
							}
							else {
							 res.setHeader('Content-Type', 'application/json');
							 res.end(JSON.stringify({ mid: 2, link:0, ok: '' }));	
							}
						}
					 }
					 else {
						res.setHeader('Content-Type', 'application/json');
						res.end(JSON.stringify({ mid: 0, link:0, ok: "" }));	
					 }				
				 }
				 else {
					 let data_backup = data;
					 let j=0;
					 data.split(/\r?\n/).forEach(line =>  {	
						if(line.length > 0){
							let as = line.split("#");
							let seconds = new Date().getTime();
							let df = seconds/1000 - as[0]/1000;
							if(df < 86400) j++;
						}
					 });
					 
					 if(j>4) j=4;				 
					 
					 if(exec_err){
						 res.setHeader('Content-Type', 'application/json');
						 res.end(JSON.stringify({ mid: 0, link:j, ok: "" }));
					 }
					 else {
						 if(stdout.includes('file exists')){
							console.log("file exits");
							let fl=false;
							let i=0;
							if(j>=4){
								j=0;i=-1;
							} else {
								j=0;i=0;
							}
							
							data_backup.split(/\r?\n/).forEach(line =>  {									
								if(line.length > 0){
									let as = line.split("#");
									let seconds = new Date().getTime();
									let df = seconds/1000 - as[0]/1000;
									if(df < 86400) {
										if(i<0) {++i;}
										else {
											if(j<=3){
												if(!fl){
													fs.writeFileSync('./linkinfo.txt', line + "\n");
													fl = true;
												}
												else fs.appendFileSync('./linkinfo.txt', line + "\n");
												j++;
											}
										}
									} 
								}
							});
							let seconds = new Date().getTime();
							let s = seconds + "#" + req.body.root + "/" + req.body.data + "\n";
							if(!fl){
								fs.writeFileSync('./linkinfo.txt', s);
							}
							else fs.appendFileSync('./linkinfo.txt', s);
							
							res.setHeader('Content-Type', 'application/json');
							res.end(JSON.stringify({ mid: 1, link:j+1, ok: 'https://['+req.body.ipv6+']:'+PORT+'/startdownlink?data='+output.encryptedData }));
							
						 }
						 else{
							 res.setHeader('Content-Type', 'application/json');
							 res.end(JSON.stringify({ mid: 2, link:j, ok: '' }));	
						 }
					 }					 
				 }
			 });//end readfile
	   });//end exec	 
	}
	catch(e){
		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify({ mid: 0, link:0, ok: "" }));
		return;
	}
});

app.get('/crl', function(req ,res) {
	try{
		console.log('Select crl');
		let token = req.query.token;
		let p = req.query.currentdir;
		
		p = p.trim().hexDecode();
		console.log("token:" + token);
		console.log("currentdir:" + p);

		//check valid token
		if(checkvalidtoken(token,res)===false)
			return;
		
		//check valid time
		if(checkvalidtime(res)===false)
			return;
			
		exec("./getipv6addr.sh | tr -d '\n'", function(err, stdout, stderr) {
			if (err) {
				res.send("Error occurred when trying get ipv6!");
			}
			else {
				 fs.readFile(__dirname + '/crl.html', function (err,html) {
					 if (err) {
						throw err; 
					 }  
					 
					 let j=0;
					 // Use fs.readFile() method to read the file
					 fs.readFile('./linkinfo.txt', 'utf8', function(err, data){
						if(err){							
						}
						else{
							//console.log(data);
							data.split(/\r?\n/).forEach(line =>  {						
								if(line.length > 0){
									let as = line.split("#");
									let seconds = new Date().getTime();
									let df = seconds/1000 - as[0]/1000;
									if(df < 86400) j++;
								}
						    });
						}
						 res.setHeader('content-type', 'text/html');
						 res.write(html); 

						 res.write('<br>');
						 res.write('<h2>Add File To Generate Link</h2>');
						 res.write('<h3 id="linknumber"> You have ' + j + ' link(s) active </h3>');					 			 
						 res.write('<h3>/var/res/ <input type=text id="textlink" name="textlink"> </h3>');
						 res.write('<textarea id="output" name="w3review" rows="10" cols="100"> </textarea>');
						 res.write('<br>');
						 res.write('<h3><button type="button" class="button" id="addlink">CreateLink</button> </h3>');						 
						 res.write('<input type="hidden" id="ipv6" name="ipv6" value="'+stdout+'">');
						 res.write('<input type="hidden" id="token" name="token" value="'+token+'">');
						 res.write('<input type="hidden" id="path" name="path" value="'+p.hexEncode()+'">');	 
						 res.write('</div>');
						 res.write('</body>');
						 res.write('</html>');
						 res.end();
					 });

				 });
			}
		});
		
		 
	}
	catch(e){
		res.send("Error occurred!");
		return;
	}

});

*/
/*********
 * Other Functions
 * *************/
 

function PromiseTimeout(ms) { 
        return new Promise(function(resolve, reject) { 
            // Setting 2000 ms time 
            setTimeout(resolve, ms); 
        }).then(function() { 
            //console.log("Wrapped setTimeout after 2000ms"); 
        }); 
} 

function getFileAndDirectories(path) {
	return fs.readdirSync(path,{withFileTypes:true})
}

//console.log(getFileAndDirectories(resDir))

function writefirst(res,rDir,token,firstcall, pPath, aPath){
		let files = getFileAndDirectories(rDir);
		let k = -1;
		
		 if(firstcall==false){
			 if(files.length > 0)
					res.write('<th style="width: 100px; height: 25px;"><button type="button" id = "selectbutton" class="btun" onclick="selectall()">Select All</button></th>');
			 else
					res.write('<th style="width: 100px; height: 25px;"><button type="button" id = "selectbutton" class="btun"> </button></th>');
		 }
		 else
			res.write('<th style="width: 100px; height: 25px;"><button type="button" id = "selectbutton" class="btun"> </button></th>');
			
		 res.write('</tr>');
		 res.write('</thead>');
		 res.write('<tbody>');
		 
		 if(firstcall==false){
			 res.write('<tr class="dir" style="border-bottom: 1px solid #000;">');
			 res.write('<td><a href="./path?p=' + token + ":" + pPath.trim().hexEncode() + '">'+ '..' + '</a></td>');
			 res.write('<td><a href="./path?p=' + token + ":" + pPath.trim().hexEncode() + '">'+ '' + '</a></td>');
			 res.write('</tr>');
		 }
		 
		 let tempPath='';
		 
		 
		 res.write('</tbody>');
		 res.write('</table>');
		 //console.log("firstcall=" + firstcall);
		 if(firstcall==true){
			 res.write('<input type="hidden" id="path" name="path" value="">');
		 }
		 else {
			 res.write('<input type="hidden" id="path" name="path" value="'+aPath.hexEncode()+'">');
		 }
		 
		 res.write('<input type="hidden" id="maxnum" name="maxnum" value="'+files.length+'">');
		 res.write('<input type="hidden" id="token" name="token" value="'+token+'">');
		 res.write('</div>');
		 res.write('</body>');
		 res.write('</html>');
		 res.end();
}

function checkvalidtime(res){
	let newvalidtime = new Date().getTime();
	if((newvalidtime - validtime)/1000 > 300)
	{
		try {
				res.send('Error: Timeout, please relogin!');
		 }
		 catch(e){
			console.log("Loi timeout " + e);
		 }
		
		return false;
	}
	//save new time
	validtime = newvalidtime;
	//write time to log for bash copy process
	updatelogtime(false);
	return true;
}

function checkvalidtoken(token,res){
	if(token==='')
	{
		res.send('Error: token');
		return false;
	}
	
	try {
		let cleartoken = crypto.decryptfromtext(token);
		//console.log("clear token:" + cleartoken);
		let compareday = myday.checkexprire(cleartoken);
		//console.log("compareday:" + compareday);
		
		if(compareday === true)
		{
			res.send('Error token');
			return false;
		}
		
		compareday = myday.checklogout(cleartoken,logouttime);
		if(compareday === true)
		{
			res.send('Error token');
			return false;
		}
	 }
	 catch(e){
			res.send('Error token');
			return false;
	 }

	return true;
}

function checkvalidtoken_downfromlink(token,res){
	if(token==='')
	{
		return false;
	}
	
	try {
		let cleartoken = crypto.decryptfromtext(token);
		//console.log("clear token:" + cleartoken);
		let compareday = myday.checkexprire(cleartoken);
		//console.log("compareday:" + compareday);
		
		if(compareday === true)
		{
			return false;
		}
		
	 }
	 catch(e){
			return false;
	 }

	return true;
}

function updatelogtime(bl){

	let data = Date.now()+"\n";
	
	if(bl===true){
		// Write first data in 'read_file.txt
		fs.writeFile('./logtime/logtimefile.txt', data, (err) => {
			  
			// In case of a error throw err.
			if (err) throw err;
		})
	}
	else{
		// Append data in 'read_file.txt
		fs.appendFile('./logtime/logtimefile.txt', data, (err) => {
			  
			// In case of a error throw err.
			if (err) throw err;
		})
	}
}

/**
 * https://medium.com/@ali.dev/how-to-use-promise-with-exec-in-node-js-a39c4d7bbf77
 * Executes a shell command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string>}
 */
 
function execShellCommand(cmd) {
	 return new Promise((resolve, reject) => {
		  exec(cmd, (error, stdout, stderr) => {
			   let out = '';
			   if (error) {
					console.warn("ErrorExecShellCommand:" + error);
					out = 'err';
			   }
			   else{
				   if(stdout!='')
						out = stdout;
					console.warn(stderr);
			   }   
			   //resolve(stdout? stdout : stderr);
			   resolve(out);
		  });
	 });
}

String.prototype.hexDecode = function(){
    var j;
    var hexes = this.match(/.{1,4}/g) || [];
    var back = "";
    for(j = 0; j<hexes.length; j++) {
        back += String.fromCharCode(parseInt(hexes[j], 16));
    }

    return back;
}

String.prototype.hexEncode = function(){
    var hex, i;

    var result = "";
    for (i=0; i<this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        result += ("000"+hex).slice(-4);
    }

    return result
}
