//load the SDK
const AWS = require("aws-sdk");
const fs = require("fs");

//let job_finished = false;
let job_name = 'test20';
let text_url = '';
const minute = 0.5;
const the_interval = minute * 60 * 1000;

//create a service object
const transcribeservice = new AWS.TranscribeService({apiVersion: '2017-10-26'});

//start the transcription job
function startJob(audio_uri) {
	const params = {
		  LanguageCode: 'en-US',
	      Media: { MediaFileUri: audio_uri},
	      TranscriptionJobName: job_name,
	      MediaFormat: 'wav',
	      //MediaSampleRateHertz: 8000, // normally 8000 if you are using wav file
	      OutputBucketName: 'spoken-biography-audio'
	}
	transcribeservice.startTranscriptionJob(params, function(err, data) {
	  if (err) console.log(err, err.stack); // an error occurred
	  else     console.log(data);           // successful response
	});	
}

function getJob(res) {
	console.log('Entered getJob');
	const params = {
	  TranscriptionJobName: job_name /* required */
	};
	transcribeservice.getTranscriptionJob(params, function(err, data) {
	  if (err) console.log(err, err.stack); // an error occurred
	  else {
	  	// successful response
	  	console.log(data); 
	    text_url = data.TranscriptionJob.Transcript.TranscriptFileUri;
	    console.log(text_url);
	    res.end(text_url);
	  }              
	});	
}

function listJob(myTimer, res) {
	console.log('Entered listJob');
	const params = {
	  JobNameContains: job_name,
	  Status: 'COMPLETED'
	};
	transcribeservice.listTranscriptionJobs(params, function(err, data) {
	  if (err) console.log(err, err.stack); // an error occurred
	  else {
	  	console.log(data);
	  	if (data.TranscriptionJobSummaries.length > 0) {
	  		//job_finished = true;
	  		console.log('length' + data.TranscriptionJobSummaries.length);
	  		clearInterval(myTimer);
	  		getJob(res);
	  	}
	  }            // successful response
	});	
}

const http = require('http');
const server = http.createServer((req, res) => {
	if (req.url == '/process_audio_file_synchronously') {
		if (req.method == 'POST') {
			console.log('Entered post');
			//collect the url 
			let data = [];
			req.on('data', chunk => {data.push(chunk)});
			req.on('end', () => {
				console.log('Data received');
				const body = JSON.parse(data);
				const media_url = body.url;
				startJob(media_url);
				console.log('job started');
				const myTimer = setInterval(() => {
					listJob(myTimer, res);
				}, the_interval);
			});
		}

		else {
			//if GET requested, give instructions
		    res.end(`
		        <!doctype html>
		        <html>
		        <body>
		        	<p>Please provide your audio file through POST method</p>
		        </body>
		        </html>
		    `);		
		}		
	}

	else if (req.url == '/process_streamed_audio') {
		//process streaming here, go to the url for the static website
	    res.end(`
	        <!doctype html>
	        <html>
	        <body>
	        	<p>Go to : /Users/jiamufeng/Desktop/transcribe/index.html</p>
	        </body>
	        </html>
	    `);	
	}

	else {
		//indicate error
	    res.end(`
	        <!doctype html>
	        <html>
	        <body>
				<p>Only accepts GET and POST method</p>
	        </body>
	        </html>
	    `);	
	}
});
server.listen(3000);